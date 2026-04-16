'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('As senhas nao conferem')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter no minimo 6 caracteres')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="neo-card p-8 rounded-lg text-center">
            <div className="w-16 h-16 bg-chart-4 neo-border rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Verifique seu email</h1>
            <p className="text-muted-foreground mb-6">
              Enviamos um link de confirmacao para <strong>{email}</strong>
            </p>
            <Link
              href="/auth/login"
              className="inline-block py-3 px-6 bg-primary text-primary-foreground font-bold uppercase tracking-wide neo-button rounded-lg"
            >
              Voltar ao Login
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="neo-card p-8 rounded-lg">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Criar Conta</h1>
            <p className="text-muted-foreground">Comece a gerenciar seus leads hoje</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold uppercase tracking-wide">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 neo-border-sm rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
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
                className="w-full px-4 py-3 neo-border-sm rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-bold uppercase tracking-wide">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 neo-border-sm rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border-2 border-destructive rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-accent text-accent-foreground font-bold uppercase tracking-wide neo-button rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando...' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Ja tem uma conta?{' '}
              <Link href="/auth/login" className="text-accent font-bold hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
