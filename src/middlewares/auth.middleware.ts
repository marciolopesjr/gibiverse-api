// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUser } from '../types/index.js';

// Estendendo a interface Request do Express para incluir nossa propriedade `user`
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ message: 'Token de autenticação não fornecido ou mal formatado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('Chave secreta JWT não configurada no servidor.');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as AuthUser;
    req.user = decoded; // Anexa o payload do usuário à requisição
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};