import { createClient } from '@/lib/supabase/server'
import dynamic from 'next/dynamic'
import DashboardStats from '@/components/DashboardStats'
import SeedButton from '@/components/SeedButton'

const CalendarView = dynamic(() => import('@/components/calendar/CalendarView'), {
  ssr: false,
  loading: () => (
    <div className="h-[640px] rounded-xl border bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <span className="text-gray-400 text-sm">Cargando calendario...</span>
    </div>
  ),
})

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: posts }, { data: cuentas }] = await Promise.all([
    supabase
      .from('posts')
      .select('*, cuenta:cuentas(*)')
      .eq('user_id', user!.id)
      .order('fecha_publicacion', { ascending: true }),
    supabase
      .from('cuentas')
      .select('*')
      .eq('user_id', user!.id)
      .eq('activa', true),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendario</h1>
          <p className="text-gray-500 text-sm">Planifica y organiza tus publicaciones</p>
        </div>
        {(posts?.length ?? 0) === 0 && <SeedButton />}
      </div>

      <DashboardStats posts={posts ?? []} />

      <CalendarView posts={posts ?? []} cuentas={cuentas ?? []} />
    </div>
  )
}
