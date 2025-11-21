// src/repositories/readingHistory.repository.ts
import { dbGet, dbRun, dbAll } from '../utils/database.js';
import { ReadingHistory, ReadProgressDTO } from '../types/index.js';

export const ReadingHistoryRepository = {
  /**
   * Obtém o progresso de leitura de uma HQ específica para um usuário.
   */
  async findByHqAndUser(
    hqId: string,
    userId: string,
  ): Promise<ReadingHistory | null> {
    const sql = `
      SELECT "userId", "hqId", "lastPageRead", "lastReadAt"
      FROM reading_history 
      WHERE "hqId" = $1 AND "userId" = $2
    `;
    const row = await dbGet<ReadingHistory>(sql, [hqId, userId]);
    return row || null;
  },

  /**
   * Obtém o progresso de leitura para uma lista de HQs para um usuário.
   */
  async findMultipleByHqsAndUser(
    hqIds: string[],
    userId: string,
  ): Promise<ReadingHistory[]> {
    if (hqIds.length === 0) return [];
    
    // O operador ANY no Postgres é usado para checar se hqId está no array de IDs
    const sql = `
      SELECT "userId", "hqId", "lastPageRead", "lastReadAt"
      FROM reading_history
      WHERE "userId" = $1 AND "hqId" = ANY($2)
    `;
    const rows = await dbAll<ReadingHistory>(sql, [userId, hqIds]);
    return rows;
  },

  /**
   * Cria ou atualiza o progresso de leitura (UPSERT).
   */
  async updateProgress(
    hqId: string,
    userId: string,
    data: ReadProgressDTO,
  ): Promise<ReadingHistory> {
    const now = new Date().toISOString();

    // No PostgreSQL, usamos ON CONFLICT para um UPSERT eficiente
    const sql = `
      INSERT INTO reading_history ("userId", "hqId", "lastPageRead", "lastReadAt")
      VALUES ($1, $2, $3, $4)
      ON CONFLICT ("userId", "hqId") DO UPDATE
      SET 
        "lastPageRead" = EXCLUDED."lastPageRead",
        "lastReadAt" = EXCLUDED."lastReadAt"
      RETURNING *
    `;

    const updatedProgress = await dbGet<ReadingHistory>(sql, [
      userId,
      hqId,
      data.lastPageRead,
      now,
    ]);

    if (!updatedProgress) {
      throw new Error('Falha ao criar/atualizar o progresso de leitura.');
    }

    return updatedProgress;
  },
};