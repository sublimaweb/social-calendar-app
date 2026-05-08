import { createClient } from '@/lib/supabase/server'
import PlantillasList from '@/components/PlantillasList'

export default async function PlantillasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: plantillas }, { data: cuentas }] = await Promise.all([
    supabase.from('plantillas').select('*, cuenta:cuentas(*)').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('cuentas').select('*').eq('user_id', user!.id).eq('activa', true),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plantillas</h1>
        <p className="text-gray-500 text-sm">Reutiliza estructuras de posts frecuentes</p>
      </div>
      <PlantillasList plantillas={plantillas ?? []} cuentas={cuentas ?? []} />
    </div>
  )
}
