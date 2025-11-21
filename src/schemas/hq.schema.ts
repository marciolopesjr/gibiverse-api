// src/schemas/hq.schema.ts
import { z } from 'zod';

export const HqCreationSchema = z.object({
  title: z
    .string()
    .min(3, 'O título deve ter pelo menos 3 caracteres.')
    .max(255),
  genre: z.string().max(100).optional(),
  sinopse: z.string().max(1000).optional(),
  coverImage: z.string().url('A imagem de capa deve ser uma URL válida.'),
  isPremium: z.boolean().default(false),
  pdfPath: z.string().url('O caminho do PDF deve ser uma URL válida.'),
  pageCount: z.number().int().min(1, 'A HQ deve ter pelo menos 1 página.'),
});

export type HqCreationDTO = z.infer<typeof HqCreationSchema>;

export const HqUpdateSchema = HqCreationSchema.omit({
  pdfPath: true,
  pageCount: true,
}).partial();

export type HqUpdateDTO = z.infer<typeof HqUpdateSchema>;