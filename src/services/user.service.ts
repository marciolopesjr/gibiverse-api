// src/services/user.service.ts
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserRepository } from '../repositories/user.repository.js';
import { UserCreationDTO, UserLoginDTO } from '../schemas/user.schema.js';
import { generateToken } from '../utils/jwt.util.js';
import { AuthPayload, User, AuthUser } from '../types/index.js';
import { EmailService } from './email.service.js';

export class BusinessError extends Error {
  public readonly statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = statusCode;
  }
}

export const UserService = {
  async create(
    userData: UserCreationDTO,
  ): Promise<Omit<User, 'passwordHash'>> {
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new BusinessError('Este e-mail já está em uso.', 409);
    }

    const saltRounds = process.env.BCRYPT_SALT_ROUNDS
      ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10)
      : 10;

    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    const newUser = await UserRepository.create({
      ...userData,
      passwordHash: passwordHash,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userResponse } = newUser;
    return userResponse;
  },

  async login(userData: UserLoginDTO): Promise<AuthPayload> {
    const user = await UserRepository.findByEmail(userData.email);
    if (!user) {
      throw new BusinessError('Credenciais inválidas.', 401);
    }

    const isPasswordValid = await bcrypt.compare(
      userData.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new BusinessError('Credenciais inválidas.', 401);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userPayload } = user;
    const token = generateToken(userPayload as AuthUser);

    return {
      user: userPayload,
      token: token,
    };
  },

  // --- RECUPERAÇÃO DE SENHA ---

  async forgotPassword(email: string): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    
    // Segurança: Se o email não existe, não retornamos erro para não vazar quais emails estão cadastrados.
    // Apenas retornamos sucesso silencioso (logamos internamente).
    if (!user) {
      return; 
    }

    // Gera um token hexadecimal aleatório
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpires = new Date();
    passwordResetExpires.setHours(passwordResetExpires.getHours() + 1); // Válido por 1 hora

    await UserRepository.saveResetToken(user.id, resetToken, passwordResetExpires);

    // Envia o email
    // Em um app real, essa URL seria do Frontend (ex: https://gibiverse.com/reset-password?token=...)
    // Como é API only por enquanto, mandamos uma instrução ou deep link.
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    await EmailService.sendMail({
      to: user.email,
      subject: 'Gibiverse - Recuperação de Senha',
      text: `Você solicitou a redefinição de senha.\n\nUse o seguinte token: ${resetToken}\n\nOu clique no link: ${resetUrl}\n\nSe você não solicitou isso, ignore este email.`,
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await UserRepository.findByResetToken(token);

    if (!user) {
      throw new BusinessError('Token inválido ou expirado.', 400);
    }

    const saltRounds = process.env.BCRYPT_SALT_ROUNDS
      ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10)
      : 10;
    
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await UserRepository.updatePassword(user.id, newPasswordHash);
  }
};