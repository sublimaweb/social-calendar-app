'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Cuenta } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CuentasList({ cuentas }: { cuentas: Cuenta[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta cuenta? Se eliminarán todos sus posts.')) return
    setDeleting(id)
    const supabase = createClient()
    const { error } = await supabase.from('cuentas').delete().eq('id', id)
    if (error) {
      toast.error('Error al eliminar')
    } else {
      toast.success('Cuenta eliminada')
      router.refresh()
    }
    setDeleting(null)
  }

  if (cuentas.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-400 mb-4">No tienes cuentas todavía</p>
          <Link href="/cuentas/nueva">
            <Button>Crear primera cuenta</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cuentas.map((cuenta) => (
        <Card key={cuenta.id} className="relative">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: cuenta.color }}
                >
                  {cuenta.nombre.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{cuenta.nombre}</p>
                  <Badge variant="secondary" className="text-xs mt-0.5">{cuenta.red_social}</Badge>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-gray-100 focus:outline-none">
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Link href={`/cuentas/${cuenta.id}`}>
                    <DropdownMenuItem>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => handleDelete(cuenta.id)}
                    disabled={deleting === cuenta.id}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {cuenta.notas && (
              <p className="text-sm text-gray-500 mt-3 line-clamp-2">{cuenta.notas}</p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cuenta.color }}
              />
              <span className="text-xs text-gray-400">
                {cuenta.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
