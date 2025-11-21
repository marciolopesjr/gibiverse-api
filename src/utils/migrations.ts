// src/utils/migrations.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool } from './database.js';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define onde estão os arquivos .sql. 
// Em dev: src/../../migrations
// Em prod: dist/../../migrations
const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

export async function runMigrations() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    logger.info('Verificando migrações de banco de dados...');

    // 1. Garante que a tabela de controle de migrações existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Lê os arquivos da pasta de migrations
    if (!fs.existsSync(MIGRATIONS_DIR)) {
        logger.warn(`Diretório de migrações não encontrado em: ${MIGRATIONS_DIR}`);
        return;
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Garante ordem alfabética (001, 002, etc.)

    // 3. Verifica quais já foram executadas
    const { rows: executedMigrations } = await client.query(
      'SELECT filename FROM migrations'
    );
    const executedFiles = new Set(executedMigrations.map(row => row.filename));

    // 4. Executa as pendentes
    for (const file of files) {
      if (!executedFiles.has(file)) {
        logger.info(`Executando migração: ${file}`);
        
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        try {
          await client.query('BEGIN'); // Inicia transação para este arquivo
          await client.query(sql);
          await client.query(
            'INSERT INTO migrations (filename) VALUES ($1)',
            [file]
          );
          await client.query('COMMIT'); // Confirma se tudo der certo
          logger.info(`Migração ${file} concluída com sucesso.`);
        } catch (err) {
          await client.query('ROLLBACK'); // Desfaz se der erro
          logger.error({ err, file }, `Erro ao executar migração ${file}. Abortando.`);
          throw err; // Para o processo, não podemos continuar com banco inconsistente
        }
      }
    }

    logger.info('Todas as migrações foram verificadas.');
  } catch (error) {
    logger.fatal(error, 'Falha crítica no sistema de migrações.');
    throw error;
  } finally {
    client.release();
  }
}