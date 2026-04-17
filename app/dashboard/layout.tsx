import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'
import { DashboardProviders } from '@/components/dashboard-providers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  // Só pegamos o usuário para passar o email pra Sidebar, sem dar redirect aqui!
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <DashboardProviders>
      <div className="flex min-h-screen">
        <Sidebar userEmail={user?.email || ''} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </DashboardProviders>
  )
}
