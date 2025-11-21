// src/services/admin.service.ts
import { UserRepository } from '../repositories/user.repository.js';
import { HqRepository } from '../repositories/hq.repository.js';
import { CreatorRepository } from '../repositories/creator.repository.js';
import { SubscriptionRepository } from '../repositories/subscription.repository.js';
import { BusinessError } from './user.service.js';
import { HqService } from './hq.service.js';
import { AuditService } from './audit.service.js'; // <-- Importação da auditoria
import {
  User,
  UserFilterOptions,
  HqFilterOptions,
  Creator,
} from '../types/index.js';
import { CreatorProfileUpdateDTO } from '../schemas/admin.schema.js';

interface PaginationOptions {
  page: number;
  limit: number;
}

export const AdminService = {
  async getDashboardStats() {
    const [
      totalUsers,
      totalCreators,
      totalHqs,
      activeSubscriptions,
    ] = await Promise.all([
      UserRepository.count(),
      CreatorRepository.count(),
      HqRepository.count(),
      SubscriptionRepository.countActive(),
    ]);

    return {
      totalUsers,
      totalCreators,
      totalHqs,
      activeSubscriptions,
    };
  },

  async listUsers(
    { page, limit }: PaginationOptions,
    filters: UserFilterOptions,
  ) {
    const offset = (page - 1) * limit;
    const { users, total } = await UserRepository.findAll(
      { limit, offset },
      filters,
    );

    const safeUsers = users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });

    return {
      data: safeUsers,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      itemsPerPage: limit,
    };
  },

  async updateUserRole(userId: string, role: User['role'], adminUserId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new BusinessError('Usuário não encontrado.', 404);
    }

    const oldRole = user.role;
    if (oldRole === role) {
      // Nenhuma alteração, apenas retorna o usuário sem fazer nada.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    }

    const updatedUser = await UserRepository.update(userId, { role });
    if (!updatedUser) {
      throw new BusinessError('Falha ao atualizar o usuário.', 500);
    }

    // Registra a ação no log de auditoria
    await AuditService.logAction({
      adminUserId,
      action: 'USER_ROLE_UPDATED',
      target: { type: 'User', id: userId },
      details: { from: oldRole, to: role },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = updatedUser;
    return safeUser;
  },

  async listCreators({ page, limit }: PaginationOptions, search?: string) {
    const offset = (page - 1) * limit;
    const { creators, total } = await CreatorRepository.findAll(
      { limit, offset },
      search,
    );
    return {
      data: creators,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      itemsPerPage: limit,
    };
  },

  async updateCreatorProfile(
    creatorId: string,
    data: CreatorProfileUpdateDTO,
    adminUserId: string,
  ): Promise<Creator> {
    const creator = await CreatorRepository.findById(creatorId);
    if (!creator) {
      throw new BusinessError('Perfil de criador não encontrado.', 404);
    }

    const updatedCreator = await CreatorRepository.update(creatorId, data);
    if (!updatedCreator) {
      throw new BusinessError('Falha ao atualizar o perfil do criador.', 500);
    }

    await AuditService.logAction({
      adminUserId,
      action: 'CREATOR_PROFILE_UPDATED',
      target: { type: 'Creator', id: creatorId },
      details: { changes: data },
    });

    return updatedCreator;
  },

  async listHqs({ page, limit }: PaginationOptions, filters: HqFilterOptions) {
    return HqService.findAll({ page, limit }, filters);
  },

  async deleteHq(hqId: string, adminUserId: string) {
    const hq = await HqRepository.findById(hqId);
    if (!hq) {
      throw new BusinessError('HQ não encontrada.', 404);
    }

    const result = await HqRepository.delete(hqId);

    if (result) {
      await AuditService.logAction({
        adminUserId,
        action: 'HQ_DELETED',
        target: { type: 'HQ', id: hqId },
        details: { title: hq.title, creatorId: hq.creatorId },
      });
    }
  },
};