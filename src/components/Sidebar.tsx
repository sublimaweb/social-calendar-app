'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { type User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  CalendarDays,
  Users,
  Upload,
  FolderOpen,
  LogOut,
  FileText,
  BarChart2,
  LayoutTemplate,
  Kanban,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ThemeToggle'
import NotasRapidas from '@/components/NotasRapidas'

const navItems = [
  { href: '/dashboard',   label: 'Calendario',   icon: CalendarDays },
  { href: '/posts',       label: 'Posts',         icon: FileText },
  { href: '/kanban',      label: 'Kanban',        icon: Kanban },
  { href: '/estadisticas',label: 'Estadísticas',  icon: BarChart2 },
  { href: '/plantillas',  label: 'Plantillas',    icon: LayoutTemplate },
  { href: '/biblioteca',  label: 'Biblioteca',    icon: ImageIcon },
  { href: '/cuentas',     label: 'Cuentas',       icon: Users },
  { href: '/importar',    label: 'Importar',      icon: Upload },
  { href: '/archivos',    label: 'Archivos',      icon: FolderOpen },
]

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/login')
    router.refresh()
  }

  const initials = user.email?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <aside className="w-56 bg-white dark:bg-gray-900 border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <CalendarDays className="h-6 w-6" />
            <span className="font-bold text-lg">PostFlow</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <div
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t space-y-1">
        <NotasRapidas />
        <div className="flex items-center gap-2 mb-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">{user.email}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-500 hover:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  )
}
