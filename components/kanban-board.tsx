'use client'

import { useState } from 'react'
import { Lead, LeadStage, FunnelStage } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { LeadCard } from './lead-card'
import { LeadModal } from './lead-modal'
import { SettingsModal } from './settings-modal'
import { Plus, Search, Settings, AlertTriangle, X } from 'lucide-react'
import { useAIGeneration } from '@/contexts/ai-generation-context'

interface KanbanBoardProps {
  initialLeads: Lead[]
  stages: FunnelStage[]
  activeWorkspaceId: string
}

export function KanbanBoard({ initialLeads, stages, activeWorkspaceId }: KanbanBoardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [missingFieldsAlert, setMissingFieldsAlert] = useState<{stageName: string, fields: string[]} | null>(null)
  const supabase = createClient()
  const { startGeneration } = useAIGeneration()

  const checkAndTriggerGeneration = async (lead: Lead, stage: LeadStage) => {
    try {
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('is_active', true)
        .eq('trigger_stage', stage)

      if (error) {
        console.error('Erro ao buscar campanhas gatilho:', error)
        return
      }

      if (campaigns && campaigns.length > 0) {
        for (const campaign of campaigns) {
          startGeneration(lead.id, lead.name, campaign.id, campaign.name)
        }
      }
    } catch (err) {
      console.error('Falha ao checar gatilhos:', err)
    }
  }

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Lógica de Drop atualizada para usar 'stage' em vez de 'status'
  const handleDrop = async (stageName: LeadStage) => {
    if (!draggedLead || draggedLead.stage === stageName) {
      setDraggedLead(null)
      return
    }

    // Busca as regras da etapa destino
    const targetStage = stages.find(s => s.name === stageName)
    if (targetStage && targetStage.required_fields && targetStage.required_fields.length > 0) {
      const missingFields: string[] = []
      targetStage.required_fields.forEach(field => {
        // Valida no lead padrão ou no JSONB custom_fields
        const val = (draggedLead as any)[field] || (draggedLead.custom_fields && draggedLead.custom_fields[field])
        if (!val || String(val).trim() === '') {
          missingFields.push(field)
        }
      })

      if (missingFields.length > 0) {
        setMissingFieldsAlert({ stageName, fields: missingFields })
        setDraggedLead(null)
        return
      }
    }

    // Optimistic update (Atualiza a tela instantaneamente)
    setLeads(prev => prev.map(lead =>
      lead.id === draggedLead.id ? { ...lead, stage: stageName } : lead
    ))

    // Atualiza no Supabase na coluna correta ('stage')
    const { error } = await supabase
      .from('leads')
      .update({ stage: stageName, updated_at: new Date().toISOString() })
      .eq('id', draggedLead.id)

    if (error) {
      console.error('Erro ao mover lead:', error)
      // Reverte a ação na tela caso dê erro no banco
      setLeads(prev => prev.map(lead =>
        lead.id === draggedLead.id ? draggedLead : lead
      ))
    } else {
      // Dispara a geração se houver campanhas na etapa destino
      checkAndTriggerGeneration(draggedLead, stageName)
      
      // Salva no log de atividades
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user && draggedLead.workspace_id) {
          supabase.from('lead_activity_logs').insert({
            workspace_id: draggedLead.workspace_id,
            lead_id: draggedLead.id,
            user_id: user.id,
            action: 'moved_stage',
            details: { from: draggedLead.stage, to: stageName }
          }).then()
        }
      })
    }

    setDraggedLead(null)
  }

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsModalOpen(true)
  }

  const handleCreateLead = () => {
    setSelectedLead(null)
    setIsModalOpen(true)
  }

  const handleLeadUpdate = (updatedLead: Lead) => {
    setLeads(prev => {
      const oldLead = prev.find(l => l.id === updatedLead.id)
      if (oldLead && oldLead.stage !== updatedLead.stage) {
        checkAndTriggerGeneration(updatedLead, updatedLead.stage)
      }
      return prev.map(lead =>
        lead.id === updatedLead.id ? updatedLead : lead
      )
    })
    setSelectedLead(updatedLead)
  }

  const handleLeadCreate = (newLead: Lead) => {
    setLeads(prev => [newLead, ...prev])
    setIsModalOpen(false)
    checkAndTriggerGeneration(newLead, newLead.stage)
  }

  const handleLeadDelete = (leadId: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== leadId))
    setIsModalOpen(false)
  }

  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      lead.name.toLowerCase().includes(term) ||
      (lead.company && lead.company.toLowerCase().includes(term)) ||
      (lead.email && lead.email.toLowerCase().includes(term))
    )
  })

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl font-black tracking-tight uppercase">Pipeline de Vendas</h2>
        
          <div className="flex w-full sm:w-auto items-center gap-4">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar lead, empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex shrink-0 items-center justify-center w-12 h-12 bg-white text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              title="Configurações do Workspace"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={handleCreateLead}
              className="flex shrink-0 items-center gap-2 h-12 px-6 bg-yellow-400 text-black border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Novo Lead</span>
            </button>
          </div>
        </div>

      <div className="flex gap-6 overflow-x-auto pb-8 snap-x flex-1">
        {stages.map(stage => {
          // Filtro atualizado para 'stage' e termo de busca
          const columnLeads = filteredLeads.filter(lead => lead.stage === stage.name)

          return (
            <div
              key={stage.id}
              className="shrink-0 w-80 snap-start"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.name)}
            >
              <div className={`${stage.color} border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 mb-6 rounded-none`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold uppercase text-sm tracking-widest ${stage.name === 'Desqualificado' ? 'text-white' : 'text-black'}`}>
                    {stage.name}
                  </h3>
                  <span className={`font-bold text-sm border-2 border-black bg-white px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                    {columnLeads.length}
                  </span>
                </div>
              </div>

              <div className="space-y-4 min-h-[500px] border-2 border-dashed border-gray-300 p-2 bg-gray-50/50">
                {columnLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onDragStart={() => handleDragStart(lead)}
                    onClick={() => handleLeadClick(lead)}
                    isDragging={draggedLead?.id === lead.id}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <LeadModal
        lead={selectedLead}
        stages={stages}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleLeadUpdate}
        onCreate={handleLeadCreate}
        onDelete={handleLeadDelete}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialStages={stages}
        activeWorkspaceId={activeWorkspaceId}
      />

      {missingFieldsAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setMissingFieldsAlert(null)} />
          <div className="relative bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full font-bold animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-xl uppercase tracking-tighter text-black">Ação Bloqueada</h3>
            </div>
            <p className="font-medium text-gray-700 mb-4">
              Para mover para a etapa <span className="bg-yellow-200 px-1 border-2 border-black inline-block mix-blend-multiply">{missingFieldsAlert.stageName}</span>, o lead precisa ter os seguintes campos preenchidos obrigatoriamente:
            </p>
            <ul className="mb-6 space-y-2">
              {missingFieldsAlert.fields.map(f => {
                // Traduzindo nomes comuns para a UI
                const labelMap: Record<string, string> = {
                  company: 'Empresa',
                  email: 'Email',
                  phone: 'Telefone',
                  job_title: 'Cargo',
                  linkedin_url: 'LinkedIn'
                }
                const label = labelMap[f] || f
                return (
                  <li key={f} className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500" />
                    <span className="uppercase text-sm border-2 border-black px-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-100">{label}</span>
                  </li>
                )
              })}
            </ul>
            <button 
              onClick={() => setMissingFieldsAlert(null)}
              className="w-full py-3 bg-black text-white hover:bg-gray-800 transition-colors border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm font-black uppercase tracking-widest"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}