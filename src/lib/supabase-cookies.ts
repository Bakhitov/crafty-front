/**
 * Утилиты для безопасной работы с Supabase cookies
 * Исправляет проблемы с парсингом base64 cookies в продакшене
 */

// Функция для безопасного парсинга JSON из cookies
export function safeParseJSON(str: string): unknown {
  try {
    // Проверяем, не является ли строка base64
    if (str.startsWith('base64-')) {
      const base64Content = str.replace('base64-', '')
      try {
        const decoded = atob(base64Content)
        return JSON.parse(decoded)
      } catch (base64Error) {
        console.warn('Failed to decode base64 cookie:', base64Error)
        return null
      }
    }

    // Обычный JSON парсинг
    return JSON.parse(str)
  } catch (error) {
    console.warn('Failed to parse cookie JSON:', error)
    return null
  }
}

// Функция для очистки поврежденных cookies
export function clearCorruptedCookies() {
  if (typeof window === 'undefined') return

  // Получаем все cookies
  const cookies = document.cookie.split(';')

  cookies.forEach((cookie) => {
    const [name, value] = cookie.split('=')
    if (!name || !value) return

    const trimmedName = name.trim()
    const trimmedValue = value.trim()

    // Проверяем Supabase cookies
    if (trimmedName.includes('supabase') || trimmedName.includes('sb-')) {
      try {
        safeParseJSON(decodeURIComponent(trimmedValue))
      } catch {
        console.warn(`Clearing corrupted cookie: ${trimmedName}`)
        // Удаляем поврежденную cookie
        document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      }
    }
  })
}

// Middleware для обработки ошибок cookies
export function withCookieErrorHandling<T>(fn: () => T): T | null {
  try {
    return fn()
  } catch (error) {
    if (error instanceof Error && error.message.includes('JSON')) {
      console.warn('Cookie parsing error, clearing corrupted cookies:', error)
      clearCorruptedCookies()
      // Перезагружаем страницу после очистки cookies
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    }
    return null
  }
}
