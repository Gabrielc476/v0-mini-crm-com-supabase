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
    const { data: rpcData, error } = await supabase
      .rpc('get_user_workspaces_info', { current_user_id: user.id })
    
    if (rpcData && !error) {
       userWorkspaces = rpcData.map((row: any) => ({
         workspace_id: row.workspace_id,
         role: row.role,
         workspaces: {
           id: row.workspace_id,
           name: row.workspace_name
         }
       }))
    }
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
