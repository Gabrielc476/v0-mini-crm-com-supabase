import { createClient } from '@/lib/supabase/server'
import { CampaignsList } from '@/components/campaigns-list'

export default async function CampanhasPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  // Removemos a busca de leads daqui! Menos requisições = aplicação mais rápida ⚡️

  return (
    <div className="h-full">
      <h2 className="text-3xl font-bold tracking-tight mb-8">Campanhas</h2>
      <CampaignsList initialCampaigns={campaigns || []} />
    </div>
  )
}