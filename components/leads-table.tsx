'use client'

import { useState } from 'react'
import { Lead, LEAD_STATUS_CONFIG } from '@/lib/types'
import { LeadModal } from './lead-modal'
import { Plus, Search } from 'lucide-react'

interface LeadsTableProps {
  initialLeads: Lead[]
}

export function LeadsTable({ initialLeads }: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 neo-border-sm rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <button
          onClick={handleCreateLead}
          className="flex items-center gap-2 px-4 py-3 bg-accent text-accent-foreground font-bold neo-button rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Novo Lead
        </button>
      </div>

      <div className="neo-card rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted">
              <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide border-b-3 border-foreground">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide border-b-3 border-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide border-b-3 border-foreground">
                Empresa
              </th>
              <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide border-b-3 border-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide border-b-3 border-foreground">
                Criado em
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhum lead encontrado
                </td>
              </tr>
            ) : (
              filteredLeads.map(lead => {
                const statusConfig = LEAD_STATUS_CONFIG[lead.status]
                return (
                  <tr
                    key={lead.id}
                    onClick={() => handleLeadClick(lead)}
                    className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-4 font-bold">{lead.name}</td>
                    <td className="px-4 py-4 text-muted-foreground">{lead.email || '-'}</td>
                    <td className="px-4 py-4">{lead.company || '-'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wide rounded neo-border-sm ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
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
