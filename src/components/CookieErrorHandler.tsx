'use client'

import { useEffect } from 'react'
import {
  clearCorruptedCookies,
  withCookieErrorHandling
} from '@/lib/supabase-cookies'

export function CookieErrorHandler() {
  useEffect(() => {
    // Очищаем поврежденные cookies при загрузке приложения
    withCookieErrorHandling(() => {
      clearCorruptedCookies()
    })

    // Обработчик глобальных ошибок для cookie-related проблем
    const handleGlobalError = (event: ErrorEvent) => {
      if (
        event.error?.message?.includes('JSON') ||
        event.error?.message?.includes('cookie') ||
        event.error?.message?.includes('base64')
      ) {
        console.warn(
          'Global cookie error detected, attempting cleanup:',
          event.error
        )
        clearCorruptedCookies()
      }
    }

    // Обработчик unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.message?.includes('JSON') ||
        event.reason?.message?.includes('cookie') ||
        event.reason?.message?.includes('base64')
      ) {
        console.warn(
          'Unhandled promise rejection with cookie error:',
          event.reason
        )
        clearCorruptedCookies()
        event.preventDefault() // Предотвращаем показ ошибки в консоли
      }
    }

    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null // Этот компонент не рендерит ничего видимого
}
