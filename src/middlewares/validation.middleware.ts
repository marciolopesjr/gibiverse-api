// src/middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // A correção crucial: sobrescreve req.body com os dados validados e com defaults
      req.body = await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      // Passa o erro Zod para o Error Handler global
      return next(error);
    }
  };