-- migrations/002_social_features.sql

-- 1. Tabela de Tags (Categorias normalizadas)
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE
);

-- 2. Tabela Pivot HQ <-> Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS hq_tags (
  "hqId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  PRIMARY KEY ("hqId", "tagId"),
  FOREIGN KEY ("hqId") REFERENCES hqs (id) ON DELETE CASCADE,
  FOREIGN KEY ("tagId") REFERENCES tags (id) ON DELETE CASCADE
);

-- 3. Tabela de Favoritos (User <-> HQ)
CREATE TABLE IF NOT EXISTS favorites (
  "userId" TEXT NOT NULL,
  "hqId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("userId", "hqId"),
  FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY ("hqId") REFERENCES hqs (id) ON DELETE CASCADE
);

-- 4. Tabela de Seguidores (User <-> Creator)
CREATE TABLE IF NOT EXISTS creator_followers (
  "followerId" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("followerId", "creatorId"),
  FOREIGN KEY ("followerId") REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY ("creatorId") REFERENCES creators (id) ON DELETE CASCADE
);

-- 5. Atualizar tabela HQs para ter colunas de Cache de Avaliação
-- Usamos DEFAULT 0 para não quebrar registros existentes
ALTER TABLE hqs 
ADD COLUMN IF NOT EXISTS "averageRating" NUMERIC(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER DEFAULT 0;

-- 6. Tabela de Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "hqId" TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_hq_review UNIQUE ("userId", "hqId"),
  FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY ("hqId") REFERENCES hqs (id) ON DELETE CASCADE
);

-- 7. FUNÇÃO TRIGGER: Calcula a média e contagem automaticamente
CREATE OR REPLACE FUNCTION update_hq_rating_stats() 
RETURNS TRIGGER AS $$
DECLARE
    target_hq_id TEXT;
BEGIN
    -- Determina qual HQ precisa ser atualizada
    IF (TG_OP = 'DELETE') THEN
        target_hq_id := OLD."hqId";
    ELSE
        target_hq_id := NEW."hqId";
    END IF;

    -- Atualiza a tabela hqs com a média e contagem atuais da tabela reviews
    UPDATE hqs
    SET 
        "averageRating" = (
            SELECT COALESCE(ROUND(AVG(rating), 2), 0.00)
            FROM reviews 
            WHERE "hqId" = target_hq_id
        ),
        "reviewCount" = (
            SELECT COUNT(id) 
            FROM reviews 
            WHERE "hqId" = target_hq_id
        )
    WHERE id = target_hq_id;

    -- Retorna null porque é um trigger AFTER e não precisamos modificar a linha do review
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 8. APLICAR O TRIGGER NA TABELA REVIEWS
DROP TRIGGER IF EXISTS trigger_update_hq_rating ON reviews;

CREATE TRIGGER trigger_update_hq_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_hq_rating_stats();