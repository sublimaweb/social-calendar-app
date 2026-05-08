'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { deleteFile, getFilePathFromUrl, formatBytes } from '@/lib/supabase/storage'
import type { Post } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, ExternalLink, Archive, FileImage, FileVideo, FileAudio, File } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

type PostWithArchivo = Pick<Post, 'id' | 'titulo' | 'archivo_url' | 'archivo_nombre' | 'archivo_tipo' | 'archivo_tamano' | 'estado' | 'fecha_publicacion' | 'cuenta'>

function FileIcon({ tipo }: { tipo: string }) {
  if (tipo.startsWith('image/')) return <FileImage className="h-5 w-5 text-blue-500" />
  if (tipo.startsWith('video/')) return <FileVideo className="h-5 w-5 text-purple-500" />
  if (tipo.startsWith('audio/')) return <FileAudio className="h-5 w-5 text-green-500" />
  return <File className="h-5 w-5 text-gray-500" />
}

export default function ArchivosManager({ posts: initialPosts }: { posts: PostWithArchivo[] }) {
  const router = useRouter()
  const [posts, setPosts] = useState(initialPosts)
  const [deleting, setDeleting] = useState<string | null>(null)

  const totalSize = posts.reduce((acc, p) => acc + (p.archivo_tamano ?? 0), 0)

  async function handleLiberar(post: PostWithArchivo) {
    if (!post.archivo_url) return
    if (!confirm(`¿Liberar el archivo "${post.archivo_nombre}"? El post se conserva pero sin archivo adjunto.`)) return

    setDeleting(post.id)
    const path = getFilePathFromUrl(post.archivo_url)

    if (path) {
      const ok = await deleteFile(path)
      if (!ok) {
        toast.error('Error al eliminar el archivo del storage')
        setDeleting(null)
        return
      }
    }

    const supabase = createClient()
    const { error } = await supabase.from('posts').update({
      archivo_url: null,
      archivo_nombre: null,
      archivo_tipo: null,
      archivo_tamano: null,
    }).eq('id', post.id)

    if (error) {
      toast.error('Error al actualizar el post')
      setDeleting(null)
      return
    }

    setPosts((prev) => prev.filter((p) => p.id !== post.id))
    toast.success('Archivo liberado · espacio recuperado')
    setDeleting(null)
    router.refresh()
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Archive className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No hay archivos adjuntos en tus posts</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{posts.length} archivos</span>
        <span>Total: {formatBytes(totalSize)}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const isImage = post.archivo_tipo?.startsWith('image/')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cuenta = post.cuenta as any

          return (
            <Card key={post.id}>
              <CardContent className="p-0 overflow-hidden">
                {/* Preview */}
                {isImage && post.archivo_url && (
                  <div className="h-32 bg-gray-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.archivo_url}
                      alt={post.archivo_nombre ?? ''}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {post.archivo_tipo?.startsWith('video/') && post.archivo_url && (
                  <div className="h-32 bg-gray-900 overflow-hidden">
                    <video src={post.archivo_url} className="w-full h-full object-cover" muted />
                  </div>
                )}
                {!isImage && !post.archivo_tipo?.startsWith('video/') && (
                  <div className="h-16 bg-gray-50 flex items-center justify-center">
                    <FileIcon tipo={post.archivo_tipo ?? ''} />
                  </div>
                )}

                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">{post.titulo}</p>
                    <p className="text-xs text-gray-400 truncate">{post.archivo_nombre}</p>
                    <p className="text-xs text-gray-400">{formatBytes(post.archivo_tamano ?? 0)}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatDate(post.fecha_publicacion)}</span>
                    {cuenta && (
                      <span className="flex items-center gap-1">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: cuenta.color }}
                        />
                        {cuenta.nombre}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    {post.archivo_url && (
                      <a
                        href={post.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      </a>
                    )}
                    {post.estado === 'publicado' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                        onClick={() => handleLiberar(post)}
                        disabled={deleting === post.id}
                        title="Eliminar archivo pero conservar el post"
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        {deleting === post.id ? '...' : 'Liberar'}
                      </Button>
                    )}
                    {post.estado !== 'publicado' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 text-xs text-red-500 hover:bg-red-50"
                        onClick={() => handleLiberar(post)}
                        disabled={deleting === post.id}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {deleting === post.id ? '...' : 'Eliminar'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <p className="text-sm text-amber-700">
            💡 <strong>Consejo:</strong> Después de publicar en tu red social, usa el botón &quot;Liberar&quot; para eliminar el archivo del Storage y ahorrar espacio. El registro del post se conserva.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
