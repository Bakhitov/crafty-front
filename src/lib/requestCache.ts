import { User } from '@supabase/supabase-js'
import { APIAgent } from '@/types/playground'

// Централизованная система кеширования запросов
interface CacheEntry<T> {
  data: T
  timestamp: number
  promise?: Promise<T>
}

interface RequestOptions {
  ttl?: number // время жизни кеша в миллисекундах
  key?: string // кастомный ключ кеша
  dedupe?: boolean // дедупликация одновременных запросов
}

// Тип для данных компании
interface CompanyData {
  company: {
    id: string
    name: string
    is_active: boolean
    [key: string]: unknown
  }
}

// Глобальный кеш для критически важных данных
class GlobalDataCache {
  private static instance: GlobalDataCache
  private companyData: Map<string, { data: CompanyData; timestamp: number }> =
    new Map()
  private pendingCompanyRequests: Map<string, Promise<CompanyData>> = new Map()

  // Добавляем кеш для auth данных
  private authData: { user: User; timestamp: number } | null = null
  private pendingAuthRequest: Promise<User> | null = null

  // Кеш для агентов с умной дедупликацией
  private agentsCache: Map<string, { data: APIAgent[]; timestamp: number }> =
    new Map()
  private pendingAgentsRequests: Map<string, Promise<APIAgent[]>> = new Map()

  static getInstance(): GlobalDataCache {
    if (!GlobalDataCache.instance) {
      GlobalDataCache.instance = new GlobalDataCache()
    }
    return GlobalDataCache.instance
  }

  async getCompanyData(userId: string): Promise<CompanyData> {
    const cached = this.companyData.get(userId)
    const now = Date.now()

    // Проверяем кеш (TTL 10 минут)
    if (cached && now - cached.timestamp < 600000) {
      return cached.data
    }

    // Проверяем pending запросы
    const pending = this.pendingCompanyRequests.get(userId)
    if (pending) {
      return pending
    }

    // Создаем новый запрос
    const requestPromise = fetch('/api/v1/companies', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const data = await response.json()

        // Сохраняем в кеш
        this.companyData.set(userId, { data, timestamp: now })

        return data
      })
      .finally(() => {
        this.pendingCompanyRequests.delete(userId)
      })

    this.pendingCompanyRequests.set(userId, requestPromise)
    return requestPromise
  }

  // Глобальный кеш для auth пользователя
  async getAuthUser(): Promise<User> {
    const now = Date.now()

    // Проверяем кеш (TTL 5 минут)
    if (this.authData && now - this.authData.timestamp < 300000) {
      return this.authData.user
    }

    // Проверяем pending запрос
    if (this.pendingAuthRequest) {
      return this.pendingAuthRequest
    }

    // Создаем новый запрос
    this.pendingAuthRequest = (async (): Promise<User> => {
      const { createBrowserClient } = await import('@supabase/ssr')
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const {
        data: { user },
        error
      } = await supabase.auth.getUser()

      if (error) {
        throw new Error(`Auth error: ${error.message}`)
      }

      // Сохраняем в кеш
      this.authData = { user: user as User, timestamp: now }

      return user as User
    })().finally(() => {
      this.pendingAuthRequest = null
    })

    return this.pendingAuthRequest as Promise<User>
  }

  // Оптимизированный кеш для агентов
  async getAgentsData(
    companyId: string,
    includePublic: boolean = true
  ): Promise<APIAgent[]> {
    const cacheKey = includePublic
      ? `${companyId}-with-public`
      : `${companyId}-only`
    const cached = this.agentsCache.get(cacheKey)
    const now = Date.now()

    // Проверяем кеш (TTL 5 минут)
    if (cached && now - cached.timestamp < 300000) {
      return cached.data
    }

    // Проверяем pending запросы
    const pending = this.pendingAgentsRequests.get(cacheKey)
    if (pending) {
      return pending
    }

    // Создаем новый запрос
    const requestPromise = (async () => {
      const { createBrowserClient } = await import('@supabase/ssr')
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      let query = supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (includePublic) {
        // Агенты компании + публичные
        query = query.or(`company_id.eq.${companyId},is_public.eq.true`)
      } else {
        // Только агенты компании
        query = query.eq('company_id', companyId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch agents: ${error.message}`)
      }

      const result = data || []

      // Сохраняем в кеш
      this.agentsCache.set(cacheKey, { data: result, timestamp: now })

      return result
    })().finally(() => {
      this.pendingAgentsRequests.delete(cacheKey)
    })

    this.pendingAgentsRequests.set(cacheKey, requestPromise)
    return requestPromise
  }

  invalidateCompany(userId: string) {
    this.companyData.delete(userId)
    this.pendingCompanyRequests.delete(userId)
  }

  invalidateAuth() {
    this.authData = null
    this.pendingAuthRequest = null
  }

  invalidateAgents(companyId?: string) {
    if (companyId) {
      // Invalidate specific company caches
      this.agentsCache.delete(`${companyId}-with-public`)
      this.agentsCache.delete(`${companyId}-only`)
      this.pendingAgentsRequests.delete(`${companyId}-with-public`)
      this.pendingAgentsRequests.delete(`${companyId}-only`)

      // Also invalidate any related request cache entries
      const keysToInvalidate = []
      for (const [key] of this.agentsCache) {
        if (key.includes(companyId)) {
          keysToInvalidate.push(key)
        }
      }
      keysToInvalidate.forEach((key) => {
        this.agentsCache.delete(key)
        this.pendingAgentsRequests.delete(key)
      })
    } else {
      // Clear all agents cache
      this.agentsCache.clear()
      this.pendingAgentsRequests.clear()
    }

    // Also invalidate the general request cache for agents endpoints
    if (typeof window !== 'undefined') {
      // Invalidate common agents API endpoints using the requestCache singleton
      requestCache.invalidate('/api/v1/agents')
      requestCache.invalidate('agents')
      if (companyId) {
        requestCache.invalidate(`agents-${companyId}`)
      }
    }
  }
}

export const globalDataCache = GlobalDataCache.getInstance()

class RequestCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private pendingRequests = new Map<string, Promise<unknown>>()

  private generateKey(url: string, options?: RequestOptions): string {
    if (options?.key) {
      return options.key
    }
    return url
  }

  private isExpired(entry: CacheEntry<unknown>, ttl: number): boolean {
    return Date.now() - entry.timestamp > ttl
  }

  async get<T>(
    url: string,
    fetcher: () => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    const key = this.generateKey(url, options)
    const ttl = options.ttl || 30000 // 30 секунд по умолчанию
    const shouldDedupe = options.dedupe !== false // по умолчанию включена дедупликация

    // Проверяем кеш
    const cached = this.cache.get(key)
    if (cached && !this.isExpired(cached, ttl)) {
      return cached.data as T
    }

    // Проверяем, есть ли уже запущенный запрос (если включена дедупликация)
    if (shouldDedupe) {
      const pendingRequest = this.pendingRequests.get(key)
      if (pendingRequest) {
        return pendingRequest as Promise<T>
      }
    }

    // Создаем новый запрос
    const requestPromise = fetcher()

    if (shouldDedupe) {
      this.pendingRequests.set(key, requestPromise)
    }

    try {
      const data = await requestPromise

      // Сохраняем в кеш
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      })

      return data
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`RequestCache: Request failed for ${key}:`, error)
      }
      throw error
    } finally {
      // Удаляем из pending запросов
      if (shouldDedupe) {
        this.pendingRequests.delete(key)
      }
    }
  }

  // Принудительно очистить кеш для ключа
  invalidate(keyOrUrl: string, options?: RequestOptions): void {
    const key = this.generateKey(keyOrUrl, options)
    this.cache.delete(key)
    this.pendingRequests.delete(key)
  }

  // Очистить весь кеш
  clear(): void {
    this.cache.clear()
    this.pendingRequests.clear()
  }

  // Получить статистику кеша
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.keys())
    }
  }
}

// Экспортируем синглтон
export const requestCache = new RequestCache()

// Утилиты для конкретных типов запросов
export const cachedFetch = async <T,>(
  url: string,
  options: RequestInit & RequestOptions = {}
): Promise<T> => {
  const { ttl, key, dedupe, ...fetchOptions } = options

  return requestCache.get(
    url,
    async () => {
      const response = await fetch(url, fetchOptions)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return response.json()
    },
    { ttl, key, dedupe }
  )
}

// Специализированные функции для наших API
export const getCachedCompany = async (userId: string) => {
  return globalDataCache.getCompanyData(userId)
}

export const getCachedAuthUser = async () => {
  return globalDataCache.getAuthUser()
}

export const getCachedAgents = async (
  companyId: string,
  includePublic: boolean = true
) => {
  return globalDataCache.getAgentsData(companyId, includePublic)
}

export const getCachedHealthCheck = async (endpoint: string) => {
  return requestCache.get(
    `health-${endpoint}`,
    async () => {
      try {
        // Попытка 1: Прямой запрос без preflight (убираем Content-Type)
        const response = await fetch(`${endpoint}/v1/health`, {
          method: 'GET',
          mode: 'cors'
          // Убираем Content-Type чтобы избежать preflight OPTIONS запроса
        })
        return response.status
      } catch (error) {
        console.warn(
          `Direct health check failed for ${endpoint}, trying proxy:`,
          error
        )

        try {
          // Попытка 2: Через наш прокси API (избегает CORS)
          const proxyUrl = `/api/v1/health-proxy?endpoint=${encodeURIComponent(endpoint)}`
          const proxyResponse = await fetch(proxyUrl)

          if (proxyResponse.ok) {
            const data = await proxyResponse.json()
            return data.status || 503
          }

          return 503
        } catch (proxyError) {
          console.warn(`Health proxy also failed for ${endpoint}:`, proxyError)
          return 503
        }
      }
    },
    { ttl: 30000, dedupe: true } // 30 секунд с дедупликацией
  )
}
