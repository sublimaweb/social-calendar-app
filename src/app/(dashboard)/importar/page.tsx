import ImportadorArchivo from '@/components/importar/ImportadorArchivo'

export default function ImportarPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar posts</h1>
        <p className="text-gray-500 text-sm">Carga un archivo Excel, Word o PDF para crear posts masivamente</p>
      </div>

      <ImportadorArchivo />
    </div>
  )
}
