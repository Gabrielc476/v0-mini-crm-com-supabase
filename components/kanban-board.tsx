'use client'

import { useState } from 'react'
import { Lead, LeadStatus, LEAD_STATUS_CONFIG } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { LeadCard } from './lead-card'
import { LeadModal } from './lead-modal'
import { Plus } from 'lucide-react'

interface KanbanBoardProps {
  initialLeads: Lead[]
}

const KANBAN_COLUMNS: LeadStatus[] = ['novo', 'contactado', 'qualificado', 'proposta', 'ganho', 'perdido']

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

  const handleDrop = async (status: LeadStatus) => {
    if (!draggedLead || draggedLead.status === status) {
      setDraggedLead(null)
      return
    }

    // Optimistic update
    setLeads(prev => prev.map(lead => 
      lead.id === draggedLead.id ? { ...lead, status } : lead
    ))

    const { error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', draggedLead.id)

    if (error) {
      // Revert on error
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Pipeline de Vendas</h2>
        <button
          onClick={handleCreateLead}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground font-bold neo-button rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Lead
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(status => {
          const config = LEAD_STATUS_CONFIG[status]
          const columnLeads = leads.filter(lead => lead.status === status)

          return (
            <div
              key={status}
              className="flex-shrink-0 w-72"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(status)}
            >
              <div className={`${config.bgColor} neo-border rounded-lg p-3 mb-3`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold uppercase text-sm tracking-wide ${config.color}`}>
                    {config.label}
                  </h3>
                  <span className={`${config.color} font-bold text-sm neo-border-sm bg-background px-2 py-0.5 rounded`}>
                    {columnLeads.length}
                  </span>
                </div>
              </div>

              <div className="space-y-3 min-h-96">
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
