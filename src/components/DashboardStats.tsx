import { Post } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Clock, XCircle, LayoutGrid } from 'lucide-react'
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns'

export default function DashboardStats({ posts }: { posts: Post[] }) {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const thisWeek = posts.filter((p) => {
    try {
      return isWithinInterval(parseISO(p.fecha_publicacion), { start: weekStart, end: weekEnd })
    } catch {
      return false
    }
  })

  const pendientes = posts.filter((p) => p.estado === 'pendiente').length
  const publicados = posts.filter((p) => p.estado === 'publicado').length
  const cancelados = posts.filter((p) => p.estado === 'cancelado').length

  const stats = [
    { label: 'Esta semana', value: thisWeek.length, icon: LayoutGrid, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pendientes', value: pendientes, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Publicados', value: publicados, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Cancelados', value: cancelados, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`${bg} p-2 rounded-lg`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
