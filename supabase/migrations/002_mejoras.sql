-- Tabla: plantillas de posts
CREATE TABLE plantillas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  cuenta_id UUID REFERENCES cuentas(id) ON DELETE SET NULL,
  tipo_contenido TEXT NOT NULL,
  prompt_visual TEXT,
  descripcion TEXT,
  hashtags TEXT[],
  nota_recomendacion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: notas rápidas
CREATE TABLE notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  color TEXT DEFAULT '#fef9c3',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: historial de cambios en posts
CREATE TABLE post_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campo TEXT NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at para notas
CREATE TRIGGER notas_updated_at
  BEFORE UPDATE ON notas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE plantillas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their plantillas"
  ON plantillas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their notas"
  ON notas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view their post history"
  ON post_historial FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
