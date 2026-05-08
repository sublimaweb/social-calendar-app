import { createClient } from '@/lib/supabase/server'
import EstadisticasView from '@/components/EstadisticasView'

export default async function EstadisticasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: posts }, { data: cuentas }] = await Promise.all([
    supabase.from('posts').select('*, cuenta:cuentas(*)').eq('user_id', user!.id),
    supabase.from('cuentas').select('*').eq('user_id', user!.id),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estadísticas</h1>
        <p className="text-gray-500 text-sm">Análisis de tu actividad en redes sociales</p>
      </div>
      <EstadisticasView posts={posts ?? []} cuentas={cuentas ?? []} />
    </div>
  )
}
