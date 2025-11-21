// src/schemas/readingHistory.schema.ts
import { z } from 'zod';

/**
 * @schema ReadProgressSchema
 * Valida a entrada para a atualização do progresso de leitura.
 */
export const ReadProgressSchema = z.object({
  lastPageRead: z
    .number({
      required_error: 'O número da última página lida é obrigatório.',
      invalid_type_error: 'A página deve ser um número.',
    })
    .int('A página deve ser um número inteiro.')
    .min(0, 'A página lida não pode ser negativa.'),
});