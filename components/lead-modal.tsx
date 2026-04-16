'use client'

import { useState, useEffect } from 'react'
import { Lead, LeadStatus, MessageType, GeneratedMessage, LEAD_STATUS_CONFIG } from '@/lib/types'
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

const MESSAGE_TYPES: { type: MessageType; label: string; icon: typeof Mail }[] = [
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { type: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
]

export function LeadModal({ lead, isOpen, onClose, onUpdate, onCreate, onDelete }: LeadModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    linkedin_url: '',
    status: 'novo' as LeadStatus,
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [generatingMessage, setGeneratingMessage] = useState<MessageType | null>(null)
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name,
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        position: lead.position || '',
        linkedin_url: lead.linkedin_url || '',
        status: lead.status,
        notes: lead.notes || '',
      })
      loadMessages(lead.id)
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        linkedin_url: '',
        status: 'novo',
        notes: '',
      })
      setGeneratedMessages([])
    }
  }, [lead])

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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    if (lead) {
      // Update existing lead
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...formData,
          email: formData.email || null,
          phone: formData.phone || null,
          company: formData.company || null,
          position: formData.position || null,
          linkedin_url: formData.linkedin_url || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)
        .select()
        .single()

      if (!error && data) {
        onUpdate(data)
      }
    } else {
      // Create new lead
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...formData,
          user_id: user.id,
          email: formData.email || null,
          phone: formData.phone || null,
          company: formData.company || null,
          position: formData.position || null,
          linkedin_url: formData.linkedin_url || null,
          notes: formData.notes || null,
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

  const generateMessage = async (messageType: MessageType) => {
    if (!lead) return

    setGeneratingMessage(messageType)

    try {
      const response = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          leadName: lead.name,
          leadCompany: lead.company,
          leadPosition: lead.position,
          messageType,
        }),
      })

      if (response.ok) {
        const newMessage = await response.json()
        setGeneratedMessages(prev => [newMessage, ...prev])
      }
    } catch (error) {
      console.error('Error generating message:', error)
    }

    setGeneratingMessage(null)
  }

  const copyToClipboard = async (message: GeneratedMessage) => {
    await navigator.clipboard.writeText(message.content)
    setCopiedId(message.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      
      <div className="relative neo-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b-3 border-foreground">
          <h2 className="text-xl font-bold">
            {lead ? 'Detalhes do Lead' : 'Novo Lead'}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wide">
                  Nome *
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
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 neo-border-sm rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
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
                  className="w-full px-4 py-3 neo-border-sm rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
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
                  className="w-full px-4 py-3 neo-border-sm rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wide">
                  Cargo
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-4 py-3 neo-border-sm rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
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
                  className="w-full px-4 py-3 neo-border-sm rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="col-span-2 space-y-2">
                <label className="block text-sm font-bold uppercase tracking-wide">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as LeadStatus }))}
                  className="w-full px-4 py-3 neo-border-sm rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {Object.entries(LEAD_STATUS_CONFIG).map(([status, config]) => (
                    <option key={status} value={status}>
                      {config.label}
                    </option>
                  ))}
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
                  className="w-full px-4 py-3 neo-border-sm rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-bold uppercase tracking-wide neo-button rounded-lg disabled:opacity-50"
              >
                {saving ? 'Salvando...' : lead ? 'Salvar' : 'Criar Lead'}
              </button>

              {lead && (
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

          {lead && (
            <div className="mt-8 pt-6 border-t-3 border-foreground">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Gerar Mensagem com IA
              </h3>

              <div className="flex gap-3 mb-6">
                {MESSAGE_TYPES.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => generateMessage(type)}
                    disabled={generatingMessage !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground font-bold neo-button rounded-lg disabled:opacity-50"
                  >
                    {generatingMessage === type ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    {label}
                  </button>
                ))}
              </div>

              {generatedMessages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    Mensagens Geradas
                  </h4>
                  {generatedMessages.map(message => {
                    const msgConfig = MESSAGE_TYPES.find(t => t.type === message.message_type)
                    const Icon = msgConfig?.icon || Mail

                    return (
                      <div key={message.id} className="neo-card p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
                            <Icon className="w-4 h-4" />
                            {msgConfig?.label}
                          </span>
                          <button
                            onClick={() => copyToClipboard(message)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                          >
                            {copiedId === message.id ? (
                              <Check className="w-4 h-4 text-chart-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
