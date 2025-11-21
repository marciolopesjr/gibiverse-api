// src/controllers/subscription.controller.ts
import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscription.service.js'; // O antigo, pode manter métodos úteis
import { StripeService } from '../services/stripe.service.js';
import { BusinessError } from '../services/user.service.js';

export const SubscriptionController = {
  // Cria o link de pagamento
  async createCheckout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      // Idealmente, o priceId vem do frontend ou de uma config
      const priceId = req.body.priceId || process.env.STRIPE_PRICE_ID; 
      
      if (!priceId) throw new BusinessError('Price ID não configurado.', 400);

      const result = await StripeService.createCheckoutSession(userId, priceId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Link para gerenciar assinatura
  async createPortal(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await StripeService.createPortalSession(userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // O Webhook (Rota Pública, mas verificada)
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'];
      if (!signature) throw new BusinessError('Assinatura ausente', 400);

      // req.body AQUI PRECISA SER BUFFER (RAW), não JSON parseado
      await StripeService.handleWebhook(signature as string, req.body);
      
      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  }
};