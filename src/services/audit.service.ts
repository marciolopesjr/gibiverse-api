// src/services/audit.service.ts
import { AuditRepository } from '../repositories/audit.repository.js';
import logger from '../utils/logger.js';

type LogActionParams = {
  adminUserId: string;
  action: string;
  target?: {
    type: string;
    id: string;
  };
  details?: object;
};

export const AuditService = {
  async logAction(params: LogActionParams): Promise<void> {
    try {
      await AuditRepository.create({
        adminUserId: params.adminUserId,
        action: params.action,
        targetType: params.target?.type,
        targetId: params.target?.id,
        details: params.details,
      });
    } catch (error) {
      // Um erro ao logar não deve quebrar a operação principal.
      // Apenas registramos o erro e seguimos em frente.
      logger.error(
        { error, params },
        'Falha ao registrar ação no log de auditoria.',
      );
    }
  },
};