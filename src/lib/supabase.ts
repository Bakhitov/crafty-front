import { createBrowserClient, createServerClient } from '@supabase/ssr'

// Supabase конфигурация
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wyehpfzafbjfvyjzgjss.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5ZWhwZnphZmJqZnZ5anpnanNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczMjU3OTUsImV4cCI6MjA1MjkwMTc5NX0.TUUdNKNQItJ2LKNf1YhkW1kgnOC4yXEZwKlODnOowGY'

// Browser client для клиентских компонентов
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server client для серверных компонентов
export function createServerSupabaseClient() {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get() {
        // В серверном контексте используем cookies из headers
        return ''
      },
      set() {
        // Будет реализовано в серверных компонентах
      },
      remove() {
        // Будет реализовано в серверных компонентах
      },
    },
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