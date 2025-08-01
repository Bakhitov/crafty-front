import { usePlaygroundStore } from '@/store'

export interface AgnoAgent {
  id: string
  name: string
  description?: string
  model?: {
    id: string
    provider: string
  }
  system_instructions?: string[]
  tool_ids?: string[]
  storage?: boolean
  storage_config?: {
    enabled: boolean
  }
  agent_config?: Record<string, unknown>
}

export interface AgnoSession {
  id: string
  agent_id: string
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
}

export interface AgnoMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  metadata?: Record<string, unknown>
}

export interface AgnoRunRequest {
  message: string
  session_id?: string
  stream?: boolean
  metadata?: Record<string, unknown>
}

export interface AgnoRunResponse {
  response: string
  session_id: string
  agent_id: string
  metadata?: Record<string, unknown>
}

/**
 * Клиент для работы с Agno Framework API
 * Обрабатывает вызовы агентов и работу с сессиями
 */
export class AgnoAPIClient {
  private endpoint: string

  constructor(endpoint?: string) {
    // Получаем endpoint из store или используем переданный
    this.endpoint = endpoint || usePlaygroundStore.getState().selectedEndpoint
  }

  /**
   * Обновить endpoint для API
   */
  setEndpoint(endpoint: string) {
    this.endpoint = endpoint
  }

  /**
   * Выполнить запрос к Agno API
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = new URL(`/v1${path}`, this.endpoint)

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(
        `Agno API Error: ${response.status} ${response.statusText}`
      )
    }

    return response.json()
  }

  // CRUD операции агентов удалены - теперь используется Supabase

  /**
   * Получить сессии агента
   */
  async getAgentSessions(agentId: string): Promise<AgnoSession[]> {
    return this.request<AgnoSession[]>(`/agents/${agentId}/sessions`)
  }

  /**
   * Получить конкретную сессию
   */
  async getSession(agentId: string, sessionId: string): Promise<AgnoSession> {
    return this.request<AgnoSession>(`/agents/${agentId}/sessions/${sessionId}`)
  }

  /**
   * Удалить сессию
   */
  async deleteSession(agentId: string, sessionId: string): Promise<void> {
    await this.request(`/agents/${agentId}/sessions/${sessionId}`, {
      method: 'DELETE'
    })
  }

  /**
   * Получить сообщения сессии
   */
  async getSessionMessages(
    agentId: string,
    sessionId: string
  ): Promise<AgnoMessage[]> {
    return this.request<AgnoMessage[]>(
      `/agents/${agentId}/sessions/${sessionId}/messages`
    )
  }

  /**
   * Запустить агента (основной метод для вызовов)
   */
  async runAgent(
    agentId: string,
    request: AgnoRunRequest
  ): Promise<AgnoRunResponse> {
    return this.request<AgnoRunResponse>(`/agents/${agentId}/runs`, {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  /**
   * Запустить агента со стримингом
   */
  async runAgentStream(
    agentId: string,
    request: AgnoRunRequest,
    onChunk: (chunk: string) => void,
    onComplete: (response: AgnoRunResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const url = new URL(`/v1/agents/${agentId}/runs`, this.endpoint)

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...request, stream: true })
      })

      if (!response.ok) {
        throw new Error(
          `Agno API Error: ${response.status} ${response.statusText}`
        )
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader available')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.chunk) {
                onChunk(parsed.chunk)
              } else if (parsed.response) {
                onComplete(parsed)
                return
              }
            } catch {
              console.warn('Failed to parse SSE data:', data)
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'))
    }
  }

  // Метод refreshAgentCache удален - больше не используется

  /**
   * Проверить статус Agno сервера
   */
  async checkHealth(): Promise<{ status: string; version?: string }> {
    return this.request<{ status: string; version?: string }>('/health')
  }
}

// Экспортируем singleton instance
export const agnoAPI = new AgnoAPIClient()

// Хук для использования в компонентах
export function useAgnoAPI() {
  const { selectedEndpoint } = usePlaygroundStore()

  // Обновляем endpoint если он изменился
  if (agnoAPI['endpoint'] !== selectedEndpoint) {
    agnoAPI.setEndpoint(selectedEndpoint)
  }

  return agnoAPI
}
