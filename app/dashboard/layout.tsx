import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'
import { DashboardProviders } from '@/components/dashboard-providers'
import { getActiveWorkspaceServer } from '@/app/actions/workspace'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  // Só pegamos o usuário para passar o email pra Sidebar, sem dar redirect aqui!
  const { data: { user } } = await supabase.auth.getUser()

  const activeWorkspaceId = await getActiveWorkspaceServer()

  let userWorkspaces: any[] = []
  if (user) {
    const { data } = await supabase
      .from('user_workspaces')
      .select('workspace_id, role, workspaces(id, name)')
      .eq('user_id', user.id)
    if (data) userWorkspaces = data
  }

  return (
    <DashboardProviders>
      <div className="flex min-h-screen">
        <Sidebar 
          userEmail={user?.email || ''} 
          activeWorkspaceId={activeWorkspaceId}
          userWorkspaces={userWorkspaces}
        />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </DashboardProviders>
  )
}
