// src/utils/database.ts
import { Pool, QueryResult, QueryResultRow } from 'pg';
import logger from './logger.js';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.fatal(
    'ERRO FATAL: DATABASE_URL não definida nas variáveis de ambiente.',
  );
  throw new Error('DATABASE_URL não está configurada.');
}

const pool = new Pool({
  connectionString: connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  logger.error(err, 'Erro inesperado no pool de conexões do PostgreSQL');
  process.exit(1);
});

/**
 * Executa uma query que não precisa retornar linhas (INSERT, UPDATE, DELETE).
 */
export const dbRun = async (
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult> => {
  try {
    return await pool.query(sql, params);
  } catch (error) {
    logger.error(
      { sql, params, error },
      'DB_RUN_ERROR: Falha na execução do comando',
    );
    throw error;
  }
};

/**
 * Executa uma query e retorna a primeira linha encontrada (ou undefined).
 */
export const dbGet = async <T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T | undefined> => {
  try {
    const result = await pool.query<T>(sql, params);
    return result.rows[0];
  } catch (error) {
    logger.error(
      { sql, params, error },
      'DB_GET_ERROR: Falha na consulta de uma linha',
    );
    throw error;
  }
};

/**
 * Executa uma query e retorna todas as linhas.
 */
export const dbAll = async <T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> => {
  try {
    const result = await pool.query<T>(sql, params);
    return result.rows;
  } catch (error) {
    logger.error(
      { sql, params, error },
      'DB_ALL_ERROR: Falha na consulta de múltiplas linhas',
    );
    throw error;
  }
};

/**
 * Exporta o pool para casos onde precisamos de transações manuais (client release).
 */
export const getPool = () => pool;