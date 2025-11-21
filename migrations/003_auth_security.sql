-- migrations/003_auth_security.sql

-- Adiciona colunas para controle de reset de senha
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "resetPasswordToken" TEXT,
ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP WITH TIME ZONE;

-- Cria um índice para buscar pelo token rapidamente (segurança e performance)
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users ("resetPasswordToken");