// Легковесный и быстрый API клиент для работы с агентами и инструментами
import { APIAgent } from '@/types/playground'

interface APIError extends Error {
  status?: number
  statusText?: string
}

export interface Agent {
  id?: string // UUID from Supabase
  agent_id: string
  name?: string
  description?: string
  model_config?: {
    id: string
    provider: string
    temperature?: number
    max_tokens?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
    stop?: string[]
    seed?: number
    timeout?: number
    max_retries?: number
  }
  system_instructions?: string[]
  tool_ids?: string[]
  user_id?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
  agent_config?: Record<string, unknown>
  is_public?: boolean
  company_id?: string
  photo?: string
  category?: string

  // New fields added to match updated schema
  goal?: string
  expected_output?: string
  role?: string

  // Legacy fields for backward compatibility
  instructions?: string
  is_active_api?: boolean
  model_configuration?: {
    provider?: string
    id?: string
    temperature?: number
    max_tokens?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
    stop?: string[]
    seed?: number
    timeout?: number
    max_retries?: number
    [key: string]: unknown
  }
  tools_config?: {
    enabled?: boolean
    tools?: Array<{
      tool_id: string
      name?: string
      type?: string
      [key: string]: unknown
    }>
    [key: string]: unknown
  }
  memory_config?: {
    enabled?: boolean
    [key: string]: unknown
  }
  knowledge_config?: {
    enabled?: boolean
    [key: string]: unknown
  }
  storage_config?: {
    enabled?: boolean
    [key: string]: unknown
  }
  reasoning_config?: {
    enabled?: boolean
    [key: string]: unknown
  }
  team_config?: {
    team_mode?: string
    role?: string
    respond_directly?: boolean
    add_transfer_instructions?: boolean
    [key: string]: unknown
  }
  settings?: {
    tags?: string[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface Tool {
  id?: string // UUID primary key
  name: string // unique name
  description: string
  type: 'dynamic' | 'custom' | 'mcp'
  configuration?: Record<string, unknown>
  is_public?: boolean
  is_active?: boolean
  company_id?: string
  user_id?: string
  display_name?: string
  category?: string
  created_at?: string
  updated_at?: string
  // Для обратной совместимости
  tool_id?: string
  config?: Record<string, unknown>
}

export interface SearchParams {
  query?: string
  tags?: string
  company_id?: string
}

class APIClient {
  private baseUrl = '/api/v1' // Изменено для использования локальных API роутов
  public endpoint: string

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  private async request<T>(
    path: string,
    params?: Record<string, string>,
    options?: RequestInit,
    retries = 3
  ): Promise<T> {
    // Для методов агентов используем локальные API роуты
    if (path.startsWith('/agents')) {
      const url = new URL(`${this.baseUrl}${path}`, window.location.origin)

      // Добавляем дополнительные параметры
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) url.searchParams.set(key, value)
        })
      }

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await fetch(url.toString(), {
            ...options,
            credentials: 'include', // Включаем cookies для аутентификации
            headers: {
              'Content-Type': 'application/json',
              ...options?.headers
            }
          })

          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error')
            const error: APIError = new Error(
              `API Error ${response.status}: ${response.statusText}. ${errorText}`
            )
            error.status = response.status
            error.statusText = response.statusText

            // Не повторяем запрос для клиентских ошибок (4xx)
            if (response.status >= 400 && response.status < 500) {
              throw error
            }

            // Повторяем только для серверных ошибок (5xx) и сетевых проблем
            if (attempt === retries) {
              throw error
            }

            // Экспоненциальная задержка между попытками
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempt) * 1000)
            )
            continue
          }

          return response.json()
        } catch (error) {
          if (attempt === retries) {
            // Улучшенное сообщение об ошибке
            if (error instanceof TypeError && error.message.includes('fetch')) {
              throw new Error(
                `Network error: Unable to connect to API. Please check your connection.`
              )
            }
            throw error
          }

          // Задержка перед повтором
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          )
        }
      }

      throw new Error('Unexpected error in request method')
    }

    // Для остальных запросов (инструменты) используем внешний Agno API
    const url = new URL(`/v1${path}`, this.endpoint)

    // Добавляем дополнительные параметры
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value)
      })
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url.toString(), options)

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          const error: APIError = new Error(
            `API Error ${response.status}: ${response.statusText}. ${errorText}`
          )
          error.status = response.status
          error.statusText = response.statusText

          // Не повторяем запрос для клиентских ошибок (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw error
          }

          // Повторяем только для серверных ошибок (5xx) и сетевых проблем
          if (attempt === retries) {
            throw error
          }

          // Экспоненциальная задержка между попытками
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          )
          continue
        }

        return response.json()
      } catch (error) {
        if (attempt === retries) {
          // Улучшенное сообщение об ошибке
          if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error(
              `Network error: Unable to connect to API. Please check your connection.`
            )
          }
          throw error
        }

        // Задержка перед повтором
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        )
      }
    }

    throw new Error('Unexpected error in request method')
  }

  // === АГЕНТЫ (Новые методы для Supabase) ===

  // Получить всех агентов (с фильтрацией)
  async getAgents(params?: {
    company_id?: string
    is_public?: boolean
    category?: string
    limit?: number
    offset?: number
  }): Promise<Agent[]> {
    const searchParams: Record<string, string> = {}
    if (params?.company_id) searchParams.company_id = params.company_id
    if (params?.is_public !== undefined)
      searchParams.is_public = params.is_public.toString()
    if (params?.category) searchParams.category = params.category
    if (params?.limit) searchParams.limit = params.limit.toString()
    if (params?.offset) searchParams.offset = params.offset.toString()

    const response = await this.request<{ success: boolean; agents: Agent[] }>(
      '/agents',
      searchParams
    )
    return response.agents
  }

  // Получить конкретного агента
  async getAgent(agentId: string): Promise<Agent> {
    const response = await this.request<{ success: boolean; agent: Agent }>(
      `/agents/${agentId}`
    )
    return response.agent
  }

  // Создать нового агента
  async createAgent(agentData: {
    agent_id: string
    name: string
    description?: string
    model_config?: Agent['model_config']
    system_instructions?: string[]
    tool_ids?: string[]
    agent_config?: Record<string, unknown>
    is_public?: boolean
    photo?: string
    category?: string
  }): Promise<Agent> {
    const response = await this.request<{ success: boolean; agent: Agent }>(
      '/agents',
      {},
      {
        method: 'POST',
        body: JSON.stringify(agentData)
      }
    )
    return response.agent
  }

  // Обновить агента
  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent> {
    const response = await this.request<{ success: boolean; agent: Agent }>(
      `/agents/${agentId}`,
      {},
      {
        method: 'PUT',
        body: JSON.stringify(updates)
      }
    )
    return response.agent
  }

  // Удалить агента (мягкое удаление)
  async deleteAgent(agentId: string): Promise<void> {
    await this.request(`/agents/${agentId}`, {}, { method: 'DELETE' })
  }

  // Получить публичных агентов (обновленный метод для Supabase)
  async getPublicAgents(params?: {
    category?: string
    limit?: number
    offset?: number
  }): Promise<Agent[]> {
    const searchParams: Record<string, string> = {}
    if (params?.category) searchParams.category = params.category
    if (params?.limit) searchParams.limit = params.limit.toString()
    if (params?.offset) searchParams.offset = params.offset.toString()

    const response = await this.request<{ success: boolean; agents: Agent[] }>(
      '/agents/public',
      searchParams
    )
    return response.agents
  }

  // Получить агентов компании (обновленный метод для Supabase)
  async getCompanyAgents(
    companyId: string,
    params?: {
      category?: string
      limit?: number
      offset?: number
    }
  ): Promise<Agent[]> {
    const searchParams: Record<string, string> = {}
    if (params?.category) searchParams.category = params.category
    if (params?.limit) searchParams.limit = params.limit.toString()
    if (params?.offset) searchParams.offset = params.offset.toString()

    const response = await this.request<{ success: boolean; agents: Agent[] }>(
      `/agents/company/${companyId}`,
      searchParams
    )
    return response.agents
  }

  // Получить доступных агентов для компании (обновленный метод для Supabase)
  async getAccessibleAgents(
    companyId: string,
    params?: {
      category?: string
      limit?: number
      offset?: number
    }
  ): Promise<Agent[]> {
    const searchParams: Record<string, string> = {}
    if (params?.category) searchParams.category = params.category
    if (params?.limit) searchParams.limit = params.limit.toString()
    if (params?.offset) searchParams.offset = params.offset.toString()

    const response = await this.request<{ success: boolean; agents: Agent[] }>(
      `/agents/company/${companyId}/accessible`,
      searchParams
    )
    return response.agents
  }

  // Поиск агентов (обновленный метод для Supabase)
  async searchAgents(params: {
    query: string
    category?: string
    company_id?: string
    limit?: number
    offset?: number
  }): Promise<Agent[]> {
    const searchParams: Record<string, string> = {
      query: params.query
    }
    if (params.category) searchParams.category = params.category
    if (params.company_id) searchParams.company_id = params.company_id
    if (params.limit) searchParams.limit = params.limit.toString()
    if (params.offset) searchParams.offset = params.offset.toString()

    const response = await this.request<{ success: boolean; agents: Agent[] }>(
      '/agents/search',
      searchParams
    )
    return response.agents
  }

  // === LEGACY МЕТОДЫ (для совместимости) ===

  // Получить список ID всех агентов (deprecated - используйте getAgents)
  async getAgentIds(): Promise<string[]> {
    const agents = await this.getAgents()
    return agents.map((agent) => agent.agent_id)
  }

  // Получить подробную информацию о всех агентах (deprecated - используйте getAgents)
  async getAgentsDetailed(): Promise<Agent[]> {
    return this.getAgents()
  }

  // === КЭШИРОВАНИЕ ===

  private cache = new Map<string, { data: unknown; timestamp: number }>()
  private cacheTimeout = 5 * 60 * 1000 // 5 минут

  async getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key)
    const now = Date.now()

    if (cached && now - cached.timestamp < this.cacheTimeout) {
      return cached.data as T
    }

    const data = await fetcher()
    this.cache.set(key, { data, timestamp: now })
    return data
  }

  clearCache(): void {
    this.cache.clear()
  }

  // === УДОБНЫЕ МЕТОДЫ ===

  // Получить агентов с кэшированием
  async getCachedAccessibleAgents(companyId: string): Promise<Agent[]> {
    return this.getCached(`accessible-agents-${companyId}`, () =>
      this.getAccessibleAgents(companyId)
    )
  }

  // Быстрый поиск агентов с кэшированием
  async quickSearchAgents(query: string, companyId?: string): Promise<Agent[]> {
    const cacheKey = `search-${query}-${companyId || 'all'}`
    return this.getCached(cacheKey, () =>
      this.searchAgents({ query, company_id: companyId })
    )
  }
}

// Фабрика для создания клиентов
export const createAPIClient = (endpoint: string) => new APIClient(endpoint)

// Глобальный клиент (будет переинициализирован при смене endpoint)
let globalClient: APIClient | null = null

export const getAPIClient = (endpoint: string): APIClient => {
  if (!globalClient || globalClient.endpoint !== endpoint) {
    globalClient = new APIClient(endpoint)
  }
  return globalClient
}

// Утилиты для преобразования данных
export const transformAgentToCombobox = (agent: Agent) => ({
  value: agent.agent_id,
  label: agent.name || agent.agent_id,
  model: {
    provider:
      agent.model_config?.provider || agent.model_configuration?.provider || ''
  },
  storage: Boolean(agent.storage_config?.enabled || agent.storage || false),
  storage_config: agent.storage_config,
  is_public: agent.is_public,
  company_id: agent.company_id,
  category: agent.category,
  photo: agent.photo,
  description: agent.description,
  system_instructions: agent.system_instructions
})

// Утилита для преобразования APIAgent в ComboboxAgent
export const transformAPIAgentToCombobox = (agent: APIAgent) => {
  // Правильно определяем storage из agent_config
  const agentConfig = agent.agent_config as
    | { storage?: { enabled?: boolean } }
    | undefined
  const hasStorage = Boolean(agentConfig?.storage?.enabled)

  return {
    value: agent.agent_id,
    label: agent.name || agent.agent_id,
    model: {
      provider: agent.model_config?.provider || ''
    },
    storage: hasStorage,
    storage_config: { enabled: hasStorage },
    agent_config: agent.agent_config, // Сохраняем полный agent_config
    is_public: agent.is_public,
    company_id: agent.company_id,
    category: agent.category,
    photo: agent.photo,
    description: agent.description,
    system_instructions: agent.system_instructions
  }
}

export const transformAgentsToCombobox = (agents: Agent[]) =>
  agents.map(transformAgentToCombobox)

export const transformAPIAgentsToCombobox = (agents: APIAgent[]) =>
  agents.map(transformAPIAgentToCombobox)
