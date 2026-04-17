'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Sparkles, MessageCircle } from 'lucide-react'

interface MessageGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  leadName: string
  campaignName: string
  status: 'generating' | 'success' | 'error'
  message: string | null
  error: string | null
}

export function MessageGenerationModal({
  isOpen,
  onClose,
  leadName,
  campaignName,
  status,
  message,
  error
}: MessageGenerationModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setCopied(false)
    }
  }, [isOpen])

  const copyToClipboard = async () => {
    if (!message) return
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={status !== 'generating' ? onClose : undefined} />

      <div className="relative neo-card rounded-lg w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-4 border-black bg-purple-400">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white border-3 border-black rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Gerador de Mensagem</h2>
              <p className="text-xs font-medium opacity-80">{leadName} - {campaignName}</p>
            </div>
          </div>
          {status !== 'generating' && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/10 rounded-lg transition-colors border-2 border-transparent hover:border-black"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {status === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12">
              {/* Animated Loading */}
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-black bg-yellow-400 rounded-lg flex items-center justify-center animate-bounce">
                  <Sparkles className="w-10 h-10" />
                </div>
                {/* Floating elements */}
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-pink-400 border-3 border-black rounded-full animate-ping" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-400 border-2 border-black rounded-sm animate-pulse" />
                <div className="absolute top-1/2 -right-6 w-3 h-3 bg-green-400 border-2 border-black rotate-45 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              
              <h3 className="text-xl font-bold mb-2">Gerando mensagem...</h3>
              <p className="text-gray-500 text-center max-w-xs">
                A IA esta criando uma mensagem personalizada para <span className="font-bold">{leadName}</span>
              </p>

              {/* Loading bar */}
              <div className="w-full max-w-xs mt-6 h-4 border-3 border-black bg-gray-100 overflow-hidden">
                <div className="h-full bg-purple-400 animate-loading-bar" />
              </div>
            </div>
          )}

          {status === 'success' && message && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <div className="w-8 h-8 bg-green-400 border-3 border-black rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <span className="font-bold">Mensagem gerada com sucesso!</span>
              </div>

              <div className="p-4 bg-blue-50 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-black/10">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-bold uppercase tracking-wide">Mensagem para {leadName}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap font-medium leading-relaxed">{message}</p>
              </div>

              <button
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-yellow-400 text-black border-4 border-black font-bold uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                {copied ? (
                  <><Check className="w-5 h-5" /> Copiado!</>
                ) : (
                  <><Copy className="w-5 h-5" /> Copiar Mensagem</>
                )}
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-red-400 border-4 border-black rounded-lg flex items-center justify-center mb-6">
                <X className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-red-600">Erro na geracao</h3>
              <p className="text-gray-500 text-center max-w-xs mb-6">
                {error || 'Ocorreu um erro ao gerar a mensagem. Tente novamente.'}
              </p>
              <button
                onClick={onClose}
                className="py-3 px-6 bg-gray-200 text-black border-4 border-black font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 60%;
            margin-left: 20%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
