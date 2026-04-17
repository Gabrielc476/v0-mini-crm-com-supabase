import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Cria a resposta inicial que continuará o fluxo da requisição
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 2. Instancia o cliente do Supabase configurado para renovar cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Atualiza a sessão chamando getUser() - OBRIGATÓRIO
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 4. A TRAVA DE SEGURANÇA: Se tentar acessar o Dashboard sem login, vai pra rua.
  if (
    request.nextUrl.pathname.startsWith('/dashboard') &&
    !user
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Se tudo estiver certo (ou se for uma rota pública), deixa passar
  return supabaseResponse
}

// 5. Configuração para ignorar arquivos estáticos e otimizar a performance
export const config = {
  matcher: [
    /*
     * Aplica o middleware em todas as rotas, EXCETO:
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de imagem otimizados)
     * - favicon.ico (ícone do site)
     * - Imagens com extensões comuns
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}