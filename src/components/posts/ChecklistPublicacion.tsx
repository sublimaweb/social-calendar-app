'use client'

import { useState, useMemo } from 'react'
import type { Post } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react'

interface CheckItem {
  id: string
  label: string
  autoPass: boolean
  required: boolean
  manual: boolean
}

function buildChecklist(post: Post): CheckItem[] {
  const red = post.cuenta?.red_social ?? 'Instagram'
  const tieneMedia = !!post.archivo_url
  const tieneVideo = tieneMedia && post.archivo_tipo?.startsWith('video/') === true
  const tieneImagen = tieneMedia && post.archivo_tipo?.startsWith('image/') === true
  const captionLen = post.descripcion?.length ?? 0
  const nHashtags = post.hashtags?.length ?? 0
  const tieneCaption = captionLen > 0
  const tieneHora = !!post.hora_aproximada

  const base: CheckItem[] = [
    { id: 'ortografia',    label: 'Revisé ortografía y redacción',        autoPass: false, required: false, manual: true },
    { id: 'pilar',         label: 'Tiene pilar de contenido asignado',    autoPass: !!post.pilar, required: false, manual: false },
  ]

  const porRed: Record<string, CheckItem[]> = {
    Instagram: [
      { id: 'media',      label: 'Tiene imagen o video adjunto',          autoPass: tieneMedia,     required: true,  manual: false },
      { id: 'caption',    label: 'Tiene caption/descripción',             autoPass: tieneCaption,   required: true,  manual: false },
      { id: 'hashtags',   label: `Tiene hashtags (${nHashtags} añadidos)`, autoPass: nHashtags >= 5, required: false, manual: false },
      { id: 'longcap',    label: 'Caption ≤ 2200 caracteres',             autoPass: captionLen <= 2200, required: true, manual: false },
      { id: 'hora',       label: 'Tiene hora de publicación',             autoPass: tieneHora,      required: false, manual: false },
    ],
    TikTok: [
      { id: 'video',      label: 'Tiene video adjunto',                   autoPass: tieneVideo,     required: true,  manual: false },
      { id: 'caption',    label: 'Tiene descripción',                     autoPass: tieneCaption,   required: false, manual: false },
      { id: 'hashtags',   label: `Tiene hashtags (${nHashtags})`,         autoPass: nHashtags > 0,  required: false, manual: false },
      { id: 'hora',       label: 'Tiene hora de publicación',             autoPass: tieneHora,      required: false, manual: false },
    ],
    X: [
      { id: 'content',    label: 'Tiene texto o imagen',                  autoPass: tieneCaption || tieneMedia, required: true, manual: false },
      { id: 'length',     label: `Texto ≤ 280 caracteres (${captionLen})`, autoPass: captionLen <= 280, required: true, manual: false },
    ],
    LinkedIn: [
      { id: 'desc',       label: 'Tiene descripción profesional',         autoPass: captionLen > 80, required: true,  manual: false },
      { id: 'hashtags',   label: `Máx. 5 hashtags (${nHashtags})`,       autoPass: nHashtags <= 5, required: false, manual: false },
      { id: 'hora',       label: 'Horario laboral programado',            autoPass: tieneHora,      required: false, manual: false },
    ],
    Facebook: [
      { id: 'content',    label: 'Tiene imagen, video o texto',           autoPass: tieneMedia || tieneCaption, required: true, manual: false },
      { id: 'caption',    label: 'Tiene descripción',                     autoPass: tieneCaption,   required: false, manual: false },
    ],
    YouTube: [
      { id: 'video',      label: 'Tiene video adjunto',                   autoPass: tieneVideo,     required: true,  manual: false },
      { id: 'desc',       label: 'Tiene descripción con keywords',        autoPass: captionLen > 50, required: true,  manual: false },
      { id: 'hashtags',   label: 'Tiene hashtags',                        autoPass: nHashtags > 0,  required: false, manual: false },
    ],
    Pinterest: [
      { id: 'imagen',     label: 'Tiene imagen adjunta',                  autoPass: tieneImagen,    required: true,  manual: false },
      { id: 'desc',       label: 'Tiene descripción con keywords',        autoPass: tieneCaption,   required: false, manual: false },
    ],
    Threads: [
      { id: 'caption',    label: 'Tiene texto/caption',                   autoPass: tieneCaption,   required: true,  manual: false },
      { id: 'length',     label: `Caption ≤ 500 caracteres (${captionLen})`, autoPass: captionLen <= 500, required: true, manual: false },
    ],
  }

  return [...(porRed[red] ?? porRed.Facebook), ...base]
}

interface Props {
  post: Post
  open: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export default function ChecklistPublicacion({ post, open, onConfirm, onCancel }: Props) {
  const items = useMemo(() => buildChecklist(post), [post])
  const [checks, setChecks] = useState<Record<string, boolean>>(
    () => Object.fromEntries(items.map((i) => [i.id, i.autoPass]))
  )
  const [confirming, setConfirming] = useState(false)

  const failedRequired = items.filter((i) => i.required && !checks[i.id])
  const warnings = items.filter((i) => !i.required && !checks[i.id])

  async function handleConfirm() {
    setConfirming(true)
    await onConfirm()
    setConfirming(false)
  }

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Checklist pre-publicación
          </DialogTitle>
        </DialogHeader>

        <div className="text-xs text-gray-500 mb-3 bg-gray-50 rounded p-2">
          Red: <strong>{post.cuenta?.red_social ?? '—'}</strong> · {post.titulo}
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {items.map((item) => {
            const checked = checks[item.id]
            const isIssue = !checked && item.required
            const isWarn = !checked && !item.required

            return (
              <label key={item.id} className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                isIssue ? 'bg-red-50 border border-red-200' : isWarn ? 'bg-amber-50 border border-amber-200' : 'hover:bg-gray-50'
              }`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecks((prev) => ({ ...prev, [item.id]: e.target.checked }))}
                  className="h-4 w-4 mt-0.5 rounded border-gray-300 text-indigo-600 cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${isIssue ? 'text-red-700 font-medium' : isWarn ? 'text-amber-700' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                  {item.required && !checked && (
                    <span className="ml-1 text-xs text-red-500">· requerido</span>
                  )}
                  {!item.manual && !item.autoPass && (
                    <p className="text-xs text-gray-400 mt-0.5">No detectado automáticamente</p>
                  )}
                  {item.manual && (
                    <p className="text-xs text-gray-400 mt-0.5">Verificación manual</p>
                  )}
                </div>
                {checked
                  ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  : item.required
                    ? <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    : <Circle className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                }
              </label>
            )
          })}
        </div>

        {/* Resumen */}
        <div className="mt-3 pt-3 border-t">
          {failedRequired.length > 0 ? (
            <p className="text-sm text-red-600 mb-3">
              ⚠️ {failedRequired.length} elemento{failedRequired.length > 1 ? 's' : ''} requerido{failedRequired.length > 1 ? 's' : ''} sin completar
            </p>
          ) : warnings.length > 0 ? (
            <p className="text-sm text-amber-600 mb-3">
              ℹ️ {warnings.length} advertencia{warnings.length > 1 ? 's' : ''} — puedes publicar de todas formas
            </p>
          ) : (
            <p className="text-sm text-green-600 mb-3">✅ Todo en orden — listo para publicar</p>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleConfirm}
              disabled={confirming || failedRequired.length > 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {confirming ? 'Publicando...' : failedRequired.length > 0 ? 'Corrige los errores primero' : warnings.length > 0 ? `Publicar con ${warnings.length} advertencia${warnings.length > 1 ? 's' : ''}` : 'Confirmar y publicar'}
            </Button>
            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
