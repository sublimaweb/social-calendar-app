import { createClient } from '@/lib/supabase/server'
import KanbanView from '@/components/KanbanView'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function KanbanPage() {
  const supabase = await createClient()

  const [{ data: posts }, { data: cuentas }] = await Promise.all([
    supabase.from('posts').select('*, cuenta:cuentas(*)').order('fecha_publicacion', { ascending: true }),
    supabase.from('cuentas').select('*').order('nombre'),
  ])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kanban</h1>
          <p className="text-sm text-gray-500 mt-0.5">Arrastra los posts entre columnas para cambiar su estado</p>
        </div>
        <Link href="/posts/nuevo">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo post</Button>
        </Link>
      </div>

      <KanbanView posts={posts ?? []} cuentas={cuentas ?? []} />
    </div>
  )
}
