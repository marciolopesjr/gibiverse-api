// src/services/creator.service.ts
import crypto from 'crypto';
import { CreatorRepository } from '../repositories/creator.repository.js';
import { AnalyticsRepository } from '../repositories/analytics.repository.js';
import { BusinessError } from './user.service.js';
import { CreatorProfileDTO } from '../schemas/creator.schema.js';
import { Creator } from '../types/index.js';

export const CreatorService = {
  async getCreatorByUserId(userId: string): Promise<Creator | null> {
    return CreatorRepository.findByUserId(userId);
  },

  async createProfile(
    profileData: CreatorProfileDTO,
    userId: string,
  ): Promise<Creator> {
    const existingProfile = await this.getCreatorByUserId(userId);
    if (existingProfile) {
      throw new BusinessError('Este usuário já possui um perfil de criador.', 409);
    }

    const analyticsId = `analytics-${crypto.randomUUID()}`;

    const newProfile = await CreatorRepository.create({
      ...profileData,
      userId,
      analyticsId,
    });

    return newProfile;
  },

  /**
   * Agrega dados para o painel do criador
   */
  async getDashboard(userId: string) {
    const creator = await this.getCreatorByUserId(userId);
    if (!creator) {
      throw new BusinessError('Usuário não é um criador ou não possui perfil configurado.', 403);
    }

    // Executa as queries de estatísticas em paralelo para performance
    const [stats, viewsChart] = await Promise.all([
      AnalyticsRepository.getCreatorStats(creator.id),
      AnalyticsRepository.getViewsOverTime(creator.id, 30) // Últimos 30 dias
    ]);

    return {
      profile: creator,
      stats,
      charts: {
        viewsLast30Days: viewsChart
      }
    };
  }
};