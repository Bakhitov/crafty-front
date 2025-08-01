import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Упрощенный кэш для middleware (только для критических проверок доступа)
const companyCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 300000 // 5 минут - оптимальный баланс производительности и актуальности

// Делаем кэш доступным глобально для инвалидации
global.middlewareCompanyCache = companyCache

// Функция для принудительной очистки кэша (для отладки)
export const clearMiddlewareCache = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Clearing middleware cache...')
  }
  companyCache.clear()
}

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
            ...options
          })
          res.cookies.set({
            name,
            value,
            ...options
          })
        },
        remove(name: string, options: Record<string, unknown>) {
          req.cookies.set({
            name,
            value: '',
            ...options
          })
          res.cookies.set({
            name,
            value: '',
            ...options
          })
        }
      }
    }
  )

  const { pathname } = req.nextUrl

  // Получаем пользователя
  const {
    data: { user }
  } = await supabase.auth.getUser()

  // Определяем типы роутов
  const protectedRoutes = ['/playground', '/api']
  const authRoutes = ['/auth']
  const accessDeniedRoute = '/access-denied'
  const publicRoutes = ['/', '/api/v1/agents/public', '/debug-stream'] // Добавляем публичные API роуты

  // Если пользователь не авторизован
  if (!user) {
    // Разрешаем доступ к публичным и auth роутам
    if (
      publicRoutes.includes(pathname) ||
      authRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + '/')
      )
    ) {
      return res
    }

    // Перенаправляем на авторизацию для всех остальных роутов
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Пользователь авторизован - проверяем компанию для защищенных роутов
  if (
    protectedRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + '/')
    ) ||
    pathname === accessDeniedRoute
  ) {
    try {
      // Проверяем кэш сначала
      const cacheKey = `company-${user.id}`
      const cached = companyCache.get(cacheKey)
      let companies = null

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        companies = cached.data
      } else {
        // Получаем данные компании
        const { data: companiesData, error } = await supabase.rpc(
          'get_user_company',
          {
            p_user_id: user.id
          }
        )

        // Кешируем результат
        if (!error) {
          companyCache.set(cacheKey, {
            data: companiesData,
            timestamp: Date.now()
          })
        }

        companies = companiesData

        // Если ошибка получения компании
        if (error) {
          console.error('Middleware: Company fetch error:', error)
        }
      }

      // Если компания не найдена
      if (!companies || companies.length === 0) {
        // Если компания не найдена (но нет ошибки), пытаемся создать её
        try {
          const { data: newCompany, error: createError } = await supabase.rpc(
            'create_user_company',
            {
              p_user_id: user.id,
              p_user_email: user.email
            }
          )

          if (!createError && newCompany && newCompany.length > 0) {
            // Компания создана, обновляем кэш
            companyCache.set(cacheKey, {
              data: newCompany,
              timestamp: Date.now()
            })

            // Проверяем её статус
            const company = newCompany[0]
            const isActive = company?.is_active === true

            if (!isActive) {
              // Новая компания неактивна - перенаправляем на access-denied
              if (pathname !== accessDeniedRoute) {
                const redirectUrl = req.nextUrl.clone()
                redirectUrl.pathname = accessDeniedRoute
                redirectUrl.search = ''
                return NextResponse.redirect(redirectUrl)
              }
              return res
            }

            // Компания активна - продолжаем обычную логику
            // (этот случай маловероятен, так как новые компании создаются неактивными)
          } else {
            console.error('Middleware: Failed to create company:', createError)
          }
        } catch (createErr) {
          console.error('Middleware: Error creating company:', createErr)
        }

        // Если пытается зайти на access-denied, разрешаем (чтобы показать ошибку)
        if (pathname === accessDeniedRoute) {
          return res
        }

        // Иначе перенаправляем на авторизацию
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/auth'
        return NextResponse.redirect(redirectUrl)
      }

      const company = companies[0]
      const isActive = company?.is_active === true

      // Если компания неактивна
      if (!isActive) {
        // Если уже на странице access-denied, разрешаем
        if (pathname === accessDeniedRoute) {
          return res
        }

        // Перенаправляем на access-denied
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = accessDeniedRoute
        redirectUrl.search = ''
        return NextResponse.redirect(redirectUrl)
      }

      // Если компания активна, но пользователь на access-denied
      if (isActive && pathname === accessDeniedRoute) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/playground'
        redirectUrl.search = ''
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Middleware: Unexpected error:', error)

      // При ошибке разрешаем доступ к access-denied
      if (pathname === accessDeniedRoute) {
        return res
      }

      // Иначе перенаправляем на авторизацию
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Если пользователь авторизован и пытается зайти на страницу авторизации
  if (
    authRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + '/')
    )
  ) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/playground'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  // Если пользователь авторизован и находится на главной странице
  if (pathname === '/') {
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
