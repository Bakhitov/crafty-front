'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { useAuth } from '@/hooks/useAuth'
import { useCompanyAccess } from '@/hooks/useCompanyAccess'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Shield, AlertCircle, LogOut, RefreshCw } from 'lucide-react'
import { requestCache } from '@/lib/requestCache'
import { invalidateMiddlewareCache } from '@/lib/middlewareCache'

export default function AccessDeniedPage() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const {
    refreshAccess,
    hasAccess,
    isLoading: accessLoading,
    company,
    isInitialized
  } = useCompanyAccess()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Автоматическая проверка при загрузке страницы убрана - только ручная проверка
  // чтобы избежать конфликтов с middleware

  // Если пользователь не авторизован, перенаправляем на страницу авторизации
  useEffect(() => {
    if (!user && !loading) {
      router.replace('/auth')
    }
  }, [user, loading, router])

  // Если доступ восстановлен, перенаправляем в playground
  useEffect(() => {
    if (hasAccess && !accessLoading && isInitialized) {
      router.push('/playground')
    }
  }, [hasAccess, accessLoading, router, isInitialized])

  // Периодическая проверка убрана - только ручная проверка через кнопку
  // чтобы не создавать лишнюю нагрузку на API

  const handleSignOut = async () => {
    // Очищаем весь кеш при выходе
    requestCache.clear()
    await signOut()
    router.replace('/auth')
  }

  const handleContactManager = () => {
    window.open('https://wa.me/77475318623', '_blank')
  }

  const handleCheckAccess = async () => {
    if (!refreshAccess || !user?.id) return

    setIsRefreshing(true)
    try {
      // АГРЕССИВНАЯ очистка всех кэшей
      requestCache.clear()

      // Очищаем middleware кэш через API с повторными попытками
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch('/api/internal/cache/invalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'company', userId: user.id })
          })

          if (response.ok) {
            break // Успешно очистили
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Cache clear attempt ${attempt + 1} failed:`, error)
          }
        }
      }

      // Дополнительная очистка через invalidateMiddlewareCache
      await invalidateMiddlewareCache(user.id)

      // Увеличиваем время ожидания для полной очистки кэша
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Делаем ПРЯМОЙ запрос к БД минуя все кэши
      const directResponse = await fetch('/api/v1/companies', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
        }
      })

      if (directResponse.ok) {
        const directData = await directResponse.json()

        if (process.env.NODE_ENV === 'development') {
          console.log('Access check - Direct API response:', {
            is_active: directData.company?.is_active,
            company_id: directData.company?.id,
            company_name: directData.company?.name
          })
        }

        // Если компания активна, принудительно перенаправляем
        if (directData.company?.is_active === true) {
          // Используем window.location.replace для принудительного обновления
          window.location.replace('/playground')
          return
        }
      } else {
        // Если API недоступен, пробуем обновить через refreshAccess
        await refreshAccess()
      }

      // Если мы дошли до этой точки, доступ все еще ограничен
      // Показываем пользователю актуальное состояние
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error during access check:', error)
      }

      // При ошибке все равно пытаемся обновить через refreshAccess
      try {
        await refreshAccess()
      } catch (refreshError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('RefreshAccess also failed:', refreshError)
        }
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  if (loading || !isInitialized) {
    return <LoadingSpinner message="Проверка доступа..." size="lg" />
  }

  if (!user) {
    return null // Будет перенаправлен на страницу авторизации
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-background-secondary border-border rounded-xl border p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="bg-accent flex h-16 w-16 items-center justify-center rounded-xl">
                  <Shield className="text-foreground h-8 w-8" />
                </div>
                <div className="bg-destructive absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full">
                  <AlertCircle className="text-background h-4 w-4" />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-foreground mb-2 text-lg font-bold">
                ДОСТУП ОГРАНИЧЕН
              </h1>
              <p className="text-muted-foreground text-xs font-medium uppercase">
                Нет доступа к платформе
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="space-y-4 text-center">
              <div className="bg-accent border-border rounded-xl border p-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {company?.restricted_at
                    ? 'Ваша компания была временно приостановлена. Пожалуйста, свяжитесь с администратором для восстановления доступа.'
                    : company
                      ? 'Ваша компания ожидает активации. Пожалуйста, свяжитесь с администратором для получения доступа к платформе.'
                      : 'Не удалось загрузить информацию о компании. Попробуйте проверить доступ или свяжитесь с администратором.'}
                </p>
              </div>

              <div className="text-muted-foreground space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium uppercase">
                    Пользователь:
                  </span>
                  <span className="ml-2 truncate">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium uppercase">
                    Статус:
                  </span>
                  <span className="text-destructive font-medium">
                    {company?.restricted_at
                      ? 'Приостановлена'
                      : company
                        ? 'Ожидает активации'
                        : 'Неизвестно'}
                  </span>
                </div>
                {company && (
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-medium uppercase">
                      Компания:
                    </span>
                    <span className="ml-2 truncate">
                      {company.name || 'Не указано'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleContactManager}
                variant="secondary"
                size="lg"
                className="bg-accent border-border text-muted-foreground hover:text-foreground hover:bg-background-secondary h-9 w-full rounded-xl border text-xs font-medium uppercase"
              >
                <Icon
                  type="whatsapp"
                  size="xs"
                  className="mr-2 text-green-500"
                />
                Связаться +77475318623
              </Button>
              <Button
                onClick={handleCheckAccess}
                disabled={isRefreshing || accessLoading}
                variant="default"
                size="lg"
                className="bg-primary border-border text-muted-foreground hover:text-foreground hover:bg-background-secondary h-9 w-full rounded-xl border text-xs font-medium uppercase"
              >
                {isRefreshing || accessLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Проверка доступа...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Проверить доступ
                  </>
                )}
              </Button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="lg"
                className="hover:text-foreground hover:bg-background-secondary h-9 w-full rounded-xl text-xs font-medium uppercase"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Выйти из системы
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
