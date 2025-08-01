// Централизованная система загрузки playground
// Координирует все запросы и минимизирует re-renders

import {
  getCachedCompany,
  getCachedAgents,
  getCachedHealthCheck
} from '@/lib/requestCache'
import { transformAPIAgentsToCombobox } from '@/lib/apiClient'
import type { ComboboxAgent } from '@/types/playground'
import type { Company } from '@/types/company'

export interface PlaygroundData {
  company: Company
  agents: ComboboxAgent[]
  healthStatus: number
  isReady: boolean
}

export interface LoadingState {
  isLoading: boolean
  error: string | null
  progress: number // 0-100
}

class PlaygroundLoader {
  private cache = new Map<string, PlaygroundData>()
  private loadingStates = new Map<string, LoadingState>()

  async loadPlaygroundData(
    userId: string,
    endpoint?: string
  ): Promise<{
    data: PlaygroundData | null
    loading: LoadingState
  }> {
    const cacheKey = `${userId}-${endpoint || 'no-endpoint'}`

    // Проверяем кэш
    const cached = this.cache.get(cacheKey)
    if (cached?.isReady) {
      return {
        data: cached,
        loading: { isLoading: false, error: null, progress: 100 }
      }
    }

    // Проверяем, идет ли уже загрузка
    let loadingState = this.loadingStates.get(cacheKey)
    if (loadingState?.isLoading) {
      return { data: null, loading: loadingState }
    }

    // Начинаем загрузку
    loadingState = { isLoading: true, error: null, progress: 0 }
    this.loadingStates.set(cacheKey, loadingState)

    try {
      // Параллельная загрузка всех данных
      const promises = [
        getCachedCompany(userId),
        endpoint ? getCachedHealthCheck(endpoint) : Promise.resolve(503)
      ]

      // Загружаем компанию и health check параллельно
      loadingState.progress = 30
      const [companyResponse, healthStatus] = await Promise.all(promises)

      const companyData = companyResponse as unknown as { company: Company }
      if (!companyData?.company) {
        throw new Error('Company not found')
      }

      // Загружаем агентов после получения компании
      loadingState.progress = 60
      const agentsData = await getCachedAgents(companyData.company.id)
      const agents = transformAPIAgentsToCombobox(agentsData || [])

      // Создаем финальный объект данных
      loadingState.progress = 90
      const playgroundData: PlaygroundData = {
        company: companyData.company,
        agents,
        healthStatus: typeof healthStatus === 'number' ? healthStatus : 503,
        isReady: true
      }

      // Сохраняем в кэш
      this.cache.set(cacheKey, playgroundData)
      loadingState.progress = 100
      loadingState.isLoading = false

      return {
        data: playgroundData,
        loading: loadingState
      }
    } catch (error) {
      loadingState.isLoading = false
      loadingState.error =
        error instanceof Error ? error.message : 'Unknown error'

      return {
        data: null,
        loading: loadingState
      }
    } finally {
      // Очищаем состояние загрузки через некоторое время
      setTimeout(() => {
        this.loadingStates.delete(cacheKey)
      }, 5000)
    }
  }

  // Инвалидация кэша
  invalidate(userId: string, endpoint?: string) {
    const cacheKey = `${userId}-${endpoint || 'no-endpoint'}`
    this.cache.delete(cacheKey)
    this.loadingStates.delete(cacheKey)
  }

  // Очистка всего кэша
  clear() {
    this.cache.clear()
    this.loadingStates.clear()
  }
}

// Экспортируем синглтон
export const playgroundLoader = new PlaygroundLoader()
