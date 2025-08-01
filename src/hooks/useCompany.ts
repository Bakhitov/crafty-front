import { useState, useEffect, useCallback, useRef } from 'react'
import { Company, CompanyResponse } from '@/types/company'
import { useAuthContext } from '@/components/AuthProvider'
import { getCachedCompany, requestCache } from '@/lib/requestCache'
import { invalidateMiddlewareCache } from '@/lib/middlewareCache'

// Глобальные флаги для предотвращения множественных инициализаций
let globalCompanyFetchInProgress = false
let globalLastCompanyFetch = 0

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthContext()
  const lastFetchTimeRef = useRef<number>(0)
  const fetchInProgressRef = useRef<boolean>(false)
  const userIdRef = useRef<string | undefined>(undefined)
  const initializedRef = useRef<boolean>(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchCompany = useCallback(
    async (force = false) => {
      const currentUserId = user?.id

      if (!currentUserId) {
        setCompany(null)
        setLoading(false)
        setError(null)
        return
      }

      // Предотвращаем множественные одновременные запросы (локально и глобально)
      if (
        (fetchInProgressRef.current || globalCompanyFetchInProgress) &&
        !force
      ) {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            'useCompany: Fetch already in progress (local or global), skipping'
          )
        }
        return
      }

      // Предотвращаем слишком частые запросы ТОЛЬКО если не force (глобально)
      const now = Date.now()
      if (
        (now - lastFetchTimeRef.current < 120000 ||
          now - globalLastCompanyFetch < 120000) &&
        !force
      ) {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            'useCompany: Too frequent requests (local or global), skipping'
          )
        }
        return
      }

      try {
        fetchInProgressRef.current = true
        globalCompanyFetchInProgress = true
        setLoading(true)
        setError(null)
        lastFetchTimeRef.current = now
        globalLastCompanyFetch = now

        if (process.env.NODE_ENV === 'development') {
          console.log(
            'useCompany: Fetching company for user:',
            currentUserId,
            'force:',
            force
          )
        }

        // При принудительном обновлении очищаем кэш
        if (force) {
          if (process.env.NODE_ENV === 'development') {
            console.log('useCompany: Force refresh - clearing cache')
          }
          requestCache.invalidate('/api/v1/companies', {
            key: `company-${currentUserId}`
          })
        }

        // Используем кешированный запрос
        const companyData = await getCachedCompany(currentUserId)

        // Создаем объект в формате CompanyResponse для совместимости
        const data: CompanyResponse = {
          success: true,
          company: companyData.company as unknown as Company
        }

        // Устанавливаем компанию независимо от is_active
        // Логика доступа будет обрабатываться в useCompanyAccess
        if (process.env.NODE_ENV === 'development') {
          console.log('useCompany: Company loaded:', {
            id: data.company.id,
            name: data.company.name,
            is_active: data.company.is_active,
            user_ids: data.company.user_ids
          })
        }

        setCompany(data.company)
      } catch (err) {
        console.error('useCompany: Error fetching company:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setCompany(null)

        // При ошибке очищаем кеш для повторной попытки
        if (currentUserId) {
          requestCache.invalidate('/api/v1/companies', {
            key: `company-${currentUserId}`
          })
        }
      } finally {
        setLoading(false)
        fetchInProgressRef.current = false
        globalCompanyFetchInProgress = false
      }
    },
    [user?.id]
  )

  // Дебаунсированная версия fetchCompany для предотвращения спама
  const debouncedFetchCompany = useCallback(
    (force = false) => {
      // Если force, выполняем сразу
      if (force) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
          debounceTimeoutRef.current = null
        }
        return fetchCompany(true)
      }

      // Иначе дебаунсим на 500ms
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      debounceTimeoutRef.current = setTimeout(() => {
        fetchCompany(false)
        debounceTimeoutRef.current = null
      }, 500)
    },
    [fetchCompany]
  )

  // Первоначальная загрузка компании ТОЛЬКО при изменении user.id
  useEffect(() => {
    // Проверяем, изменился ли пользователь
    const currentUserId = user?.id
    const previousUserId = userIdRef.current

    if (currentUserId !== previousUserId) {
      console.log('useCompany: User changed, fetching company:', {
        previous: previousUserId,
        current: currentUserId
      })

      userIdRef.current = currentUserId
      initializedRef.current = false

      if (currentUserId) {
        fetchCompany(true) // force = true для новой загрузки
      } else {
        // Пользователь разлогинился
        setCompany(null)
        setLoading(false)
        setError(null)
      }
    } else if (currentUserId && !initializedRef.current) {
      // Первая инициализация для текущего пользователя
      console.log('useCompany: Initial fetch for user:', currentUserId)
      initializedRef.current = true
      debouncedFetchCompany(false) // Используем дебаунсированную версию
    }
  }, [user?.id, fetchCompany, debouncedFetchCompany])

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Убираем автоматическое обновление - оно создает избыточные запросы
  // Компания будет обновляться только при необходимости

  // Обновление при фокусе на окне браузера убрано - будет только ручное обновление
  // через кнопку на странице access-denied

  const createCompany = useCallback(async () => {
    const currentUserId = user?.id

    if (!currentUserId) {
      setError('User not authenticated')
      return null
    }

    try {
      setLoading(true)
      setError(null)

      console.log('useCompany: Creating company for user:', currentUserId)

      const response = await fetch('/api/v1/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        )
      }

      const data = await response.json()
      console.log('useCompany: Company created successfully:', data.company)
      setCompany(data.company)

      // Инвалидируем кеш после создания
      requestCache.invalidate('/api/v1/companies', {
        key: `company-${currentUserId}`
      })

      return data.company
    } catch (err) {
      console.error('useCompany: Error creating company:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Возвращаем функцию refetch которая принуждает обновление
  const refetch = useCallback(() => {
    console.log('useCompany: Manual refetch requested')
    if (user?.id) {
      console.log('useCompany: Invalidating cache for user:', user.id)
      requestCache.invalidate('/api/v1/companies', {
        key: `company-${user.id}`
      })

      // Также инвалидируем кэш middleware
      invalidateMiddlewareCache(user.id)
    }
    console.log('useCompany: Calling fetchCompany with force=true')
    return fetchCompany(true)
  }, [fetchCompany, user?.id])

  return {
    company,
    loading,
    error,
    refetch,
    createCompany
  }
}
