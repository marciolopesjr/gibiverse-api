// src/routes/auth.routes.ts
import { Router } from 'express';
import { validate } from '../middlewares/validation.middleware.js';
import {
  UserCreationSchema,
  UserLoginSchema,
} from '../schemas/user.schema.js';
import { UserController } from '../controllers/user.controller.js';

const authRouter = Router();

authRouter.post(
  '/register',
  validate(UserCreationSchema),
  UserController.create,
);

authRouter.post('/login', validate(UserLoginSchema), UserController.login);

export default authRouter;