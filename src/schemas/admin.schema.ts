// src/schemas/admin.schema.ts
import { z } from 'zod';

/**
 * @schema UserRoleUpdateSchema
 * Valida a entrada para a atualização de role de um usuário pelo admin.
 */
export const UserRoleUpdateSchema = z.object({
  role: z.enum(['Leitor', 'Criador', 'Admin'], {
    required_error: 'O campo "role" é obrigatório.',
    invalid_type_error: 'O valor do "role" é inválido.',
  }),
});

/**
 * @schema CreatorProfileUpdateSchema
 * Valida a entrada para a atualização do perfil de um criador pelo admin.
 * É um partial do schema original de criação de perfil.
 */
export const CreatorProfileUpdateSchema = z
  .object({
    penName: z
      .string()
      .min(2, 'O nome artístico deve ter pelo menos 2 caracteres.')
      .max(100),
    bio: z
      .string()
      .max(1000, 'A biografia é muito longa (máximo de 1000 caracteres).')
      .nullable(), // Permite que a bio seja definida como nula
  })
  .partial();

export type UserRoleUpdateDTO = z.infer<typeof UserRoleUpdateSchema>;
export type CreatorProfileUpdateDTO = z.infer<typeof CreatorProfileUpdateSchema>;