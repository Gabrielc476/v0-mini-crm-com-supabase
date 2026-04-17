'use client'

import { useAIGeneration } from '@/contexts/ai-generation-context'
import { X, Loader2, CheckCircle, AlertCircle, Sparkles, Trash2 } from 'lucide-react'

export function GenerationNotifications() {
  const { tasks, pendingCount, clearCompletedTasks, clearTask } = useAIGeneration()

  if (tasks.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 space-y-2">
      {/* Header com contador */}
      <div className="flex items-center justify-between p-3 bg-purple-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 font-bold text-sm uppercase">
          <Sparkles className="w-4 h-4" />
          Gerando Mensagens
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-black text-white text-xs rounded-full">
              {pendingCount}
            </span>
          )}
        </div>
        {tasks.some(t => t.status !== 'generating') && (
          <button
            onClick={clearCompletedTasks}
            className="p-1 hover:bg-purple-500 transition-colors border-2 border-transparent hover:border-black"
            title="Limpar concluídos"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Lista de tasks */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
              task.status === 'generating' ? 'bg-yellow-100' :
              task.status === 'success' ? 'bg-green-100' :
              'bg-red-100'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{task.leadName}</p>
                <p className="text-xs text-gray-600 truncate">{task.campaignName}</p>
              </div>
              <div className="flex items-center gap-1">
                {task.status === 'generating' && (
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                )}
                {task.status === 'success' && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
                {task.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                {task.status !== 'generating' && (
                  <button
                    onClick={() => clearTask(task.id)}
                    className="p-0.5 hover:bg-black/10 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            {task.status === 'error' && task.error && (
              <p className="text-xs text-red-600 mt-1 font-medium">{task.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
