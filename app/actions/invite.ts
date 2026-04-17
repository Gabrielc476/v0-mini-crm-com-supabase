'use server'

import { createClient } from '@/lib/supabase/server'
import { setActiveWorkspace } from '@/app/actions/workspace'
import { redirect } from 'next/navigation'

export async function acceptInvite(token: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verifica o convite
  const { data: invite, error: inviteError } = await supabase
    .from('workspace_invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (inviteError || !invite) {
    throw new Error('Convite inválido ou expirado.')
  }

  // Insere o usuário no workspace
  const { error: insertError } = await supabase
    .from('user_workspaces')
    .insert({
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role: invite.role
    })

  if (insertError) {
    // Se der erro de duplicate key, ele já está no workspace
    if (insertError.code !== '23505') {
      throw new Error('Erro ao entrar no workspace.')
    }
  }

  // Deleta o convite
  await supabase
    .from('workspace_invitations')
    .delete()
    .eq('id', invite.id)

  // Define o workspace como ativo
  await setActiveWorkspace(invite.workspace_id)

  // Vai pro dash
  redirect('/dashboard')
}
