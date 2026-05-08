'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { parseExcel } from '@/lib/parsers/excel'
import { parseWord, parsePdfText } from '@/lib/parsers/word'
import type { PostImportado, Cuenta } from '@/types'
import { TIPOS_CONTENIDO } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, FileSpreadsheet, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

type Step = 'upload' | 'preview' | 'success'

export default function ImportadorArchivo() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('')
  const [posts, setPosts] = useState<PostImportado[]>([])
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [imported, setImported] = useState(0)
  const [errors, setErrors] = useState(0)

  async function loadCuentas() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data } = await supabase.from('cuentas').select('*').eq('user_id', user.id).eq('activa', true)
    return data ?? []
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setFileName(file.name)
    setFileType(file.type)

    try {
      const buffer = await file.arrayBuffer()
      let parsed: PostImportado[] = []

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parsed = parseExcel(buffer)
      } else if (file.name.endsWith('.docx')) {
        parsed = await parseWord(buffer)
      } else if (file.name.endsWith('.pdf')) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('PDF parse failed')
        const { text } = await res.json()
        parsed = parsePdfText(text)
      } else {
        toast.error('Formato no soportado. Usa Excel (.xlsx), Word (.docx) o PDF (.pdf)')
        setLoading(false)
        return
      }

      if (parsed.length === 0) {
        toast.error('No se encontraron posts en el archivo')
        setLoading(false)
        return
      }

      const cuentasData = await loadCuentas()
      setCuentas(cuentasData)
      setPosts(parsed)
      setStep('preview')
    } catch (err) {
      console.error(err)
      toast.error('Error al procesar el archivo')
    }
    setLoading(false)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function validatePost(post: PostImportado, _cuentas: Cuenta[]): string[] {
    const errs: string[] = []
    if (!post.cuenta) errs.push('Cuenta requerida')
    if (!post.red_social) errs.push('Red social requerida')
    if (!post.tipo_contenido || !TIPOS_CONTENIDO.includes(post.tipo_contenido)) errs.push('Tipo de contenido inválido')
    if (!post.titulo) errs.push('Título requerido')
    if (!post.fecha_publicacion) errs.push('Fecha requerida')
    return errs
  }

  async function handleConfirm() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let ok = 0
    let err = 0

    for (const post of posts) {
      const validErrors = validatePost(post, cuentas)
      if (validErrors.length > 0) {
        err++
        continue
      }

      const cuenta = cuentas.find(
        (c) => c.nombre.toLowerCase() === post.cuenta.toLowerCase() ||
               c.nombre.toLowerCase().includes(post.cuenta.replace('@', '').toLowerCase())
      )

      if (!cuenta) {
        err++
        continue
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        cuenta_id: cuenta.id,
        tipo_contenido: post.tipo_contenido,
        titulo: post.titulo,
        fecha_publicacion: post.fecha_publicacion,
        hora_aproximada: post.hora_aproximada || null,
        prompt_visual: post.prompt_visual || null,
        prompt_copy: post.prompt_copy || null,
        descripcion: post.descripcion || null,
        prompt_hashtags: post.prompt_hashtags || null,
        hashtags: post.hashtags && post.hashtags.length > 0 ? post.hashtags : null,
        nota_recomendacion: post.nota_recomendacion || null,
        estado: 'pendiente',
      })

      if (error) err++
      else ok++
    }

    await supabase.from('importaciones').insert({
      user_id: user.id,
      nombre_archivo: fileName,
      tipo_archivo: fileType,
      posts_importados: ok,
      errores: err,
    })

    setImported(ok)
    setErrors(err)
    setStep('success')
    setLoading(false)
    router.refresh()
  }

  function reset() {
    setStep('upload')
    setPosts([])
    setFileName('')
    setFileType('')
    if (fileRef.current) fileRef.current.value = ''
  }

  if (step === 'success') {
    return (
      <Card>
        <CardContent className="p-12 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Importación completada</h2>
          <p className="text-gray-500">
            {imported} posts importados correctamente
            {errors > 0 && ` · ${errors} con errores`}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/posts')}>Ver posts</Button>
            <Button variant="outline" onClick={reset}>Importar otro archivo</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'preview') {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
              {fileName} — {posts.length} posts encontrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Revisa los posts antes de confirmar la importación:</p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {posts.map((post, i) => {
                const errs = validatePost(post, cuentas)
                const cuentaEncontrada = cuentas.find(
                  (c) => c.nombre.toLowerCase() === post.cuenta?.toLowerCase() ||
                         c.nombre.toLowerCase().includes(post.cuenta?.replace('@', '').toLowerCase() ?? '')
                )

                return (
                  <div
                    key={i}
                    className={`border rounded-lg p-3 text-sm ${errs.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{post.titulo || '(sin título)'}</div>
                        <div className="text-gray-500 mt-0.5">
                          {post.cuenta} · {post.red_social} · {post.tipo_contenido}
                          {post.fecha_publicacion && ` · ${post.fecha_publicacion}`}
                        </div>
                        {!cuentaEncontrada && (
                          <p className="text-amber-600 text-xs mt-1">
                            ⚠️ Cuenta &quot;{post.cuenta}&quot; no encontrada en tus cuentas
                          </p>
                        )}
                        {errs.length > 0 && (
                          <div className="mt-1">
                            {errs.map((e) => (
                              <p key={e} className="text-red-600 text-xs">• {e}</p>
                            ))}
                          </div>
                        )}
                      </div>
                      <Badge variant={errs.length > 0 ? 'destructive' : 'secondary'} className="text-xs flex-shrink-0">
                        {errs.length > 0 ? (
                          <><AlertCircle className="h-3 w-3 mr-1" />Error</>
                        ) : (
                          <><CheckCircle2 className="h-3 w-3 mr-1" />OK</>
                        )}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Importando...' : `Confirmar importación (${posts.length} posts)`}
          </Button>
          <Button variant="outline" onClick={reset}>
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <Card>
        <CardContent className="p-8">
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-300 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-700 mb-1">
              {loading ? 'Procesando...' : 'Arrastra o selecciona un archivo'}
            </p>
            <p className="text-sm text-gray-400">Excel (.xlsx), Word (.docx) o PDF (.pdf)</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.docx,.pdf"
            onChange={handleFile}
            disabled={loading}
          />
        </CardContent>
      </Card>

      {/* Formato Excel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
            <FileSpreadsheet className="h-4 w-4" />
            Formato Excel (.xlsx) — Hoja &quot;Posts&quot;
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {['A: Cuenta', 'B: Red Social', 'C: Tipo', 'D: Título*', 'E: Fecha*', 'F: Hora', 'G: Prompt Visual', 'H: Prompt Copy', 'I: Descripción', 'J: Prompt Hashtags', 'K: Hashtags', 'L: Notas'].map((h) => (
                    <th key={h} className="border px-2 py-1 text-left font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {['@miempresa', 'Instagram', 'imagen', 'Lanzamiento Mayo', '15/05/2026', '09:00', 'Fondo azul...', 'Escribe un copy...', '¡Llegó el momento!', 'Crea hashtags...', '#lanzamiento', 'Publicar tras email'].map((v, i) => (
                    <td key={i} className="border px-2 py-1 text-gray-500">{v}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Formato Word/PDF */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
            <FileText className="h-4 w-4" />
            Formato Word (.docx) / PDF — separar posts con &quot;---&quot;
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 rounded p-3 text-gray-600 overflow-x-auto">{`CUENTA: @miempresa
RED: Instagram
TIPO: imagen
TITULO: Lanzamiento Mayo
FECHA: 15/05/2026
HORA: 09:00
PROMPT VISUAL: Fondo azul marino, texto blanco, minimalista
PROMPT COPY: Escribe un copy persuasivo sobre el lanzamiento
DESCRIPCION: ¡Llegó el momento!
PROMPT HASHTAGS: Crea 5 hashtags sobre lanzamientos
HASHTAGS: #lanzamiento #nuevo
NOTAS: Publicar después del email
---
CUENTA: @miempresa
RED: TikTok
TIPO: video
TITULO: Tutorial rápido
FECHA: 20/05/2026`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
