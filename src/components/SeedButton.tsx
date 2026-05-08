'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function SeedButton() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function generarEjemplos() {
    if (!confirm('¿Generar 3 cuentas de ejemplo, 9 posts, 3 plantillas y 3 notas?\n\nSe añadirán a los datos existentes.')) return
    setLoading(true)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error desconocido')
      const { resumen } = json
      toast.success(`✅ Ejemplos creados: ${resumen.cuentas} cuentas, ${resumen.posts} posts, ${resumen.plantillas} plantillas, ${resumen.notas} notas`)
      setDone(true)
      router.refresh()
    } catch (e) {
      toast.error(`Error: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="flex items-center gap-2 text-sm text-green-600">
      <CheckCircle2 className="h-4 w-4" />
      Ejemplos generados — recarga la página para verlos
    </div>
  )

  return (
    <Button variant="outline" size="sm" onClick={generarEjemplos} disabled={loading} className="gap-2 border-dashed text-gray-500 hover:text-indigo-600 hover:border-indigo-400">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {loading ? 'Generando...' : 'Generar datos de ejemplo'}
    </Button>
  )
}
