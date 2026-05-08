'use client'

import { useState, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, type Event, Views } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { Post, Cuenta, COLORES_REDES, ICONOS_CONTENIDO, COLORES_PILARES } from '@/types'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PostDetailModal from '@/components/posts/PostDetailModal'
import { toast } from 'sonner'

const locales = { es }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DnDCalendar = withDragAndDrop(Calendar as any) as any

interface CalendarPost extends Event {
  post: Post
}

interface Props {
  posts: Post[]
  cuentas: Cuenta[]
}

const messages = {
  allDay: 'Todo el día',
  previous: '‹',
  next: '›',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Post',
  noEventsInRange: 'No hay posts en este período',
  showMore: (total: number) => `+${total} más`,
}

export default function CalendarView({ posts: initialPosts, cuentas }: Props) {
  const [posts, setPosts] = useState(initialPosts)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [view, setView] = useState<string>(Views.MONTH)
  const router = useRouter()

  const events: CalendarPost[] = posts.map((post) => {
    const date = parseISO(post.fecha_publicacion)
    const start = post.hora_aproximada
      ? new Date(`${post.fecha_publicacion}T${post.hora_aproximada}`)
      : date
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    return {
      title: `${ICONOS_CONTENIDO[post.tipo_contenido]} ${post.titulo}`,
      start,
      end,
      post,
    }
  })

  const eventStyleGetter = useCallback((event: CalendarPost) => {
    const cuenta = cuentas.find((c) => c.id === event.post.cuenta_id)
    const baseColor = cuenta?.color ?? COLORES_REDES[event.post.cuenta?.red_social ?? 'Instagram'] ?? '#6366f1'
    const color = event.post.pilar ? COLORES_PILARES[event.post.pilar] ?? baseColor : baseColor
    const opacity = event.post.estado === 'cancelado' ? 0.45 : event.post.estado === 'publicado' ? 0.75 : event.post.estado === 'borrador' ? 0.6 : 1
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        opacity,
        color: 'white',
        fontSize: '11px',
        fontWeight: 500,
        borderRadius: '4px',
        textDecoration: event.post.estado === 'cancelado' ? 'line-through' : 'none',
      },
    }
  }, [cuentas])

  const handleEventDrop = useCallback(async ({ event, start }: { event: CalendarPost; start: Date | string }) => {
    const newDate = new Date(start)
    const newDateStr = newDate.toISOString().split('T')[0]

    const supabase = createClient()
    const { error } = await supabase
      .from('posts')
      .update({ fecha_publicacion: newDateStr })
      .eq('id', event.post.id)

    if (error) {
      toast.error('Error al mover el post')
      return
    }

    setPosts((prev) =>
      prev.map((p) => p.id === event.post.id ? { ...p, fecha_publicacion: newDateStr } : p)
    )
    toast.success(`Post movido a ${format(newDate, 'd MMM', { locale: es })}`)
  }, [])

  const handleEventResize = useCallback(async ({ event, start, end }: { event: CalendarPost; start: Date | string; end: Date | string }) => {
    const newDate = new Date(start)
    const newDateStr = newDate.toISOString().split('T')[0]
    const newHora = format(newDate, 'HH:mm')
    const supabase = createClient()
    await supabase.from('posts').update({
      fecha_publicacion: newDateStr,
      hora_aproximada: newHora,
    }).eq('id', event.post.id)
    setPosts((prev) =>
      prev.map((p) => p.id === event.post.id ? { ...p, fecha_publicacion: newDateStr, hora_aproximada: newHora } : p)
    )
    void end
  }, [])

  return (
    <>
      <Card className="p-4 dark:bg-gray-900">
        <div style={{ height: view === Views.WEEK ? 680 : 620 }}>
          <DnDCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            messages={messages}
            culture="es"
            eventPropGetter={eventStyleGetter as never}
            onSelectEvent={(event: CalendarPost) => setSelectedPost(event.post)}
            onEventDrop={handleEventDrop as never}
            onEventResize={handleEventResize as never}
            resizable
            views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
            view={view as never}
            onView={setView}
            popup
            step={30}
            timeslots={2}
            defaultDate={new Date()}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {cuentas.map((c) => (
            <Badge key={c.id} style={{ backgroundColor: c.color, color: 'white', border: 'none' }}>
              {c.nombre} · {c.red_social}
            </Badge>
          ))}
        </div>
        {/* Leyenda de pilares si hay posts con pilar */}
        {(posts ?? []).some((p) => p.pilar) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(COLORES_PILARES).map(([pilar, color]) => (
              (posts ?? []).some((p) => p.pilar === pilar) && (
                <span key={pilar} className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                  {pilar}
                </span>
              )
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
          <span>💡 Arrastra un post para cambiar su fecha</span>
          <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setView(Views.WEEK)}>
            Vista semanal
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setView(Views.AGENDA)}>
            Agenda
          </Button>
        </div>
      </Card>

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onEdit={() => {
            router.push(`/posts/${selectedPost.id}`)
            setSelectedPost(null)
          }}
        />
      )}
    </>
  )
}
