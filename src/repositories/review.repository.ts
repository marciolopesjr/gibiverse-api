// src/repositories/review.repository.ts
import { dbGet, dbRun, dbAll } from '../utils/database.js';
import { Review } from '../types/index.js';
import { ReviewDTO } from '../schemas/social.schema.js';

export const ReviewRepository = {
  async findByHq(hqId: string): Promise<Review[]> {
    const sql = `
      SELECT r.*, u.name as "userName" -- Opcional: trazer nome do usuário
      FROM reviews r
      JOIN users u ON r."userId" = u.id
      WHERE r."hqId" = $1
      ORDER BY r."createdAt" DESC
    `;
    return dbAll<Review>(sql, [hqId]);
  },

  async findByUserAndHq(userId: string, hqId: string): Promise<Review | null> {
    const sql = 'SELECT * FROM reviews WHERE "userId" = $1 AND "hqId" = $2';
    const review = await dbGet<Review>(sql, [userId, hqId]);
    return review || null;
  },

  async upsert(userId: string, hqId: string, data: ReviewDTO): Promise<Review> {
    const id = `review-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    // UPSERT: Se já existe (userId + hqId), atualiza. Se não, cria.
    const sql = `
      INSERT INTO reviews (id, "userId", "hqId", rating, comment, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $6)
      ON CONFLICT ("userId", "hqId") 
      DO UPDATE SET
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        "updatedAt" = EXCLUDED."updatedAt"
      RETURNING *;
    `;

    const review = await dbGet<Review>(sql, [id, userId, hqId, data.rating, data.comment, now]);
    if (!review) throw new Error('Falha ao salvar review.');
    return review;
  },

  async delete(userId: string, hqId: string): Promise<boolean> {
    const sql = 'DELETE FROM reviews WHERE "userId" = $1 AND "hqId" = $2';
    const result = await dbRun(sql, [userId, hqId]);
    return (result.rowCount || 0) > 0;
  }
};