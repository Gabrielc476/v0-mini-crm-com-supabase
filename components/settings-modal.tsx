'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Settings, Users, Filter, Plus, Trash2 } from 'lucide-react'
import { FunnelStage } from '@/lib/types'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialStages: FunnelStage[]
  activeWorkspaceId: string
}

const AVAILABLE_FIELDS = [
  { id: 'company', label: 'Empresa' },
  { id: 'phone', label: 'Telefone' },
  { id: 'email', label: 'Email' },
  { id: 'job_title', label: 'Cargo' },
  { id: 'linkedin_url', label: 'LinkedIn' },
]

export function SettingsModal({ isOpen, onClose, initialStages, activeWorkspaceId }: SettingsModalProps) {
  const [stages, setStages] = useState<FunnelStage[]>([])
  const [activeTab, setActiveTab] = useState('funnel')
  const [saving, setSaving] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [members, setMembers] = useState<any[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [generatedLink, setGeneratedLink] = useState('')
  
  const supabase = createClient()
  const workspaceId = activeWorkspaceId

  const loadTeam = async (wsId: string) => {
    // Busca membros ativos
    const { data: membersData } = await supabase
      .from('user_workspaces')
      .select('id, role, user_id, auth_users: user_id(email)')
      .eq('workspace_id', wsId)
      
    // Na API livre do Supabase não conseguimos fazer o join com auth.users facilmente 
    // a menos que haja view. Mas deixaremos placeholder ou listaremos apenas papeis.
    if (membersData) setMembers(membersData)

    // Busca convites pendentes
    const { data: invitesData } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('workspace_id', wsId)
    
    if (invitesData) setInvites(invitesData)
  }

  useEffect(() => {
    if (isOpen) {
      setStages(initialStages)
      if (activeWorkspaceId) {
        loadTeam(activeWorkspaceId)
      }
    } else {
      setGeneratedLink('')
      setInviteEmail('')
    }
  }, [isOpen, initialStages, activeWorkspaceId])

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId || !inviteEmail) return
    setSaving(true)
    
    const { data, error } = await supabase
      .from('workspace_invitations')
      .insert({
        workspace_id: workspaceId,
        email: inviteEmail.trim(),
        role: inviteRole
      })
      .select()
      .single()
      
    if (error) {
      alert('Erro ao criar convite: ' + error.message)
    } else if (data) {
      const link = `${window.location.origin}/invite/${data.token}`
      setGeneratedLink(link)
      loadTeam(workspaceId)
    }
    setSaving(false)
  }

  if (!isOpen) return null

  const handleFieldToggle = (stageId: string, fieldId: string) => {
    setStages(prev => prev.map(s => {
      if (s.id !== stageId) return s
      const currentFields = s.required_fields || []
      const newFields = currentFields.includes(fieldId)
        ? currentFields.filter(f => f !== fieldId)
        : [...currentFields, fieldId]
      return { ...s, required_fields: newFields }
    }))
  }

  const handleSaveStages = async () => {
    setSaving(true)
    let hasError = false
    for (const stage of stages) {
      // Fazemos o update usando o nome ao invés do ID! 
      // Caso existam duplicatas invisíveis no banco, todas elas receberão as regras garantindo que funcionem sempre.
      const { error } = await supabase
        .from('funnel_stages')
        .update({ required_fields: stage.required_fields })
        .eq('workspace_id', stage.workspace_id)
        .eq('name', stage.name)

      if (error) {
        console.error('Erro ao salvar estágio', stage.name, error)
        hasError = true
      }
    }
    setSaving(false)
    
    if (hasError) {
      alert('Ocorreu um erro ao salvar algumas regras. Verifique o console.')
    } else {
      alert('Salvo! A página será recarregada para aplicar suas novas regras.')
      window.location.reload()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />

      <div className="relative neo-card rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-background border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between p-6 border-b-4 border-black bg-yellow-400">
          <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Configurações do Workspace
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/10 rounded-lg transition-colors border-2 border-transparent hover:border-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4">
            <TabsList className="w-full grid grid-cols-2 border-4 border-black bg-gray-100 p-1 h-auto rounded-none">
              <TabsTrigger 
                value="funnel" 
                className="flex items-center gap-2 py-3 px-4 font-bold uppercase text-sm data-[state=active]:bg-blue-300 data-[state=active]:shadow-none rounded-none border-2 border-transparent data-[state=active]:border-black"
              >
                <Filter className="w-4 h-4" />
                Regras de Funil
              </TabsTrigger>
              <TabsTrigger 
                value="team" 
                className="flex items-center gap-2 py-3 px-4 font-bold uppercase text-sm data-[state=active]:bg-green-300 data-[state=active]:shadow-none rounded-none border-2 border-transparent data-[state=active]:border-black"
              >
                <Users className="w-4 h-4" />
                Membros e Convites
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="funnel" className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="bg-blue-50 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-bold text-lg mb-2">Campos Obrigatórios por Etapa</h3>
                <p className="text-sm font-medium text-gray-700">
                  Marque quais campos um lead precisa ter preenchido obrigatoriamente para entrar em cada estágio.
                </p>
              </div>

              <div className="grid gap-4">
                {stages.map(stage => (
                  <div key={stage.id} className="border-4 border-black p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white">
                    <div className="flex items-center gap-3 w-48">
                      <div className={`w-4 h-4 rounded-full border-2 border-black ${stage.color}`}></div>
                      <span className="font-bold uppercase tracking-wide">{stage.name}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 flex-1">
                      {AVAILABLE_FIELDS.map(field => {
                        const isRequired = (stage.required_fields || []).includes(field.id);
                        return (
                          <button
                            key={field.id}
                            onClick={() => handleFieldToggle(stage.id, field.id)}
                            className={`px-3 py-1 text-xs font-bold uppercase border-2 transition-all ${
                              isRequired 
                                ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                                : 'bg-transparent text-gray-500 border-gray-300 hover:border-black'
                            }`}
                          >
                            {field.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t-4 border-black">
                <button
                  onClick={handleSaveStages}
                  disabled={saving}
                  className="w-full py-3 px-4 bg-green-400 text-black border-4 border-black font-black uppercase text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar Regras'}
                </button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team" className="flex-1 overflow-y-auto p-6">
            <div className="grid md:grid-cols-2 gap-8 h-full">
              {/* Painel de Geração de Convites */}
              <div className="space-y-6">
                <div className="bg-green-50 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Novo Convite
                  </h3>
                  <p className="text-sm font-medium text-gray-700">
                    Gere um link mágico para que um colega acesse seu pipeline de vendas e ajude a fechar os leads.
                  </p>
                </div>

                <form onSubmit={handleCreateInvite} className="space-y-4 border-4 border-black p-4 flex flex-col bg-white">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-2">Email do Convidado</label>
                    <input 
                      type="email" 
                      required
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="exemplo@empresa.com"
                      className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:bg-yellow-50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-2">Permissão</label>
                    <select 
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      className="w-full border-2 border-black p-3 font-bold focus:outline-none appearance-none bg-white cursor-pointer"
                    >
                      <option value="member">Membro (Vendedor)</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  
                  {generatedLink ? (
                    <div className="mt-4 p-4 bg-yellow-200 border-2 border-dashed border-black">
                      <p className="text-xs font-black uppercase mb-2">Link Gerado com Sucesso!</p>
                      <div className="flex gap-2">
                        <input readOnly value={generatedLink} className="flex-1 text-xs border border-black p-2 bg-white" />
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedLink)
                            alert('Link copiado!')
                          }}
                          className="bg-black text-white px-4 text-xs font-bold uppercase hover:bg-gray-800"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3 px-4 bg-black text-white font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] border-2 border-transparent hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 mt-2"
                    >
                      {saving ? 'Gerando...' : 'Gerar Link'}
                    </button>
                  )}
                </form>
              </div>

              {/* Lista de Membros e Pendentes */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-black uppercase tracking-widest text-sm mb-4 border-b-4 border-black pb-2">Membros Ativos</h3>
                  <div className="space-y-2">
                    {members.length === 0 ? (
                      <p className="text-xs text-gray-500 font-bold uppercase">Ninguém encontrado.</p>
                    ) : (
                      members.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-3 border-2 border-black bg-white">
                          <span className="font-bold text-sm truncate">{m.user_id}</span>
                          <span className={`text-[10px] uppercase font-black px-2 py-0.5 border border-black ${m.role === 'admin' ? 'bg-purple-200' : 'bg-gray-200'}`}>
                            {m.role}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-black uppercase tracking-widest text-sm mb-4 border-b-4 border-black pb-2">Convites Pendentes</h3>
                  <div className="space-y-2">
                    {invites.length === 0 ? (
                      <p className="text-xs text-gray-500 font-bold uppercase">Nenhum convite pendente.</p>
                    ) : (
                      invites.map(inv => (
                        <div key={inv.id} className="flex flex-col justify-between p-3 border-2 border-black bg-gray-50 gap-2">
                          <div className="flex justify-between items-center w-full">
                            <span className="font-bold text-sm truncate">{inv.email}</span>
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 border border-black bg-orange-200">
                              Pendente
                            </span>
                          </div>
                          <div className="text-xs font-mono bg-white p-1 border border-dashed border-gray-300 truncate cursor-not-allowed">
                            {window.location.origin}/invite/{inv.token}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
