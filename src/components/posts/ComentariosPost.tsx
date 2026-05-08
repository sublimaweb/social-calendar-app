'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PostComentario } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  postId: string
}

export default function ComentariosPost({ postId }: Props) {
  const [comentarios, setComentarios] = useState<PostComentario[]>([])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('post_comentarios')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setComentarios(data ?? [])
        setLoading(false)
      })
  }, [postId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comentarios])

  async function enviarComentario() {
    if (!texto.trim()) return
    setSending(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('post_comentarios')
      .insert({ post_id: postId, user_id: user.id, contenido: texto.trim() })
      .select()
      .single()

    if (error || !data) { toast.error('Error al enviar comentario'); setSending(false); return }
    setComentarios((prev) => [...prev, data])
    setTexto('')
    setSending(false)
  }

  async function eliminarComentario(id: string) {
    const supabase = createClient()
    await supabase.from('post_comentarios').delete().eq('id', id)
    setComentarios((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
        <MessageSquare className="h-3.5 w-3.5" />
        Comentarios internos ({comentarios.length})
      </div>

      {/* Hilo */}
      <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2">
        {loading && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
        {!loading && comentarios.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-3">Sin comentarios — sé el primero</p>
        )}
        {comentarios.map((c) => (
          <div key={c.id} className="flex items-start gap-2 group">
            <div className="flex-1 bg-white dark:bg-gray-700 rounded-lg p-2.5 shadow-sm">
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{c.contenido}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: es })}
              </p>
            </div>
            <button
              onClick={() => eliminarComentario(c.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all mt-1 flex-shrink-0"
              title="Eliminar comentario"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end">
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) enviarComentario() }}
          placeholder="Escribe una nota interna... (Ctrl+Enter para enviar)"
          rows={2}
          className="text-sm resize-none flex-1"
        />
        <Button
          size="sm"
          onClick={enviarComentario}
          disabled={sending || !texto.trim()}
          className="h-10 px-3 flex-shrink-0"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
