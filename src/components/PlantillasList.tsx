'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Plantilla, Cuenta, TipoContenido } from '@/types'
import { TIPOS_CONTENIDO, ICONOS_CONTENIDO } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal, Trash2, FileText, Send, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  plantillas: Plantilla[]
  cuentas: Cuenta[]
}

interface FormData {
  nombre: string
  cuenta_id: string
  tipo_contenido: TipoContenido
  prompt_visual: string
  descripcion: string
  hashtags: string
  nota_recomendacion: string
}

const defaultForm: FormData = {
  nombre: '',
  cuenta_id: '',
  tipo_contenido: 'imagen',
  prompt_visual: '',
  descripcion: '',
  hashtags: '',
  nota_recomendacion: '',
}

export default function PlantillasList({ plantillas: init, cuentas }: Props) {
  const router = useRouter()
  const [plantillas, setPlantillas] = useState(init)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.nombre || !form.tipo_contenido) { toast.error('Nombre y tipo son requeridos'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const hashtags = form.hashtags.split(/\s+/).filter((h) => h.trim()).map((h) => h.startsWith('#') ? h : `#${h}`)

    const { data, error } = await supabase.from('plantillas').insert({
      user_id: user.id,
      nombre: form.nombre,
      cuenta_id: form.cuenta_id || null,
      tipo_contenido: form.tipo_contenido,
      prompt_visual: form.prompt_visual || null,
      descripcion: form.descripcion || null,
      hashtags: hashtags.length > 0 ? hashtags : null,
      nota_recomendacion: form.nota_recomendacion || null,
    }).select('*, cuenta:cuentas(*)').single()

    if (error || !data) { toast.error('Error al guardar'); setSaving(false); return }
    setPlantillas((prev) => [data, ...prev])
    setOpen(false)
    setForm(defaultForm)
    toast.success('Plantilla guardada')
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta plantilla?')) return
    const supabase = createClient()
    await supabase.from('plantillas').delete().eq('id', id)
    setPlantillas((prev) => prev.filter((p) => p.id !== id))
    toast.success('Plantilla eliminada')
  }

  function applyTemplate(p: Plantilla) {
    const params = new URLSearchParams()
    if (p.cuenta_id) params.set('cuenta_id', p.cuenta_id)
    params.set('tipo_contenido', p.tipo_contenido)
    if (p.prompt_visual) params.set('prompt_visual', p.prompt_visual)
    if (p.descripcion) params.set('descripcion', p.descripcion)
    if (p.hashtags) params.set('hashtags', p.hashtags.join(' '))
    if (p.nota_recomendacion) params.set('nota_recomendacion', p.nota_recomendacion)
    router.push(`/posts/nuevo?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" /> Nueva plantilla
      </Button>

      {plantillas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 mb-2">No tienes plantillas todavía</p>
            <p className="text-sm text-gray-400">Crea plantillas para reutilizar estructuras de posts frecuentes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plantillas.map((p) => (
            <Card key={p.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{p.nombre}</p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {ICONOS_CONTENIDO[p.tipo_contenido]} {p.tipo_contenido}
                      </Badge>
                      {p.cuenta && (
                        <Badge variant="outline" className="text-xs">{p.cuenta.nombre}</Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-gray-100 focus:outline-none">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDelete(p.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {p.descripcion && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.descripcion}</p>}
                {p.hashtags && p.hashtags.length > 0 && (
                  <p className="text-xs text-indigo-400 mb-3 truncate">{p.hashtags.slice(0, 4).join(' ')}</p>
                )}

                <Button size="sm" className="w-full gap-2" onClick={() => applyTemplate(p)}>
                  <Send className="h-3.5 w-3.5" /> Usar plantilla
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal nueva plantilla */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva plantilla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Post de lanzamiento" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo de contenido *</Label>
                <div className="relative">
                  <select value={form.tipo_contenido}
                    onChange={(e) => setForm({ ...form, tipo_contenido: e.target.value as TipoContenido })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none">
                    {TIPOS_CONTENIDO.map((t) => <option key={t} value={t}>{ICONOS_CONTENIDO[t]} {t}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Cuenta (opcional)</Label>
                <div className="relative">
                  <select value={form.cuenta_id}
                    onChange={(e) => setForm({ ...form, cuenta_id: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none">
                    <option value="">Ninguna</option>
                    {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Prompt visual</Label>
              <Textarea value={form.prompt_visual} onChange={(e) => setForm({ ...form, prompt_visual: e.target.value })} rows={2} placeholder="Describe el estilo visual..." />
            </div>
            <div className="space-y-1">
              <Label>Descripción / Caption</Label>
              <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3} placeholder="Texto base de la publicación..." />
            </div>
            <div className="space-y-1">
              <Label>Hashtags</Label>
              <Input value={form.hashtags} onChange={(e) => setForm({ ...form, hashtags: e.target.value })} placeholder="#tag1 #tag2 #tag3" />
            </div>
            <div className="space-y-1">
              <Label>Nota / Recomendación</Label>
              <Input value={form.nota_recomendacion} onChange={(e) => setForm({ ...form, nota_recomendacion: e.target.value })} placeholder="Tips para usar esta plantilla..." />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar plantilla'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
