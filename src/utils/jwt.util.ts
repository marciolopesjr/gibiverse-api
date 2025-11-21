// src/utils/jwt.util.ts
import jwt from 'jsonwebtoken';
import logger from './logger.js';
import { AuthUser } from '../types/index.js';

export function generateToken(user: AuthUser): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    logger.fatal('ERRO FATAL: JWT_SECRET não definido nas variáveis de ambiente.');
    throw new Error('JWT_SECRET não está configurado.');
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  // Determina a expiração
  // Se houver JWT_EXPIRES_IN (ex: "8h", "7d"), usa ele.
  // Caso contrário, tenta JWT_EXPIRES_IN_SECONDS (número).
  // Fallback final: "8h".
  const expiresIn = process.env.JWT_EXPIRES_IN 
    || (process.env.JWT_EXPIRES_IN_SECONDS ? parseInt(process.env.JWT_EXPIRES_IN_SECONDS, 10) : '8h');

  const token = jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });

  return token;
}