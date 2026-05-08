import mammoth from 'mammoth'
import type { PostImportado, RedSocial, TipoContenido } from '@/types'

export async function parseWord(buffer: ArrayBuffer): Promise<PostImportado[]> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return parseTextBlocks(result.value)
}

export function parsePdfText(text: string): PostImportado[] {
  return parseTextBlocks(text)
}

function parseTextBlocks(text: string): PostImportado[] {
  const blocks = text.split(/---+|\n\n\n+/)
  const posts: PostImportado[] = []

  for (const block of blocks) {
    const lines = block.trim().split('\n').filter((l) => l.trim())
    if (lines.length === 0) continue

    const data: Record<string, string> = {}
    for (const line of lines) {
      const colonIdx = line.indexOf(':')
      if (colonIdx === -1) continue
      const key = line.slice(0, colonIdx).trim().toUpperCase()
      const value = line.slice(colonIdx + 1).trim()
      data[key] = value
    }

    const cuenta = data['CUENTA']
    const red = data['RED'] || data['RED SOCIAL']
    const tipo = data['TIPO'] || data['TIPO CONTENIDO']
    const titulo = data['TITULO'] || data['TÍTULO']
    const fecha = data['FECHA']

    if (!cuenta || !red || !tipo || !titulo || !fecha) continue

    const hashtagsRaw = data['HASHTAGS'] || ''
    const hashtags = hashtagsRaw
      .split(/\s+/)
      .filter((h) => h.startsWith('#'))

    posts.push({
      cuenta: cuenta.trim(),
      red_social: red.trim() as RedSocial,
      tipo_contenido: tipo.trim().toLowerCase() as TipoContenido,
      titulo: titulo.trim(),
      fecha_publicacion: parseTextDate(fecha.trim()),
      hora_aproximada: data['HORA']?.trim() || undefined,
      prompt_visual: data['PROMPT']?.trim() || data['PROMPT VISUAL']?.trim() || undefined,
      prompt_copy: data['PROMPT COPY']?.trim() || undefined,
      descripcion: data['DESCRIPCION']?.trim() || data['DESCRIPCIÓN']?.trim() || undefined,
      prompt_hashtags: data['PROMPT HASHTAGS']?.trim() || undefined,
      hashtags: hashtags.length > 0 ? hashtags : undefined,
      nota_recomendacion: data['NOTAS']?.trim() || undefined,
    })
  }

  return posts
}

function parseTextDate(value: string): string {
  const parts = value.split('/')
  if (parts.length === 3) {
    const [d, m, y] = parts
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return value
}
