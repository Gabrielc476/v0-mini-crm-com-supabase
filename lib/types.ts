export type LeadStatus = 'novo' | 'contactado' | 'qualificado' | 'proposta' | 'ganho' | 'perdido'

export interface Lead {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  position: string | null
  linkedin_url: string | null
  status: LeadStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type CampaignStatus = 'rascunho' | 'ativa' | 'pausada' | 'finalizada'

export interface Campaign {
  id: string
  user_id: string
  name: string
  description: string | null
  status: CampaignStatus
  created_at: string
  updated_at: string
}

export interface CampaignLead {
  id: string
  campaign_id: string
  lead_id: string
  added_at: string
}

export type MessageType = 'email' | 'linkedin' | 'whatsapp'

export interface GeneratedMessage {
  id: string
  user_id: string
  lead_id: string
  message_type: MessageType
  content: string
  created_at: string
}

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bgColor: string }> = {
  novo: { label: 'Novo', color: 'text-foreground', bgColor: 'bg-primary' },
  contactado: { label: 'Contactado', color: 'text-foreground', bgColor: 'bg-secondary' },
  qualificado: { label: 'Qualificado', color: 'text-accent-foreground', bgColor: 'bg-accent' },
  proposta: { label: 'Proposta', color: 'text-foreground', bgColor: 'bg-chart-4' },
  ganho: { label: 'Ganho', color: 'text-foreground', bgColor: 'bg-chart-4' },
  perdido: { label: 'Perdido', color: 'text-destructive-foreground', bgColor: 'bg-destructive' },
}

export const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bgColor: string }> = {
  rascunho: { label: 'Rascunho', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  ativa: { label: 'Ativa', color: 'text-foreground', bgColor: 'bg-chart-4' },
  pausada: { label: 'Pausada', color: 'text-foreground', bgColor: 'bg-secondary' },
  finalizada: { label: 'Finalizada', color: 'text-accent-foreground', bgColor: 'bg-accent' },
}
