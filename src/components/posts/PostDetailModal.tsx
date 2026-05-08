'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/types'
import { ICONOS_CONTENIDO, COLORES_REDES, ESTADO_CONFIG, COLORES_PILARES } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime } from '@/lib/utils'
import { CheckCircle2, Pencil, X, Paperclip, Clock, Clipboard, Archive, ArchiveRestore } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import ChecklistPublicacion from '@/components/posts/ChecklistPublicacion'
import ComentariosPost from '@/components/posts/ComentariosPost'

interface Props {
  post: Post
  onClose: () => void
  onEdit: () => void
  onArchived?: (id: string) => void
}

export default function PostDetailModal({ post: initialPost, onClose, onEdit, onArchived }: Props) {
  const [post, setPost] = useState(initialPost)
  const [showChecklist, setShowChecklist] = useState(false)

  function copiarCaption() {
    const texto = [post.descripcion, post.hashtags?.join(' ')].filter(Boolean).join('\n\n')
    if (!texto) { toast.error('No hay caption para copiar'); return }
    navigator.clipboard.writeText(texto)
    toast.success('Caption copiado al portapapeles 📋')
  }

  async function doMarkPublished() {
    const supabase = createClient()
    const { error } = await supabase
      .from('posts')
      .update({ estado: 'publicado', publicado_en: new Date().toISOString() })
      .eq('id', post.id)
    if (error) { toast.error('Error al marcar como publicado'); return }
    setPost({ ...post, estado: 'publicado' })
    toast.success('Post marcado como publicado ✅')
    setShowChecklist(false)
  }

  async function toggleArchivado() {
    const nuevoEstado = !post.archivado
    const supabase = createClient()
    const { error } = await supabase.from('posts').update({ archivado: nuevoEstado }).eq('id', post.id)
    if (error) { toast.error('Error al archivar'); return }
    setPost({ ...post, archivado: nuevoEstado })
    toast.success(nuevoEstado ? 'Post archivado 📦' : 'Post restaurado ✅')
    if (nuevoEstado) { onArchived?.(post.id); onClose() }
  }

  const cuenta = post.cuenta
  const color = cuenta?.color ?? COLORES_REDES[cuenta?.red_social ?? 'Instagram'] ?? '#6366f1'
  const barColor = post.pilar ? COLORES_PILARES[post.pilar] ?? color : color

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{ICONOS_CONTENIDO[post.tipo_contenido]}</span>
              <span className="truncate">{post.titulo}</span>
              {post.archivado && <Badge variant="secondary" className="text-xs ml-1">📦 Archivado</Badge>}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Cuenta, estado y pilar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              {cuenta && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{cuenta.nombre} · {cuenta.red_social}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {post.pilar && (
                  <Badge variant="outline" className="text-xs" style={{ borderColor: barColor, color: barColor }}>
                    {post.pilar}
                  </Badge>
                )}
                <Badge className={`${ESTADO_CONFIG[post.estado]?.color ?? 'bg-gray-100 text-gray-600'} border-0`}>
                  {ESTADO_CONFIG[post.estado]?.icon} {ESTADO_CONFIG[post.estado]?.label ?? post.estado}
                </Badge>
              </div>
            </div>

            {/* Fecha */}
            <div className="text-sm text-gray-500">
              📅 {formatDate(post.fecha_publicacion)}
              {post.hora_aproximada && ` · 🕐 ${formatTime(post.hora_aproximada)}`}
            </div>

            {/* Archivo media */}
            {post.archivo_url && (
              <div className="rounded-lg overflow-hidden border">
                {post.archivo_tipo?.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.archivo_url} alt={post.archivo_nombre ?? ''} className="w-full max-h-56 object-cover" />
                ) : post.archivo_tipo?.startsWith('video/') ? (
                  <video src={post.archivo_url} controls className="w-full max-h-56" />
                ) : (
                  <div className="p-3 flex items-center gap-2 text-sm text-gray-600">
                    <Paperclip className="h-4 w-4" />
                    {post.archivo_nombre}
                  </div>
                )}
              </div>
            )}

            {/* Prompt visual */}
            {post.prompt_visual && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Prompt visual</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded p-2 whitespace-pre-wrap">{post.prompt_visual}</p>
              </div>
            )}

            {/* Descripción */}
            {post.descripcion && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Descripción</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.descripcion}</p>
              </div>
            )}

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.hashtags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}

            {/* Notas */}
            {post.nota_recomendacion && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">💡 Nota</p>
                <p className="text-sm text-amber-800">{post.nota_recomendacion}</p>
              </div>
            )}

            {/* Comentarios internos */}
            <div className="pt-1 border-t">
              <ComentariosPost postId={post.id} />
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-2 border-t flex-wrap">
              {post.estado === 'pendiente' && !post.archivado && (
                <Button size="sm" onClick={() => setShowChecklist(true)} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Marcar publicado
                </Button>
              )}
              {!post.archivado && (
                <Button size="sm" variant="outline" onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={copiarCaption}>
                <Clipboard className="h-4 w-4 mr-1" />
                Copiar caption
              </Button>
              <Link href={`/posts/${post.id}/historial`} onClick={onClose}>
                <Button size="sm" variant="ghost">
                  <Clock className="h-4 w-4 mr-1" />
                  Historial
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleArchivado}
                className={post.archivado ? 'text-indigo-600' : 'text-gray-400 hover:text-amber-600'}
                title={post.archivado ? 'Restaurar post' : 'Archivar post'}
              >
                {post.archivado
                  ? <><ArchiveRestore className="h-4 w-4 mr-1" /> Restaurar</>
                  : <><Archive className="h-4 w-4 mr-1" /> Archivar</>
                }
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose} className="ml-auto">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checklist pre-publicación */}
      <ChecklistPublicacion
        post={post}
        open={showChecklist}
        onConfirm={doMarkPublished}
        onCancel={() => setShowChecklist(false)}
      />
    </>
  )
}
