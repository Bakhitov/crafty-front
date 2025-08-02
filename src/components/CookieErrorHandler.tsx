'use client'

import { useEffect } from 'react'
import { clearCorruptedCookies } from '@/lib/supabase-cookies'

export function CookieErrorHandler() {
  useEffect(() => {
    // Очищаем поврежденные cookies при загрузке приложения
    clearCorruptedCookies()

    // Обработчик глобальных ошибок для cookie parsing
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('Failed to parse cookie string')) {
        console.warn(
          'Detected cookie parsing error, clearing corrupted cookies'
        )
        clearCorruptedCookies()
      }
    }

    // Обработчик необработанных промисов
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('JSON')) {
        console.warn(
          'Detected JSON parsing error in promise, clearing corrupted cookies'
        )
        clearCorruptedCookies()
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}
