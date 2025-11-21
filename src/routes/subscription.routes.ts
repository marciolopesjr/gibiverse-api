// src/routes/subscription.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { SubscriptionController } from '../controllers/subscription.controller.js';

const subscriptionRouter = Router();

subscriptionRouter.use(authMiddleware);

// Rota POST para simular a compra/ativação de uma assinatura
subscriptionRouter.post('/purchase', SubscriptionController.purchase);

export default subscriptionRouter;