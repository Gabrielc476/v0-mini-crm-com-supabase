'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function setActiveWorkspace(workspaceId: string) {
  const cookieStore = await cookies()
  cookieStore.set('active_workspace_id', workspaceId, { path: '/' })
  revalidatePath('/dashboard', 'layout')
}

export async function getActiveWorkspaceServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  let activeId = cookieStore.get('active_workspace_id')?.value

  // Se não tem cookie, tenta puxar o primeiro workspace do usuário
  if (!activeId) {
    const { data } = await supabase
      .from('user_workspaces')
      .select('workspace_id, workspaces(name)')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (data) {
      activeId = data.workspace_id
      // Como estamos num Server Action puro, não auto-definiremos o cookie aqui
      // Deixaremos o usuário setá-lo ao tentar trocar.
    }
  }

  return activeId
}

export async function createNewWorkspace(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // 1. & 2. Executa a criação vinculada através de um Remote Procedure Call de Segurança (RPC)
  const { data: newWs, error: rpcError } = await supabase
    .rpc('create_new_workspace', { workspace_name: name, creator_id: user.id })

  if (rpcError || !newWs) {
    console.error('[ERRO SUPABASE RPC CREATE WORKSPACE]', rpcError)
    throw new Error(`Falha transacional ao provisionar: ${rpcError?.message || 'Sem dados retornados'}`)
  }

  // 3. Forçar o contexto para a conta nova
  const cookieStore = await cookies()
  cookieStore.set('active_workspace_id', newWs.id, { path: '/' })
  
  revalidatePath('/dashboard', 'layout')
}
