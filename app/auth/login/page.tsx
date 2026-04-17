'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('[Login] Tentando autenticar...', email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('[Login] Erro do Supabase:', error.message)
      setError(error.message)
      setLoading(false)
    } else {
      console.log('[Login] Sucesso! Usuário:', data.user?.email)

      // Se o seu Kanban estiver em outra rota, MUDE AQUI (ex: '/leads' ou '/')
      const destino = '/dashboard'

      console.log(`[Login] Redirecionando para ${destino}...`)
      router.push(destino)
      router.refresh()
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-yellow-400">
      <div className="w-full max-w-md">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 rounded-none">
          <div className="mb-8 text-center border-b-4 border-black pb-6">
            <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Mini CRM</h1>
            <p className="text-gray-600 font-bold uppercase tracking-wide text-sm">
              SDR Intelligence Hub
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold uppercase tracking-wide">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-purple-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-bold uppercase tracking-wide">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-4 border-black rounded-none bg-white focus:outline-none focus:ring-4 focus:ring-purple-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-400 border-4 border-black text-black font-bold uppercase tracking-wide text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 mt-4 bg-purple-400 text-black border-4 border-black font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar na Base'}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t-4 border-black">
            <p className="text-gray-600 font-bold text-sm">
              Ainda não tem conta?{' '}
              <Link href="/auth/signup" className="text-purple-600 font-black uppercase hover:underline ml-1">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}