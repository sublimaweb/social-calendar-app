import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Clock } from 'lucide-react'

export default async function HistorialPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const [{ data: post }, { data: historial }] = await Promise.all([
    supabase.from('posts').select('titulo').eq('id', params.id).single(),
    supabase.from('post_historial').select('*').eq('post_id', params.id).order('created_at', { ascending: false }),
  ])

  if (!post) notFound()

  const LABELS: Record<string, string> = {
    titulo: 'Título',
    descripcion: 'Descripción',
    fecha_publicacion: 'Fecha',
    hora_aproximada: 'Hora',
    estado: 'Estado',
    hashtags: 'Hashtags',
    prompt_visual: 'Prompt visual',
    nota_recomendacion: 'Notas',
    cuenta_id: 'Cuenta',
    tipo_contenido: 'Tipo',
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/posts/${params.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Historial de cambios</h1>
          <p className="text-sm text-gray-500">{post.titulo}</p>
        </div>
      </div>

      {historial && historial.length > 0 ? (
        <div className="space-y-3">
          {historial.map((h) => (
            <Card key={h.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {LABELS[h.campo] ?? h.campo}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      {h.valor_anterior && (
                        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded line-through">{h.valor_anterior}</span>
                      )}
                      {h.valor_anterior && h.valor_nuevo && <span className="text-gray-400">→</span>}
                      {h.valor_nuevo && (
                        <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded">{h.valor_nuevo}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatDate(h.created_at)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hay cambios registrados todavía</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
