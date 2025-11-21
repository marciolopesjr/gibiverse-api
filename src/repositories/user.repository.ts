// src/repositories/user.repository.ts
import { dbGet, dbRun, dbAll } from '../utils/database.js';
import { UserCreationDTO } from '../schemas/user.schema.js';
import { User, UserFilterOptions } from '../types/index.js';

type UserInsertData = UserCreationDTO & { passwordHash: string };
type UserUpdateData = Partial<Pick<User, 'name' | 'email' | 'role'>>;

interface PaginationParams {
  limit: number;
  offset: number;
}

export const UserRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const row = await dbGet<User>('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    return row || null;
  },

  async findById(id: string): Promise<User | null> {
    const row = await dbGet<User>('SELECT * FROM users WHERE id = $1', [id]);
    return row || null;
  },

  // --- NOVO: Busca por token de reset válido ---
  async findByResetToken(token: string): Promise<User | null> {
    // Verifica se o token bate E se a data de expiração é maior que AGORA
    const sql = `
      SELECT * FROM users 
      WHERE "resetPasswordToken" = $1 
      AND "resetPasswordExpires" > NOW()
    `;
    const row = await dbGet<User>(sql, [token]);
    return row || null;
  },

  // --- NOVO: Salva o token de reset ---
  async saveResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    const sql = `
      UPDATE users 
      SET "resetPasswordToken" = $1, "resetPasswordExpires" = $2 
      WHERE id = $3
    `;
    await dbRun(sql, [token, expiresAt.toISOString(), userId]);
  },

  // --- NOVO: Atualiza senha e limpa o token ---
  async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    const sql = `
      UPDATE users 
      SET "passwordHash" = $1, "resetPasswordToken" = NULL, "resetPasswordExpires" = NULL, "updatedAt" = NOW()
      WHERE id = $2
    `;
    await dbRun(sql, [newPasswordHash, userId]);
  },

  async findAll(
    { limit, offset }: PaginationParams,
    filters: UserFilterOptions = {},
  ): Promise<{ users: User[]; total: number }> {
    const whereClauses: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (filters.search) {
      whereClauses.push(
        `(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`,
      );
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.role) {
      whereClauses.push(`role = $${paramIndex}`);
      params.push(filters.role);
      paramIndex++;
    }

    const whereStatement =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const dataSql = `
      SELECT * FROM users 
      ${whereStatement}
      ORDER BY "createdAt" DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const users = await dbAll<User>(dataSql, [...params, limit, offset]);

    const totalSql = `SELECT COUNT(id) as total FROM users ${whereStatement}`;
    const { total } = (await dbGet(totalSql, params)) as { total: number };

    return { users, total: parseInt(String(total), 10) };
  },

  async count(): Promise<number> {
    const { total } = (await dbGet('SELECT COUNT(id) as total FROM users')) as {
      total: number;
    };
    return parseInt(String(total), 10);
  },

  async create(userData: UserInsertData): Promise<User> {
    const id = `user-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    await dbRun(
      'INSERT INTO users (id, email, name, "passwordHash", role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        id,
        userData.email,
        userData.name,
        userData.passwordHash,
        userData.role,
        now,
        now,
      ],
    );

    const newUser = await this.findById(id);
    if (!newUser) {
      throw new Error('Falha ao criar e recuperar o novo usuário.');
    }
    return newUser;
  },

  async update(id: string, data: UserUpdateData): Promise<User | null> {
    const fields = Object.keys(data).filter(
      (key) => data[key as keyof UserUpdateData] !== undefined,
    );
    if (fields.length === 0) {
      return this.findById(id);
    }

    const values: (string | number | boolean)[] = [];
    let paramIndex = 1;
    const setClause = fields
      .map((field) => {
        const value = data[field as keyof UserUpdateData] as string;
        values.push(value);
        return `"${field}" = $${paramIndex++}`;
      })
      .join(', ');

    const sql = `UPDATE users SET ${setClause}, "updatedAt" = NOW() WHERE id = $${paramIndex} RETURNING *`;
    const updatedUser = await dbGet<User>(sql, [...values, id]);

    return updatedUser || null;
  },
};