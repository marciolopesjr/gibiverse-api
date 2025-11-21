// src/routes/tag.routes.ts
import { Router } from 'express';
import { TagController } from '../controllers/tag.controller.js';
import { adminAuthMiddleware } from '../middlewares/adminAuth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { TagCreationSchema } from '../schemas/social.schema.js';

const tagRouter = Router();

// Público: Listar tags para preencher filtros no frontend
tagRouter.get('/', TagController.index);

// Privado (Admin): Criar novas tags
tagRouter.post(
  '/',
  adminAuthMiddleware, 
  validate(TagCreationSchema),
  TagController.create
);

export default tagRouter;