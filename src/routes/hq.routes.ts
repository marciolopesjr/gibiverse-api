// src/routes/hq.routes.ts
import { Router } from 'express';
import { HqController } from '../controllers/hq.controller.js';
import { SocialController } from '../controllers/social.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { HqCreationSchema, HqUpdateSchema } from '../schemas/hq.schema.js';
import { ReadProgressSchema } from '../schemas/readingHistory.schema.js';
import { ReviewSchema } from '../schemas/social.schema.js'; // Novo Schema

const hqRouter = Router();

// Público (Listagem e Detalhes)
hqRouter.get('/', HqController.findAll);
// Reviews são públicos para leitura
hqRouter.get('/:id/reviews', SocialController.listHqReviews); 

// Middlewares de Autenticação
hqRouter.use(authMiddleware);

// CRUD de HQs
hqRouter.post('/', validate(HqCreationSchema), HqController.create);
hqRouter.get('/:id', HqController.findById);
hqRouter.patch('/:id', validate(HqUpdateSchema), HqController.update);
hqRouter.delete('/:id', HqController.delete);

// Progresso de Leitura
hqRouter.post(
  '/:id/read-progress',
  validate(ReadProgressSchema),
  HqController.updateReadProgress
);

// --- NOVAS ROTAS SOCIAIS ---

// Favoritar (Toggle)
hqRouter.post('/:id/favorite', SocialController.toggleFavorite);

// Reviews (Criar/Editar e Deletar)
hqRouter.post(
  '/:id/reviews',
  validate(ReviewSchema),
  SocialController.addReview
);
hqRouter.delete('/:id/reviews', SocialController.deleteReview);

export default hqRouter;