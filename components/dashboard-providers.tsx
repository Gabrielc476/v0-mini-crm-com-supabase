'use client'

import { ReactNode } from 'react'
import { AIGenerationProvider } from '@/contexts/ai-generation-context'
import { GenerationNotifications } from '@/components/generation-notifications'

export function DashboardProviders({ children }: { children: ReactNode }) {
  return (
    <AIGenerationProvider>
      {children}
      <GenerationNotifications />
    </AIGenerationProvider>
  )
}
