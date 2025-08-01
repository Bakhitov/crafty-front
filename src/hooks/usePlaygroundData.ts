// Оптимизированный хук для загрузки данных playground
// Заменяет множественные хуки одним централизованным
// ИСПРАВЛЯЕТ проблему множественных дублирующихся запросов

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuthContext } from '@/components/AuthProvider'
import { useCompanyContext } from '@/components/CompanyProvider'
import { usePlaygroundStore } from '@/store'
import {
  getCachedAgents,
  getCachedHealthCheck,
  requestCache
} from '@/lib/requestCache'
import { transformAPIAgentsToCombobox } from '@/lib/apiClient'

// Import AgentOption type from store
interface AgentOption {
  value: string
  label: string
  model: {
    provider: string
  }
  storage?: boolean
  storage_config?: {
    enabled?: boolean
  }
  is_public?: boolean
  company_id?: string
  description?: string
  system_instructions?: string[]
  category?: string
  photo?: string
}

interface UsePlaygroundDataOptions {
  endpoint?: string
  autoLoad?: boolean
}

// Глобальный флаг для предотвращения множественных загрузок
let globalLoadInProgress = false
let lastLoadTime = 0

interface UsePlaygroundDataReturn {
  isLoading: boolean
  isReady: boolean
  error: string | null
  progress: number

  // Методы
  reload: () => Promise<void>
  invalidate: () => void
}

// Оптимизированная система пакетной загрузки данных
class PlaygroundDataLoader {
  private static instance: PlaygroundDataLoader
  private batchQueue: Array<{
    companyId: string
    endpoint?: string
    resolve: (data: { agents: AgentOption[]; healthStatus: number }) => void
    reject: (error: Error) => void
  }> = []
  private batchTimer: NodeJS.Timeout | null = null
  private readonly BATCH_DELAY = 50 // 50ms для группировки запросов

  static getInstance(): PlaygroundDataLoader {
    if (!PlaygroundDataLoader.instance) {
      PlaygroundDataLoader.instance = new PlaygroundDataLoader()
    }
    return PlaygroundDataLoader.instance
  }

  async loadData(
    companyId: string,
    endpoint?: string
  ): Promise<{
    agents: AgentOption[]
    healthStatus: number
  }> {
    return new Promise((resolve, reject) => {
      // Добавляем в очередь пакетной обработки
      this.batchQueue.push({ companyId, endpoint, resolve, reject })

      // Устанавливаем таймер для обработки пакета
      if (this.batchTimer) {
        clearTimeout(this.batchTimer)
      }

      this.batchTimer = setTimeout(() => {
        this.processBatch()
      }, this.BATCH_DELAY)
    })
  }

  private async processBatch() {
    const currentBatch = [...this.batchQueue]
    this.batchQueue = []
    this.batchTimer = null

    if (currentBatch.length === 0) return

    console.log(
      `PlaygroundDataLoader: Processing batch of ${currentBatch.length} requests`
    )

    // Группируем запросы по companyId и endpoint
    const uniqueRequests = new Map<string, (typeof currentBatch)[0]>()
    const requestGroups = new Map<string, typeof currentBatch>()

    for (const request of currentBatch) {
      const key = `${request.companyId}-${request.endpoint || 'no-endpoint'}`

      if (!uniqueRequests.has(key)) {
        uniqueRequests.set(key, request)
        requestGroups.set(key, [])
      }
      requestGroups.get(key)!.push(request)
    }

    // Выполняем уникальные запросы параллельно
    const promises = Array.from(uniqueRequests.entries()).map(
      async ([key, request]) => {
        try {
          const [agents, healthStatus] = await Promise.all([
            getCachedAgents(request.companyId, true), // включаем публичные агенты
            request.endpoint
              ? getCachedHealthCheck(request.endpoint)
              : Promise.resolve(503)
          ])

          const transformedAgents = transformAPIAgentsToCombobox(agents || [])
          const result = { agents: transformedAgents, healthStatus }

          // Уведомляем все запросы в группе
          const group = requestGroups.get(key)!
          for (const groupRequest of group) {
            groupRequest.resolve(result)
          }
        } catch (error) {
          // Уведомляем об ошибке все запросы в группе
          const group = requestGroups.get(key)!
          for (const groupRequest of group) {
            groupRequest.reject(
              error instanceof Error ? error : new Error('Unknown error')
            )
          }
        }
      }
    )

    await Promise.allSettled(promises)
  }
}

const dataLoader = PlaygroundDataLoader.getInstance()

export function usePlaygroundData(
  options: UsePlaygroundDataOptions = {}
): UsePlaygroundDataReturn {
  const { endpoint, autoLoad = true } = options
  const { user } = useAuthContext()
  const { company } = useCompanyContext()
  const {
    setAgents,
    setSelectedEndpoint,
    setIsEndpointActive,
    setIsEndpointLoading
  } = usePlaygroundStore()

  const [loading, setLoading] = useState({
    isLoading: false,
    error: null as string | null,
    progress: 0
  })

  const loadInProgressRef = useRef(false)
  const lastCompanyIdRef = useRef<string | null>(null)
  const lastEndpointRef = useRef<string | null>(null)

  const loadData = useCallback(
    async (force = false) => {
      // Предотвращаем множественные одновременные запросы
      if ((loadInProgressRef.current || globalLoadInProgress) && !force) {
        console.log('usePlaygroundData: Load already in progress, skipping')
        return
      }

      // Предотвращаем слишком частые запросы (только если не force)
      const now = Date.now()
      if (now - lastLoadTime < 5000 && !force) {
        // Уменьшаем с 10s до 5s
        console.log('usePlaygroundData: Too frequent requests, skipping')
        return
      }

      if (!user?.id || !company?.id) {
        setLoading({ isLoading: false, error: null, progress: 0 })
        return
      }

      // Проверяем, нужно ли перезагружать данные
      const companyChanged = lastCompanyIdRef.current !== company.id
      const endpointChanged = lastEndpointRef.current !== endpoint

      if (
        !force &&
        !companyChanged &&
        !endpointChanged &&
        loading.progress === 100
      ) {
        console.log('usePlaygroundData: Data already loaded and up to date')
        return
      }

      try {
        loadInProgressRef.current = true
        globalLoadInProgress = true
        lastLoadTime = now
        lastCompanyIdRef.current = company.id
        lastEndpointRef.current = endpoint || null

        setLoading({ isLoading: true, error: null, progress: 10 })
        setIsEndpointLoading(true)

        console.log('usePlaygroundData: Starting optimized data load for:', {
          userId: user.id,
          companyId: company.id,
          endpoint,
          force,
          companyChanged,
          endpointChanged
        })

        // При принудительном обновлении очищаем кеш
        if (force) {
          requestCache.invalidate(`agents-${company.id}`)
          if (endpoint) {
            requestCache.invalidate(`health-${endpoint}`)
          }
        }

        setLoading((prev) => ({ ...prev, progress: 30 }))

        // Используем оптимизированный загрузчик с глобальным кешем
        const result = await dataLoader.loadData(company.id, endpoint)

        setLoading((prev) => ({ ...prev, progress: 80 }))

        // Обновляем store одним батчем
        setAgents(result.agents)

        if (endpoint) {
          setSelectedEndpoint(endpoint)
          setIsEndpointActive(result.healthStatus === 200)
        }

        setLoading((prev) => ({ ...prev, progress: 100, isLoading: false }))

        console.log('usePlaygroundData: Data loaded successfully:', {
          agentsCount: result.agents.length,
          healthStatus: result.healthStatus,
          endpoint
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to load playground data'

        console.error('usePlaygroundData: Load error:', error)
        setLoading({
          isLoading: false,
          error: errorMessage,
          progress: 0
        })
      } finally {
        loadInProgressRef.current = false
        globalLoadInProgress = false
        setIsEndpointLoading(false)
      }
    },
    [
      user?.id,
      company?.id,
      endpoint,
      setAgents,
      setSelectedEndpoint,
      setIsEndpointActive,
      setIsEndpointLoading,
      loading.progress
    ]
  )

  const invalidate = useCallback(() => {
    if (company?.id) {
      requestCache.invalidate(`agents-${company.id}`)
    }
    if (endpoint) {
      requestCache.invalidate(`health-${endpoint}`)
    }
    // Сбрасываем состояние для принуждения к перезагрузке
    lastCompanyIdRef.current = null
    lastEndpointRef.current = null
    setLoading({ isLoading: false, error: null, progress: 0 })
    console.log('usePlaygroundData: Cache invalidated')
  }, [company?.id, endpoint])

  const reload = useCallback(async () => {
    await loadData(true)
  }, [loadData])

  // Автоматическая загрузка при изменении зависимостей
  useEffect(() => {
    if (autoLoad && user?.id && company?.id) {
      loadData()
    }
  }, [autoLoad, user?.id, company?.id, endpoint, loadData])

  return {
    isLoading: loading.isLoading,
    isReady: loading.progress === 100 && !loading.error,
    error: loading.error,
    progress: loading.progress,
    reload,
    invalidate
  }
}
