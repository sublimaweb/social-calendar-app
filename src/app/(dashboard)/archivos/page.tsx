import { createClient } from '@/lib/supabase/server'
import ArchivosManager from '@/components/ArchivosManager'

export default async function ArchivosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('posts')
    .select('id, titulo, archivo_url, archivo_nombre, archivo_tipo, archivo_tamano, estado, fecha_publicacion, cuenta:cuentas(nombre, red_social, color)')
    .eq('user_id', user!.id)
    .not('archivo_url', 'is', null)
    .order('fecha_publicacion', { ascending: false })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Archivos</h1>
        <p className="text-gray-500 text-sm">Gestiona los archivos multimedia de tus posts</p>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ArchivosManager posts={(posts ?? []) as any} />
    </div>
  )
}
