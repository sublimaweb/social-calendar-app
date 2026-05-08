-- Tabla: cuentas
CREATE TABLE cuentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  red_social TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  avatar_url TEXT,
  notas TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cuenta_id UUID REFERENCES cuentas(id) ON DELETE CASCADE,
  tipo_contenido TEXT NOT NULL,
  titulo TEXT NOT NULL,
  fecha_publicacion DATE NOT NULL,
  hora_aproximada TIME,
  prompt_visual TEXT,
  descripcion TEXT,
  hashtags TEXT[],
  nota_recomendacion TEXT,
  archivo_url TEXT,
  archivo_nombre TEXT,
  archivo_tipo TEXT,
  archivo_tamano BIGINT,
  estado TEXT DEFAULT 'pendiente',
  publicado_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: importaciones
CREATE TABLE importaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_archivo TEXT,
  tipo_archivo TEXT,
  posts_importados INT DEFAULT 0,
  errores INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para updated_at en posts
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS (Row Level Security)
ALTER TABLE cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE importaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cuentas"
  ON cuentas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own posts"
  ON posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own importaciones"
  ON importaciones FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket (ejecutar en Supabase Dashboard o vía API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Storage policy
-- CREATE POLICY "Users can manage their own media"
--   ON storage.objects FOR ALL
--   USING (auth.uid()::text = (storage.foldername(name))[1])
--   WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
