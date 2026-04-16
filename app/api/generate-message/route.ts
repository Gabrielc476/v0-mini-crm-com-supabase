import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { leadId, leadName, leadCompany, leadPosition, messageType } = await request.json()

  const prompts: Record<string, string> = {
    email: `Escreva um email de prospecção profissional e personalizado para ${leadName}${leadCompany ? `, que trabalha na ${leadCompany}` : ''}${leadPosition ? ` como ${leadPosition}` : ''}. O email deve ser curto (máximo 150 palavras), direto, e ter um call-to-action claro para agendar uma conversa. Use tom profissional mas amigável. Não inclua assunto, apenas o corpo do email.`,
    
    linkedin: `Escreva uma mensagem de conexão do LinkedIn profissional e personalizada para ${leadName}${leadCompany ? `, que trabalha na ${leadCompany}` : ''}${leadPosition ? ` como ${leadPosition}` : ''}. A mensagem deve ser muito curta (máximo 300 caracteres), direta, e mencionar o interesse em conectar-se profissionalmente. Use tom profissional mas amigável.`,
    
    whatsapp: `Escreva uma mensagem de WhatsApp profissional e personalizada para ${leadName}${leadCompany ? `, que trabalha na ${leadCompany}` : ''}${leadPosition ? ` como ${leadPosition}` : ''}. A mensagem deve ser curta (máximo 100 palavras), informal mas profissional, e ter um call-to-action para agendar uma ligação rápida.`,
  }

  const prompt = prompts[messageType] || prompts.email

  const { text } = await generateText({
    model: gateway('openai/gpt-4o-mini'),
    prompt,
  })

  // Save to database
  const { data, error } = await supabase
    .from('generated_messages')
    .insert({
      user_id: user.id,
      lead_id: leadId,
      message_type: messageType,
      content: text,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
