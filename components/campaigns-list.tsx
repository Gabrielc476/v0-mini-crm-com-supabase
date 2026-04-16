'use client'

import { useState } from 'react'
import { Campaign, CAMPAIGN_STATUS_CONFIG, Lead } from '@/lib/types'
import { CampaignModal } from './campaign-modal'
import { Plus, Calendar, Users } from 'lucide-react'

interface CampaignsListProps {
  initialCampaigns: Campaign[]
  availableLeads: Pick<Lead, 'id' | 'name' | 'company'>[]
}

export function CampaignsList({ initialCampaigns, availableLeads }: CampaignsListProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setIsModalOpen(true)
  }

  const handleCreateCampaign = () => {
    setSelectedCampaign(null)
    setIsModalOpen(true)
  }

  const handleCampaignUpdate = (updatedCampaign: Campaign) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === updatedCampaign.id ? updatedCampaign : campaign
    ))
    setSelectedCampaign(updatedCampaign)
  }

  const handleCampaignCreate = (newCampaign: Campaign) => {
    setCampaigns(prev => [newCampaign, ...prev])
    setIsModalOpen(false)
  }

  const handleCampaignDelete = (campaignId: string) => {
    setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId))
    setIsModalOpen(false)
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
        <button
          onClick={handleCreateCampaign}
          className="flex items-center gap-2 px-4 py-3 bg-accent text-accent-foreground font-bold neo-button rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Nova Campanha
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="neo-card p-12 rounded-lg text-center">
          <div className="w-16 h-16 bg-muted neo-border rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-2">Nenhuma campanha ainda</h3>
          <p className="text-muted-foreground mb-6">
            Crie sua primeira campanha para organizar seus leads
          </p>
          <button
            onClick={handleCreateCampaign}
            className="inline-flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-bold neo-button rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Criar Campanha
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(campaign => {
            const statusConfig = CAMPAIGN_STATUS_CONFIG[campaign.status]
            return (
              <div
                key={campaign.id}
                onClick={() => handleCampaignClick(campaign)}
                className="neo-card p-6 rounded-lg cursor-pointer hover:-translate-y-1 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold">{campaign.name}</h3>
                  <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded neo-border-sm ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>

                {campaign.description && (
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {campaign.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Criada em {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CampaignModal
        campaign={selectedCampaign}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleCampaignUpdate}
        onCreate={handleCampaignCreate}
        onDelete={handleCampaignDelete}
        availableLeads={availableLeads}
      />
    </div>
  )
}
