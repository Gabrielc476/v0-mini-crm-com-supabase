'use client'

import { useState } from 'react'
import { Lead, LeadStage, LEAD_STAGE_CONFIG } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { LeadCard } from './lead-card'
import { LeadModal } from './lead-modal'
import { Plus } from 'lucide-react'

interface KanbanBoardProps {
  initialLeads: Lead[]
}

// Colunas atualizadas com as etapas reais do seu funil
const KANBAN_COLUMNS: LeadStage[] = [
  'Base',
  'Lead Mapeado',
  'Tentando Contato',
  'Conexão Iniciada',
  'Qualificado',
  'Reunião Agendada',
  'Desqualificado'
]

export function KanbanBoard({ initialLeads }: KanbanBoardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const supabase = createClient()

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Lógica de Drop atualizada para usar 'stage' em vez de 'status'
  const handleDrop = async (stage: LeadStage) => {
    if (!draggedLead || draggedLead.stage === stage) {
      setDraggedLead(null)
      return
    }

    // Optimistic update (Atualiza a tela instantaneamente)
    setLeads(prev => prev.map(lead =>
      lead.id === draggedLead.id ? { ...lead, stage } : lead
    ))

    // Atualiza no Supabase na coluna correta ('stage')
    const { error } = await supabase
      .from('leads')
      .update({ stage, updated_at: new Date().toISOString() })
      .eq('id', draggedLead.id)

    if (error) {
      console.error('Erro ao mover lead:', error)
      // Reverte a ação na tela caso dê erro no banco
      setLeads(prev => prev.map(lead =>
        lead.id === draggedLead.id ? draggedLead : lead
      ))
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
    setLeads(prev => prev.map(lead =>
      lead.id === updatedLead.id ? updatedLead : lead
    ))
    setSelectedLead(updatedLead)
  }

  const handleLeadCreate = (newLead: Lead) => {
    setLeads(prev => [newLead, ...prev])
    setIsModalOpen(false)
  }

  const handleLeadDelete = (leadId: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== leadId))
    setIsModalOpen(false)
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Pipeline de Vendas</h2>
        <button
          onClick={handleCreateLead}
          className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black border-4 border-black font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Lead
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
        {KANBAN_COLUMNS.map(stage => {
          const config = LEAD_STAGE_CONFIG[stage]
          // Filtro atualizado para 'stage'
          const columnLeads = leads.filter(lead => lead.stage === stage)

          return (
            <div
              key={stage}
              className="shrink-0 w-80 snap-start"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage)}
            >
              <div className={`${config.bgColor} border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 mb-6 rounded-none`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold uppercase text-sm tracking-widest ${config.color}`}>
                    {config.label}
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleLeadUpdate}
        onCreate={handleLeadCreate}
        onDelete={handleLeadDelete}
      />
    </div>
  )
}