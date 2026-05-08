-- Nuevos campos en posts: pilar de contenido y recurrencia
ALTER TABLE posts ADD COLUMN IF NOT EXISTS pilar TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS recurrencia TEXT DEFAULT 'ninguna';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS recurrencia_fin DATE;

-- El campo estado ya es TEXT sin restricción CHECK, así que los nuevos
-- valores 'borrador' y 'en_revision' funcionan sin cambios adicionales.
-- Flujo: borrador → en_revision → pendiente → publicado
