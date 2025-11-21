// src/repositories/tag.repository.ts
import { dbAll, dbGet, dbRun } from '../utils/database.js';
import { Tag } from '../types/index.js';

export const TagRepository = {
  async findAll(): Promise<Tag[]> {
    return dbAll<Tag>('SELECT * FROM tags ORDER BY name ASC');
  },

  async findBySlug(slug: string): Promise<Tag | null> {
    const tag = await dbGet<Tag>('SELECT * FROM tags WHERE slug = $1', [slug]);
    return tag || null;
  },

  async create(name: string, slug: string): Promise<Tag> {
    const id = `tag-${crypto.randomUUID()}`;
    const sql = `
      INSERT INTO tags (id, name, slug)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const newTag = await dbGet<Tag>(sql, [id, name, slug]);
    if (!newTag) throw new Error('Falha ao criar tag.');
    return newTag;
  },

  /**
   * Associa uma lista de IDs de tags a uma HQ.
   * Primeiro limpa as associações antigas (estratégia simples) e insere as novas.
   */
  async syncTagsForHq(hqId: string, tagIds: string[]): Promise<void> {
    const client = await import('../utils/database.js').then(m => m.getPool().connect());
    
    try {
      await client.query('BEGIN');
      
      // 1. Remove associações existentes
      await client.query('DELETE FROM hq_tags WHERE "hqId" = $1', [hqId]);

      // 2. Insere as novas
      if (tagIds.length > 0) {
        // Montagem de Bulk Insert manual para performance
        const values: string[] = [];
        const params: string[] = [hqId];
        let paramIndex = 2;

        tagIds.forEach(tagId => {
            values.push(`($1, $${paramIndex})`);
            params.push(tagId);
            paramIndex++;
        });

        const sql = `
          INSERT INTO hq_tags ("hqId", "tagId")
          VALUES ${values.join(', ')}
        `;
        await client.query(sql, params);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};