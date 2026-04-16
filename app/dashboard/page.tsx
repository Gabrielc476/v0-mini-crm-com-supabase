import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/kanban-board'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="h-full">
      <KanbanBoard initialLeads={leads || []} />
    </div>
  )
}
