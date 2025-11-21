// src/routes/user.routes.ts
import { Router } from 'express';
import { validate } from '../middlewares/validation.middleware.js';
import {
  UserCreationSchema,
  UserLoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema
} from '../schemas/user.schema.js';
import { UserController } from '../controllers/user.controller.js';
import { SocialController } from '../controllers/social.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js'; // NOVO

const authRouter = Router();

// Rotas Públicas (Com Rate Limit Estrito)
authRouter.post(
  '/register',
  authLimiter,
  validate(UserCreationSchema),
  UserController.create,
);

authRouter.post(
  '/login', 
  authLimiter,
  validate(UserLoginSchema), 
  UserController.login
);

authRouter.post(
  '/forgot-password',
  authLimiter,
  validate(ForgotPasswordSchema),
  UserController.forgotPassword
);

authRouter.post(
  '/reset-password',
  authLimiter,
  validate(ResetPasswordSchema),
  UserController.resetPassword
);

// --- Router de Usuário Logado ---
const userRouter = Router();
userRouter.use(authMiddleware);

userRouter.get('/me/favorites', SocialController.listMyFavorites);
userRouter.get('/me/following', SocialController.listFollowing);

export { authRouter, userRouter };