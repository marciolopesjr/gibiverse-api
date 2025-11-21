// src/middlewares/adminAuth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth.middleware.js';
import { BusinessError } from '../services/user.service.js';

export const adminAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Primeiro, roda a autenticação normal para garantir que há um usuário logado
  authMiddleware(req, res, (err) => {
    if (err) {
      // Se o authMiddleware padrão falhar (ex: token inválido), repassa o erro
      return next(err);
    }

    // Agora que temos req.user, verificamos a role
    if (req.user?.role !== 'Admin') {
      return next(
        new BusinessError(
          'Acesso negado. Requer privilégios de administrador.',
          403,
        ),
      );
    }

    // Se passou em ambas as checagens, pode prosseguir
    next();
  });
};