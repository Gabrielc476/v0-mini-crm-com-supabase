import { createClient } from '@/lib/supabase/server'
import { CampaignsList } from '@/components/campaigns-list'
import { getActiveWorkspaceServer } from '@/app/actions/workspace'

export default async function CampanhasPage() {
  const supabase = await createClient()
  const activeWorkspaceId = await getActiveWorkspaceServer()

  if (!activeWorkspaceId) {
    return <div className="p-8 text-center font-bold">Nenhum workspace ativo encontrado.</div>
  }

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('workspace_id', activeWorkspaceId)
    .order('created_at', { ascending: false })

  const { data: rawStages } = await supabase
    .from('funnel_stages')
    .select('*')
    .eq('workspace_id', activeWorkspaceId)
    .order('position', { ascending: true })

  // Filtro anti-duplicação idêntico ao do Dashboard
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
      <h2 className="text-3xl font-bold tracking-tight mb-8">Campanhas</h2>
      <CampaignsList key={activeWorkspaceId} initialCampaigns={campaigns || []} stages={uniqueStages} />
    </div>
  )
}