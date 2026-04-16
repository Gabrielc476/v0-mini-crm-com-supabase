'use client'

import { useState, useEffect } from 'react'
import { Campaign, CampaignStatus, Lead, CAMPAIGN_STATUS_CONFIG } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { X, Trash2, UserPlus, UserMinus } from 'lucide-react'

interface CampaignModalProps {
  campaign: Campaign | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (campaign: Campaign) => void
  onCreate: (campaign: Campaign) => void
  onDelete: (campaignId: string) => void
  availableLeads: Pick<Lead, 'id' | 'name' | 'company'>[]
}

export function CampaignModal({ 
  campaign, 
  isOpen, 
  onClose, 
  onUpdate, 
  onCreate, 
  onDelete,
  availableLeads 
}: CampaignModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'rascunho' as CampaignStatus,
  })
  const [campaignLeads, setCampaignLeads] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description || '',
        status: campaign.status,
      })
      loadCampaignLeads(campaign.id)
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'rascunho',
      })
      setCampaignLeads([])
    }
  }, [campaign])

  const loadCampaignLeads = async (campaignId: string) => {
    const { data } = await supabase
      .from('campaign_leads')
      .select('lead_id')
      .eq('campaign_id', campaignId)

    if (data) {
      setCampaignLeads(data.map(cl => cl.lead_id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    if (campaign) {
      // Update existing campaign
      const { data, error } = await supabase
        .from('campaigns')
        .update({
          ...formData,
          description: formData.description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaign.id)
        .select()
        .single()

      if (!error && data) {
        onUpdate(data)
      }
    } else {
      // Create new campaign
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          ...formData,
          user_id: user.id,
          description: formData.description || null,
        })
        .select()
        .single()

      if (!error && data) {
        onCreate(data)
      }
    }

    setSaving(false)
  }

  const handleDelete = async () => {
    if (!campaign || !confirm('Tem certeza que deseja excluir esta campanha?')) return
    
    setDeleting(true)
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaign.id)

    if (!error) {
      onDelete(campaign.id)
    }
    setDeleting(false)
  }

  const toggleLeadInCampaign = async (leadId: string) => {
    if (!campaign) return

    const isInCampaign = campaignLeads.includes(leadId)

    if (isInCampaign) {
      // Remove lead from campaign
      const { error } = await supabase
        .from('campaign_leads')
        .delete()
        .eq('campaign_id', campaign.id)
        .eq('lead_id', leadId)

      if (!error) {
        setCampaignLeads(prev => prev.filter(id => id !== leadId))
      }
    } else {
      // Add lead to campaign
      const { error } = await supabase
        .from('campaign_leads')
        .insert({
          campaign_id: campaign.id,
          lead_id: leadId,
        })

      if (!error) {
        setCampaignLeads(prev => [...prev, leadId])
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      
      <div className="relative neo-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b-3 border-foreground">
          <h2 className="text-xl font-bold">
            {campaign ? 'Detalhes da Campanha' : 'Nova Campanha'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold uppercase tracking-wide">
                Nome da Campanha *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 neo-border-sm rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold uppercase tracking-wide">
                Descricao
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 neo-border-sm rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold uppercase tracking-wide">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as CampaignStatus }))}
                className="w-full px-4 py-3 neo-border-sm rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {Object.entries(CAMPAIGN_STATUS_CONFIG).map(([status, config]) => (
                  <option key={status} value={status}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-bold uppercase tracking-wide neo-button rounded-lg disabled:opacity-50"
              >
                {saving ? 'Salvando...' : campaign ? 'Salvar' : 'Criar Campanha'}
              </button>

              {campaign && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="py-3 px-4 bg-destructive text-destructive-foreground font-bold neo-button rounded-lg disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>

          {campaign && (
            <div className="mt-8 pt-6 border-t-3 border-foreground">
              <h3 className="text-lg font-bold mb-4">Leads na Campanha</h3>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableLeads.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum lead disponivel. Crie leads primeiro.
                  </p>
                ) : (
                  availableLeads.map(lead => {
                    const isInCampaign = campaignLeads.includes(lead.id)
                    return (
                      <div
                        key={lead.id}
                        className={`flex items-center justify-between p-3 rounded-lg neo-border-sm ${
                          isInCampaign ? 'bg-accent/20' : 'bg-muted'
                        }`}
                      >
                        <div>
                          <p className="font-bold">{lead.name}</p>
                          {lead.company && (
                            <p className="text-sm text-muted-foreground">{lead.company}</p>
                          )}
                        </div>
                        <button
                          onClick={() => toggleLeadInCampaign(lead.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            isInCampaign 
                              ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' 
                              : 'bg-accent/10 text-accent hover:bg-accent/20'
                          }`}
                        >
                          {isInCampaign ? (
                            <UserMinus className="w-5 h-5" />
                          ) : (
                            <UserPlus className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                {campaignLeads.length} lead{campaignLeads.length !== 1 ? 's' : ''} nesta campanha
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
