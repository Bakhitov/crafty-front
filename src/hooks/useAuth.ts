import { useState, useEffect } from 'react'
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface UseAuthReturn {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Получаем текущего пользователя
    const getUser = async () => {
      const {
        data: { user: currentUser }
      } = await supabase.auth.getUser()
      setUser(currentUser)
      setLoading(false)
    }

    getUser()

    // Слушаем изменения аутентификации
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch {
      return { error: 'Произошла ошибка при входе' }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch {
      return { error: 'Произошла ошибка при регистрации' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      // Выходим из Supabase Auth сначала
      await supabase.auth.signOut()

      // Очищаем все локальные данные браузера связанные с сессией
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }

      // Очищаем пользователя в конце, чтобы middleware успел обработать редирект
      setUser(null)
    } catch (error) {
      console.error('Error during sign out:', error)
      // При ошибке все равно очищаем пользователя
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch {
      return { error: 'Произошла ошибка при сбросе пароля' }
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword
  }
}
