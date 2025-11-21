// src/repositories/creator.repository.ts
import { dbGet, dbRun, dbAll } from '../utils/database.js';
import { Creator } from '../types/index.js';
import { CreatorProfileDTO } from '../schemas/creator.schema.js';
import { CreatorProfileUpdateDTO } from '../schemas/admin.schema.js';

type CreatorInsertData = CreatorProfileDTO & {
  userId: string;
  analyticsId: string;
};

interface PaginationParams {
  limit: number;
  offset: number;
}

export const CreatorRepository = {
  async findByUserId(userId: string): Promise<Creator | null> {
    const row = await dbGet<Creator>(
      'SELECT * FROM creators WHERE "userId" = $1',
      [userId],
    );
    return row || null;
  },

  async findById(id: string): Promise<Creator | null> {
    const row = await dbGet<Creator>('SELECT * FROM creators WHERE id = $1', [
      id,
    ]);
    return row || null;
  },

  async findAll(
    { limit, offset }: PaginationParams,
    search?: string,
  ): Promise<{ creators: Creator[]; total: number }> {
    const params: (string | number)[] = [];
    let whereStatement = '';
    if (search) {
      whereStatement = `WHERE "penName" ILIKE $1`;
      params.push(`%${search}%`);
    }

    const dataSql = `
      SELECT * FROM creators
      ${whereStatement}
      ORDER BY "createdAt" DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const creators = await dbAll<Creator>(dataSql, [
      ...params,
      limit,
      offset,
    ]);

    const totalSql = `SELECT COUNT(id) as total FROM creators ${whereStatement}`;
    const { total } = (await dbGet(totalSql, params)) as { total: number };

    return { creators, total: parseInt(String(total), 10) };
  },

  async count(): Promise<number> {
    const { total } = (await dbGet(
      'SELECT COUNT(id) as total FROM creators',
    )) as { total: number };
    return parseInt(String(total), 10);
  },

  async create(data: CreatorInsertData): Promise<Creator> {
    const id = `creator-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO creators (id, "userId", "penName", bio, "analyticsId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await dbRun(sql, [
      id,
      data.userId,
      data.penName,
      data.bio,
      data.analyticsId,
      now,
      now,
    ]);

    const newCreatorProfile = await this.findById(id);
    if (!newCreatorProfile) {
      throw new Error('Falha ao criar e recuperar o perfil de criador.');
    }
    return newCreatorProfile;
  },

  async update(
    id: string,
    data: CreatorProfileUpdateDTO,
  ): Promise<Creator | null> {
    const fields = Object.keys(data).filter(
      (key) => data[key as keyof CreatorProfileUpdateDTO] !== undefined,
    );
    if (fields.length === 0) {
      return this.findById(id);
    }

    const values: (string | null)[] = [];
    let paramIndex = 1;
    const setClause = fields
      .map((field) => {
        values.push(data[field as keyof CreatorProfileUpdateDTO] ?? null);
        return `"${field}" = $${paramIndex++}`;
      })
      .join(', ');

    const sql = `UPDATE creators SET ${setClause}, "updatedAt" = NOW() WHERE id = $${paramIndex} RETURNING *`;
    const updatedCreator = await dbGet<Creator>(sql, [...values, id]);

    return updatedCreator || null;
  },
};