import { useState, useEffect, useCallback, useRef } from 'react'
import { useCompany } from './useCompany'
import { APIAgent } from '@/types/playground'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface UseAgentsOptions {
  category?: string
  includePublic?: boolean
  limit?: number
}

export const useAgents = (options: UseAgentsOptions = {}) => {
  const [agents, setAgents] = useState<APIAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { company } = useCompany()

  // Используем ref для предотвращения повторных запросов
  const fetchInProgressRef = useRef(false)
  const lastFetchParamsRef = useRef<string>('')

  const fetchAgents = useCallback(
    async (force = false) => {
      // Создаем ключ для кеширования на основе параметров
      const fetchKey = JSON.stringify({
        companyId: company?.id,
        category: options.category,
        includePublic: options.includePublic,
        limit: options.limit
      })

      // Предотвращаем повторные запросы с теми же параметрами (если не принудительный запрос)
      if (!force && fetchInProgressRef.current) {
        console.log('useAgents: Fetch already in progress, skipping')
        return
      }

      // Для принудительного обновления всегда сбрасываем кеш
      if (force) {
        lastFetchParamsRef.current = ''
        console.log('useAgents: Force refresh - clearing cache')
      } else if (lastFetchParamsRef.current === fetchKey) {
        console.log('useAgents: Same params and not forced, skipping')
        return
      }

      fetchInProgressRef.current = true
      lastFetchParamsRef.current = fetchKey

      try {
        setLoading(true)
        setError(null)

        // Получаем текущего пользователя
        const {
          data: { user }
        } = await supabase.auth.getUser()

        if (!user) {
          setError('User not authenticated')
          setAgents([])
          return
        }

        let query = supabase
          .from('agents')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        // Логика фильтрации по доступности
        if (company?.id) {
          console.log('useAgents: Loading agents for company:', {
            companyId: company.id,
            includePublic: options.includePublic,
            willLoadCompanyAgents: true,
            willLoadPublicAgents: options.includePublic !== false
          })

          // Если есть компания, показываем агентов компании + публичные
          if (options.includePublic !== false) {
            query = query.or(`company_id.eq.${company.id},is_public.eq.true`)
            console.log(
              'useAgents: Query filter - company agents + public agents'
            )
          } else {
            // Только агенты компании
            query = query.eq('company_id', company.id)
            console.log('useAgents: Query filter - ONLY company agents')
          }
        } else {
          console.log('useAgents: No company found, loading only public agents')
          // Если нет компании, показываем только публичные агенты
          query = query.eq('is_public', true)
          console.log('useAgents: Query filter - ONLY public agents')
        }

        // Фильтрация по категории
        if (options.category) {
          query = query.eq('category', options.category)
        }

        // Лимит
        if (options.limit) {
          query = query.limit(options.limit)
        }

        const { data, error: fetchError } = await query

        if (fetchError) {
          throw new Error(`Failed to fetch agents: ${fetchError.message}`)
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('useAgents: Query result:', {
            totalAgents: data?.length || 0,
            companyId: company?.id,
            agents:
              data?.map((agent: APIAgent) => ({
                agent_id: agent.agent_id,
                name: agent.name,
                is_public: agent.is_public,
                company_id: agent.company_id
              })) || []
          })
        }

        const result = data || []
        setAgents(result)
        return result
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch agents'
        setError(errorMessage)
        console.error('Error fetching agents:', err)
        toast.error('Ошибка загрузки агентов')
        return []
      } finally {
        setLoading(false)
        fetchInProgressRef.current = false
      }
    },
    [company, options.category, options.includePublic, options.limit]
  )

  // Загружаем агентов только при значимых изменениях зависимостей
  useEffect(() => {
    // Сбрасываем кеш при изменении компании
    const currentFetchKey = lastFetchParamsRef.current
    const currentCompanyId = company?.id || ''
    if (!currentFetchKey.includes(currentCompanyId)) {
      lastFetchParamsRef.current = ''
    }
    fetchAgents()
  }, [fetchAgents, company?.id])

  // Функция для обновления списка агентов
  const refreshAgents = useCallback(() => {
    return fetchAgents(true) // Принудительное обновление
  }, [fetchAgents])

  // Функция для поиска агентов
  const searchAgents = useCallback(
    async (searchQuery: string) => {
      try {
        setLoading(true)
        setError(null)

        const {
          data: { user }
        } = await supabase.auth.getUser()

        if (!user) {
          setError('User not authenticated')
          return []
        }

        let query = supabase
          .from('agents')
          .select('*')
          .eq('is_active', true)
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)

        // Фильтрация по доступности
        if (company?.id) {
          query = query.or(`company_id.eq.${company.id},is_public.eq.true`)
        } else {
          // Если нет компании, но есть пользователь, показываем агентов пользователя + публичные агенты
          query = query.or(`user_id.eq.${user.id},is_public.eq.true`)
        }

        // Фильтрация по категории
        if (options.category) {
          query = query.eq('category', options.category)
        }

        // Сортировка по релевантности
        query = query.order('name', { ascending: true })

        // Лимит
        if (options.limit) {
          query = query.limit(options.limit)
        }

        const { data, error: searchError } = await query

        if (searchError) {
          throw new Error(`Failed to search agents: ${searchError.message}`)
        }

        const results = data || []
        setAgents(results)
        return results
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to search agents'
        setError(errorMessage)
        console.error('Error searching agents:', err)
        toast.error('Ошибка поиска агентов')
        return []
      } finally {
        setLoading(false)
      }
    },
    [company, options.category, options.limit]
  )

  // Функция для получения конкретного агента
  const getAgent = useCallback(
    async (agentId: string): Promise<APIAgent | null> => {
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('agent_id', agentId)
          .eq('is_active', true)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            return null // Агент не найден
          }
          throw new Error(`Failed to fetch agent: ${error.message}`)
        }

        return data
      } catch (err) {
        console.error('Error fetching agent:', err)
        toast.error('Ошибка загрузки агента')
        return null
      }
    },
    []
  )

  return {
    agents,
    loading,
    error,
    refreshAgents,
    searchAgents,
    getAgent
  }
}

// Хук для получения публичных агентов
export const usePublicAgents = (
  options: Omit<UseAgentsOptions, 'includePublic'> = {}
) => {
  return useAgents({ ...options, includePublic: false })
}

// Хук для получения агентов компании
export const useCompanyAgents = (options: UseAgentsOptions = {}) => {
  return useAgents({ ...options, includePublic: false })
}
