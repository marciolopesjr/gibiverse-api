// src/controllers/creator.controller.ts
import { Request, Response, NextFunction } from 'express';
import { CreatorService } from '../services/creator.service.js';
import { HqService } from '../services/hq.service.js';
import { BusinessError } from '../services/user.service.js';
import { HqFilterOptions } from '../types/index.js';

export const CreatorController = {

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const profile = await CreatorService.getCreatorByUserId(userId); 

      if (!profile) {
        throw new BusinessError('Perfil de criador não encontrado.', 404);
      }
      res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  },

  async createProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      if (user.role !== 'Criador') {
        throw new BusinessError('Apenas usuários do tipo "Criador" podem criar um perfil.', 403);
      }

      const newProfile = await CreatorService.createProfile(req.body, user.id);
      res.status(201).json(newProfile);
    } catch (error) {
      next(error);
    }
  },

  async getCreatorHqs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      
      const creatorProfile = await CreatorService.getCreatorByUserId(userId);
      if (!creatorProfile) {
        throw new BusinessError('Perfil de criador não encontrado para este usuário.', 404);
      }
      
      const page = parseInt(req.query.page as string, 10) || 1;
      
      const defaultLimit = process.env.DEFAULT_PAGINATION_LIMIT
        ? parseInt(process.env.DEFAULT_PAGINATION_LIMIT, 10)
        : 10;
      const limit = parseInt(req.query.limit as string, 10) || defaultLimit;
      
      const { search, genre, isPremium } = req.query;
      const filters: HqFilterOptions = {};
      if (search) filters.search = search as string;
      if (genre) filters.genre = genre as string;
      if (isPremium === 'true') filters.isPremium = true;
      if (isPremium === 'false') filters.isPremium = false;

      const hqs = await HqService.findHqsByCreatorId(creatorProfile.id, { page, limit }, filters, userId);
      res.status(200).json(hqs);
    } catch (error) {
      next(error);
    }
  },

  // NOVO
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      // O service já valida se o usuário é criador e tem perfil
      const dashboardData = await CreatorService.getDashboard(userId);
      res.status(200).json(dashboardData);
    } catch (error) {
      next(error);
    }
  }
};