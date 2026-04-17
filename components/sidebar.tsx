'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Megaphone, LogOut, ChevronDown, Check, Plus, Loader2, BarChart2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { setActiveWorkspace, createNewWorkspace } from '@/app/actions/workspace'

interface SidebarProps {
  userEmail: string
  activeWorkspaceId?: string | null
  userWorkspaces?: any[]
}

const navItems = [
  { href: '/dashboard', label: 'Pipeline', icon: LayoutDashboard },
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/campanhas', label: 'Campanhas', icon: Megaphone },
  { href: '/dashboard/metricas', label: 'Métricas', icon: BarChart2 },
]

export function Sidebar({ userEmail, activeWorkspaceId, userWorkspaces = [] }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false)
  
  // States para criação de novo workspace
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return

    startTransition(async () => {
      try {
        await createNewWorkspace(newWorkspaceName.trim())
        setIsCreatingWorkspace(false)
        setNewWorkspaceName('')
        setIsWorkspaceMenuOpen(false)
        router.refresh()
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  const activeWorkspaceInfo = userWorkspaces.find(w => w.workspace_id === activeWorkspaceId)

  return (
    <aside className="w-64 bg-white border-r-4 border-black flex flex-col relative z-20">
      <div className="p-6 border-b-4 border-black bg-yellow-400">
        <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
          <div className="w-4 h-4 bg-black rounded-full" />
          Mini CRM
        </h1>
        <p className="text-xs font-bold mt-1 text-black/70">{userEmail}</p>
      </div>

      {userWorkspaces.length > 0 && (
        <div className="border-b-4 border-black relative">
          <button 
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-white transition-colors cursor-pointer group"
          >
            <div className="flex flex-col items-start truncate">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Workspace Atual</span>
              <span className="font-bold text-sm truncate max-w-[170px] uppercase">
                {activeWorkspaceInfo?.workspaces?.name || 'Selecione'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-1" />
          </button>

          {isWorkspaceMenuOpen && (
            <div className="absolute top-full left-0 w-full z-30 bg-white border-b-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {userWorkspaces.map(w => (
                <button
                  key={w.workspace_id}
                  onClick={async () => {
                    setIsWorkspaceMenuOpen(false)
                    if (w.workspace_id !== activeWorkspaceId) {
                      await setActiveWorkspace(w.workspace_id)
                      router.refresh()
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3 border-b-2 border-black last:border-b-0 hover:bg-yellow-200 transition-colors text-left font-bold text-sm uppercase ${
                    w.workspace_id === activeWorkspaceId ? 'bg-yellow-100' : ''
                  }`}
                >
                  <span className="truncate">{w.workspaces?.name}</span>
                  {w.workspace_id === activeWorkspaceId && <Check className="w-4 h-4" />}
                </button>
              ))}
              
              <button
                onClick={() => {
                  setIsWorkspaceMenuOpen(false)
                  setIsCreatingWorkspace(true)
                }}
                className="w-full flex items-center justify-center p-3 border-b-2 border-black last:border-b-0 hover:bg-yellow-400 transition-colors bg-white font-black text-xs uppercase gap-2 text-black border-t-4"
              >
                <Plus className="w-4 h-4" /> Criar Novo Workspace
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Criação Embutido */}
      {isCreatingWorkspace && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm -m-[200vw]" style={{ width: '400vw', height: '400vh', marginLeft: '-150vw', marginTop: '-150vh' }}>
          <form 
            onSubmit={handleCreateWorkspace}
            className="relative bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-80 flex flex-col"
          >
            <h3 className="font-black uppercase text-xl mb-4 text-center">Nova Empresa</h3>
            <label className="text-xs font-bold uppercase text-gray-600 mb-2">Nome do Workspace</label>
            <input 
              autoFocus
              required
              disabled={isPending}
              value={newWorkspaceName}
              onChange={e => setNewWorkspaceName(e.target.value)}
              className="border-2 border-black p-3 font-bold focus:outline-none mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              placeholder="Ex: Minha Agência"
            />
            
            <div className="flex gap-2">
              <button 
                type="button"
                disabled={isPending}
                onClick={() => setIsCreatingWorkspace(false)}
                className="flex-1 py-3 bg-gray-200 border-2 border-black font-bold uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isPending}
                className="flex-1 flex justify-center items-center py-3 bg-black text-white border-2 border-black font-bold uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] transition-all disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      )}

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
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold uppercase tracking-wide text-sm transition-all border-4 ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-1'
                      : 'border-transparent hover:border-black hover:bg-sidebar-accent hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 text-sidebar-foreground'
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

      <div className="p-4 border-t-4 border-black bg-white">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg font-bold uppercase tracking-wide transition-all border-4 border-transparent hover:border-black hover:bg-red-400 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 text-red-500"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  )
}
