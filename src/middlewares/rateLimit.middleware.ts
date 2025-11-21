// src/middlewares/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

/**
 * Limitador Geral: Protege a API como um todo contra spam básico.
 * 100 requisições por 15 minutos por IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate Limit Excedido (API) para IP: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  }
});

/**
 * Limitador Estrito: Protege rotas sensíveis (Login, Cadastro, Reset de Senha).
 * 5 requisições por hora por IP.
 * Isso impede ataques de força bruta na senha.
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Permitir 10 tentativas (5 é muito pouco se o usuário for desastrado)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Muitas tentativas de autenticação. Tente novamente em 1 hora.'
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate Limit Excedido (AUTH) para IP: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  }
});