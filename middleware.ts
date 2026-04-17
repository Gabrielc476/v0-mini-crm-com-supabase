import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  console.log(`\n--- [MIDDLEWARE START] Interceptando requisição para: ${path} ---`)

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const allCookies = request.cookies.getAll()
            console.log(`[MIDDLEWARE] Lendo cookies: ${allCookies.length} encontrados.`)
            return allCookies
          },
          setAll(cookiesToSet) {
            console.log(`[MIDDLEWARE] Tentativa de gravar ${cookiesToSet.length} cookies de sessão.`)
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

    console.log('[MIDDLEWARE] Executando supabase.auth.getUser()...')
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.log('[MIDDLEWARE ERRO AUTH] O getUser falhou:', error.message)
    }

    console.log(`[MIDDLEWARE] Resultado da sessão -> Usuário: ${user ? user.email : 'NENHUM'}`)

    if (path.startsWith('/dashboard') && !user) {
      console.log('⛔ [MIDDLEWARE BLOQUEIO] Rota /dashboard protegida acessada sem sessão válida. Redirecionando para login.')
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    console.log(`✅ [MIDDLEWARE END] Passagem liberada para: ${path}`)
    return supabaseResponse

  } catch (err) {
    console.error('💥 [MIDDLEWARE CRASH] O middleware estourou um erro crítico não tratado:', err)
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}