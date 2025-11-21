// src/services/tag.service.ts
import { TagRepository } from '../repositories/tag.repository.js';
import { TagCreationDTO } from '../schemas/social.schema.js';
import { BusinessError } from './user.service.js';

export const TagService = {
  async listAll() {
    return TagRepository.findAll();
  },

  async create(data: TagCreationDTO) {
    // Se não veio slug, cria um simples baseado no nome (ex: "Ação & Aventura" -> "acao-aventura")
    const finalSlug = data.slug || data.name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Troca chars especiais por hífen
      .replace(/^-+|-+$/g, ''); // Remove hífens do começo/fim

    const existing = await TagRepository.findBySlug(finalSlug);
    if (existing) {
      throw new BusinessError(`A tag com slug '${finalSlug}' já existe.`, 409);
    }

    return TagRepository.create(data.name, finalSlug);
  }
};