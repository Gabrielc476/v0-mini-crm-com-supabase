import { createClient } from '@/lib/supabase/server'
import { LeadsTable } from '@/components/leads-table'

export default async function LeadsPage() {
  const supabase = await createClient()
  
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Todos os Leads</h2>
      <LeadsTable initialLeads={leads || []} />
    </div>
  )
}
