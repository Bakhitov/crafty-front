'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import { getCachedAuthUser, globalDataCache } from '@/lib/requestCache'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true
})

// Функция для автоматического создания компании убрана
// Теперь компании создаются только через API endpoint при первом обращении

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Получаем текущую сессию через глобальный кеш
    const getSession = async () => {
      try {
        const cachedUser = await getCachedAuthUser()
        setUser(cachedUser)
      } catch {
        console.log('AuthProvider: Using fallback auth method')
        const {
          data: { session }
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }

    getSession()

    // Подписываемся на изменения авторизации
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // Инвалидируем кеш при изменении авторизации
      globalDataCache.invalidateAuth()
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
