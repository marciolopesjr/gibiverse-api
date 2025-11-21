// src/schemas/social.schema.ts
import { z } from 'zod';

/**
 * Validação para criar/atualizar um Review
 */
export const ReviewSchema = z.object({
  rating: z
    .number({
      required_error: 'A nota é obrigatória.',
      invalid_type_error: 'A nota deve ser um número.',
    })
    .int()
    .min(1, 'A nota mínima é 1.')
    .max(5, 'A nota máxima é 5.'),
  comment: z
    .string()
    .max(500, 'O comentário não pode exceder 500 caracteres.')
    .optional(),
});

/**
 * Validação para criar Tags (Admin)
 */
export const TagCreationSchema = z.object({
  name: z
    .string()
    .min(2, 'O nome da tag deve ter pelo menos 2 caracteres.')
    .max(50),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'O slug deve conter apenas letras minúsculas, números e hifens.')
    .optional(), // Se não enviado, geramos a partir do nome
});

export type ReviewDTO = z.infer<typeof ReviewSchema>;
export type TagCreationDTO = z.infer<typeof TagCreationSchema>;