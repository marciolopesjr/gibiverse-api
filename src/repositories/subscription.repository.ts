// src/repositories/subscription.repository.ts
import { dbGet, dbRun } from '../utils/database.js';
import { Subscription } from '../types/index.js';

export const SubscriptionRepository = {
  async findActiveByUserId(userId: string): Promise<Subscription | null> {
    const sql = `
      SELECT * FROM subscriptions 
      WHERE "userId" = $1 
      AND status IN ('active', 'trialing')
      ORDER BY "endDate" DESC
      LIMIT 1
    `;
    // Correção: Atribuir a const primeiro para o TS entender
    const row = await dbGet<Subscription>(sql, [userId]);
    return row || null;
  },

  async findByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const sql = 'SELECT * FROM subscriptions WHERE "stripeSubscriptionId" = $1';
    // Correção: Atribuir a const primeiro
    const row = await dbGet<Subscription>(sql, [stripeSubscriptionId]);
    return row || null;
  },

  // ... Mantenha o upsertStripeSubscription igual ...
  async upsertStripeSubscription(data: {
    userId: string;
    stripeSubscriptionId: string;
    stripePriceId: string;
    status: string;
    currentPeriodEnd: Date;
  }): Promise<void> {
    const id = `sub-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const endDate = data.currentPeriodEnd.toISOString();

    const sql = `
      INSERT INTO subscriptions (
        id, "userId", "planId", status, "startDate", "endDate", 
        "stripeSubscriptionId", "stripePriceId", "createdAt"
      )
      VALUES ($1, $2, 'premium', $3, $4, $5, $6, $7, $4)
      ON CONFLICT ("stripeSubscriptionId") 
      DO UPDATE SET
        status = EXCLUDED.status,
        "endDate" = EXCLUDED."endDate",
        "stripePriceId" = EXCLUDED."stripePriceId"
    `;

    await dbRun(sql, [
      id,
      data.userId,
      data.status,
      now,
      endDate,
      data.stripeSubscriptionId,
      data.stripePriceId
    ]);
  },
  
  async updateUserStripeId(userId: string, stripeCustomerId: string): Promise<void> {
    await dbRun(
      'UPDATE users SET "stripeCustomerId" = $1 WHERE id = $2',
      [stripeCustomerId, userId]
    );
  },

  async countActive(): Promise<number> {
    const { total } = (await dbGet(
      `SELECT COUNT(id) as total FROM subscriptions WHERE status = 'active'`
    )) as { total: number };
    return parseInt(String(total), 10);
  },
};