'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Post, Cuenta, EstadoPost } from '@/types'
import { ICONOS_CONTENIDO, COLORES_REDES, ESTADO_CONFIG, PILARES_CONTENIDO, COLORES_PILARES } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MoreHorizontal, Pencil, Trash2, CheckCircle2, Paperclip, Copy, Download, Search, X, CheckSquare, Archive, ArchiveRestore, ChevronDown } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { addDays, format, parseISO } from 'date-fns'

interface Props {
  posts: Post[]
  cuentas: Cuenta[]
  vistaArchivados?: boolean
}

const TODOS_ESTADOS: { value: EstadoPost; label: string }[] = [
  { value: 'borrador',    label: '📝 Borrador' },
  { value: 'en_revision', label: '👁️ En revisión' },
  { value: 'pendiente',   label: '⏳ Pendiente' },
  { value: 'publicado',   label: '✅ Publicado' },
  { value: 'cancelado',   label: '❌ Cancelado' },
]

export default function PostsList({ posts: initialPosts, cuentas, vistaArchivados = false }: Props) {
  const [posts, setPosts] = useState(initialPosts)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroCuenta, setFiltroCuenta] = useState('todas')
  const [filtroPilar, setFiltroPilar] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  // Acciones masivas
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [bulkDialog, setBulkDialog] = useState<'estado' | 'mover' | null>(null)
  const [bulkEstado, setBulkEstado] = useState<EstadoPost>('pendiente')
  const [bulkDias, setBulkDias] = useState('1')

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false
      if (filtroCuenta !== 'todas' && p.cuenta_id !== filtroCuenta) return false
      if (filtroPilar !== 'todos' && p.pilar !== filtroPilar) return false
      if (fechaDesde && p.fecha_publicacion < fechaDesde) return false
      if (fechaHasta && p.fecha_publicacion > fechaHasta) return false
      if (busqueda) {
        const q = busqueda.toLowerCase()
        if (!p.titulo.toLowerCase().includes(q)
          && !(p.descripcion?.toLowerCase().includes(q))
          && !(p.hashtags?.some((h) => h.toLowerCase().includes(q)))) return false
      }
      return true
    })
  }, [posts, filtroEstado, filtroCuenta, filtroPilar, busqueda, fechaDesde, fechaHasta])

  const hasFilters = busqueda || filtroEstado !== 'todos' || filtroCuenta !== 'todas' || filtroPilar !== 'todos' || fechaDesde || fechaHasta
  const todosSeleccionados = filtered.length > 0 && filtered.every((p) => seleccionados.has(p.id))

  function resetFilters() {
    setBusqueda(''); setFiltroEstado('todos'); setFiltroCuenta('todas')
    setFiltroPilar('todos'); setFechaDesde(''); setFechaHasta('')
  }

  function toggleSeleccion(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function toggleTodos() {
    if (todosSeleccionados) setSeleccionados(new Set())
    else setSeleccionados(new Set(filtered.map((p) => p.id)))
  }

  // ─── acciones masivas ───────────────────────────────────────────────
  async function bulkCambiarEstado() {
    const ids = Array.from(seleccionados)
    const supabase = createClient()
    const { error } = await supabase.from('posts').update({ estado: bulkEstado }).in('id', ids)
    if (error) { toast.error('Error al actualizar'); return }
    setPosts((prev) => prev.map((p) => seleccionados.has(p.id) ? { ...p, estado: bulkEstado } : p))
    toast.success(`${ids.length} posts actualizados a "${ESTADO_CONFIG[bulkEstado].label}"`)
    setSeleccionados(new Set()); setBulkDialog(null)
  }

  async function bulkMoverFecha() {
    const dias = parseInt(bulkDias, 10)
    if (isNaN(dias)) return
    const supabase = createClient()
    const ids = Array.from(seleccionados)
    const updatedPosts = posts.filter((p) => seleccionados.has(p.id)).map((p) => ({
      id: p.id,
      fecha_publicacion: format(addDays(parseISO(p.fecha_publicacion), dias), 'yyyy-MM-dd'),
    }))
    for (const { id, fecha_publicacion } of updatedPosts) {
      await supabase.from('posts').update({ fecha_publicacion }).eq('id', id)
    }
    const fechaMap = Object.fromEntries(updatedPosts.map(({ id, fecha_publicacion }) => [id, fecha_publicacion]))
    setPosts((prev) => prev.map((p) => fechaMap[p.id] ? { ...p, fecha_publicacion: fechaMap[p.id] } : p))
    toast.success(`${ids.length} posts movidos ${dias > 0 ? '+' : ''}${dias} días`)
    setSeleccionados(new Set()); setBulkDialog(null)
  }

  async function bulkEliminar() {
    const ids = Array.from(seleccionados)
    if (!confirm(`¿Eliminar ${ids.length} posts seleccionados?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('posts').delete().in('id', ids)
    if (error) { toast.error('Error al eliminar'); return }
    setPosts((prev) => prev.filter((p) => !seleccionados.has(p.id)))
    toast.success(`${ids.length} posts eliminados`)
    setSeleccionados(new Set())
  }

  // ─── acciones individuales ──────────────────────────────────────────
  async function markPublished(post: Post) {
    const supabase = createClient()
    const { error } = await supabase.from('posts').update({ estado: 'publicado', publicado_en: new Date().toISOString() }).eq('id', post.id)
    if (error) { toast.error('Error al marcar como publicado'); return }
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, estado: 'publicado' } : p))
    toast.success('Post marcado como publicado ✅')
  }

  async function handleDelete(post: Post) {
    if (!confirm(`¿Eliminar "${post.titulo}"?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (error) { toast.error('Error al eliminar el post'); return }
    setPosts((prev) => prev.filter((p) => p.id !== post.id))
    toast.success('Post eliminado')
  }

  async function toggleArchivado(post: Post) {
    const nuevoEstado = !post.archivado
    const supabase = createClient()
    const { error } = await supabase.from('posts').update({ archivado: nuevoEstado }).eq('id', post.id)
    if (error) { toast.error('Error'); return }
    setPosts((prev) => prev.filter((p) => p.id !== post.id))
    toast.success(nuevoEstado ? 'Post archivado 📦' : 'Post restaurado ✅')
  }

  async function handleDuplicate(post: Post) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const tomorrow = format(addDays(parseISO(post.fecha_publicacion), 1), 'yyyy-MM-dd')
    const { data, error } = await supabase.from('posts').insert({
      user_id: user.id, cuenta_id: post.cuenta_id, tipo_contenido: post.tipo_contenido,
      titulo: `${post.titulo} (copia)`, fecha_publicacion: tomorrow,
      hora_aproximada: post.hora_aproximada, prompt_visual: post.prompt_visual,
      descripcion: post.descripcion, hashtags: post.hashtags,
      nota_recomendacion: post.nota_recomendacion, estado: 'borrador',
      pilar: post.pilar,
    }).select('*, cuenta:cuentas(*)').single()
    if (error || !data) { toast.error('Error al duplicar'); return }
    setPosts((prev) => [data, ...prev])
    toast.success('Post duplicado ✅ — fecha: día siguiente')
  }

  function exportarExcel() {
    const rows = filtered.map((p) => {
      const cuenta = p.cuenta ?? cuentas.find((c) => c.id === p.cuenta_id)
      return {
        Cuenta: cuenta?.nombre ?? '', 'Red Social': cuenta?.red_social ?? '',
        Tipo: p.tipo_contenido, Título: p.titulo, Fecha: p.fecha_publicacion,
        Hora: p.hora_aproximada ?? '', Estado: p.estado, Pilar: p.pilar ?? '',
        'Prompt Visual': p.prompt_visual ?? '', Descripción: p.descripcion ?? '',
        Hashtags: p.hashtags?.join(' ') ?? '', Notas: p.nota_recomendacion ?? '',
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Posts')
    XLSX.writeFile(wb, `postflow-${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Excel exportado correctamente')
  }

  if (posts.length === 0) {
    return (
      <>
        <div className="flex gap-2 mb-4">
          <Link href="/posts"><Button variant={!vistaArchivados ? 'default' : 'outline'} size="sm">Activos</Button></Link>
          <Link href="/posts?view=archivados"><Button variant={vistaArchivados ? 'default' : 'outline'} size="sm" className="gap-1"><Archive className="h-3.5 w-3.5" /> Archivados</Button></Link>
        </div>
        <Card><CardContent className="p-12 text-center">
          <p className="text-gray-400 mb-4">{vistaArchivados ? 'No hay posts archivados' : 'No tienes posts todavía'}</p>
          {!vistaArchivados && <Link href="/posts/nuevo"><Button>Crear primer post</Button></Link>}
        </CardContent></Card>
      </>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tabs Activos / Archivados */}
      <div className="flex gap-2">
        <Link href="/posts"><Button variant={!vistaArchivados ? 'default' : 'outline'} size="sm">Activos ({posts.filter((p) => !p.archivado).length})</Button></Link>
        <Link href="/posts?view=archivados"><Button variant={vistaArchivados ? 'default' : 'outline'} size="sm" className="gap-1"><Archive className="h-3.5 w-3.5" /> Archivados ({posts.filter((p) => !!p.archivado).length})</Button></Link>
      </div>

      {/* Barra de filtros */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por título, descripción o hashtag..." className="pl-8" />
            </div>
            <Button variant="outline" onClick={exportarExcel} className="gap-2 shrink-0">
              <Download className="h-4 w-4" /> Excel
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
                className="h-8 rounded-md border border-input bg-background pl-2.5 pr-7 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none">
                <option value="todos">Todos los estados</option>
                {TODOS_ESTADOS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            </div>

            <div className="relative">
              <select value={filtroCuenta} onChange={(e) => setFiltroCuenta(e.target.value)}
                className="h-8 rounded-md border border-input bg-background pl-2.5 pr-7 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none">
                <option value="todas">Todas las cuentas</option>
                {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            </div>

            <div className="relative">
              <select value={filtroPilar} onChange={(e) => setFiltroPilar(e.target.value)}
                className="h-8 rounded-md border border-input bg-background pl-2.5 pr-7 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none">
                <option value="todos">Todos los pilares</option>
                {PILARES_CONTENIDO.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Desde</span>
              <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-36 h-8 text-xs" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Hasta</span>
              <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-36 h-8 text-xs" />
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2 text-xs text-gray-500">
                <X className="h-3 w-3 mr-1" /> Limpiar
              </Button>
            )}
            <span className="text-xs text-gray-400 self-center ml-auto">{filtered.length} de {posts.length} posts</span>
          </div>
        </div>
      </Card>

      {/* Barra de acciones masivas */}
      {seleccionados.size > 0 && (
        <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-2">
          <CheckSquare className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{seleccionados.size} seleccionados</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setBulkDialog('estado')}>Cambiar estado</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setBulkDialog('mover')}>Mover fecha</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={bulkEliminar}>Eliminar</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSeleccionados(new Set())}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {/* Encabezado con checkbox "select all" */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-1">
            <input type="checkbox" checked={todosSeleccionados} onChange={toggleTodos}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer" />
            <span className="text-xs text-gray-400">Seleccionar todos los visibles</span>
          </div>
        )}

        {filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-gray-400 text-sm">No hay posts con esos filtros</CardContent></Card>
        ) : (
          filtered.map((post) => {
            const cuenta = post.cuenta ?? cuentas.find((c) => c.id === post.cuenta_id)
            const color = cuenta?.color ?? COLORES_REDES[cuenta?.red_social ?? 'Instagram'] ?? '#6366f1'
            const estCfg = ESTADO_CONFIG[post.estado] || { label: post.estado || 'Desconocido', icon: '❓', color: 'bg-gray-100 text-gray-600' }
            const seleccionado = seleccionados.has(post.id)

            return (
              <Card key={post.id} className={`hover:shadow-sm transition-shadow ${seleccionado ? 'ring-2 ring-indigo-400' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={seleccionado} onChange={() => toggleSeleccion(post.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer mt-1 flex-shrink-0" />
                    <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: post.pilar ? COLORES_PILARES[post.pilar] : color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base">{ICONOS_CONTENIDO[post.tipo_contenido]}</span>
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">{post.titulo}</h3>
                            <Badge className={`text-xs ${estCfg.color} border-0`}>{estCfg.icon} {estCfg.label}</Badge>
                            {post.pilar && (
                              <Badge variant="outline" className="text-xs" style={{ borderColor: COLORES_PILARES[post.pilar], color: COLORES_PILARES[post.pilar] }}>
                                {post.pilar}
                              </Badge>
                            )}
                            {post.archivo_url && <Paperclip className="h-3.5 w-3.5 text-gray-400" />}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                            {cuenta && (
                              <span className="flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                {cuenta.nombre} · {cuenta.red_social}
                              </span>
                            )}
                            <span>📅 {formatDate(post.fecha_publicacion)}</span>
                            {post.hora_aproximada && <span>🕐 {formatTime(post.hora_aproximada)}</span>}
                          </div>
                          {post.descripcion && <p className="text-sm text-gray-400 mt-1 line-clamp-1">{post.descripcion}</p>}
                          {post.hashtags && post.hashtags.length > 0 && (
                            <p className="text-xs text-indigo-400 mt-0.5 truncate">
                              {post.hashtags.slice(0, 5).join(' ')}{post.hashtags.length > 5 ? ` +${post.hashtags.length - 5}` : ''}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {post.estado === 'pendiente' && (
                            <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 px-2" onClick={() => markPublished(post)} title="Marcar como publicado">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!vistaArchivados && <Link href={`/posts/${post.id}`}><DropdownMenuItem><Pencil className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem></Link>}
                              {!vistaArchivados && <DropdownMenuItem onClick={() => handleDuplicate(post)}><Copy className="h-4 w-4 mr-2" /> Duplicar</DropdownMenuItem>}
                              <DropdownMenuItem onClick={() => toggleArchivado(post)}>
                                {post.archivado
                                  ? <><ArchiveRestore className="h-4 w-4 mr-2" /> Restaurar</>
                                  : <><Archive className="h-4 w-4 mr-2" /> Archivar</>}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(post)}><Trash2 className="h-4 w-4 mr-2" /> Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Dialog: cambiar estado masivo */}
      <Dialog open={bulkDialog === 'estado'} onOpenChange={() => setBulkDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Cambiar estado — {seleccionados.size} posts</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap gap-2">
              {TODOS_ESTADOS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => setBulkEstado(value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    bulkEstado === value ? `${ESTADO_CONFIG[value].color} border-current` : 'text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}>{label}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={bulkCambiarEstado} className="flex-1">Aplicar</Button>
              <Button variant="outline" onClick={() => setBulkDialog(null)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: mover fechas masivo */}
      <Dialog open={bulkDialog === 'mover'} onOpenChange={() => setBulkDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Mover fecha — {seleccionados.size} posts</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Desplazar</span>
              <Input type="number" value={bulkDias} onChange={(e) => setBulkDias(e.target.value)} className="w-24" />
              <span className="text-sm text-gray-600">días (negativo = atrás)</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={bulkMoverFecha} className="flex-1">Aplicar</Button>
              <Button variant="outline" onClick={() => setBulkDialog(null)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
