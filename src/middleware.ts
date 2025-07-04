import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: Record<string, unknown>) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Получаем сессию пользователя
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Список защищенных роутов - требуют авторизации
  const protectedRoutes = ['/playground', '/api']
  const authRoutes = ['/auth']

  const { pathname } = req.nextUrl

  // Если пользователь не авторизован и пытается зайти на защищенный роут
  if (!session && protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    const redirectUrl = new URL('/auth', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Если пользователь авторизован и пытается зайти на страницу авторизации
  if (session && authRoutes.some(route => pathname.startsWith(route))) {
    const redirectUrl = new URL('/playground', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Если пользователь авторизован и находится на главной странице, перенаправляем в playground
  if (session && pathname === '/') {
    const redirectUrl = new URL('/playground', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 