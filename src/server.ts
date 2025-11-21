// src/server.ts
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { ZodError } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

import logger from './utils/logger.js';
import { runMigrations } from './utils/migrations.js';
import { authRouter, userRouter } from './routes/user.routes.js';
import hqRouter from './routes/hq.routes.js';
import creatorRouter from './routes/creator.routes.js';
import uploadRouter from './routes/upload.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import adminRouter from './routes/admin.routes.js';
import tagRouter from './routes/tag.routes.js';
import { BusinessError } from './services/user.service.js';
import { apiLimiter } from './middlewares/rateLimit.middleware.js'; // NOVO

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares essenciais
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// RATE LIMIT GERAL (Aplicado antes do body parser para economizar CPU)
app.use(apiLimiter); 

app.use(express.json());
app.use(pinoHttp({ logger }));

// --- Servir Arquivos Estáticos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- Rotas
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'Gibiverse API' });
});

// Rotas de Autenticação
app.use('/api/auth', authRouter);
// Rotas de Usuário Logado
app.use('/api/users', userRouter); 

app.use('/api/hqs', hqRouter);
app.use('/api/creator', creatorRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/admin', adminRouter);
app.use('/api/tags', tagRouter);

// --- Middleware de Tratamento de Erros Global
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Erro de validação.',
      errors: err.flatten().fieldErrors,
    });
  }

  if (err instanceof BusinessError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  if (
    err.message &&
    String(err.message).includes('duplicate key value violates unique constraint')
  ) {
    return res
      .status(409)
      .json({ message: 'O recurso que você está tentando criar já existe.' });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }

  logger.error(err, 'Ocorreu um erro interno inesperado');
  return res.status(500).json({
    message: 'Ocorreu um erro interno inesperado no servidor.',
  });
});

// --- Inicialização do servidor
async function startServer() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      logger.info(`>> API rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.fatal(
      error,
      'Falha ao inicializar a aplicação. O servidor será encerrado.',
    );
    process.exit(1);
  }
}

startServer();