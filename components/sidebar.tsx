'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Users, Megaphone, LogOut } from 'lucide-react'

interface SidebarProps {
  userEmail: string
}

const navItems = [
  { href: '/dashboard', label: 'Pipeline', icon: LayoutDashboard },
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/campanhas', label: 'Campanhas', icon: Megaphone },
]

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-sidebar neo-border border-l-0 border-t-0 border-b-0 flex flex-col">
      <div className="p-6 border-b-3 border-foreground">
        <h1 className="text-2xl font-bold">Mini CRM</h1>
        <p className="text-sm text-muted-foreground truncate mt-1">{userEmail}</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground neo-shadow-sm'
                      : 'hover:bg-sidebar-accent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t-3 border-foreground">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-bold text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  )
}
