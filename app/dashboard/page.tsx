import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/kanban-board'
import { getActiveWorkspaceServer } from '@/app/actions/workspace'

export default async function DashboardPage() {
  const supabase = await createClient()
  const activeWorkspaceId = await getActiveWorkspaceServer()

  if (!activeWorkspaceId) {
    return <div className="p-8 text-center font-bold">Nenhum workspace ativo encontrado.</div>
  }
  
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('workspace_id', activeWorkspaceId)
    .order('created_at', { ascending: false })

  const { data: rawStages } = await supabase
    .from('funnel_stages')
    .select('*')
    .eq('workspace_id', activeWorkspaceId)
    .order('position', { ascending: true })

  // Filtro inteligente anti-duplicação (Corrige falha onde usuários podem ter múltiplas trigadas)
  const uniqueStages: any[] = []
  const seenStageNames = new Set<string>()
  
  if (rawStages) {
    rawStages.forEach(stage => {
      if (!seenStageNames.has(stage.name)) {
        seenStageNames.add(stage.name)
        uniqueStages.push(stage)
      }
    })
  }

  return (
    <div className="h-full">
      <KanbanBoard key={activeWorkspaceId} initialLeads={leads || []} stages={uniqueStages} activeWorkspaceId={activeWorkspaceId} />
    </div>
  )
}
