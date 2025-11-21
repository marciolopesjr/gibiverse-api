-- migrations/004_stripe_integration.sql

-- Adiciona ID do cliente Stripe ao usuário
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users ("stripeCustomerId");

-- Reformula a tabela de assinaturas para suportar dados reais do Stripe
-- Adicionamos colunas nullable primeiro
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "stripePriceId" TEXT,
ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP WITH TIME ZONE;

-- Índice para buscar a assinatura pelo ID do Stripe (para Webhooks)
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions ("stripeSubscriptionId");