'use client'

import type { Post, Cuenta } from '@/types'
import { ICONOS_CONTENIDO } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Eye } from 'lucide-react'

interface Props {
  post: Partial<Post> & { titulo: string; descripcion?: string | null; hashtags?: string[] | null; archivo_url?: string | null; archivo_tipo?: string | null; tipo_contenido: Post['tipo_contenido'] }
  cuenta?: Cuenta | null
  open: boolean
  onClose: () => void
}

export default function PostPreview({ post, cuenta, open, onClose }: Props) {
  const red = cuenta?.red_social ?? 'Instagram'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4" />
            Preview — {red}
          </DialogTitle>
        </DialogHeader>

        {/* Instagram-style preview */}
        <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-2 p-3 border-b">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: cuenta?.color ?? '#6366f1' }}>
              {cuenta?.nombre?.slice(0, 2).toUpperCase() ?? 'PF'}
            </div>
            <div>
              <p className="text-xs font-semibold">{cuenta?.nombre ?? 'Tu cuenta'}</p>
              <p className="text-xs text-gray-400">{red}</p>
            </div>
            <span className="ml-auto text-xs text-gray-400">Ahora</span>
          </div>

          {/* Media */}
          {post.archivo_url && post.archivo_tipo?.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.archivo_url} alt="" className="w-full max-h-64 object-cover" />
          ) : post.archivo_url && post.archivo_tipo?.startsWith('video/') ? (
            <video src={post.archivo_url} className="w-full max-h-64 object-cover" muted />
          ) : (
            <div className="h-48 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center">
              <span className="text-5xl">{ICONOS_CONTENIDO[post.tipo_contenido]}</span>
            </div>
          )}

          {/* Content */}
          <div className="p-3 space-y-1">
            <div className="flex gap-3 text-gray-600 text-sm mb-2">
              <span>♡ 0</span><span>💬 0</span><span>↗ 0</span>
            </div>
            {post.descripcion && (
              <p className="text-xs text-gray-800 dark:text-gray-200 line-clamp-4 whitespace-pre-wrap">{post.descripcion}</p>
            )}
            {post.hashtags && post.hashtags.length > 0 && (
              <p className="text-xs text-blue-500 line-clamp-2">{post.hashtags.join(' ')}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-1">
          <Badge variant="secondary" className="text-xs">
            {ICONOS_CONTENIDO[post.tipo_contenido]} {post.tipo_contenido}
          </Badge>
          <Badge variant="outline" className="text-xs">{red}</Badge>
        </div>
      </DialogContent>
    </Dialog>
  )
}
