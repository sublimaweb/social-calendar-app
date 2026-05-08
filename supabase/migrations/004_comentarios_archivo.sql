-- Archivar posts (en lugar de eliminar)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS archivado BOOLEAN DEFAULT false;

-- Hilos de comentarios internos por post
CREATE TABLE post_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE post_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their post comments"
  ON post_comentarios FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índice para acelerar la consulta de comentarios por post
CREATE INDEX IF NOT EXISTS post_comentarios_post_id_idx ON post_comentarios (post_id);
