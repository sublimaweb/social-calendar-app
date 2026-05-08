export type RedSocial =
  | 'Instagram'
  | 'TikTok'
  | 'Facebook'
  | 'LinkedIn'
  | 'X'
  | 'YouTube'
  | 'Pinterest'
  | 'Threads'
  | 'WhatsApp'

export type TipoContenido =
  | 'imagen'
  | 'video'
  | 'carrusel'
  | 'audio'
  | 'reel'
  | 'story'
  | 'texto'

export type EstadoPost =
  | 'borrador'
  | 'en_revision'
  | 'pendiente'
  | 'publicado'
  | 'cancelado'

export type Recurrencia = 'ninguna' | 'semanal' | 'quincenal' | 'mensual'

export const PILARES_CONTENIDO = [
  'educativo',
  'entretenimiento',
  'ventas',
  'inspiracional',
  'producto',
  'comunidad',
] as const

export type PilarContenido = typeof PILARES_CONTENIDO[number]

export const COLORES_PILARES: Record<string, string> = {
  educativo:      '#3b82f6',
  entretenimiento:'#f59e0b',
  ventas:         '#10b981',
  inspiracional:  '#8b5cf6',
  producto:       '#ef4444',
  comunidad:      '#06b6d4',
}

export interface Cuenta {
  id: string
  user_id: string
  nombre: string
  red_social: RedSocial
  color: string
  avatar_url?: string | null
  notas?: string | null
  activa: boolean
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  cuenta_id: string
  tipo_contenido: TipoContenido
  titulo: string
  fecha_publicacion: string
  hora_aproximada?: string | null
  prompt_visual?: string | null
  prompt_copy?: string | null
  descripcion?: string | null
  prompt_hashtags?: string | null
  hashtags?: string[] | null
  nota_recomendacion?: string | null
  archivo_url?: string | null
  archivo_nombre?: string | null
  archivo_tipo?: string | null
  archivo_tamano?: number | null
  archivos?: { url: string; nombre: string; tipo: string; tamano: number }[] | null
  estado: EstadoPost
  pilar?: string | null
  recurrencia?: string | null
  recurrencia_fin?: string | null
  archivado?: boolean | null
  publicado_en?: string | null
  created_at: string
  updated_at: string
  cuenta?: Cuenta
}

export interface PostComentario {
  id: string
  post_id: string
  user_id: string
  contenido: string
  created_at: string
}

export interface Importacion {
  id: string
  user_id: string
  nombre_archivo?: string | null
  tipo_archivo?: string | null
  posts_importados: number
  errores: number
  created_at: string
}

export interface PostImportado {
  cuenta: string
  red_social: RedSocial
  tipo_contenido: TipoContenido
  titulo: string
  fecha_publicacion: string
  hora_aproximada?: string
  prompt_visual?: string
  prompt_copy?: string
  descripcion?: string
  prompt_hashtags?: string
  hashtags?: string[]
  nota_recomendacion?: string
  error?: string
}

export const COLORES_REDES: Record<RedSocial, string> = {
  Instagram: '#E1306C',
  TikTok:    '#000000',
  Facebook:  '#1877F2',
  LinkedIn:  '#0A66C2',
  X:         '#14171A',
  YouTube:   '#FF0000',
  Pinterest: '#E60023',
  Threads:   '#101010',
  WhatsApp:  '#25D366',
}

export const ICONOS_REDES: Record<RedSocial, string> = {
  Instagram: '📸',
  TikTok:    '🎵',
  Facebook:  '📘',
  LinkedIn:  '💼',
  X:         '✖',
  YouTube:   '▶',
  Pinterest: '📌',
  Threads:   '🧵',
  WhatsApp:  '💬',
}

export const PLACEHOLDER_REDES: Record<RedSocial, string> = {
  Instagram: '@usuario o nombre de la página',
  TikTok:    '@usuario de TikTok',
  Facebook:  'Nombre de la página o perfil',
  LinkedIn:  'Nombre de la empresa o perfil',
  X:         '@usuario de X (Twitter)',
  YouTube:   'Nombre del canal',
  Pinterest: '@usuario o nombre del tablero',
  Threads:   '@usuario de Threads',
  WhatsApp:  'Número o nombre del grupo/negocio',
}

export const REDES_SOCIALES: RedSocial[] = [
  'Instagram',
  'TikTok',
  'WhatsApp',
  'Facebook',
  'LinkedIn',
  'X',
  'YouTube',
  'Pinterest',
  'Threads',
]

export const TIPOS_CONTENIDO: TipoContenido[] = [
  'imagen',
  'video',
  'carrusel',
  'audio',
  'reel',
  'story',
  'texto',
]

export const ICONOS_CONTENIDO: Record<TipoContenido, string> = {
  imagen:   '🖼️',
  video:    '🎬',
  carrusel: '📱',
  audio:    '🎵',
  reel:     '🎞️',
  story:    '⭕',
  texto:    '📝',
}

export const ESTADO_CONFIG: Record<EstadoPost, { label: string; icon: string; color: string }> = {
  borrador:    { label: 'Borrador',    icon: '📝', color: 'bg-gray-100 text-gray-600' },
  en_revision: { label: 'En revisión', icon: '👁️',  color: 'bg-blue-100 text-blue-700' },
  pendiente:   { label: 'Pendiente',   icon: '⏳', color: 'bg-amber-100 text-amber-700' },
  publicado:   { label: 'Publicado',   icon: '✅', color: 'bg-green-100 text-green-700' },
  cancelado:   { label: 'Cancelado',   icon: '❌', color: 'bg-red-100 text-red-600' },
}

export interface Plantilla {
  id: string
  user_id: string
  nombre: string
  cuenta_id?: string | null
  tipo_contenido: TipoContenido
  prompt_visual?: string | null
  descripcion?: string | null
  hashtags?: string[] | null
  nota_recomendacion?: string | null
  created_at: string
  cuenta?: Cuenta
}

export interface Nota {
  id: string
  user_id: string
  contenido: string
  color: string
  created_at: string
  updated_at: string
}

export interface PostHistorial {
  id: string
  post_id: string
  user_id: string
  campo: string
  valor_anterior?: string | null
  valor_nuevo?: string | null
  created_at: string
}
