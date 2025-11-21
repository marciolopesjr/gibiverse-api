// src/services/hq.service.ts
import { HqRepository } from '../repositories/hq.repository.js';
import { HqCreationDTO, HqUpdateDTO } from '../schemas/hq.schema.js';
import { BusinessError } from './user.service.js';
import {
  AuthUser,
  Creator,
  HQ,
  PaginatedResponse,
  HqFilterOptions,
  HqWithProgress,
} from '../types/index.js';
import { SubscriptionService } from './subscription.service.js';
import { ReadingHistoryService } from './readingHistory.service.js';
import { AnalyticsRepository } from '../repositories/analytics.repository.js'; // Import novo

interface PaginationOptions {
  page: number;
  limit: number;
}

export const HqService = {
  async findAll(
    { page, limit }: PaginationOptions,
    filters: HqFilterOptions,
    userId?: string,
  ): Promise<PaginatedResponse<HqWithProgress>> {
    const offset = (page - 1) * limit;
    const { hqs, total } = await HqRepository.findAll({ limit, offset }, filters);

    let hqsWithProgress: HqWithProgress[] = hqs.map((hq) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { storagePath, ...safeHq } = hq;
      return safeHq as HqWithProgress;
    });

    if (userId) {
      const hqIds = hqs.map((hq) => hq.id);
      const progressHistory = await ReadingHistoryService.getMultipleProgress(
        hqIds,
        userId,
      );

      const progressMap = new Map(
        progressHistory.map((p) => [p.hqId, p.lastPageRead]),
      );

      hqsWithProgress = hqsWithProgress.map((hq) => ({
        ...hq,
        lastPageRead: progressMap.get(hq.id),
      }));
    }

    return {
      data: hqsWithProgress,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      itemsPerPage: limit,
    };
  },

  async findById(id: string, user: AuthUser) {
    const hq = await HqRepository.findById(id);

    if (!hq) {
      throw new BusinessError(`HQ com ID ${id} não encontrada.`, 404);
    }

    if (hq.isPremium) {
      const isCreatorOrAdmin =
        user.role === 'Criador' || user.role === 'Admin';
      
      // Verificação de assinatura agora usa o método real (conectado ao banco/Stripe)
      const isSubscribed = await SubscriptionService.isUserSubscribed(user.id);

      if (!isCreatorOrAdmin && !isSubscribed) {
        throw new BusinessError(
          'Conteúdo Premium. Assinatura ativa é necessária.',
          403,
        );
      }
    }

    // --- REGISTRO DE ANALYTICS ---
    // Registra que a HQ foi visualizada. 
    // Usamos .catch para garantir que uma falha no log não impeça o usuário de ler.
    AnalyticsRepository.logView(hq.id, hq.creatorId, user.id).catch(() => {
        // Silencioso em produção ou logger.warn em dev
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { storagePath, ...hqDetails } = hq;
    return hqDetails;
  },

  async findHqsByCreatorId(
    creatorId: string,
    { page, limit }: PaginationOptions,
    filters: HqFilterOptions,
    userId: string,
  ): Promise<PaginatedResponse<HqWithProgress>> {
    const offset = (page - 1) * limit;
    const { hqs, total } = await HqRepository.findByCreatorId(
      creatorId,
      { limit, offset },
      filters,
    );

    let hqsWithProgress: HqWithProgress[] = hqs.map((hq) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { storagePath, ...safeHq } = hq;
      return safeHq as HqWithProgress;
    });

    const hqIds = hqs.map((hq) => hq.id);
    const progressHistory = await ReadingHistoryService.getMultipleProgress(
      hqIds,
      userId,
    );

    const progressMap = new Map(
      progressHistory.map((p) => [p.hqId, p.lastPageRead]),
    );

    hqsWithProgress = hqsWithProgress.map((hq) => ({
      ...hq,
      lastPageRead: progressMap.get(hq.id),
    }));

    return {
      data: hqsWithProgress,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      itemsPerPage: limit,
    };
  },

  async create(hqData: HqCreationDTO, creatorId: string): Promise<HQ> {
    const storagePath = `uploads/hqs/${creatorId}/${hqData.title
      .toLowerCase()
      .replace(/\s+/g, '-')}`;

    const newHq = await HqRepository.create({
      ...hqData,
      creatorId,
      storagePath,
    });

    return newHq;
  },

  async update(hqId: string, data: HqUpdateDTO, creatorProfile: Creator) {
    const hq = await HqRepository.findById(hqId);
    if (!hq) {
      throw new BusinessError(`HQ com ID ${hqId} não encontrada.`, 404);
    }

    if (hq.creatorId !== creatorProfile.id) {
      throw new BusinessError(
        'Você não tem permissão para editar esta HQ.',
        403,
      );
    }

    return HqRepository.update(hqId, data);
  },

  async delete(hqId: string, creatorProfile: Creator) {
    const hq = await HqRepository.findById(hqId);
    if (!hq) {
      throw new BusinessError(`HQ com ID ${hqId} não encontrada.`, 404);
    }

    if (hq.creatorId !== creatorProfile.id) {
      throw new BusinessError(
        'Você não tem permissão para excluir esta HQ.',
        403,
      );
    }

    return HqRepository.delete(hqId);
  },
};