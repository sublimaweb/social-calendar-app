'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Post, Cuenta, EstadoPost } from '@/types'
import { ICONOS_CONTENIDO, COLORES_REDES, ESTADO_CONFIG, COLORES_PILARES } from '@/types'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { Plus } from 'lucide-react'

type KanbanCol = { id: EstadoPost; label: string; color: string }

const COLUMNAS: KanbanCol[] = [
  { id: 'borrador',    label: 'Borrador',     color: 'bg-gray-100 border-gray-300' },
  { id: 'en_revision', label: 'En revisión',  color: 'bg-blue-50 border-blue-200' },
  { id: 'pendiente',   label: 'Pendiente',    color: 'bg-amber-50 border-amber-200' },
  { id: 'publicado',   label: 'Publicado',    color: 'bg-green-50 border-green-200' },
]

interface Props {
  posts: Post[]
  cuentas: Cuenta[]
}

export default function KanbanView({ posts: initialPosts, cuentas }: Props) {
  const [posts, setPosts] = useState(initialPosts)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<EstadoPost | null>(null)

  async function moverAColumna(postId: string, nuevoEstado: EstadoPost) {
    const post = posts.find((p) => p.id === postId)
    if (!post || post.estado === nuevoEstado) return
    const supabase = createClient()
    const update: Record<string, string | null> = { estado: nuevoEstado }
    if (nuevoEstado === 'publicado' && !post.publicado_en) update.publicado_en = new Date().toISOString()
    const { error } = await supabase.from('posts').update(update).eq('id', postId)
    if (error) { toast.error('Error al mover el post'); return }
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, estado: nuevoEstado } : p))
    toast.success(`Post movido a "${ESTADO_CONFIG[nuevoEstado].label}"`)
  }

  function onDragStart(e: React.DragEvent, postId: string) {
    e.dataTransfer.setData('postId', postId)
    setDraggingId(postId)
  }

  function onDragEnd() { setDraggingId(null); setOverCol(null) }

  function onDrop(e: React.DragEvent, estado: EstadoPost) {
    e.preventDefault()
    const postId = e.dataTransfer.getData('postId')
    if (postId) moverAColumna(postId, estado)
    setOverCol(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[70vh]">
      {COLUMNAS.map((col) => {
        const colPosts = posts.filter((p) => p.estado === col.id)
        const isOver = overCol === col.id

        return (
          <div key={col.id} className="flex-shrink-0 w-72"
            onDragOver={(e) => { e.preventDefault(); setOverCol(col.id) }}
            onDragLeave={() => setOverCol(null)}
            onDrop={(e) => onDrop(e, col.id)}>

            {/* Encabezado columna */}
            <div className={`rounded-t-xl border-2 px-4 py-3 flex items-center justify-between ${col.color} ${isOver ? 'ring-2 ring-indigo-400' : ''} transition-all`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{ESTADO_CONFIG[col.id].icon}</span>
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{col.label}</span>
                <Badge variant="secondary" className="text-xs h-5">{colPosts.length}</Badge>
              </div>
              <Link href={`/posts/nuevo`}>
                <button className="text-gray-400 hover:text-indigo-600 transition-colors" title="Nuevo post">
                  <Plus className="h-4 w-4" />
                </button>
              </Link>
            </div>

            {/* Cards */}
            <div className={`bg-gray-50 dark:bg-gray-800/50 border-2 border-t-0 rounded-b-xl min-h-[200px] p-2 space-y-2 transition-all ${isOver ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-400' : 'border-gray-200 dark:border-gray-700'}`}>
              {colPosts.length === 0 && (
                <div className="flex items-center justify-center h-20 text-xs text-gray-400">
                  Arrastra posts aquí
                </div>
              )}

              {colPosts.map((post) => {
                const cuenta = post.cuenta ?? cuentas.find((c) => c.id === post.cuenta_id)
                const cuentaColor = cuenta?.color ?? COLORES_REDES[cuenta?.red_social ?? 'Instagram'] ?? '#6366f1'
                const barColor = post.pilar ? COLORES_PILARES[post.pilar] ?? cuentaColor : cuentaColor
                const isDragging = draggingId === post.id

                return (
                  <div key={post.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, post.id)}
                    onDragEnd={onDragEnd}
                    className={`bg-white dark:bg-gray-800 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing transition-all select-none ${isDragging ? 'opacity-40 scale-95' : 'hover:shadow-md'}`}>
                    <div className="flex">
                      <div className="w-1 rounded-l-lg flex-shrink-0" style={{ backgroundColor: barColor }} />
                      <div className="p-3 flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          <span className="text-sm">{ICONOS_CONTENIDO[post.tipo_contenido]}</span>
                          <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug line-clamp-2 flex-1">{post.titulo}</p>
                        </div>

                        {post.pilar && (
                          <span className="inline-block text-xs px-1.5 py-0.5 rounded-full mb-1.5" style={{ backgroundColor: `${COLORES_PILARES[post.pilar]}22`, color: COLORES_PILARES[post.pilar] }}>
                            {post.pilar}
                          </span>
                        )}

                        {post.descripcion && (
                          <p className="text-xs text-gray-400 line-clamp-2 mb-2">{post.descripcion}</p>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                          <span>📅 {formatDate(post.fecha_publicacion)}</span>
                          {cuenta && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cuentaColor }} />
                              {cuenta.nombre}
                            </span>
                          )}
                        </div>

                        <div className="flex justify-end mt-2">
                          <Link href={`/posts/${post.id}`} onClick={(e) => e.stopPropagation()}>
                            <button className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">Editar →</button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Columna Cancelado — colapsada */}
      <div className="flex-shrink-0 w-12 flex flex-col items-center">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl px-2 py-3 flex flex-col items-center gap-2 h-full">
          <span className="text-base rotate-90 whitespace-nowrap text-xs text-red-400 font-medium"
            style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
            ❌ Cancelado ({posts.filter((p) => p.estado === 'cancelado').length})
          </span>
        </div>
      </div>
    </div>
  )
}
