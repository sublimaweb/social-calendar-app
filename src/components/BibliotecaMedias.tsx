'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatBytes } from '@/lib/supabase/storage'
import { Clipboard, ExternalLink, Trash2, Upload, Image as ImageIcon, Film, Music, FileIcon as FileIcon, Search } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface MediaFile {
  name: string
  url: string
  tipo: string
  tamano: number
  created_at: string
}

interface Props {
  archivos: MediaFile[]
  userId: string
}

function tipoIcon(tipo: string) {
  if (tipo.startsWith('image/')) return <ImageIcon className="h-5 w-5" />
  if (tipo.startsWith('video/')) return <Film className="h-5 w-5" />
  if (tipo.startsWith('audio/')) return <Music className="h-5 w-5" />
  return <FileIcon className="h-5 w-5" />
}

function tipoBadge(tipo: string) {
  if (tipo.startsWith('image/')) return 'Imagen'
  if (tipo.startsWith('video/')) return 'Video'
  if (tipo.startsWith('audio/')) return 'Audio'
  return 'Archivo'
}

export default function BibliotecaMedias({ archivos: initialArchivos, userId }: Props) {
  const [archivos, setArchivos] = useState(initialArchivos)
  const [busqueda, setBusqueda] = useState('')
  const [uploading, setUploading] = useState(false)

  const filtered = archivos.filter((a) => a.name.toLowerCase().includes(busqueda.toLowerCase()))

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    const supabase = createClient()

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/biblioteca/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type })
      if (error) { toast.error(`Error subiendo ${file.name}`); continue }
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      setArchivos((prev) => [{
        name: file.name, url: publicUrl, tipo: file.type,
        tamano: file.size, created_at: new Date().toISOString(),
      }, ...prev])
    }
    toast.success(`${files.length} archivo(s) subido(s) ✅`)
    setUploading(false)
    e.target.value = ''
  }

  async function handleDelete(archivo: MediaFile) {
    if (!confirm(`¿Eliminar "${archivo.name}"?`)) return
    const supabase = createClient()
    const url = new URL(archivo.url)
    const path = url.pathname.split('/object/public/media/')[1]
    if (path) {
      const { error } = await supabase.storage.from('media').remove([path])
      if (error) { toast.error('Error al eliminar'); return }
    }
    setArchivos((prev) => prev.filter((a) => a.url !== archivo.url))
    toast.success('Archivo eliminado')
  }

  function copiarUrl(url: string) {
    navigator.clipboard.writeText(url)
    toast.success('URL copiada al portapapeles 📋')
  }

  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar archivos..." className="pl-8" />
        </div>
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-input rounded-md text-sm font-medium bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
          <input type="file" multiple className="hidden" accept="image/*,video/*,audio/*,.pdf" onChange={handleUpload} disabled={uploading} />
          <Upload className="h-4 w-4" />{uploading ? 'Subiendo...' : 'Subir archivos'}
        </label>
        <span className="self-center text-sm text-gray-400">{filtered.length} archivos</span>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No hay archivos todavía</p>
            <p className="text-sm text-gray-400">Sube imágenes, videos y audios para reutilizarlos en tus posts</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((archivo) => (
            <Card key={archivo.url} className="overflow-hidden group hover:shadow-md transition-shadow">
              {/* Preview */}
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                {archivo.tipo.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={archivo.url} alt={archivo.name} className="w-full h-full object-cover" />
                ) : archivo.tipo.startsWith('video/') ? (
                  <video src={archivo.url} className="w-full h-full object-cover" muted />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    {tipoIcon(archivo.tipo)}
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => copiarUrl(archivo.url)}
                    className="text-white hover:text-indigo-300 transition-colors" title="Copiar URL">
                    <Clipboard className="h-5 w-5" />
                  </button>
                  <Link href={archivo.url} target="_blank">
                    <button className="text-white hover:text-blue-300 transition-colors" title="Abrir">
                      <ExternalLink className="h-5 w-5" />
                    </button>
                  </Link>
                  <button onClick={() => handleDelete(archivo)}
                    className="text-white hover:text-red-400 transition-colors" title="Eliminar">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <CardContent className="p-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate" title={archivo.name}>{archivo.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="secondary" className="text-xs h-4">{tipoBadge(archivo.tipo)}</Badge>
                  <span className="text-xs text-gray-400">{formatBytes(archivo.tamano)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
