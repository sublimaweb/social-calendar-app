'use client'

import { useMemo } from 'react'
import type { Post, Cuenta } from '@/types'
import { COLORES_REDES } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, eachMonthOfInterval, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

interface Props {
  posts: Post[]
  cuentas: Cuenta[]
}

export default function EstadisticasView({ posts, cuentas }: Props) {
  const totalPosts = posts.length
  const publicados = posts.filter((p) => p.estado === 'publicado').length
  const pendientes = posts.filter((p) => p.estado === 'pendiente').length
  const cancelados = posts.filter((p) => p.estado === 'cancelado').length
  const tasaPublicacion = totalPosts > 0 ? Math.round((publicados / totalPosts) * 100) : 0

  // Posts por red social
  const porRedSocial = useMemo(() => {
    const map: Record<string, number> = {}
    posts.forEach((p) => {
      const red = p.cuenta?.red_social ?? 'Desconocida'
      map[red] = (map[red] ?? 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [posts])

  // Posts por mes (últimos 6 meses)
  const porMes = useMemo(() => {
    const now = new Date()
    const months = eachMonthOfInterval({ start: subMonths(now, 5), end: now })
    return months.map((month) => {
      const key = format(month, 'yyyy-MM')
      const total = posts.filter((p) => p.fecha_publicacion?.startsWith(key)).length
      const pub = posts.filter((p) => p.fecha_publicacion?.startsWith(key) && p.estado === 'publicado').length
      return {
        mes: format(month, 'MMM', { locale: es }),
        total,
        publicados: pub,
      }
    })
  }, [posts])

  // Posts por tipo de contenido
  const porTipo = useMemo(() => {
    const map: Record<string, number> = {}
    posts.forEach((p) => { map[p.tipo_contenido] = (map[p.tipo_contenido] ?? 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [posts])

  // Posts por cuenta
  const porCuenta = useMemo(() => {
    return cuentas.map((c) => ({
      name: c.nombre,
      total: posts.filter((p) => p.cuenta_id === c.id).length,
      publicados: posts.filter((p) => p.cuenta_id === c.id && p.estado === 'publicado').length,
      color: c.color,
    })).filter((c) => c.total > 0)
  }, [posts, cuentas])

  const PIE_COLORS = ['#6366f1', '#E1306C', '#1877F2', '#0A66C2', '#FF0000', '#E60023', '#10b981', '#f59e0b']

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total posts', value: totalPosts, color: 'text-indigo-600' },
          { label: 'Publicados', value: publicados, color: 'text-green-600' },
          { label: 'Pendientes', value: pendientes, color: 'text-amber-600' },
          { label: 'Cancelados', value: cancelados, color: 'text-red-500' },
          { label: 'Tasa publicación', value: `${tasaPublicacion}%`, color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Posts por mes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Posts por mes (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porMes} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" name="Total" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                <Bar dataKey="publicados" name="Publicados" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Posts por red social */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Posts por red social</CardTitle>
          </CardHeader>
          <CardContent>
            {porRedSocial.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={porRedSocial} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    label={({ name, percent }: any) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {porRedSocial.map((entry, i) => (
                      <Cell key={entry.name} fill={COLORES_REDES[entry.name as keyof typeof COLORES_REDES] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Por cuenta */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Posts por cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            {porCuenta.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porCuenta} layout="vertical" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="total" name="Total" radius={[0, 4, 4, 0]}>
                    {porCuenta.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Por tipo de contenido */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-600">Por tipo de contenido</CardTitle>
          </CardHeader>
          <CardContent>
            {porTipo.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={porTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                    {porTipo.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={(v) => v} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
