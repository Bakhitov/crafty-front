import { createBrowserClient, createServerClient } from '@supabase/ssr'

// Supabase конфигурация
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://wyehpfzafbjfvyjzgjss.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5ZWhwZnphZmJqZnZ5anpnanNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczMjU3OTUsImV4cCI6MjA1MjkwMTc5NX0.TUUdNKNQItJ2LKNf1YhkW1kgnOC4yXEZwKlODnOowGY'

// Singleton для browser client
let browserClient: ReturnType<typeof createBrowserClient> | null = null

// Безопасный parser для localStorage данных
function safeGetStorageItem(key: string): string | null {
  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    // Проверяем, не является ли это base64 данными
    if (item.startsWith('base64-')) {
      const base64Content = item.replace('base64-', '')
      try {
        const decoded = atob(base64Content)
        // Проверяем, что это валидный JSON
        JSON.parse(decoded)
        return decoded // Возвращаем декодированную строку
      } catch (error) {
        console.warn('Failed to decode base64 storage item, clearing:', error)
        localStorage.removeItem(key)
        return null
      }
    }

    // Проверяем на валидность JSON без изменений
    try {
      JSON.parse(item)
      return item
    } catch (error) {
      console.warn('Invalid JSON in storage, clearing:', error)
      localStorage.removeItem(key)
      return null
    }
  } catch (error) {
    console.warn(`Failed to get storage item ${key}:`, error)
    try {
      localStorage.removeItem(key)
    } catch {
      // Игнорируем ошибки при очистке
    }
    return null
  }
}

// Browser client для клиентских компонентов (singleton)
export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Server-side: создаем новый клиент каждый раз
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }

  // Client-side: используем singleton
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: {
          getItem: (key: string) => {
            return safeGetStorageItem(key)
          },
          setItem: (key: string, value: string) => {
            try {
              localStorage.setItem(key, value)
            } catch (error) {
              console.warn(`Failed to set storage item ${key}:`, error)
            }
          },
          removeItem: (key: string) => {
            try {
              localStorage.removeItem(key)
            } catch (error) {
              console.warn(`Failed to remove storage item ${key}:`, error)
            }
          }
        }
      }
    })
  }

  return browserClient
})()

// Server client для серверных компонентов
export function createServerSupabaseClient(cookies?: {
  get: (name: string) => string | undefined
  set: (name: string, value: string, options?: Record<string, unknown>) => void
  remove: (name: string, options?: Record<string, unknown>) => void
}) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookies || {
      get() {
        // В серверном контексте используем cookies из headers
        return ''
      },
      set() {
        // Будет реализовано в серверных компонентах
      },
      remove() {
        // Будет реализовано в серверных компонентах
      }
    }
  })
}

// Типы для авторизации
export interface AuthUser {
  id: string
  email: string
  name?: string
  created_at: string
}

export interface AuthResponse {
  user: AuthUser | null
  error: string | null
}
