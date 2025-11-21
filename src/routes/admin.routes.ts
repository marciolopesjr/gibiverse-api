// src/routes/admin.routes.ts
import { Router } from 'express';
import { adminAuthMiddleware } from '../middlewares/adminAuth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  UserRoleUpdateSchema,
  CreatorProfileUpdateSchema,
} from '../schemas/admin.schema.js';
import { AdminController } from '../controllers/admin.controller.js';

const adminRouter = Router();

// Aplica o middleware de autenticação de admin para TODAS as rotas deste arquivo
adminRouter.use(adminAuthMiddleware);

// --- Rota do Dashboard ---
adminRouter.get('/dashboard/stats', AdminController.getDashboardStats);

// --- Rotas de Gerenciamento de Usuários ---
adminRouter.get('/users', AdminController.listUsers);
adminRouter.patch(
  '/users/:id/role',
  validate(UserRoleUpdateSchema),
  AdminController.updateUserRole,
);

// --- Rotas de Gerenciamento de Criadores ---
adminRouter.get('/creators', AdminController.listCreators);
adminRouter.patch(
  '/creators/:id',
  validate(CreatorProfileUpdateSchema),
  AdminController.updateCreatorProfile,
);

// --- Rotas de Gerenciamento de Conteúdo (HQs) ---
adminRouter.get('/hqs', AdminController.listHqs);
adminRouter.delete('/hqs/:id', AdminController.deleteHq);

export default adminRouter;