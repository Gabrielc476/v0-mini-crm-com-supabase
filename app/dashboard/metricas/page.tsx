import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspaceServer } from '@/app/actions/workspace'
import { BarChart, TrendingUp, Cpu, Activity, Zap } from 'lucide-react'

export default async function MetricasPage() {
  const supabase = await createClient()
  const activeWorkspaceId = await getActiveWorkspaceServer()

  if (!activeWorkspaceId) {
    return <div className="p-8 text-center font-bold">Nenhum workspace ativo encontrado.</div>
  }

  // Fetch Stages and remove potential ghost duplicates
  const { data: rawStages } = await supabase
    .from('funnel_stages')
    .select('*')
    .eq('workspace_id', activeWorkspaceId)
    .order('position', { ascending: true })

  const uniqueStages: any[] = []
  const seenNames = new Set()
  if (rawStages) {
    rawStages.forEach(s => {
      if (!seenNames.has(s.name)) {
        seenNames.add(s.name)
        uniqueStages.push(s)
      }
    })
  }

  // Fetch Leads Volume
  const { data: rawLeads } = await supabase
    .from('leads')
    .select('id, stage')
    .eq('workspace_id', activeWorkspaceId)
  
  const leads = rawLeads || []
  const totalLeads = leads.length

  // Build Pipeline Volume Map
  const stageVolume = uniqueStages.map(stage => {
    const count = leads.filter(l => l.stage === stage.name).length
    return {
      name: stage.name,
      color: stage.color,
      count,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
    }
  })

  // Win Rate (Última Etapa)
  const lastStage = uniqueStages[uniqueStages.length - 1]?.name
  const wonLeads = lastStage ? leads.filter(l => l.stage === lastStage).length : 0
  const winRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

  // AI Efficiency
  const { data: msgs } = await supabase
    .from('generated_messages')
    .select('status')
    .eq('workspace_id', activeWorkspaceId)
  
  const totalMsgs = msgs?.length || 0
  const sentMsgs = msgs?.filter(m => m.status === 'enviada').length || 0
  const aiAdoption = totalMsgs > 0 ? Math.round((sentMsgs / totalMsgs) * 100) : 0

  // Activity Logs (Engajamento do Time Mês)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const { count: activitiesCount } = await supabase
    .from('lead_activity_logs')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', activeWorkspaceId)
    .gte('created_at', startOfMonth.toISOString())

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-blue-300 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <BarChart className="w-8 h-8" />
        </div>
        <h2 className="text-4xl font-black tracking-tight uppercase">Métricas Avançadas</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* KPI 1: Win Rate */}
        <div className="bg-green-400 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 shrink-0" />
            <h3 className="font-extrabold uppercase tracking-widest text-sm">Taxa de Vitória (Win-Rate)</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-black leading-none">{winRate}%</span>
          </div>
          <p className="font-bold text-gray-800 text-sm mt-4 border-t-4 border-black pt-2">
            {wonLeads} convertidos de um total de {totalLeads}.
          </p>
        </div>

        {/* KPI 2: AI Adoption */}
        <div className="bg-purple-300 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-6 h-6 shrink-0" />
            <h3 className="font-extrabold uppercase tracking-widest text-sm">Adoção de Inteligência</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-black leading-none">{aiAdoption}%</span>
          </div>
          <p className="font-bold text-gray-800 text-sm mt-4 border-t-4 border-black pt-2">
            {sentMsgs} msgs usadas de {totalMsgs} geradas.
          </p>
        </div>

        {/* KPI 3: Team Engagement */}
        <div className="bg-yellow-400 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-6 h-6 shrink-0" />
            <h3 className="font-extrabold uppercase tracking-widest text-sm">Dinamismo do Time (Mês)</h3>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-black leading-none">{activitiesCount || 0}</span>
          </div>
          <p className="font-bold text-gray-800 text-sm mt-4 border-t-4 border-black pt-2">
            Ações brutas registradas dentro do seu funil neste mês.
          </p>
        </div>
      </div>

      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 mb-8">
          <Zap className="w-8 h-8 text-yellow-500 fill-yellow-400" />
          <h3 className="text-2xl font-black uppercase tracking-tight">Raio-X de Gargalos (Funil)</h3>
        </div>
        
        <div className="space-y-6">
          {stageVolume.map((st, i) => (
            <div key={st.name} className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-48 font-bold uppercase truncate shrink-0 flex items-center gap-2 text-sm">
                <span className="text-gray-400 text-xs font-black">#{i + 1}</span>
                {st.name}
              </div>
              
              {/* CSS Native Bar Chart Progress */}
              <div className="flex-1 w-full bg-gray-100 border-4 border-black h-12 relative flex items-center">
                <div 
                  className={`h-full border-r-4 border-black border-collapse ${st.color} flex items-center justify-end pr-2 transition-all duration-1000 ease-out`}
                  style={{ width: `${st.percentage}%` }}
                >
                </div>
                {st.percentage > 0 && (
                  <span className="absolute mix-blend-difference font-black text-white pl-4 uppercase text-xs z-10">
                    {st.percentage}% da massa
                  </span>
                )}
              </div>
              
              <div className="w-24 shrink-0 text-right">
                <span className="font-black text-xl">{st.count}</span>
                <span className="text-xs font-bold text-gray-500 uppercase block">Leads</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
