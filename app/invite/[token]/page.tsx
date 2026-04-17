import { createClient } from '@/lib/supabase/server'
import { acceptInvite } from '@/app/actions/invite'
import Link from 'next/link'
import { Megaphone, Users, CheckSquare } from 'lucide-react'

export default async function InvitePage({ params }: { params: { token: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invite } = await supabase
    .from('workspace_invitations')
    .select('*, workspaces(name)')
    .eq('token', params.token)
    .single()

  if (!invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full text-center">
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Acesso Negado</h1>
          <p className="font-bold text-gray-600 mb-8">
            Este link de convite é inválido ou já foi utilizado por alguém.
          </p>
          <Link href="/dashboard" className="inline-block py-3 px-6 bg-black text-white font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] transition-all">
            Ir para meu Painel
          </Link>
        </div>
      </div>
    )
  }

  // Se não estiver logado
  if (!user) {
    return (
      <div className="min-h-screen bg-yellow-400 flex flex-col justify-center items-center p-4">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full text-center">
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 text-balance leading-none">
            Você foi convidado!
          </h1>
          <p className="font-bold text-gray-600 mb-8 mt-4 text-sm">
            A empresa <span className="text-black bg-yellow-200 px-1 border-2 border-black inline-block mix-blend-multiply">{invite.workspaces?.name}</span> te convidou para ajudar a fechar leads no Mini CRM.
          </p>
          
          <div className="p-4 bg-gray-100 border-4 border-black mb-8 text-left">
            <p className="text-xs font-black uppercase mb-2">Para aceitar o convite:</p>
            <p className="text-sm font-bold">Faça o Login na sua conta (ou crie uma) e então clique novamente no link recebido.</p>
          </div>

          <Link href={`/?redirect_to=/invite/${params.token}`} className="block w-full py-3 px-6 bg-green-400 text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
            Fazer Login Agora
          </Link>
        </div>
      </div>
    )
  }

  // Client Server Action Wrapper Form
  return (
    <div className="min-h-screen bg-blue-400 flex flex-col justify-center items-center p-4">
      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full relative">
        
        <div className="absolute -top-6 -right-6 bg-yellow-400 w-12 h-12 border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
          <Users className="w-6 h-6" />
        </div>

        <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-balance leading-tight">
          Entrar no Time
        </h1>
        
        <div className="space-y-4 mb-8">
          <p className="font-bold text-gray-600 outline-none">
            <span className="text-black underline decoration-2 decoration-yellow-400">{user.email}</span>, você foi oficialmente recrutado.
          </p>
          <div className="p-4 border-4 border-black bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-wider text-gray-500">Workspace</span>
            <span className="font-black border-b-2 border-black uppercase">{invite.workspaces?.name}</span>
          </div>
          <div className="p-4 border-4 border-black bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-wider text-gray-500">Permissão</span>
            <span className="font-black border-b-2 border-black uppercase text-purple-600">{invite.role === 'admin' ? 'Administrador' : 'Vendedor'}</span>
          </div>
        </div>

        <form action={async () => {
          'use server'
          await acceptInvite(params.token)
        }}>
          <button type="submit" className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-black text-white font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] transition-all hover:bg-gray-800 text-lg">
            <CheckSquare className="w-5 h-5" />
            Aceitar e Iniciar
          </button>
        </form>
      </div>
    </div>
  )
}
