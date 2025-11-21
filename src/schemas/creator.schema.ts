// src/schemas/creator.schema.ts
import { z } from 'zod';

export const CreatorProfileSchema = z.object({
  penName: z
    .string({ required_error: 'O nome artístico (penName) é obrigatório.' })
    .min(2, 'O nome artístico deve ter pelo menos 2 caracteres.')
    .max(100),
  bio: z
    .string()
    .max(1000, 'A biografia é muito longa (máximo de 1000 caracteres).')
    .optional(),
});

export type CreatorProfileDTO = z.infer<typeof CreatorProfileSchema>;