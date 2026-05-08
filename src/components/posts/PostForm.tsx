'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadFile, deleteFile, getFilePathFromUrl, formatBytes } from '@/lib/supabase/storage'
import type { Post, Cuenta, TipoContenido, EstadoPost, Recurrencia } from '@/types'
import { TIPOS_CONTENIDO, ICONOS_CONTENIDO, ESTADO_CONFIG, PILARES_CONTENIDO, COLORES_PILARES } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { X, Upload, FileImage, Trash2, Eye, Bell, BellOff, Clock, ChevronDown, Download } from 'lucide-react'
import PostPreview from '@/components/posts/PostPreview'
import { addDays, addWeeks, format, parseISO } from 'date-fns'

const MAX_FILE_SIZE = 200 * 1024 * 1024

const ESTADOS_POST: EstadoPost[] = ['borrador', 'en_revision', 'pendiente', 'publicado', 'cancelado']
const RECURRENCIAS: { value: Recurrencia; label: string }[] = [
  { value: 'ninguna',   label: 'Sin repetición' },
  { value: 'semanal',   label: 'Semanal' },
  { value: 'quincenal', label: 'Cada 2 semanas' },
  { value: 'mensual',   label: 'Mensual' },
]

interface Props {
  post?: Post
  cuentas: Cuenta[]
  defaultValues?: Partial<Post>
}

export default function PostForm({ post, cuentas, defaultValues }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const [cuentaId, setCuentaId] = useState(post?.cuenta_id ?? defaultValues?.cuenta_id ?? '')
  const [tipo, setTipo] = useState<TipoContenido>(post?.tipo_contenido ?? defaultValues?.tipo_contenido ?? 'imagen')
  const [titulo, setTitulo] = useState(post?.titulo ?? defaultValues?.titulo ?? '')
  const [fecha, setFecha] = useState(post?.fecha_publicacion ?? defaultValues?.fecha_publicacion ?? '')
  const [hora, setHora] = useState(post?.hora_aproximada ?? defaultValues?.hora_aproximada ?? '')
  const [prompt, setPrompt] = useState(post?.prompt_visual ?? defaultValues?.prompt_visual ?? '')
  const [promptCopy, setPromptCopy] = useState(post?.prompt_copy ?? defaultValues?.prompt_copy ?? '')
  const [descripcion, setDescripcion] = useState(post?.descripcion ?? defaultValues?.descripcion ?? '')
  const [promptHashtags, setPromptHashtags] = useState(post?.prompt_hashtags ?? defaultValues?.prompt_hashtags ?? '')
  const [hashtagInput, setHashtagInput] = useState('')
  const [hashtags, setHashtags] = useState<string[]>(post?.hashtags ?? defaultValues?.hashtags ?? [])
  const [notas, setNotas] = useState(post?.nota_recomendacion ?? defaultValues?.nota_recomendacion ?? '')
  const [estado, setEstado] = useState<EstadoPost>(post?.estado ?? 'borrador')
  const [pilar, setPilar] = useState<string>(post?.pilar ?? '')
  const [recurrencia, setRecurrencia] = useState<Recurrencia>((post?.recurrencia as Recurrencia) ?? 'ninguna')
  const [recurrenciaFin, setRecurrenciaFin] = useState(post?.recurrencia_fin ?? '')

  const [archivos, setArchivos] = useState<{url: string, nombre: string, tipo: string, tamano: number}[]>(
    post?.archivos ?? (post?.archivo_url ? [{ url: post.archivo_url, nombre: post.archivo_nombre || '', tipo: post.archivo_tipo || '', tamano: post.archivo_tamano || 0 }] : [])
  )
  const [showPreview, setShowPreview] = useState(false)
  const [notifEnabled, setNotifEnabled] = useState(false)

  // Horarios óptimos para la cuenta seleccionada
  const [horariosOptimos, setHorariosOptimos] = useState<string[]>([])

  useEffect(() => {
    if (!cuentaId) return
    const supabase = createClient()
    supabase
      .from('posts')
      .select('hora_aproximada')
      .eq('cuenta_id', cuentaId)
      .not('hora_aproximada', 'is', null)
      .then(({ data }) => {
        if (!data) return
        const freq: Record<string, number> = {}
        data.forEach(({ hora_aproximada }) => {
          if (hora_aproximada) freq[hora_aproximada] = (freq[hora_aproximada] ?? 0) + 1
        })
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h]) => h)
        setHorariosOptimos(sorted)
      })
  }, [cuentaId])

  async function requestNotification() {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    if (perm === 'granted') { setNotifEnabled(true); toast.success('Notificaciones activadas') }
  }

  function addHashtag(raw: string) {
    const tags = raw.trim().split(/\s+/).filter(Boolean).map((t) => t.startsWith('#') ? t : `#${t}`)
    setHashtags(Array.from(new Set([...hashtags, ...tags])))
    setHashtagInput('')
  }

  function removeHashtag(tag: string) { setHashtags(hashtags.filter((h) => h !== tag)) }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (archivos.length + files.length > 6) { toast.error('Máximo 6 archivos permitidos'); return }
    
    setUploadingFile(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploadingFile(false); return }
    
    const postId = post?.id ?? `temp-${Date.now()}`
    const nuevosArchivos = [...archivos]

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) { toast.error(`El archivo supera el límite de 200 MB: ${file.name}`); continue }
      const result = await uploadFile(file, user.id, postId)
      if (result) {
        nuevosArchivos.push({ url: result.url, nombre: file.name, tipo: file.type, tamano: file.size })
      } else { toast.error(`Error al subir ${file.name}`) }
    }
    
    setArchivos(nuevosArchivos)
    if (nuevosArchivos.length > archivos.length) toast.success('Archivos subidos correctamente')
    setUploadingFile(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleRemoveFile(index: number) {
    const target = archivos[index]
    if (target.url) { const path = getFilePathFromUrl(target.url); if (path) await deleteFile(path) }
    setArchivos(prev => prev.filter((_, i) => i !== index))
    toast.success('Archivo eliminado')
  }

  // Genera fechas según recurrencia hasta recurrenciaFin
  function generarFechas(): string[] {
    if (recurrencia === 'ninguna' || !fecha || !recurrenciaFin) return [fecha]
    const fechas: string[] = []
    let current = parseISO(fecha)
    const fin = parseISO(recurrenciaFin)
    while (current <= fin) {
      fechas.push(format(current, 'yyyy-MM-dd'))
      if (recurrencia === 'semanal')   current = addWeeks(current, 1)
      else if (recurrencia === 'quincenal') current = addWeeks(current, 2)
      else current = addDays(current, 30)
    }
    return fechas
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cuentaId) { toast.error('Selecciona una cuenta'); return }
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const basePayload = {
      user_id: user.id,
      cuenta_id: cuentaId,
      tipo_contenido: tipo,
      titulo,
      hora_aproximada: hora || null,
      prompt_visual: prompt || null,
      prompt_copy: promptCopy || null,
      descripcion: descripcion || null,
      prompt_hashtags: promptHashtags || null,
      hashtags: hashtags.length > 0 ? hashtags : null,
      nota_recomendacion: notas || null,
      archivo_url: archivos.length > 0 ? archivos[0].url : null,
      archivo_nombre: archivos.length > 0 ? archivos[0].nombre : null,
      archivo_tipo: archivos.length > 0 ? archivos[0].tipo : null,
      archivo_tamano: archivos.length > 0 ? archivos[0].tamano : null,
      archivos: archivos.length > 0 ? archivos : null,
      estado,
      pilar: pilar || null,
      recurrencia: recurrencia !== 'ninguna' ? recurrencia : null,
      recurrencia_fin: recurrenciaFin || null,
      publicado_en: estado === 'publicado' && !post?.publicado_en ? new Date().toISOString() : (post?.publicado_en ?? null),
    }

    if (post) {
      // Editar post existente
      const { error } = await supabase.from('posts').update({ ...basePayload, fecha_publicacion: fecha }).eq('id', post.id)
      if (error) { toast.error('Error al guardar el post'); setLoading(false); return }
      toast.success('Post actualizado')
    } else {
      // Crear uno o varios posts (recurrencia)
      const fechas = generarFechas()
      const rows = fechas.map((f) => ({ ...basePayload, fecha_publicacion: f }))
      const { error } = await supabase.from('posts').insert(rows)
      if (error) { toast.error('Error al guardar el post'); setLoading(false); return }
      toast.success(fechas.length > 1 ? `${fechas.length} posts creados con recurrencia ✅` : 'Post creado')
    }

    router.push('/posts')
    router.refresh()
  }

  const cuentaSeleccionada = cuentas.find((c) => c.id === cuentaId) ?? null

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Cuenta y tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cuenta-select">Cuenta *</Label>
              <div className="relative">
                <select
                  id="cuenta-select"
                  value={cuentaId}
                  onChange={(e) => setCuentaId(e.target.value)}
                  required
                  className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none"
                >
                  <option value="">Selecciona una cuenta</option>
                  {cuentas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} · {c.red_social}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo-select">Tipo de contenido *</Label>
              <div className="relative">
                <select
                  id="tipo-select"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoContenido)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none"
                >
                  {TIPOS_CONTENIDO.map((t) => (
                    <option key={t} value={t}>{ICONOS_CONTENIDO[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">Título interno *</Label>
            <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Lanzamiento producto Mayo" maxLength={100} required />
            <p className="text-xs text-gray-400">{titulo.length}/100</p>
          </div>

          {/* Fecha, hora, pilar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha publicación *</Label>
              <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Hora aproximada</Label>
              <Input id="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
              {horariosOptimos.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  <Clock className="h-3 w-3 text-gray-400 self-center" />
                  {horariosOptimos.map((h) => (
                    <button key={h} type="button" onClick={() => setHora(h)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded transition-colors">
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pilar-select">Pilar de contenido</Label>
              <div className="relative">
                <select
                  id="pilar-select"
                  value={pilar}
                  onChange={(e) => setPilar(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none"
                >
                  <option value="">Sin pilar</option>
                  {PILARES_CONTENIDO.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Recurrencia */}
          <div className="space-y-2">
            <Label>Recurrencia</Label>
            <div className="flex gap-3 flex-wrap items-center">
              <div className="flex gap-2">
                {RECURRENCIAS.map(({ value, label }) => (
                  <button key={value} type="button" onClick={() => setRecurrencia(value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      recurrencia === value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 hover:border-indigo-300'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              {recurrencia !== 'ninguna' && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500 whitespace-nowrap">Hasta</Label>
                  <Input type="date" value={recurrenciaFin} onChange={(e) => setRecurrenciaFin(e.target.value)} className="w-36 h-8 text-xs" />
                </div>
              )}
            </div>
            {recurrencia !== 'ninguna' && fecha && recurrenciaFin && (
              <p className="text-xs text-indigo-600">
                Se crearán {generarFechas().length} posts con esta recurrencia
              </p>
            )}
          </div>

          {/* Estado — flujo de aprobación */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <div className="flex gap-2 flex-wrap">
              {ESTADOS_POST.map((s) => {
                const cfg = ESTADO_CONFIG[s]
                return (
                  <button key={s} type="button" onClick={() => setEstado(s)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      estado === s ? `${cfg.color} border-current` : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}>
                    {cfg.icon} {cfg.label}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-400">Flujo: Borrador → En revisión → Pendiente → Publicado</p>
          </div>

          {/* Prompt visual */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt visual</Label>
            <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe la imagen o video que quieres generar..." rows={3} maxLength={5000} />
            <p className="text-xs text-gray-400">{prompt.length}/5000</p>
          </div>

          {/* Prompt copy */}
          <div className="space-y-2">
            <Label htmlFor="promptCopy">Prompt para el copy</Label>
            <Textarea id="promptCopy" value={promptCopy} onChange={(e) => setPromptCopy(e.target.value)}
              placeholder="Prompt base para generar el copy..." rows={3} maxLength={5000} />
            <p className="text-xs text-gray-400">{promptCopy.length}/5000</p>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción / Caption</Label>
            <Textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Escribe el copy de tu publicación..." rows={4} maxLength={5000} />
            <p className="text-xs text-gray-400">{descripcion.length}/5000</p>
          </div>

          {/* Prompt hashtags */}
          <div className="space-y-2">
            <Label htmlFor="promptHashtags">Prompt hashtags</Label>
            <Textarea id="promptHashtags" value={promptHashtags} onChange={(e) => setPromptHashtags(e.target.value)}
              placeholder="Prompt para generar los hashtags..." rows={2} maxLength={5000} />
            <p className="text-xs text-gray-400">{promptHashtags.length}/5000</p>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label>Hashtags</Label>
            <div className="flex gap-2">
              <Input value={hashtagInput} onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && hashtagInput.trim()) { e.preventDefault(); addHashtag(hashtagInput) } }}
                placeholder="#mihashtag (Enter para agregar)" />
              <Button type="button" variant="outline" onClick={() => hashtagInput.trim() && addHashtag(hashtagInput)}>+</Button>
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {hashtags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button type="button" onClick={() => removeHashtag(tag)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-3 text-xs text-gray-400 mt-1">
              <span>{hashtags.length} hashtags</span>
              <span>·</span>
              <span className={descripcion.length + hashtags.join(' ').length > 5000 ? 'text-red-500' : ''}>
                {descripcion.length + (hashtags.length > 0 ? hashtags.join(' ').length + 1 : 0)} / 5000 total
              </span>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Nota / Recomendación</Label>
            <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)}
              placeholder="Tips, recordatorios, contexto adicional..." rows={2} />
          </div>

          {/* Archivo media */}
          <div className="space-y-2">
            <Label>Archivos multimedia (hasta 6)</Label>
            {archivos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {archivos.map((f, i) => {
                  const isImg = f.tipo.startsWith('image/')
                  const isVid = f.tipo.startsWith('video/')
                  return (
                    <div key={i} className="border rounded-lg p-3 space-y-2 relative">
                      {isImg && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.url} alt={f.nombre} className="max-h-40 rounded object-contain bg-gray-50 w-full" />
                      )}
                      {isVid && <video src={f.url} controls className="max-h-40 rounded w-full" />}
                      {!isImg && !isVid && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <FileImage className="h-5 w-5" />
                          <span className="text-sm truncate">{f.nombre}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{f.nombre}</p>
                          <p className="text-xs text-gray-400">{formatBytes(f.tamano)} · {f.tipo}</p>
                        </div>
                        <div className="flex gap-1 ml-2 shrink-0">
                          <Button type="button" variant="ghost" size="icon" asChild title="Descargar">
                            <a href={f.url} download target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 text-indigo-600" />
                            </a>
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveFile(i)} title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {archivos.length < 6 && (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-300 transition-colors"
                onClick={() => fileRef.current?.click()}>
                <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{uploadingFile ? 'Subiendo...' : 'Clic para subir archivo(s)'}</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, MP4, MOV, MP3, PDF — hasta 200 MB por archivo</p>
              </div>
            )}
            <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf" multiple
              onChange={handleFileUpload} disabled={uploadingFile} />
          </div>
        </CardContent>

        <CardFooter className="px-6 pb-6 gap-3 flex-wrap">
          <Button type="submit" disabled={loading || uploadingFile}>
            {loading ? 'Guardando...' : post ? 'Actualizar post' : 'Crear post'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-1.5" /> Preview
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={requestNotification}
            title={notifEnabled ? 'Notificaciones activas' : 'Activar notificaciones'}
            className={notifEnabled ? 'text-indigo-600' : 'text-gray-400'}>
            {notifEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        </CardFooter>
      </Card>

      <PostPreview
        post={{ titulo, descripcion, hashtags, archivo_url: archivos.length > 0 ? archivos[0].url : null, archivo_tipo: archivos.length > 0 ? archivos[0].tipo : null, archivos: archivos.length > 0 ? archivos : null, tipo_contenido: tipo }}
        cuenta={cuentaSeleccionada}
        open={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </form>
  )
}
