// src/repositories/social.repository.ts
import { dbRun, dbGet, dbAll } from '../utils/database.js';
import { HQ } from '../types/index.js';

export const SocialRepository = {
  // --- FAVORITOS ---

  async addFavorite(userId: string, hqId: string): Promise<void> {
    const sql = `
      INSERT INTO favorites ("userId", "hqId")
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING -- Se já for favorito, ignora
    `;
    await dbRun(sql, [userId, hqId]);
  },

  async removeFavorite(userId: string, hqId: string): Promise<void> {
    await dbRun('DELETE FROM favorites WHERE "userId" = $1 AND "hqId" = $2', [userId, hqId]);
  },

  async isFavorite(userId: string, hqId: string): Promise<boolean> {
    const result = await dbGet(
      'SELECT 1 FROM favorites WHERE "userId" = $1 AND "hqId" = $2',
      [userId, hqId]
    );
    return !!result;
  },

  async listUserFavorites(userId: string): Promise<HQ[]> {
    // Retorna as HQs que o usuário favoritou
    const sql = `
      SELECT h.*, c."penName" as creatorPenName
      FROM hqs h
      JOIN creators c ON h."creatorId" = c.id
      JOIN favorites f ON h.id = f."hqId"
      WHERE f."userId" = $1
      ORDER BY f."createdAt" DESC
    `;
    return dbAll<HQ>(sql, [userId]);
  },

  // --- SEGUIDORES ---

  async followCreator(followerId: string, creatorId: string): Promise<void> {
    const sql = `
      INSERT INTO creator_followers ("followerId", "creatorId")
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `;
    await dbRun(sql, [followerId, creatorId]);
  },

  async unfollowCreator(followerId: string, creatorId: string): Promise<void> {
    await dbRun(
      'DELETE FROM creator_followers WHERE "followerId" = $1 AND "creatorId" = $2',
      [followerId, creatorId]
    );
  },

  async listFollowing(userId: string): Promise<any[]> {
    const sql = `
      SELECT c.*
      FROM creators c
      JOIN creator_followers cf ON c.id = cf."creatorId"
      WHERE cf."followerId" = $1
      ORDER BY cf."createdAt" DESC
    `;
    return dbAll(sql, [userId]);
  }
};