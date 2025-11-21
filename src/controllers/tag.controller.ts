// src/controllers/tag.controller.ts
import { Request, Response, NextFunction } from 'express';
import { TagService } from '../services/tag.service.js';

export const TagController = {
  async index(_req: Request, res: Response, next: NextFunction) {
    try {
      const tags = await TagService.listAll();
      res.status(200).json(tags);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Assumimos que validação Zod já ocorreu na rota
      const newTag = await TagService.create(req.body);
      res.status(201).json(newTag);
    } catch (error) {
      next(error);
    }
  }
};