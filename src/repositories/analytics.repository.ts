// src/repositories/analytics.repository.ts
import { dbAll, dbGet, dbRun } from '../utils/database.js';

export const AnalyticsRepository = {
  // Registra uma visualização com debounce simples de 10 minutos
  async logView(hqId: string, creatorId: string, userId: string): Promise<void> {
    // Anti-spam simples: Se o mesmo usuário viu a mesma HQ nos últimos 10 minutos, não conta novamente.
    const checkSql = `
      SELECT 1 FROM hq_views 
      WHERE "hqId" = $1 AND "userId" = $2 
      AND "createdAt" > NOW() - INTERVAL '10 minutes'
    `;
    const recentView = await dbGet(checkSql, [hqId, userId]);
    
    if (!recentView) {
      await dbRun(
        'INSERT INTO hq_views ("hqId", "creatorId", "userId") VALUES ($1, $2, $3)',
        [hqId, creatorId, userId]
      );
    }
  },

  // Retorna KPIs gerais do criador (cards do topo do dashboard)
  async getCreatorStats(creatorId: string) {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM hq_views WHERE "creatorId" = $1) as "totalViews",
        (SELECT COUNT(*) FROM creator_followers WHERE "creatorId" = $1) as "followersCount",
        (SELECT COALESCE(AVG("averageRating"), 0) FROM hqs WHERE "creatorId" = $1) as "avgRating",
        (SELECT COUNT(*) FROM hqs WHERE "creatorId" = $1) as "totalHqs"
    `;
    const result = await dbGet(sql, [creatorId]);
    
    // Converte strings do Postgres (COUNT retorna string para evitar overflow de int64) para números
    return {
      totalViews: parseInt(result?.totalViews as string || '0', 10),
      followersCount: parseInt(result?.followersCount as string || '0', 10),
      avgRating: parseFloat(result?.avgRating as string || '0'),
      totalHqs: parseInt(result?.totalHqs as string || '0', 10),
    };
  },

  // Retorna views agrupados por dia nos últimos X dias (para gráficos)
  async getViewsOverTime(creatorId: string, days = 30) {
    // Query avançada usando generate_series para preencher dias sem views com 0
    const sql = `
      SELECT 
        to_char(date_trunc('day', series), 'YYYY-MM-DD') as date,
        COUNT(v.id) as views
      FROM generate_series(
        CURRENT_DATE - ($2 || ' days')::interval, 
        CURRENT_DATE, 
        '1 day'
      ) as series
      LEFT JOIN hq_views v ON 
        date_trunc('day', v."createdAt") = series 
        AND v."creatorId" = $1
      GROUP BY series
      ORDER BY series ASC
    `;
    
    const rows = await dbAll(sql, [creatorId, days]);
    
    return rows.map(row => ({
      date: row.date,
      views: parseInt(row.views as string, 10)
    }));
  }
};