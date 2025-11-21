-- migrations/005_creator_analytics.sql

-- Tabela de log de visualizações. 
-- Diferente do history, aqui nós NUNCA atualizamos, só inserimos.
-- Isso permite análise temporal (Time Series).
CREATE TABLE IF NOT EXISTS hq_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "hqId" TEXT NOT NULL,
  "userId" TEXT, -- Pode ser nulo se permitirmos leitura anônima no futuro
  "creatorId" TEXT NOT NULL, -- Desnormalizado para facilitar queries de "Views do Criador X"
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("hqId") REFERENCES hqs (id) ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY ("creatorId") REFERENCES creators (id) ON DELETE CASCADE
);

-- Índices para relatórios rápidos
CREATE INDEX IF NOT EXISTS idx_hq_views_creator_date ON hq_views ("creatorId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_hq_views_hq_date ON hq_views ("hqId", "createdAt");