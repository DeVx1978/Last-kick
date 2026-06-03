import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED = ['/radar', '/dashboard', '/perfil', '/recargar', '/admin', '/promotor', '/distribuidor', '/combinadas', '/individual', '/campo-de-batalla']
const AUTH_ONLY          = ['/login', '/register']
const ADMIN_ONLY         = ['/admin']
const PROMOTOR_ONLY      = ['/promotor']
const DISTRIBUIDOR_ONLY  = ['/distribuidor']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({ request })

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error && error.message !== 'Auth session missing!') {
    console.error('[Middleware] Auth error:', error.message)
    return response
  }

  const isProtected = PROTECTED.some(r => pathname.startsWith(r))
  const isAuthOnly  = AUTH_ONLY.some(r => pathname.startsWith(r))
  const isAdminOnly = ADMIN_ONLY.some(r => pathname.startsWith(r))

  /* ── 1. Ruta protegida sin sesión → /login ── */
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('message', 'session-required')
    const redirect = NextResponse.redirect(url)
    redirect.headers.set('Cache-Control', 'no-store')
    return redirect
  }

  /* ── 2. Ruta protegida con sesión sin verificar → /login ── */
  if (isProtected && user && !user.email_confirmed_at) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('message', 'verify-email')
    url.searchParams.set('email', user.email ?? '')
    const redirect = NextResponse.redirect(url)
    redirect.headers.set('Cache-Control', 'no-store')
    return redirect
  }

  /* ── 3. Ruta admin — verificar rol ── */
if (isAdminOnly && user) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const rolesAdmin = ['admin', 'super_admin', 'finance_admin']
  if (!profile || !rolesAdmin.includes(profile.role ?? '')) {
    const url = request.nextUrl.clone()
    url.pathname = '/radar'
    const redirect = NextResponse.redirect(url)
    redirect.headers.set('Cache-Control', 'no-store')
    return redirect
  }
}

  /* ── 5. Ruta distribuidor — verificar rol ── */
  const isDistribuidorOnly = DISTRIBUIDOR_ONLY.some(r => pathname.startsWith(r))
  if (isDistribuidorOnly && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    const rolesPermitidos = ['admin', 'super_admin', 'distribuidor']
    if (!profile || !rolesPermitidos.includes(profile.role ?? '')) {
      const url = request.nextUrl.clone()
      url.pathname = '/radar'
      const redirect = NextResponse.redirect(url)
      redirect.headers.set('Cache-Control', 'no-store')
      return redirect
    }
  }

  /* ── 5. Todo lo demás: dejar pasar ── */
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|img/|fonts/|api/).*)',
  ],
}