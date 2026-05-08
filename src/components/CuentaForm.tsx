'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  REDES_SOCIALES, COLORES_REDES, ICONOS_REDES, PLACEHOLDER_REDES,
  type Cuenta, type RedSocial,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { CheckCircle2, Circle, ChevronDown } from 'lucide-react'

const PRESET_COLORS = [
  '#6366f1', '#E1306C', '#1877F2', '#0A66C2',
  '#25D366', '#FF0000', '#E60023', '#101010',
  '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6',
]

interface Props {
  cuenta?: Cuenta
}

// ─── Modo edición: formulario clásico de una sola red ────────────────────────
function FormEdicion({ cuenta }: { cuenta: Cuenta }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState(cuenta.nombre)
  const [redSocial, setRedSocial] = useState<RedSocial>(cuenta.red_social)
  const [color, setColor] = useState(cuenta.color)
  const [notas, setNotas] = useState(cuenta.notas ?? '')
  const [activa, setActiva] = useState(cuenta.activa)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('cuentas')
      .update({ nombre, red_social: redSocial, color, notas, activa, user_id: user.id })
      .eq('id', cuenta.id)
    if (error) { toast.error('Error al guardar la cuenta'); setLoading(false); return }
    toast.success('Cuenta actualizada')
    router.push('/cuentas')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la cuenta *</Label>
            <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="@miempresa" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="red-social-select">Red social *</Label>
            <div className="relative">
              <select
                id="red-social-select"
                value={redSocial}
                onChange={(e) => {
                  const v = e.target.value as RedSocial
                  setRedSocial(v)
                  setColor(COLORES_REDES[v])
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none"
              >
                {REDES_SOCIALES.map((r) => (
                  <option key={r} value={r}>{ICONOS_REDES[r]} {r}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color de etiqueta</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: color === c ? 'white' : 'transparent', outline: color === c ? `2px solid ${c}` : 'none' }} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-12 rounded cursor-pointer border" />
              <span className="text-sm text-gray-500">{color}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)}
              placeholder="Descripción, audiencia, estrategia..." rows={3} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="activa" checked={activa} onChange={(e) => setActiva(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
            <Label htmlFor="activa">Cuenta activa</Label>
          </div>
        </CardContent>
        <CardFooter className="px-6 pb-6 gap-3">
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Actualizar cuenta'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        </CardFooter>
      </Card>
    </form>
  )
}

// ─── Modo creación: checklist multi-red + nombre por red ─────────────────────
interface RedState {
  checked: boolean
  nombre: string
}

function FormCreacion() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clienteNombre, setClienteNombre] = useState('')
  const [notas, setNotas] = useState('')
  const [colorGlobal, setColorGlobal] = useState('#6366f1')
  const [usarColorMarca, setUsarColorMarca] = useState(true)
  const [redes, setRedes] = useState<Record<RedSocial, RedState>>(
    () => Object.fromEntries(REDES_SOCIALES.map((r) => [r, { checked: false, nombre: '' }])) as Record<RedSocial, RedState>
  )

  function toggleRed(red: RedSocial) {
    setRedes((prev) => ({ ...prev, [red]: { ...prev[red], checked: !prev[red].checked } }))
  }

  function setNombreRed(red: RedSocial, valor: string) {
    setRedes((prev) => ({ ...prev, [red]: { ...prev[red], nombre: valor } }))
  }

  const redesSeleccionadas = REDES_SOCIALES.filter((r) => redes[r].checked)
  const redesListas = redesSeleccionadas.filter((r) => redes[r].nombre.trim().length > 0)
  const hayError = redesSeleccionadas.some((r) => !redes[r].nombre.trim())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (redesListas.length === 0) { toast.error('Selecciona al menos una red y escribe el usuario'); return }
    if (hayError) { toast.error('Escribe el usuario de cada red seleccionada'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const notasFinales = [
      clienteNombre ? `Cliente: ${clienteNombre}` : '',
      notas,
    ].filter(Boolean).join('\n') || null

    const payload = redesListas.map((red) => ({
      user_id: user.id,
      nombre: redes[red].nombre.trim(),
      red_social: red,
      color: usarColorMarca ? COLORES_REDES[red] : colorGlobal,
      notas: notasFinales,
      activa: true,
    }))

    const { error } = await supabase.from('cuentas').insert(payload)
    if (error) { toast.error('Error al crear las cuentas'); setLoading(false); return }

    toast.success(`${payload.length} cuenta${payload.length > 1 ? 's' : ''} creada${payload.length > 1 ? 's' : ''} ✅`)
    router.push('/cuentas')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="p-6 space-y-6">

          {/* 1. Nombre del negocio / cliente */}
          <div className="space-y-2">
            <Label htmlFor="cliente-nombre" className="text-base font-semibold">
              Nombre del negocio o establecimiento
            </Label>
            <Input
              id="cliente-nombre"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              placeholder="Ej: Restaurante La Casa, Boutique Luna, Clínica Salud..."
            />
            <p className="text-xs text-gray-400">Identifica al cliente o negocio al que pertenecen estas cuentas</p>
          </div>

          {/* 2. Checklist de redes sociales */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">Redes sociales</Label>
              <p className="text-xs text-gray-400 mt-0.5">
                Toca una red para seleccionarla — luego escribe el usuario o nombre de la página
              </p>
            </div>

            <div className="grid gap-2">
              {REDES_SOCIALES.map((red) => {
                const { checked, nombre } = redes[red]
                const brandColor = COLORES_REDES[red]
                const sinNombre = checked && !nombre.trim()

                return (
                  <div
                    key={red}
                    onClick={() => toggleRed(red)}
                    className={`rounded-xl border-2 transition-all cursor-pointer select-none ${
                      checked
                        ? 'border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40'
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 p-3">

                      {/* Icono check */}
                      <div className="flex-shrink-0 pointer-events-none">
                        {checked
                          ? <CheckCircle2 className="h-6 w-6 text-indigo-600" />
                          : <Circle className="h-6 w-6 text-gray-300" />}
                      </div>

                      {/* Badge de la red */}
                      <div className="flex items-center gap-2 w-32 flex-shrink-0 pointer-events-none">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: brandColor }}
                        >
                          {ICONOS_REDES[red]}
                        </span>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{red}</span>
                      </div>

                      {/* Input usuario — stopPropagation para no des-seleccionar al escribir */}
                      {checked && (
                        <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={nombre}
                            onChange={(e) => setNombreRed(red, e.target.value)}
                            placeholder={PLACEHOLDER_REDES[red]}
                            className={`h-8 text-sm ${sinNombre ? 'border-red-300 focus-visible:ring-red-400' : ''}`}
                          />
                          {sinNombre && (
                            <p className="text-xs text-red-500 mt-0.5">Escribe el nombre o usuario</p>
                          )}
                        </div>
                      )}

                      {!checked && (
                        <span className="flex-1 text-xs text-gray-400 italic pointer-events-none truncate">
                          {PLACEHOLDER_REDES[red]}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {redesSeleccionadas.length > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-950 rounded-lg px-3 py-2 text-xs text-indigo-700 dark:text-indigo-300">
                {redesListas.length} de {redesSeleccionadas.length} redes listas
                {redesListas.length > 0 && ` — se crearán: ${redesListas.join(', ')}`}
              </div>
            )}
          </div>

          {/* 3. Color de etiqueta */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Color de etiqueta</Label>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={usarColorMarca} onChange={() => setUsarColorMarca(true)}
                  className="h-4 w-4 text-indigo-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Usar color oficial de cada red</span>
              </label>
              <div className="flex gap-1">
                {redesListas.map((r) => (
                  <span key={r} className="w-4 h-4 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: COLORES_REDES[r] }} title={r} />
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={!usarColorMarca} onChange={() => setUsarColorMarca(false)}
                className="h-4 w-4 text-indigo-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Un color personalizado para todas</span>
            </label>
            {!usarColorMarca && (
              <div className="pl-6 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setColorGlobal(c)}
                      className="w-8 h-8 rounded-full border-2 transition-all"
                      style={{ backgroundColor: c, borderColor: colorGlobal === c ? 'white' : 'transparent', outline: colorGlobal === c ? `2px solid ${c}` : 'none' }} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={colorGlobal} onChange={(e) => setColorGlobal(e.target.value)}
                    className="h-8 w-12 rounded cursor-pointer border" />
                  <span className="text-sm text-gray-500">{colorGlobal}</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Notas adicionales */}
          <div className="space-y-2">
            <Label htmlFor="notas" className="text-base font-semibold">
              Notas adicionales <span className="font-normal text-gray-400">(opcional)</span>
            </Label>
            <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)}
              placeholder="Estrategia, audiencia, horarios preferidos, tono de comunicación..."
              rows={3} />
          </div>
        </CardContent>

        <CardFooter className="px-6 pb-6 gap-3">
          <Button type="submit" disabled={loading || redesListas.length === 0 || hayError}>
            {loading
              ? 'Creando...'
              : redesListas.length === 0
                ? 'Selecciona al menos una red'
                : `Crear ${redesListas.length} cuenta${redesListas.length > 1 ? 's' : ''}`}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        </CardFooter>
      </Card>
    </form>
  )
}

// ─── Export principal ─────────────────────────────────────────────────────────
export default function CuentaForm({ cuenta }: Props) {
  if (cuenta) return <FormEdicion cuenta={cuenta} />
  return <FormCreacion />
}
