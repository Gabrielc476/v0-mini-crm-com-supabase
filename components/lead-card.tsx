'use client'

import { Lead } from '@/lib/types'
import { Building2, Mail, Phone } from 'lucide-react'

interface LeadCardProps {
  lead: Lead
  onDragStart: () => void
  onClick: () => void
  isDragging: boolean
}

export function LeadCard({ lead, onDragStart, onClick, isDragging }: LeadCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`neo-card p-4 rounded-lg cursor-pointer transition-all hover:-translate-y-1 ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
    >
      <h4 className="font-bold text-lg mb-2 truncate">{lead.name}</h4>
      
      {lead.company && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Building2 className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{lead.company}</span>
        </div>
      )}
      
      {lead.email && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{lead.email}</span>
        </div>
      )}
      
      {lead.phone && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="w-4 h-4 flex-shrink-0" />
          <span>{lead.phone}</span>
        </div>
      )}

      {lead.position && (
        <div className="mt-2 pt-2 border-t border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {lead.position}
          </span>
        </div>
      )}
    </div>
  )
}
