// src/controllers/admin.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';
import { HqFilterOptions, UserFilterOptions } from '../types/index.js';

export const AdminController = {
  async getDashboardStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getDashboardStats();
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  },

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      const { search, role } = req.query;
      const filters: UserFilterOptions = {};
      if (search) filters.search = search as string;
      if (role) filters.role = role as 'Leitor' | 'Criador' | 'Admin';

      const result = await AdminService.listUsers({ page, limit }, filters);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: userId } = req.params;
      const { role } = req.body;
      const adminUserId = req.user!.id; // O admin que está fazendo a ação

      const updatedUser = await AdminService.updateUserRole(
        userId,
        role,
        adminUserId,
      );
      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  },

  async listCreators(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const { search } = req.query;

      const result = await AdminService.listCreators(
        { page, limit },
        search as string,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async updateCreatorProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: creatorId } = req.params;
      const adminUserId = req.user!.id;

      const updatedCreator = await AdminService.updateCreatorProfile(
        creatorId,
        req.body,
        adminUserId,
      );
      res.status(200).json(updatedCreator);
    } catch (error) {
      next(error);
    }
  },

  async listHqs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      const { search, genre, isPremium } = req.query;
      const filters: HqFilterOptions = {};
      if (search) filters.search = search as string;
      if (genre) filters.genre = genre as string;
      if (isPremium === 'true') filters.isPremium = true;
      if (isPremium === 'false') filters.isPremium = false;

      const result = await AdminService.listHqs({ page, limit }, filters);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async deleteHq(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: hqId } = req.params;
      const adminUserId = req.user!.id;
      await AdminService.deleteHq(hqId, adminUserId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};