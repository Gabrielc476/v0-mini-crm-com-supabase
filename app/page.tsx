import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        <div className="neo-card p-3 inline-block mb-8 bg-primary rounded-lg">
          <h1 className="text-4xl md:text-6xl font-bold">Mini CRM</h1>
        </div>

        <p className="text-xl md:text-2xl text-muted-foreground mb-8">
          O CRM minimalista para SDRs que valorizam produtividade
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-8 py-4 bg-accent text-accent-foreground font-bold uppercase tracking-wide neo-button rounded-lg text-center"
          >
            Entrar
          </Link>
          <Link
            href="/auth/signup"
            className="px-8 py-4 bg-primary text-primary-foreground font-bold uppercase tracking-wide neo-button rounded-lg text-center"
          >
            Criar Conta
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="neo-card p-6 rounded-lg bg-secondary">
            <h3 className="text-lg font-bold mb-2">Pipeline Visual</h3>
            <p className="text-sm text-muted-foreground">
              Kanban board intuitivo para gerenciar seus leads
            </p>
          </div>
          <div className="neo-card p-6 rounded-lg bg-primary">
            <h3 className="text-lg font-bold mb-2">Mensagens IA</h3>
            <p className="text-sm text-muted-foreground">
              Gere emails e mensagens personalizadas com IA
            </p>
          </div>
          <div className="neo-card p-6 rounded-lg bg-accent">
            <h3 className="text-lg font-bold mb-2">Campanhas</h3>
            <p className="text-sm text-muted-foreground">
              Organize seus leads em campanhas de prospeccao
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
