'use client'

import { useEffect } from 'react'
import { clearCorruptedCookies } from '@/lib/supabase-cookies'

export function CookieErrorHandler() {
  useEffect(() => {
    // Очищаем поврежденные cookies при загрузке приложения
    clearCorruptedCookies()

    // Обработчик глобальных ошибок для cookie parsing
    const handleError = (event: ErrorEvent) => {
      if (
        event.message.includes('Failed to parse cookie string') ||
        event.message.includes('Unexpected token') ||
        event.message.includes('base64-eyJ')
      ) {
        console.warn(
          'Detected cookie parsing error, clearing corrupted cookies'
        )
        clearCorruptedCookies()
        // Перезагружаем страницу после очистки
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    }

    // Обработчик необработанных промисов
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      if (
        reason?.message?.includes('JSON') ||
        reason?.message?.includes('cookie') ||
        reason?.message?.includes('base64')
      ) {
        console.warn(
          'Detected JSON/cookie parsing error in promise, clearing corrupted cookies'
        )
        clearCorruptedCookies()
        // Перезагружаем страницу после очистки
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    }

    // Перехватываем console.error для Supabase ошибок
    const originalConsoleError = console.error
    console.error = (...args) => {
      const message = args.join(' ')
      if (
        message.includes('Failed to parse cookie string') ||
        message.includes('Multiple GoTrueClient instances')
      ) {
        console.warn('Detected Supabase cookie/client issue, clearing cookies')
        clearCorruptedCookies()
        return // Не показываем ошибку в консоли
      }
      originalConsoleError.apply(console, args)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      console.error = originalConsoleError
    }
  }, [])

  return null
}
