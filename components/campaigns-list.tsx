'use client'

import { useState } from 'react'
import { Campaign } from '@/lib/types'
import { CampaignModal } from './campaign-modal'
import { Plus, Calendar, Megaphone } from 'lucide-react'

// Removemos o availableLeads daqui
interface CampaignsListProps {
  initialCampaigns: Campaign[]
}

export function CampaignsList({ initialCampaigns }: CampaignsListProps) {
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
      <div className="flex items-center justify-end mb-8">
        <button
          onClick={handleCreateCampaign}
          className="flex items-center gap-2 px-6 py-3 bg-purple-400 text-black border-4 border-black font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <Plus className="w-5 h-5" />
          Nova Campanha
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 rounded-none text-center">
          <div className="w-16 h-16 bg-yellow-200 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-black" />
          </div>
          <h3 className="text-xl font-bold mb-2">Nenhuma campanha criada</h3>
          <p className="text-gray-600 font-medium mb-6">
            Crie sua primeira campanha para dar contexto à Inteligência Artificial.
          </p>
          <button
            onClick={handleCreateCampaign}
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black border-4 border-black font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Plus className="w-5 h-5" />
            Criar Campanha
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              onClick={() => handleCampaignClick(campaign)}
              className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 rounded-none cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col"
            >
              <div className="flex items-start justify-between mb-4 gap-2">
                <h3 className="text-lg font-bold leading-tight">{campaign.name}</h3>
                {/* Lógica do status atualizada para is_active */}
                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border-2 border-black whitespace-nowrap ${campaign.is_active ? 'bg-green-300 text-black' : 'bg-red-300 text-black'
                  }`}>
                  {campaign.is_active ? 'Ativa' : 'Inativa'}
                </span>
              </div>

              {/* Atualizado para context_description */}
              {campaign.context_description && (
                <p className="text-gray-600 font-medium text-sm mb-6 flex-1 line-clamp-3">
                  {campaign.context_description}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide pt-4 border-t-2 border-black/10">
                <Calendar className="w-4 h-4" />
                <span>
                  Criada em {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Removemos o availableLeads da chamada do Modal */}
      <CampaignModal
        campaign={selectedCampaign}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleCampaignUpdate}
        onCreate={handleCampaignCreate}
        onDelete={handleCampaignDelete}
      />
    </div>
  )
}