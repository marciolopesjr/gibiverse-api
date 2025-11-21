// src/routes/creator.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { CreatorProfileSchema } from '../schemas/creator.schema.js';
import { CreatorController } from '../controllers/creator.controller.js';
import { SocialController } from '../controllers/social.controller.js';

const creatorRouter = Router();

creatorRouter.use(authMiddleware);

// Perfil
creatorRouter.get('/profile', CreatorController.getProfile);
creatorRouter.post(
  '/profile',
  validate(CreatorProfileSchema),
  CreatorController.createProfile,
);

// HQs e Dashboard
creatorRouter.get('/hqs', CreatorController.getCreatorHqs);
creatorRouter.get('/dashboard', CreatorController.getDashboard); // NOVO

// Social (Seguir)
creatorRouter.post('/:id/follow', SocialController.followCreator);
creatorRouter.delete('/:id/follow', SocialController.unfollowCreator);

export default creatorRouter;