'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Nota } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StickyNote, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

const COLORES = ['#fef9c3', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff', '#ffedd5']

export default function NotasRapidas() {
  const [open, setOpen] = useState(false)
  const [notas, setNotas] = useState<Nota[]>([])
  const [nueva, setNueva] = useState('')
  const [colorSeleccionado, setColorSeleccionado] = useState(COLORES[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) cargarNotas()
  }, [open])

  async function cargarNotas() {
    const supabase = createClient()
    const { data } = await supabase.from('notas').select('*').order('updated_at', { ascending: false })
    setNotas(data ?? [])
  }

  async function agregarNota() {
    if (!nueva.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('notas').insert({
      user_id: user.id,
      contenido: nueva.trim(),
      color: colorSeleccionado,
    }).select().single()

    if (error || !data) { toast.error('Error al guardar'); setLoading(false); return }
    setNotas((prev) => [data, ...prev])
    setNueva('')
    setLoading(false)
  }

  async function eliminarNota(id: string) {
    const supabase = createClient()
    await supabase.from('notas').delete().eq('id', id)
    setNotas((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="w-full justify-start text-gray-500 hover:text-yellow-600 text-xs" onClick={() => setOpen(true)}>
        <StickyNote className="h-4 w-4 mr-2" />
        Notas rápidas
      </Button>

      {open && (
        <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border z-50 flex flex-col max-h-[70vh]">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <StickyNote className="h-4 w-4 text-yellow-500" />
              Notas rápidas
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3 border-b space-y-2">
            <Textarea
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              placeholder="Escribe una nota..."
              rows={2}
              className="text-sm resize-none"
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) agregarNota() }}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {COLORES.map((c) => (
                  <button key={c} onClick={() => setColorSeleccionado(c)} className="w-5 h-5 rounded-full border-2 transition-all"
                    style={{ backgroundColor: c, borderColor: colorSeleccionado === c ? '#6366f1' : 'transparent' }} />
                ))}
              </div>
              <Button size="sm" onClick={agregarNota} disabled={loading || !nueva.trim()} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Añadir
              </Button>
            </div>
            <p className="text-xs text-gray-400">Ctrl+Enter para guardar</p>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {notas.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No hay notas</p>}
            {notas.map((nota) => (
              <div key={nota.id} className="rounded-lg p-3 text-sm relative group" style={{ backgroundColor: nota.color }}>
                <p className="text-gray-800 whitespace-pre-wrap pr-6">{nota.contenido}</p>
                <button
                  onClick={() => eliminarNota(nota.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-600 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
