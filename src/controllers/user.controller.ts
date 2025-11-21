// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { UserCreationDTO, UserLoginDTO } from '../schemas/user.schema.js';

export const UserController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const newUser = await UserService.create(req.body as UserCreationDTO);
      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.login(req.body as UserLoginDTO);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await UserService.forgotPassword(email);
      // Sempre retornamos 200 OK por segurança, mesmo se o email não existir
      res.status(200).json({ message: 'Se o email existir, instruções foram enviadas.' });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      await UserService.resetPassword(token, newPassword);
      res.status(200).json({ message: 'Senha alterada com sucesso.' });
    } catch (error) {
      next(error);
    }
  }
};