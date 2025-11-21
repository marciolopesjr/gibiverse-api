// src/routes/subscription.routes.ts
import { Router } from 'express';
import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { SubscriptionController } from '../controllers/subscription.controller.js';

const subscriptionRouter = Router();

// --- WEBHOOK ---
// Recebe o evento do Stripe. O express.raw() é vital aqui.
subscriptionRouter.post(
    '/webhook', 
    express.raw({ type: 'application/json' }), 
    SubscriptionController.webhook
);

// --- ROTAS PRIVADAS ---
subscriptionRouter.use(authMiddleware);

// Rotas reais do Stripe (nada de 'purchase' aqui)
subscriptionRouter.post('/checkout', SubscriptionController.createCheckout);
subscriptionRouter.post('/portal', SubscriptionController.createPortal);

export default subscriptionRouter;