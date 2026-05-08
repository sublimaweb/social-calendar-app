import { createClient } from './client'

const BUCKET = 'media'

export async function uploadFile(
  file: File,
  userId: string,
  postId: string
): Promise<{ url: string; path: string } | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `${userId}/${postId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    console.error('Error uploading file:', error)
    return null
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

export async function deleteFile(path: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) {
    console.error('Error deleting file:', error)
    return false
  }
  return true
}

export function getFilePathFromUrl(url: string): string {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return ''
  return url.slice(idx + marker.length)
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
