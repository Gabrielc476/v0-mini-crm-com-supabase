'use client'

import { useState, useEffect } from 'react'
import { Campaign, LeadStage, FunnelStage } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { X, Trash2 } from 'lucide-react'

interface CampaignModalProps {
  campaign: Campaign | null
  stages: FunnelStage[]
  isOpen: boolean
  onClose: () => void
  onUpdate: (campaign: Campaign) => void
  onCreate: (campaign: Campaign) => void
  onDelete: (campaignId: string) => void
}

export function CampaignModal({
  campaign,
  stages,
  isOpen,
  onClose,
  onUpdate,
  onCreate,
  onDelete,
}: CampaignModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    context_description: '',
    prompt_instructions: '',
    trigger_stage: '' as LeadStage | '',
    is_active: true,
  })

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        context_description: campaign.context_description || '',
        prompt_instructions: campaign.prompt_instructions || '',
        trigger_stage: campaign.trigger_stage || '',
        is_active: campaign.is_active,
      })
    } else {
      setFormData({
        name: '',
        context_description: '',
        prompt_instructions: '',
        trigger_stage: '',
        is_active: true,
      })
    }
  }, [campaign])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const payload = {
      name: formData.name,
      context_description: formData.context_description || null,
      prompt_instructions: formData.prompt_instructions || null,
      trigger_stage: formData.trigger_stage || null,
      is_active: formData.is_active,
    }

    if (campaign) {
      // Update existing campaign
      const { data, error } = await supabase
        .from('campaigns')
        .update({
          ...payload,
        })
        .eq('id', campaign.id)
        .select()
        .single()

      if (!error && data) {
        onUpdate(data)
      } else {
        console.error('Erro ao atualizar campanha:', error)
      }
    } else {
      // Create new campaign: Buscar o workspace_id primeiro
      const { data: workspaceData, error: wsError } = await supabase
        .from('user_workspaces')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single()

      if (wsError || !workspaceData) {
        console.error('Erro ao buscar workspace do usuário:', wsError)
        setSaving(false)
        return
      }

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          ...payload,
          workspace_id: workspaceData.workspace_id
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar campanha:', error)
      }
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />

      <div className="relative neo-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-background">
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <h2 className="text-xl font-bold">
            {campaign ? 'Detalhes da Campanha' : 'Nova Campanha'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors border-2 border-transparent hover:border-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="space-y-2">
              <label className="block text-sm font-bold uppercase tracking-wide">
                Nome da Campanha *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                placeholder="Ex: Black Friday 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold uppercase tracking-wide">
                Contexto (Oferta/Produto)
              </label>
              <textarea
                value={formData.context_description}
                onChange={(e) => setFormData(prev => ({ ...prev, context_description: e.target.value }))}
                rows={3}
                placeholder="Ex: Estamos oferecendo 50% de desconto na primeira assinatura..."
                className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent resize-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold uppercase tracking-wide">
                Instruções de Prompt / Persona da IA
              </label>
              <textarea
                value={formData.prompt_instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, prompt_instructions: e.target.value }))}
                rows={3}
                placeholder="Ex: Escreva de forma descontraída, como um consultor sênior. Use emojis."
                className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent resize-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wide">
                  Etapa Gatilho (Opcional)
                </label>
                <select
                  value={formData.trigger_stage}
                  onChange={(e) => setFormData(prev => ({ ...prev, trigger_stage: e.target.value as LeadStage | '' }))}
                  className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <option value="">Nenhum gatilho</option>
                  {stages && stages.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wide">
                  Status da Campanha
                </label>
                <select
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                  className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <option value="true">🟢 Ativa</option>
                  <option value="false">🔴 Inativa</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t-4 border-black mt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 mt-4 py-3 px-4 bg-green-400 text-black border-4 border-black font-bold uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
              >
                {saving ? 'Salvando...' : campaign ? 'Salvar Alterações' : 'Criar Campanha'}
              </button>

              {campaign && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="mt-4 py-3 px-4 bg-red-400 text-black border-4 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}