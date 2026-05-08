import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import PostsList from '@/components/posts/PostsList'

interface SearchParams {
  estado?: string
  view?: string
}

export default async function PostsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const vistaArchivados = searchParams.view === 'archivados'

  let query = supabase
    .from('posts')
    .select('*, cuenta:cuentas(*)')
    .eq('user_id', user!.id)
    .order('fecha_publicacion', { ascending: false })

  if (vistaArchivados) {
    query = query.eq('archivado', true)
  } else {
    // Incluir posts sin archivado (NULL) y los no archivados
    query = query.or('archivado.is.null,archivado.eq.false')
  }

  if (searchParams.estado) query = query.eq('estado', searchParams.estado)

  const [{ data: posts }, { data: cuentas }] = await Promise.all([
    query,
    supabase.from('cuentas').select('*').eq('user_id', user!.id).eq('activa', true),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {vistaArchivados ? 'Archivo de posts' : 'Posts'}
          </h1>
          <p className="text-gray-500 text-sm">{posts?.length ?? 0} publicaciones</p>
        </div>
        {!vistaArchivados && (
          <Link href="/posts/nuevo">
            <Button><Plus className="h-4 w-4 mr-2" /> Nuevo post</Button>
          </Link>
        )}
      </div>

      <PostsList posts={posts ?? []} cuentas={cuentas ?? []} vistaArchivados={vistaArchivados} />
    </div>
  )
}
