import {
  MessengerInstanceUnion,
  CreateInstanceResponse,
  CreateWhatsAppWebInstancePayload,
  CreateTelegramInstancePayload,
  CreateWhatsAppOfficialInstancePayload,
  CreateDiscordInstancePayload,
  CreateSlackInstancePayload,
  CreateMessengerInstancePayload
} from '@/types/messenger'

type CreateInstancePayload =
  | CreateWhatsAppWebInstancePayload
  | CreateTelegramInstancePayload
  | CreateWhatsAppOfficialInstancePayload
  | CreateDiscordInstancePayload
  | CreateSlackInstancePayload
  | CreateMessengerInstancePayload

export interface InstancesFilter {
  provider?: string
  status?: string
  company_id?: string
}

export interface InstancesPagination {
  limit: number
  offset: number
}

export interface InstancesListResponse {
  instances: MessengerInstanceUnion[]
  total: number
  limit: number
  offset: number
}

export interface SendMessageRequest {
  instanceId: string
  port: number
  message: string
  agent_id?: string
  session_id?: string
}

export interface TelegramSendRequest extends SendMessageRequest {
  chatId: string
}

export interface WhatsAppSendRequest extends SendMessageRequest {
  number: string
}

/**
 * Клиент для работы с API инстансов мессенджеров
 * Обрабатывает все операции с инстансами на сервере 13.61.141.6
 */
export class InstancesAPIClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    // Используем переменную окружения или HTTPS по умолчанию
    this.baseUrl =
      baseUrl ||
      process.env.NEXT_PUBLIC_INSTANCES_API_URL ||
      'https://13.61.141.6'
  }

  /**
   * Выполнить запрос к API инстансов
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(
        `Instances API Error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Получить список всех инстансов
   */
  async getInstances(
    filters?: InstancesFilter,
    pagination?: InstancesPagination
  ): Promise<InstancesListResponse> {
    const params = new URLSearchParams()

    if (filters?.provider) params.append('provider', filters.provider)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.company_id) params.append('company_id', filters.company_id)

    if (pagination?.limit) params.append('limit', pagination.limit.toString())
    if (pagination?.offset)
      params.append('offset', pagination.offset.toString())

    const queryString = params.toString()
    const path = `/api/v1/instances${queryString ? `?${queryString}` : ''}`

    return this.request<InstancesListResponse>(path)
  }

  /**
   * Получить конкретный инстанс
   */
  async getInstance(instanceId: string): Promise<MessengerInstanceUnion> {
    return this.request<MessengerInstanceUnion>(
      `/api/v1/instances/${instanceId}`
    )
  }

  /**
   * Создать новый инстанс
   */
  async createInstance(
    payload: CreateInstancePayload
  ): Promise<CreateInstanceResponse> {
    return this.request<CreateInstanceResponse>('/api/v1/instances', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  /**
   * Обновить инстанс
   */
  async updateInstance(
    instanceId: string,
    updates: Partial<MessengerInstanceUnion>
  ): Promise<MessengerInstanceUnion> {
    return this.request<MessengerInstanceUnion>(
      `/api/v1/instances/${instanceId}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates)
      }
    )
  }

  /**
   * Удалить инстанс
   */
  async deleteInstance(instanceId: string): Promise<void> {
    await this.request(`/api/v1/instances/${instanceId}`, {
      method: 'DELETE'
    })
  }

  /**
   * Получить статус инстанса
   */
  async getInstanceStatus(
    instanceId: string
  ): Promise<{ status: string; details?: Record<string, unknown> }> {
    return this.request<{ status: string; details?: Record<string, unknown> }>(
      `/api/v1/instances/${instanceId}/status`
    )
  }

  /**
   * Запустить инстанс
   */
  async startInstance(
    instanceId: string
  ): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(
      `/api/v1/instances/${instanceId}/start`,
      {
        method: 'POST'
      }
    )
  }

  /**
   * Остановить инстанс
   */
  async stopInstance(
    instanceId: string
  ): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(
      `/api/v1/instances/${instanceId}/stop`,
      {
        method: 'POST'
      }
    )
  }

  /**
   * Перезапустить инстанс
   */
  async restartInstance(
    instanceId: string
  ): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(
      `/api/v1/instances/${instanceId}/restart`,
      {
        method: 'POST'
      }
    )
  }

  /**
   * Отправить сообщение через Telegram инстанс
   */
  async sendTelegramMessage(
    request: TelegramSendRequest
  ): Promise<{ success: boolean; message_id?: string }> {
    const protocol = this.baseUrl.startsWith('https') ? 'https' : 'http'
    const host = this.baseUrl.replace(/^https?:\/\//, '')
    const url = `${protocol}://${host}:${request.port}/api/v1/telegram/send`

    const payload = {
      chatId: request.chatId,
      message: request.message,
      ...(request.agent_id && { agent_id: request.agent_id }),
      ...(request.session_id && { session_id: request.session_id })
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${request.instanceId}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(
        `Telegram send error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Отправить сообщение через WhatsApp инстанс
   */
  async sendWhatsAppMessage(
    request: WhatsAppSendRequest
  ): Promise<{ success: boolean; message_id?: string }> {
    const protocol = this.baseUrl.startsWith('https') ? 'https' : 'http'
    const host = this.baseUrl.replace(/^https?:\/\//, '')
    const url = `${protocol}://${host}:${request.port}/api/v1/send`

    const payload = {
      number: request.number,
      message: request.message,
      ...(request.agent_id && { agent_id: request.agent_id }),
      ...(request.session_id && { session_id: request.session_id })
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${request.instanceId}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(
        `WhatsApp send error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Получить QR код для WhatsApp Web инстанса
   */
  async getWhatsAppQR(
    instanceId: string,
    port: number
  ): Promise<{ qr?: string; status: string }> {
    const protocol = this.baseUrl.startsWith('https') ? 'https' : 'http'
    const host = this.baseUrl.replace(/^https?:\/\//, '')
    const url = `${protocol}://${host}:${port}/api/v1/qr`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${instanceId}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(
        `QR fetch error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Получить информацию об авторизации инстанса
   */
  async getInstanceAuth(
    instanceId: string,
    port: number
  ): Promise<{ authenticated: boolean; details?: Record<string, unknown> }> {
    const protocol = this.baseUrl.startsWith('https') ? 'https' : 'http'
    const host = this.baseUrl.replace(/^https?:\/\//, '')
    const url = `${protocol}://${host}:${port}/api/v1/auth/status`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${instanceId}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(
        `Auth status error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Проверить здоровье API инстансов
   */
  async checkHealth(): Promise<{ status: string; version?: string }> {
    return this.request<{ status: string; version?: string }>('/api/v1/health')
  }
}

// Экспортируем singleton instance
export const instancesAPI = new InstancesAPIClient()

// Хук для использования в компонентах
export function useInstancesAPI() {
  return instancesAPI
}
