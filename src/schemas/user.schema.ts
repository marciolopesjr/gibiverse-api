// src/schemas/user.schema.ts
import { z } from 'zod';

export const UserCreationSchema = z.object({
  email: z
    .string({ required_error: 'O e-mail é obrigatório.' })
    .email('Formato de e-mail inválido.')
    .max(255),
  name: z
    .string({ required_error: 'O nome é obrigatório.' })
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(100),
  password: z
    .string({ required_error: 'A senha é obrigatória.' })
    .min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  role: z.enum(['Leitor', 'Criador']).default('Leitor'),
});

export type UserCreationDTO = z.infer<typeof UserCreationSchema>;

export const UserLoginSchema = z.object({
  email: z.string().email('Formato de e-mail inválido.'),
  password: z.string().nonempty('A senha não pode estar vazia.'),
});

export type UserLoginDTO = z.infer<typeof UserLoginSchema>;

// --- NOVOS SCHEMAS ---

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Formato de e-mail inválido.'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().nonempty('O token é obrigatório.'),
  newPassword: z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres.'),
});