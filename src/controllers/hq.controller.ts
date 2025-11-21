// src/controllers/hq.controller.ts
import { Request, Response, NextFunction } from 'express';
import { HqService } from '../services/hq.service.js';
import { HqCreationDTO } from '../schemas/hq.schema.js';
import { BusinessError } from '../services/user.service.js';
import { CreatorService } from '../services/creator.service.js';
import { HqFilterOptions } from '../types/index.js';
import { ReadingHistoryService } from '../services/readingHistory.service.js';

export const HqController = {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
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
      
      const userId = req.user?.id;

      const hqs = await HqService.findAll({ page, limit }, filters, userId);
      res.status(200).json(hqs);
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = req.user!;
      const hq = await HqService.findById(id, user);
      res.status(200).json(hq);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      if (user.role !== 'Criador') {
        throw new BusinessError('Apenas usuários do tipo "Criador" podem publicar HQs.', 403);
      }
      
      const creatorProfile = await CreatorService.getCreatorByUserId(user.id);
      if (!creatorProfile) {
        throw new BusinessError('Usuário Criador não possui um perfil de criador configurado.', 400);
      }

      const hqData = req.body as HqCreationDTO;
      const hq = await HqService.create(hqData, creatorProfile.id);
      res.status(201).json(hq);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
      try {
          const { id: hqId } = req.params;
          const user = req.user!;
          
          const creatorProfile = await CreatorService.getCreatorByUserId(user.id);
          if (!creatorProfile) {
              throw new BusinessError('Apenas criadores com perfil podem editar HQs.', 403);
          }
          
          const updatedHq = await HqService.update(hqId, req.body, creatorProfile);
          res.status(200).json(updatedHq);
      } catch (error) {
          next(error);
      }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
      try {
          const { id: hqId } = req.params;
          const user = req.user!;
          
          const creatorProfile = await CreatorService.getCreatorByUserId(user.id);
          if (!creatorProfile) {
              throw new BusinessError('Apenas criadores com perfil podem excluir HQs.', 403);
          }
          
          await HqService.delete(hqId, creatorProfile);
          res.status(204).send();
      } catch (error) {
          next(error);
      }
  },
  
  async updateReadProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: hqId } = req.params;
      const userId = req.user!.id;
      const { lastPageRead } = req.body;

      const updatedProgress = await ReadingHistoryService.updateReadProgress(
        hqId,
        userId,
        { lastPageRead }
      );

      res.status(200).json(updatedProgress);
    } catch (error) {
      next(error);
    }
  }
};