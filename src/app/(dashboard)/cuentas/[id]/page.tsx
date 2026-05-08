import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CuentaForm from '@/components/CuentaForm'

export default async function EditarCuentaPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: cuenta } = await supabase
    .from('cuentas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!cuenta) notFound()

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar cuenta</h1>
        <p className="text-gray-500 text-sm">{cuenta.nombre}</p>
      </div>
      <CuentaForm cuenta={cuenta} />
    </div>
  )
}
