import CuentaForm from '@/components/CuentaForm'

export default function NuevaCuentaPage() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva cuenta</h1>
        <p className="text-gray-500 text-sm">Agrega un perfil de red social</p>
      </div>
      <CuentaForm />
    </div>
  )
}
