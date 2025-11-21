// src/controllers/social.controller.ts
import { Request, Response, NextFunction } from 'express';
import { SocialService } from '../services/social.service.js';
import { BusinessError } from '../services/user.service.js';

export const SocialController = {
  // --- REVIEWS ---
  async addReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id: hqId } = req.params;
      
      const review = await SocialService.addReview(userId, hqId, req.body);
      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  },

  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id: hqId } = req.params;

      await SocialService.deleteReview(userId, hqId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async listHqReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: hqId } = req.params;
      const reviews = await SocialService.getReviews(hqId);
      res.status(200).json(reviews);
    } catch (error) {
      next(error);
    }
  },

  // --- FAVORITES ---
  async toggleFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id: hqId } = req.params;

      const result = await SocialService.toggleFavorite(userId, hqId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async listMyFavorites(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const favorites = await SocialService.getUserFavorites(userId);
      res.status(200).json(favorites);
    } catch (error) {
      next(error);
    }
  },

  // --- FOLLOWERS ---
  async followCreator(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id: creatorId } = req.params;

      if (!creatorId) throw new BusinessError('ID do criador inválido', 400);

      // Impedir que o criador siga a si mesmo se ele tentar usar o próprio ID de usuário
      // (Lógica simples, poderia ser mais robusta checando se userId == creator.userId)
      
      await SocialService.followCreator(userId, creatorId);
      res.status(200).json({ message: 'Seguindo com sucesso.' });
    } catch (error) {
      next(error);
    }
  },

  async unfollowCreator(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id: creatorId } = req.params;

      await SocialService.unfollowCreator(userId, creatorId);
      res.status(200).json({ message: 'Deixou de seguir.' });
    } catch (error) {
      next(error);
    }
  },

  async listFollowing(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const following = await SocialService.getFollowing(userId);
      res.status(200).json(following);
    } catch (error) {
      next(error);
    }
  }
};