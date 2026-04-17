'use client'

import { useState, useEffect } from 'react'
import { Lead, FunnelStage } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useAIGeneration } from '@/contexts/ai-generation-context'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { X, Trash2, MessageCircle, Sparkles, Copy, Check, Loader2, User, History, AlertTriangle } from 'lucide-react'

interface LeadModalProps {
  lead: Lead | null
  stages: FunnelStage[]
  isOpen: boolean
  onClose: () => void
  onUpdate: (lead: Lead) => void
  onCreate: (lead: Lead) => void
  onDelete: (leadId: string) => void
  activeWorkspaceId: string
}

export function LeadModal({ lead, stages, isOpen, onClose, onUpdate, onCreate, onDelete, activeWorkspaceId }: LeadModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    linkedin_url: '',
    stage: 'Base',
    notes: '',
  })

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState('edit')

  // Estados para a IA e Campanhas
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [generatedMessages, setGeneratedMessages] = useState<any[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [missingFieldsAlert, setMissingFieldsAlert] = useState<{stageName: string, fields: string[]} | null>(null)

  const supabase = createClient()
  const { startGeneration, tasks } = useAIGeneration()

  // Verifica se está gerando para este lead
  const isGeneratingForThisLead = lead ? tasks.some(t => t.leadId === lead.id && t.status === 'generating') : false

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
      loadLogs(lead.id)
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
      setActivityLogs([])
      setActiveTab('edit')
    }

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

  // Recarrega mensagens quando uma geração termina para este lead
  useEffect(() => {
    if (!lead) return
    
    const completedTask = tasks.find(t => t.leadId === lead.id && t.status === 'success')
    if (completedTask) {
      loadMessages(lead.id)
    }
  }, [tasks, lead])

  const loadMessages = async (leadId: string) => {
    setLoadingMessages(true)
    const { data } = await supabase
      .from('generated_messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (data) {
      setGeneratedMessages(data)
    }
    setLoadingMessages(false)
  }

  const loadLogs = async (leadId: string) => {
    setLoadingLogs(true)
    const { data } = await supabase
      .from('lead_activity_logs')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (data) {
      setActivityLogs(data)
    }
    setLoadingLogs(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('Usuário não autenticado')
      setSaving(false)
      return
    }

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

    // Validação de Campos Obrigatórios de acordo com a Etapa
    const targetStage = stages.find(s => s.name === formData.stage)
    if (targetStage && targetStage.required_fields && targetStage.required_fields.length > 0) {
      const missingFields: string[] = []
      targetStage.required_fields.forEach(field => {
        const val = (payload as any)[field]
        if (!val || String(val).trim() === '') {
          missingFields.push(field)
        }
      })

      if (missingFields.length > 0) {
        setMissingFieldsAlert({ stageName: formData.stage, fields: missingFields })
        setSaving(false)
        return
      }
    }

    if (lead) {
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
        // Log de atualização
        const changedFields = Object.keys(payload).filter(k => (payload as any)[k] !== (lead as any)[k])
        if (changedFields.length > 0) {
          supabase.from('lead_activity_logs').insert({
            workspace_id: data.workspace_id,
            lead_id: data.id,
            user_id: user.id,
            action: 'updated_fields',
            details: { fields: changedFields }
          }).then()
        }
        onUpdate(data)
        loadLogs(data.id) // atualiza log local
      } else {
        console.error('Erro ao atualizar:', error)
      }
    } else {
      const payloadFinal = {
        ...payload,
        workspace_id: activeWorkspaceId,
        user_id: user.id
      }
      
      console.log("[DEBUG] Payload final tentando inserir Lead:", payloadFinal)

      const { data, error } = await supabase
        .from('leads')
        .insert(payloadFinal)
        .select()
        .single()

      if (!error && data) {
        onCreate(data)
      } else {
        console.error('Error creating lead no supabase (RLS?):', error)
        alert(`Falha no banco ao criar lead: ${error?.message}`)
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

  const handleGenerateMessage = () => {
    if (!lead || !selectedCampaign) return

    const campaign = campaigns.find(c => c.id === selectedCampaign)
    startGeneration(lead.id, lead.name, selectedCampaign, campaign?.name || 'Campanha')
  }

  const copyToClipboard = async (message: any) => {
    await navigator.clipboard.writeText(message.content)
    setCopiedId(message.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleMarkAsSent = async (message: any) => {
    const { error } = await supabase
      .from('generated_messages')
      .update({ status: 'enviada' })
      .eq('id', message.id)

    if (!error) {
      setGeneratedMessages(prev => prev.map(m => m.id === message.id ? { ...m, status: 'enviada' } : m))
      
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user && lead?.workspace_id) {
          supabase.from('lead_activity_logs').insert({
            workspace_id: lead.workspace_id,
            lead_id: lead.id,
            user_id: user.id,
            action: 'message_sent',
            details: { message_id: message.id }
          }).then(() => loadLogs(lead.id))
        }
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />

      <div className="relative neo-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-background">
        <div className="flex items-center justify-between p-6 border-b-4 border-black">
          <h2 className="text-xl font-bold">
            {lead ? lead.name : 'Novo Lead'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors border-2 border-transparent hover:border-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {lead ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4">
              <TabsList className="w-full grid grid-cols-3 border-4 border-black bg-gray-100 p-1 h-auto rounded-none">
                <TabsTrigger 
                  value="edit" 
                  className="flex items-center justify-center gap-2 py-3 px-2 font-bold uppercase text-xs sm:text-sm data-[state=active]:bg-yellow-400 data-[state=active]:shadow-none rounded-none border-2 border-transparent data-[state=active]:border-black"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Editar</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="messages" 
                  className="flex items-center justify-center gap-2 py-3 px-2 font-bold uppercase text-xs sm:text-sm data-[state=active]:bg-purple-400 data-[state=active]:shadow-none rounded-none border-2 border-transparent data-[state=active]:border-black"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Mensagens</span>
                  {generatedMessages.length > 0 && (
                    <span className="px-2 py-0.5 bg-black text-white text-[10px] rounded-full">
                      {generatedMessages.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="flex items-center justify-center gap-2 py-3 px-2 font-bold uppercase text-xs sm:text-sm data-[state=active]:bg-blue-300 data-[state=active]:shadow-none rounded-none border-2 border-transparent data-[state=active]:border-black"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">Histórico</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="edit" className="flex-1 overflow-y-auto p-6 pt-4">
              <LeadForm
                formData={formData}
                setFormData={setFormData}
                stages={stages}
                onSubmit={handleSubmit}
                saving={saving}
                deleting={deleting}
                onDelete={handleDelete}
                isEditing={true}
              />

              {/* Seção de Geração de Mensagem */}
              <div className="mt-6 pt-6 border-t-4 border-black">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Gerar Mensagem com IA
                </h3>

                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                    className="flex-1 px-4 py-3 border-4 border-black rounded-none bg-white font-bold focus:outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <option value="" disabled>Selecione uma Campanha...</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleGenerateMessage}
                    disabled={isGeneratingForThisLead || !selectedCampaign}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-400 text-black border-4 border-black font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingForThisLead ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Gerando...</>
                    ) : (
                      <><Sparkles className="w-5 h-5" /> Gerar</>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  A geração ocorre em segundo plano. Você pode fechar este modal e continuar trabalhando.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="flex-1 overflow-y-auto p-6 pt-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : generatedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-bold">Nenhuma mensagem gerada</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Vá para a aba &quot;Editar Lead&quot; e use a IA para gerar mensagens.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generatedMessages.map(message => (
                    <div key={message.id} className="p-4 bg-blue-50 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center justify-between mb-3 border-b-2 border-black/10 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                            <MessageCircle className="w-4 h-4" />
                            Sugestão IA
                          </span>
                          <span className={`text-[10px] uppercase font-black px-2 py-0.5 border-2 border-black ${message.status === 'enviada' ? 'bg-green-400' : 'bg-white'}`}>
                            {message.status === 'enviada' ? 'Enviada' : 'Pendente'}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(message.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {message.status !== 'enviada' && (
                            <button
                              onClick={() => handleMarkAsSent(message)}
                              className="flex items-center gap-2 px-3 py-1 bg-green-400 border-2 border-black font-bold text-xs hover:bg-green-500 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                            >
                              <Check className="w-3 h-3" /> Concluir
                            </button>
                          )}
                          <button
                            onClick={() => copyToClipboard(message)}
                            className="flex items-center gap-2 px-3 py-1 bg-white border-2 border-black font-bold text-xs hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          >
                            {copiedId === message.id ? (
                              <><Check className="w-3 h-3 text-green-600" /> Copiado</>
                            ) : (
                              <><Copy className="w-3 h-3" /> Copiar</>
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap font-medium">{message.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-y-auto p-6 pt-4">
              {loadingLogs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-bold">Nenhum evento registrado</p>
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                  {activityLogs.map((log, i) => (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        {log.action === 'moved_stage' && <span className="text-blue-500 font-bold">»</span>}
                        {log.action === 'updated_fields' && <User className="w-4 h-4" />}
                        {log.action === 'message_sent' && <MessageCircle className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-sm uppercase">
                            {log.action === 'moved_stage' ? 'Moveu de Etapa' :
                             log.action === 'updated_fields' ? 'Atualizou lead' :
                             log.action === 'message_sent' ? 'Mensagem Enviada' : log.action}
                          </div>
                          <time className="text-xs font-bold text-gray-500">
                            {new Date(log.created_at).toLocaleDateString()}
                          </time>
                        </div>
                        <div className="text-gray-600 text-sm font-medium">
                          {log.action === 'moved_stage' && (
                            <span>Moveu de <b>{log.details?.from}</b> para <b>{log.details?.to}</b></span>
                          )}
                          {log.action === 'updated_fields' && (
                            <span>Campos: {(log.details?.fields || []).join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <LeadForm
              formData={formData}
              setFormData={setFormData}
              stages={stages}
              onSubmit={handleSubmit}
              saving={saving}
              deleting={deleting}
              onDelete={handleDelete}
              isEditing={false}
            />
          </div>
        )}
      </div>
      
      {/* Alerta Neo-brutalista de Campos Faltando */}
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
              type="button"
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

// Componente de formulário extraído para reutilização
interface LeadFormProps {
  formData: {
    name: string
    email: string
    phone: string
    company: string
    job_title: string
    linkedin_url: string
    stage: string
    notes: string
  }
  setFormData: (fn: (prev: any) => any) => void
  stages?: FunnelStage[]
  onSubmit: (e: React.FormEvent) => void
  saving: boolean
  deleting: boolean
  onDelete: () => void
  isEditing: boolean
}
  
  function LeadForm({ formData, setFormData, stages, onSubmit, saving, deleting, onDelete, isEditing }: LeadFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <label className="block text-sm font-bold uppercase tracking-wide">
            Nome *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
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
            onChange={(e) => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
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
            onChange={(e) => setFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
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
            onChange={(e) => setFormData((prev: any) => ({ ...prev, company: e.target.value }))}
            className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold uppercase tracking-wide">
            Cargo
          </label>
          <input
            type="text"
            value={formData.job_title}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, job_title: e.target.value }))}
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
            onChange={(e) => setFormData((prev: any) => ({ ...prev, linkedin_url: e.target.value }))}
            className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        <div className="col-span-2 space-y-2">
          <label className="block text-sm font-bold uppercase tracking-wide">
            Etapa do Funil
          </label>
          <select
            value={formData.stage}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, stage: e.target.value }))}
            className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            {stages && stages.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2 space-y-2">
          <label className="block text-sm font-bold uppercase tracking-wide">
            Notas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
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
          {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Lead'}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="py-3 px-4 bg-red-400 text-black border-4 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </form>
  )
}
