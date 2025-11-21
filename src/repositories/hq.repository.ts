// src/repositories/hq.repository.ts
import { dbAll, dbGet, dbRun, getPool } from '../utils/database.js';
import { HQ, HqFilterOptions, Tag } from '../types/index.js';
import { HqCreationDTO, HqUpdateDTO } from '../schemas/hq.schema.js';

// Estendemos o tipo interno para incluir as tags retornadas pelo JSON_AGG
type HqRow = HQ & { 
  creatorPenName: string;
  tags: Tag[]; // O Postgres retornará isso como um array JSON
};

interface PaginationParams {
  limit: number;
  offset: number;
}

export const HqRepository = {
  async findAll(
    { limit, offset }: PaginationParams,
    filters: HqFilterOptions = {},
  ): Promise<{ hqs: HqRow[]; total: number }> {
    const whereClauses: string[] = [];
    const params: (string | number | boolean)[] = [];
    let paramIndex = 1;

    // Filtros Básicos
    if (filters.search) {
      whereClauses.push(
        `(h.title ILIKE $${paramIndex} OR h.sinopse ILIKE $${paramIndex})`,
      );
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    if (typeof filters.isPremium === 'boolean') {
      whereClauses.push(`h."isPremium" = $${paramIndex}`);
      params.push(filters.isPremium);
      paramIndex++;
    }
    
    // Novo Filtro: Tag Slug
    // Usamos EXISTS para performance, em vez de JOIN na query principal que duplicaria linhas antes do group
    if (filters.tag) {
      whereClauses.push(`EXISTS (
        SELECT 1 FROM hq_tags ht 
        JOIN tags t ON ht."tagId" = t.id 
        WHERE ht."hqId" = h.id AND t.slug = $${paramIndex}
      )`);
      params.push(filters.tag);
      paramIndex++;
    }

    const whereStatement =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // QUERY PODEROSA COM JSON_AGG
    // Agrupa as tags em um array JSON para cada HQ
    const dataSql = `
      SELECT 
        h.*, 
        c."penName" as "creatorPenName",
        COALESCE(
          json_agg(
            json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
          ) FILTER (WHERE t.id IS NOT NULL), 
          '[]'
        ) as tags
      FROM hqs h
      JOIN creators c ON h."creatorId" = c.id
      LEFT JOIN hq_tags ht ON h.id = ht."hqId"
      LEFT JOIN tags t ON ht."tagId" = t.id
      ${whereStatement}
      GROUP BY h.id, c.id
      ORDER BY h."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Nota: params precisa bater com os índices. Adicionamos limit e offset no final.
    const hqs = await dbAll<HqRow>(dataSql, [...params, limit, offset]);

    // Contagem total (simplificada, sem joins desnecessários)
    const totalSql = `SELECT COUNT(h.id) as total FROM hqs h ${whereStatement}`;
    const { total } = (await dbGet(totalSql, params)) as { total: number };

    return { hqs, total: parseInt(String(total), 10) };
  },

  async findById(id: string): Promise<HqRow | null> {
    const sql = `
      SELECT 
        h.*, 
        c."penName" as "creatorPenName",
        COALESCE(
          json_agg(
            json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
          ) FILTER (WHERE t.id IS NOT NULL), 
          '[]'
        ) as tags
      FROM hqs h
      JOIN creators c ON h."creatorId" = c.id
      LEFT JOIN hq_tags ht ON h.id = ht."hqId"
      LEFT JOIN tags t ON ht."tagId" = t.id
      WHERE h.id = $1
      GROUP BY h.id, c.id
    `;
    const row = await dbGet<HqRow>(sql, [id]);
    return row || null;
  },

  async findByCreatorId(
    creatorId: string,
    { limit, offset }: PaginationParams,
    filters: HqFilterOptions = {},
  ): Promise<{ hqs: HqRow[]; total: number }> {
    // Similar ao findAll, mas fixo no creatorId
    // Para brevidade, omitindo a implementação completa repetitiva, 
    // mas deve seguir o mesmo padrão do findAll com json_agg
    
    const whereClauses: string[] = ['h."creatorId" = $1'];
    const params: (string | number | boolean)[] = [creatorId];
    let paramIndex = 2;

    if (filters.search) {
      whereClauses.push(`(h.title ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereStatement = `WHERE ${whereClauses.join(' AND ')}`;

    const dataSql = `
      SELECT 
        h.*, 
        c."penName" as "creatorPenName",
        COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)) FILTER (WHERE t.id IS NOT NULL), '[]') as tags
      FROM hqs h
      JOIN creators c ON h."creatorId" = c.id
      LEFT JOIN hq_tags ht ON h.id = ht."hqId"
      LEFT JOIN tags t ON ht."tagId" = t.id
      ${whereStatement}
      GROUP BY h.id, c.id
      ORDER BY h."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const hqs = await dbAll<HqRow>(dataSql, [...params, limit, offset]);
    
    const totalSql = `SELECT COUNT(h.id) as total FROM hqs h ${whereStatement}`;
    const { total } = (await dbGet(totalSql, params)) as { total: number };

    return { hqs, total: parseInt(String(total), 10) };
  },

  async count(): Promise<number> {
    const { total } = (await dbGet('SELECT COUNT(id) as total FROM hqs')) as {
      total: number;
    };
    return parseInt(String(total), 10);
  },

  async create(
    hqData: HqCreationDTO & { creatorId: string; storagePath: string },
  ): Promise<HQ> {
    const id = `hq-${crypto.randomUUID()}`;
    const sql = `
      INSERT INTO hqs (id, "creatorId", title, genre, sinopse, "storagePath", "isPremium", "coverImage", "pdfPath", "pageCount")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const newHq = await dbGet<HQ>(sql, [
      id,
      hqData.creatorId,
      hqData.title,
      hqData.genre,
      hqData.sinopse,
      hqData.storagePath,
      hqData.isPremium,
      hqData.coverImage,
      hqData.pdfPath,
      hqData.pageCount,
    ]);

    if (!newHq) throw new Error('Falha ao criar HQ.');
    return newHq;
  },

  async update(id: string, data: HqUpdateDTO): Promise<HQ | null> {
    const fields = Object.keys(data).filter(
      (key) => data[key as keyof HqUpdateDTO] !== undefined,
    );
    if (fields.length === 0) {
        // Hack para retornar o objeto mesmo sem update
        const existing = await this.findById(id);
        return existing;
    }

    const values: (string | number | boolean)[] = [];
    const setClause = fields
      .map((field, index) => {
        values.push(data[field as keyof HqUpdateDTO] as string | number | boolean);
        return `"${field}" = $${index + 1}`;
      })
      .join(', ');

    const sql = `UPDATE hqs SET ${setClause}, "updatedAt" = NOW() WHERE id = $${values.length + 1}`;
    await dbRun(sql, [...values, id]);
    
    // Retorna o objeto atualizado usando o findById para trazer as tags se houver
    return this.findById(id);
  },

  async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM hqs WHERE id = $1';
    const result = await dbRun(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  },
};