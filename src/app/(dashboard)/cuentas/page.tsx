import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import CuentasList from '@/components/CuentasList'

export default async function CuentasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cuentas } = await supabase
    .from('cuentas')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuentas</h1>
          <p className="text-gray-500 text-sm">Gestiona tus perfiles de redes sociales</p>
        </div>
        <Link href="/cuentas/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva cuenta
          </Button>
        </Link>
      </div>

      <CuentasList cuentas={cuentas ?? []} />
    </div>
  )
}
