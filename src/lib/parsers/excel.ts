import * as XLSX from 'xlsx'
import type { PostImportado, RedSocial, TipoContenido } from '@/types'

export function parseExcel(buffer: ArrayBuffer): PostImportado[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets['Posts'] || workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { header: 'A' })

  const posts: PostImportado[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row.A || !row.B || !row.C || !row.D || !row.E) continue

    const hashtags = row.K
      ? row.K.split(/\s+/).filter((h) => h.startsWith('#'))
      : []

    posts.push({
      cuenta: row.A?.trim(),
      red_social: row.B?.trim() as RedSocial,
      tipo_contenido: row.C?.trim().toLowerCase() as TipoContenido,
      titulo: row.D?.trim(),
      fecha_publicacion: parseExcelDate(row.E),
      hora_aproximada: row.F?.trim() || undefined,
      prompt_visual: row.G?.trim() || undefined,
      prompt_copy: row.H?.trim() || undefined,
      descripcion: row.I?.trim() || undefined,
      prompt_hashtags: row.J?.trim() || undefined,
      hashtags: hashtags.length > 0 ? hashtags : undefined,
      nota_recomendacion: row.L?.trim() || undefined,
    })
  }

  return posts
}

function parseExcelDate(value: string | number): string {
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    const d = new Date(date.y, date.m - 1, date.d)
    return d.toISOString().split('T')[0]
  }
  const parts = String(value).split('/')
  if (parts.length === 3) {
    const [d, m, y] = parts
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return value
}
