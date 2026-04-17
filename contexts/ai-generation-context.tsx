'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageGenerationModal } from '@/components/message-generation-modal'

export interface GenerationTask {
  id: string
  leadId: string
  leadName: string
  campaignId: string
  campaignName: string
  status: 'generating' | 'success' | 'error'
  message?: string
  error?: string
  createdAt: Date
}

interface AIGenerationContextType {
  tasks: GenerationTask[]
  pendingCount: number
  startGeneration: (leadId: string, leadName: string, campaignId: string, campaignName: string) => void
  clearCompletedTasks: () => void
  clearTask: (taskId: string) => void
}

const AIGenerationContext = createContext<AIGenerationContextType | null>(null)

export function AIGenerationProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<GenerationTask[]>([])
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const supabase = createClient()

  const startGeneration = useCallback(async (
    leadId: string,
    leadName: string,
    campaignId: string,
    campaignName: string
  ) => {
    const taskId = `${leadId}-${Date.now()}`

    // Adiciona a task como pending
    const newTask: GenerationTask = {
      id: taskId,
      leadId,
      leadName,
      campaignId,
      campaignName,
      status: 'generating',
      createdAt: new Date()
    }

    setTasks((prev: GenerationTask[]) => [newTask, ...prev])
    setActiveTaskId(taskId)

    // Executa a geração em background
    try {
      const { data, error } = await supabase.functions.invoke('generate-message', {
        body: { lead_id: leadId, campaign_id: campaignId }
      })

      if (error) {
        let errorMessage = 'Erro ao gerar mensagem'

        const serverMessage = error.context?.error || error.message || ''

        if (serverMessage.includes('Acesso negado') || error.message.includes('401')) {
          errorMessage = 'Sessão expirada. Faça login novamente.'
        } else if (serverMessage.includes('TIMEOUT') || error.message.includes('546') || error.message.includes('504')) {
          errorMessage = 'A IA demorou muito para responder. Tente novamente.'
        } else if (serverMessage.includes('DB_ERROR') || error.message.includes('422')) {
          errorMessage = 'Erro ao salvar mensagem no banco.'
        }

        setTasks((prev: GenerationTask[]) => prev.map((t: GenerationTask) =>
          t.id === taskId
            ? { ...t, status: 'error', error: errorMessage }
            : t
        ))
        return
      }

      if (data?.success) {
        const generatedMessage = data.messages ? data.messages.join('\n\n-----\n\n') : 'Mensagem gerada com sucesso!'
        setTasks((prev: GenerationTask[]) => prev.map((t: GenerationTask) =>
          t.id === taskId
            ? { ...t, status: 'success', message: generatedMessage }
            : t
        ))
      }
    } catch (err: any) {
      setTasks((prev: GenerationTask[]) => prev.map((t: GenerationTask) =>
        t.id === taskId
          ? { ...t, status: 'error', error: err.message || 'Erro inesperado' }
          : t
      ))
    }
  }, [supabase])

  const clearCompletedTasks = useCallback(() => {
    setTasks((prev: GenerationTask[]) => prev.filter((t: GenerationTask) => t.status === 'generating'))
  }, [])

  const clearTask = useCallback((taskId: string) => {
    setTasks((prev: GenerationTask[]) => prev.filter((t: GenerationTask) => t.id !== taskId))
  }, [])

  const pendingCount = tasks.filter((t: GenerationTask) => t.status === 'generating').length
  const activeTask = tasks.find((t: GenerationTask) => t.id === activeTaskId)

  return (
    <AIGenerationContext.Provider value={{
      tasks,
      pendingCount,
      startGeneration,
      clearCompletedTasks,
      clearTask
    }}>
      {children}
      <MessageGenerationModal
        isOpen={!!activeTaskId && !!activeTask}
        onClose={() => setActiveTaskId(null)}
        leadName={activeTask?.leadName || ''}
        campaignName={activeTask?.campaignName || ''}
        status={activeTask?.status || 'generating'}
        message={activeTask?.message || null}
        error={activeTask?.error || null}
      />
    </AIGenerationContext.Provider>
  )
}

export function useAIGeneration() {
  const context = useContext(AIGenerationContext)
  if (!context) {
    throw new Error('useAIGeneration must be used within AIGenerationProvider')
  }
  return context
}
