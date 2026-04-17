'use client'

import { useState, useEffect } from 'react'
import { Lead, GeneratedMessage } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { X, Trash2, Mail, MessageCircle, Linkedin, Sparkles, Copy, Check, Loader2 } from 'lucide-react'

interface LeadModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (lead: Lead) => void
  onCreate: (lead: Lead) => void
  onDelete: (leadId: string) => void
}

export function LeadModal({ lead, isOpen, onClose, onUpdate, onCreate, onDelete }: LeadModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '', // Corrigido de position para job_title
    linkedin_url: '',
    stage: 'Base', // Corrigido de status para stage
    notes: '',
  })

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Estados para a IA e Campanhas
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [generatingMessage, setGeneratingMessage] = useState(false)
  const [generatedMessages, setGeneratedMessages] = useState<any[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name,
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        job_title: lead.job_title || '',
        linkedin_url: lead.linkedin_url || '',
        stage: lead.stage || 'Base',
        notes: lead.notes || '',
      })
      loadMessages(lead.id)
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        job_title: '',
        linkedin_url: '',
        stage: 'Base',
        notes: '',
      })
      setGeneratedMessages([])
    }

    // Carrega as campanhas disponíveis sempre que o modal abre
    const loadCampaigns = async () => {
      const { data } = await supabase.from('campaigns').select('*').eq('is_active', true)
      if (data) {
        setCampaigns(data)
        if (data.length > 0) setSelectedCampaign(data[0].id)
      }
    }

    if (isOpen) {
      loadCampaigns()
    }
  }, [lead, isOpen])

  const loadMessages = async (leadId: string) => {
    const { data } = await supabase
      .from('generated_messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (data) {
      setGeneratedMessages(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (!user) {
      console.error('Usuário não autenticado')
      setSaving(false)
      return
    }

    // Preparar o Payload exato que o banco espera
    const payload = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      company: formData.company || null,
      job_title: formData.job_title || null,
      linkedin_url: formData.linkedin_url || null,
      stage: formData.stage,
      notes: formData.notes || null,
    }

    if (lead) {
      // Update existing lead
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)
        .select()
        .single()

      if (!error && data) {
        onUpdate(data)
      } else {
        console.error('Erro ao atualizar:', error)
      }
    } else {
      // Create new lead
      // Precisamos buscar o workspace_id do usuário primeiro
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
        .from('leads')
        .insert({
          ...payload,
          workspace_id: workspaceData.workspace_id // Inserindo o vínculo obrigatório
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating lead:', error)
      }
      if (!error && data) {
        onCreate(data)
      }
    }

    setSaving(false)
  }

  const handleDelete = async () => {
    if (!lead || !confirm('Tem certeza que deseja excluir este lead?')) return

    setDeleting(true)
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', lead.id)

    if (!error) {
      onDelete(lead.id)
    }
    setDeleting(false)
  }

  const generateMessage = async () => {
    if (!lead || !selectedCampaign) return

    setGeneratingMessage(true)

    try {
      // Chama a NOSSA Edge Function real no Supabase
      const { data, error } = await supabase.functions.invoke('generate-message', {
        body: {
          lead_id: lead.id,
          campaign_id: selectedCampaign
        }
      })

      if (error) throw error

      if (data?.success) {
        // As mensagens já foram salvas no banco pela Edge Function!
        // Só precisamos recarregar a lista para exibir na tela.
        await loadMessages(lead.id)
      }
    } catch (error) {
      console.error('Erro ao gerar mensagem na IA:', error)
      alert('Falha ao gerar mensagens. Verifique os logs da Edge Function.')
    }

    setGeneratingMessage(false)
  }

  const copyToClipboard = async (message: any) => {
    await navigator.clipboard.writeText(message.content)
    setCopiedId(message.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />

      <div className="relative neo-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-background">
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <h2 className="text-xl font-bold">
            {lead ? 'Detalhes do Lead' : 'Novo Lead'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors border-2 border-transparent hover:border-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wide">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wide">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wide">
                  Empresa
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wide">
                  Cargo
                </label>
                <input
                  type="text"
                  value={formData.job_title} // CORRIGIDO AQUI
                  onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                  className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wide">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                  className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="col-span-2 space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wide">
                  Etapa do Funil
                </label>
                <select
                  value={formData.stage} // CORRIGIDO AQUI
                  onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value }))}
                  className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  {/* Fallback de opções caso o config do v0 não tenha sido atualizado */}
                  <option value="Base">Base</option>
                  <option value="Lead Mapeado">Lead Mapeado</option>
                  <option value="Tentando Contato">Tentando Contato</option>
                  <option value="Conexão Iniciada">Conexão Iniciada</option>
                  <option value="Desqualificado">Desqualificado</option>
                  <option value="Qualificado">Qualificado</option>
                  <option value="Reunião Agendada">Reunião Agendada</option>
                </select>
              </div>

              <div className="col-span-2 space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wide">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent resize-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 px-4 bg-yellow-400 text-black border-4 border-black font-bold uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
              >
                {saving ? 'Salvando...' : lead ? 'Salvar Alterações' : 'Criar Lead'}
              </button>

              {lead && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="py-3 px-4 bg-red-400 text-black border-4 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>

          {/* SESSÃO DE INTELIGÊNCIA ARTIFICIAL */}
          {lead && (
            <div className="mt-8 pt-6 border-t-4 border-black">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Gerar Mensagem com IA
              </h3>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="flex-1 px-4 py-3 border-4 border-black rounded-none bg-white font-bold focus:outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <option value="" disabled>1. Selecione uma Campanha...</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <button
                  onClick={generateMessage}
                  disabled={generatingMessage || !selectedCampaign}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-400 text-black border-4 border-black font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingMessage ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Pensando...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Gerar</>
                  )}
                </button>
              </div>

              {generatedMessages.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                    Histórico de Mensagens
                  </h4>
                  {generatedMessages.map(message => (
                    <div key={message.id} className="p-4 bg-blue-50 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center justify-between mb-3 border-b-2 border-black/10 pb-2">
                        <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                          <MessageCircle className="w-4 h-4" />
                          Sugestão IA
                        </span>
                        <button
                          onClick={() => copyToClipboard(message)}
                          className="flex items-center gap-2 px-3 py-1 bg-white border-2 border-black font-bold text-xs hover:bg-gray-100 transition-colors"
                        >
                          {copiedId === message.id ? (
                            <><Check className="w-3 h-3 text-green-600" /> Copiado</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Copiar</>
                          )}
                        </button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap font-medium">{message.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}