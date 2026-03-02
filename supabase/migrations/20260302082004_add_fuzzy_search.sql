-- Habilita a extensão de trigramas caso não exista
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Cria um índice GIN na coluna título para buscas rápidas por similaridade
CREATE INDEX IF NOT EXISTS listings_title_trgm_idx ON listings USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS listings_desc_trgm_idx ON listings USING GIN (description gin_trgm_ops);

-- Função de busca Fuzzy para anúncios (tolerante a erros de digitação)
CREATE OR REPLACE FUNCTION search_listings_fuzzy(
  search_term TEXT,
  p_type TEXT DEFAULT NULL,
  p_category_id INT DEFAULT NULL,
  min_similarity FLOAT DEFAULT 0.15
)
RETURNS SETOF listings AS $$
BEGIN
  RETURN QUERY
  SELECT l.*
  FROM listings l
  WHERE 
    l.status = 'ATIVO' 
    AND l.report_count < 10
    AND (p_type IS NULL OR l.type::TEXT = p_type)
    AND (p_category_id IS NULL OR l.category_id = p_category_id)
    -- Verifica se o termo de busca bate com o título ou se há alguma validação (se vazio, ignora)
    AND (
      search_term IS NULL 
      OR search_term = ''
      OR l.title % search_term 
      OR l.description % search_term
      OR word_similarity(search_term, l.title) >= min_similarity
      OR word_similarity(search_term, l.description) >= min_similarity
    )
  ORDER BY 
    -- Ordena primeiro pela maior correspondência textual (maior similaridade)
    GREATEST(word_similarity(search_term, l.title), word_similarity(search_term, l.description)) DESC,
    l.favorites_count DESC, 
    l.created_at DESC
  LIMIT 40;
END;
$$ LANGUAGE plpgsql STABLE;
