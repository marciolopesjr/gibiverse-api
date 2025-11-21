// src/repositories/audit.repository.ts
import { dbRun } from '../utils/database.js';

interface AuditLogData {
  adminUserId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: object;
}

export const AuditRepository = {
  async create(logData: AuditLogData): Promise<void> {
    const id = `audit-${crypto.randomUUID()}`;
    const sql = `
      INSERT INTO audit_logs (id, "adminUserId", action, "targetType", "targetId", details)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await dbRun(sql, [
      id,
      logData.adminUserId,
      logData.action,
      logData.targetType,
      logData.targetId,
      logData.details ? JSON.stringify(logData.details) : null,
    ]);
  },
};