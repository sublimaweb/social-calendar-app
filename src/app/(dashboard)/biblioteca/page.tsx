import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BibliotecaMedias from '@/components/BibliotecaMedias'
import { Image as ImageIcon } from 'lucide-react'

export default async function BibliotecaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Lista archivos del bucket "media" en la carpeta del usuario
  const { data: objetos } = await supabase.storage.from('media').list(user.id, {
    limit: 200,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  // Expandir subdirectorios (posts usan userId/postId/archivo)
  const archivos: { name: string; url: string; tipo: string; tamano: number; created_at: string }[] = []

  for (const obj of objetos ?? []) {
    if (!obj.metadata) {
      // es un directorio — listar su contenido
      const { data: sub } = await supabase.storage.from('media').list(`${user.id}/${obj.name}`, {
        limit: 100, sortBy: { column: 'created_at', order: 'desc' },
      })
      for (const f of sub ?? []) {
        if (!f.metadata) continue
        const path = `${user.id}/${obj.name}/${f.name}`
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
        archivos.push({
          name: f.name,
          url: publicUrl,
          tipo: f.metadata.mimetype ?? 'application/octet-stream',
          tamano: f.metadata.size ?? 0,
          created_at: f.created_at ?? '',
        })
      }
    } else {
      const path = `${user.id}/${obj.name}`
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      archivos.push({
        name: obj.name,
        url: publicUrl,
        tipo: obj.metadata.mimetype ?? 'application/octet-stream',
        tamano: obj.metadata.size ?? 0,
        created_at: obj.created_at ?? '',
      })
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Biblioteca de medios</h1>
        </div>
        <p className="text-sm text-gray-500">Todos los archivos subidos — reutiliza imágenes y videos en tus posts</p>
      </div>

      <BibliotecaMedias archivos={archivos} userId={user.id} />
    </div>
  )
}
