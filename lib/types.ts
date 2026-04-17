// 1. Tipagem das Etapas do Funil (antigo LeadStatus)
export type LeadStage =
  | 'Base'
  | 'Lead Mapeado'
  | 'Tentando Contato'
  | 'Conexão Iniciada'
  | 'Qualificado'
  | 'Reunião Agendada'
  | 'Desqualificado'

export interface Lead {
  id: string
  workspace_id: string // Alterado para suportar Multi-tenancy
  name: string
  email: string | null
  phone: string | null
  company: string | null
  job_title: string | null // Antigo position
  source: string | null
  linkedin_url: string | null // Mantido conforme seu pedido
  stage: LeadStage // Antigo status
  notes: string | null
  custom_fields?: Record<string, any> // Suporte ao JSONB de campos personalizados
  created_at: string
  updated_at: string
}

// 2. Tipagem de Campanhas
export interface Campaign {
  id: string
  workspace_id: string
  name: string
  context_description: string | null
  prompt_instructions: string | null
  trigger_stage: LeadStage | null
  is_active: boolean // Substitui o enum CampaignStatus antigo
  created_at: string
}

// 3. Tipagem das Mensagens Geradas pela IA
export type MessageStatus = 'sugerida' | 'enviada' | 'descartada'

export interface GeneratedMessage {
  id: string
  lead_id: string
  campaign_id: string // Vinculado diretamente à campanha em vez de user_id
  content: string
  status: MessageStatus
  created_at: string
}

// 4. Configuração visual para o Kanban e Modal
export const LEAD_STAGE_CONFIG: Record<LeadStage, { label: string; color: string; bgColor: string }> = {
  'Base': { label: 'Base', color: 'text-black', bgColor: 'bg-gray-200' },
  'Lead Mapeado': { label: 'Lead Mapeado', color: 'text-black', bgColor: 'bg-blue-200' },
  'Tentando Contato': { label: 'Tentando Contato', color: 'text-black', bgColor: 'bg-yellow-200' },
  'Conexão Iniciada': { label: 'Conexão Iniciada', color: 'text-black', bgColor: 'bg-orange-200' },
  'Qualificado': { label: 'Qualificado', color: 'text-black', bgColor: 'bg-green-300' },
  'Reunião Agendada': { label: 'Reunião Agendada', color: 'text-black', bgColor: 'bg-purple-300' },
  'Desqualificado': { label: 'Desqualificado', color: 'text-white', bgColor: 'bg-red-500' },
}