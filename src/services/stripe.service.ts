// src/services/stripe.service.ts
import Stripe from 'stripe';
import { UserRepository } from '../repositories/user.repository.js';
import { SubscriptionRepository } from '../repositories/subscription.repository.js';
import { BusinessError } from './user.service.js';
import logger from '../utils/logger.js';
import { dbGet } from '../utils/database.js';

// --- TIPO FALSO / HACK ---
// Criamos este tipo manual para forçar o TypeScript a reconhecer os campos.
// O conflito de nomes entre nossa 'Subscription' e a do Stripe estava
// impedindo o acesso ao 'current_period_end'.
type StripeSubscriptionPayload = {
  id: string;
  status: string;
  customer: string | any;
  current_period_end: number; // O campo que estava dando erro
  items: {
    data: Array<{
      price: { id: string }
    }>
  }
};
// -------------------------

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não configurada.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // @ts-ignore - Silencia verificação de versão
  apiVersion: '2023-10-16', 
});

export const StripeService = {
  async createCheckoutSession(userId: string, priceId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new BusinessError('Usuário não encontrado', 404);

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await SubscriptionRepository.updateUserStripeId(userId, customerId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/settings/billing?canceled=true`,
      metadata: { userId: user.id },
    });

    return { url: session.url };
  },

  async createPortalSession(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user || !user.stripeCustomerId) {
      throw new BusinessError('Usuário não possui histórico de pagamento.', 400);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/settings/billing`,
    });

    return { url: session.url };
  },

  async handleWebhook(signature: string, rawBody: Buffer) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) throw new Error('STRIPE_WEBHOOK_SECRET não definido.');

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } catch (err) {
      logger.error(err, 'Falha na validação da assinatura do Webhook');
      throw new BusinessError('Webhook Signature Verification Failed', 400);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
            await this.syncSubscriptionStatus(session.subscription as string, session.customer as string);
        }
        break;
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        // Cast forçado para o nosso tipo payload manual
        const stripeObj = event.data.object as unknown as StripeSubscriptionPayload;
        await this.syncSubscriptionStatus(stripeObj.id, stripeObj.customer, stripeObj);
        break;
      }
      
      default:
        logger.info(`Evento Stripe não tratado: ${event.type}`);
    }
  },

  async syncSubscriptionStatus(
    stripeSubscriptionId: string, 
    stripeCustomerId: string, 
    subObject?: StripeSubscriptionPayload // Usando o tipo manual aqui
  ) {
    try {
        // AQUI ESTÁ A MÁGICA: 'as unknown as StripeSubscriptionPayload'
        // Convertemos para unknown primeiro para limpar qualquer tipagem anterior,
        // e depois forçamos para o nosso tipo manual que TEM o campo current_period_end.
        const stripeObj = (subObject || await stripe.subscriptions.retrieve(stripeSubscriptionId)) as unknown as StripeSubscriptionPayload;
        
        const userRow = await dbGet<{id: string}>('SELECT id FROM users WHERE "stripeCustomerId" = $1', [stripeCustomerId]);
        
        if (!userRow) {
            logger.error(`Webhook Error: Usuário não encontrado para Customer ID ${stripeCustomerId}`);
            return;
        }

        await SubscriptionRepository.upsertStripeSubscription({
            userId: userRow.id,
            stripeSubscriptionId: stripeObj.id,
            stripePriceId: stripeObj.items.data[0].price.id,
            status: stripeObj.status,
            // Agora o TS OBEDECE porque definimos current_period_end no tipo StripeSubscriptionPayload
            currentPeriodEnd: new Date(stripeObj.current_period_end * 1000),
        });
        
        logger.info(`Assinatura sincronizada para User ${userRow.id}: ${stripeObj.status}`);

    } catch (error) {
        logger.error(error, 'Erro ao sincronizar assinatura Stripe');
        throw error;
    }
  }
};