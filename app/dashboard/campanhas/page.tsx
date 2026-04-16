import { createClient } from '@/lib/supabase/server'
import { CampaignsList } from '@/components/campaigns-list'

export default async function CampanhasPage() {
  const supabase = await createClient()
  
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, company')
    .order('name', { ascending: true })

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Campanhas</h2>
      <CampaignsList initialCampaigns={campaigns || []} availableLeads={leads || []} />
    </div>
  )
}
