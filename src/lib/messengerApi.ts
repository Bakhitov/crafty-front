import {
  MessengerInstanceUnion,
  CreateInstanceResponse,
  InstanceListResponse,
  InstanceMemoryData,
  InstanceStatsResponse,
  PortUsageResponse,
  SystemPerformanceResponse,
  InstanceError,
  CreateWhatsAppWebInstancePayload,
  CreateTelegramInstancePayload,
  CreateWhatsAppOfficialInstancePayload,
  CreateDiscordInstancePayload,
  CreateSlackInstancePayload,
  CreateMessengerInstancePayload,
  ProviderType
} from '@/types/messenger'

export class MessengerAPIClient {
  private baseUrl: string
  private instanceManagerUrl: string

  constructor(instanceManagerUrl: string = 'http://13.61.141.6:3000') {
    this.instanceManagerUrl = instanceManagerUrl
    this.baseUrl = `${instanceManagerUrl}/api/v1`
  }

  // Health check
  async checkHealth(): Promise<{
    status: string
    timestamp: string
    uptime: number
  }> {
    const response = await fetch(`${this.instanceManagerUrl}/health`)
    if (!response.ok) {
      throw new Error('Instance Manager is not available')
    }
    return response.json()
  }

  // Instance Management
  async getInstances(filters?: {
    provider?: ProviderType
    status?: string
    limit?: number
    offset?: number
  }): Promise<InstanceListResponse> {
    const params = new URLSearchParams()
    if (filters?.provider) params.append('provider', filters.provider)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const url = `${this.baseUrl}/instances${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch instances')
    }

    return response.json()
  }

  async getInstance(
    instanceId: string
  ): Promise<{ instance: MessengerInstanceUnion }> {
    const response = await fetch(`${this.baseUrl}/instances/${instanceId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch instance')
    }

    return response.json()
  }

  async createWhatsAppWebInstance(
    payload: CreateWhatsAppWebInstancePayload
  ): Promise<CreateInstanceResponse> {
    return this.createInstance(payload)
  }

  async createTelegramInstance(
    payload: CreateTelegramInstancePayload
  ): Promise<CreateInstanceResponse> {
    return this.createInstance(payload)
  }

  async createWhatsAppOfficialInstance(
    payload: CreateWhatsAppOfficialInstancePayload
  ): Promise<CreateInstanceResponse> {
    return this.createInstance(payload)
  }

  async createDiscordInstance(
    payload: CreateDiscordInstancePayload
  ): Promise<CreateInstanceResponse> {
    return this.createInstance(payload)
  }

  async createSlackInstance(
    payload: CreateSlackInstancePayload
  ): Promise<CreateInstanceResponse> {
    return this.createInstance(payload)
  }

  async createMessengerInstance(
    payload: CreateMessengerInstancePayload
  ): Promise<CreateInstanceResponse> {
    return this.createInstance(payload)
  }

  private async createInstance(payload: any): Promise<CreateInstanceResponse> {
    const response = await fetch(`${this.baseUrl}/instances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Failed to create instance' }))
      throw new Error(error.message || 'Failed to create instance')
    }

    return response.json()
  }

  async deleteInstance(instanceId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/instances/${instanceId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete instance')
    }
  }

  // Instance Control
  async processInstance(
    instanceId: string,
    options?: { force_recreate?: boolean }
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/process`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options || {})
      }
    )

    if (!response.ok) {
      throw new Error('Failed to process instance')
    }
  }

  async startInstance(instanceId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/start`,
      {
        method: 'POST'
      }
    )

    if (!response.ok) {
      throw new Error('Failed to start instance')
    }
  }

  async stopInstance(instanceId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/stop`,
      {
        method: 'POST'
      }
    )

    if (!response.ok) {
      throw new Error('Failed to stop instance')
    }
  }

  async restartInstance(instanceId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/restart`,
      {
        method: 'POST'
      }
    )

    if (!response.ok) {
      throw new Error('Failed to restart instance')
    }
  }

  // Instance Data
  async getInstanceMemory(instanceId: string): Promise<InstanceMemoryData> {
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/memory`
    )

    if (!response.ok) {
      throw new Error('Failed to get instance memory data')
    }

    return response.json()
  }

  async getInstanceQR(instanceId: string): Promise<{ qr_code: string }> {
    const response = await fetch(`${this.baseUrl}/instances/${instanceId}/qr`)

    if (!response.ok) {
      throw new Error('Failed to get QR code')
    }

    return response.json()
  }

  async getInstanceCurrentQR(instanceId: string): Promise<{ qr_code: string }> {
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/current-qr`
    )

    if (!response.ok) {
      throw new Error('Failed to get current QR code')
    }

    return response.json()
  }

  async getInstanceCurrentApiKey(
    instanceId: string
  ): Promise<{ api_key: string }> {
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/current-api-key`
    )

    if (!response.ok) {
      throw new Error('Failed to get current API key')
    }

    return response.json()
  }

  async getInstanceAuthStatus(
    instanceId: string
  ): Promise<{ status: string; authenticated: boolean }> {
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/auth-status`
    )

    if (!response.ok) {
      throw new Error('Failed to get auth status')
    }

    return response.json()
  }

  async getInstanceErrors(
    instanceId: string
  ): Promise<{ errors: InstanceError[] }> {
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/errors`
    )

    if (!response.ok) {
      throw new Error('Failed to get instance errors')
    }

    return response.json()
  }

  async clearInstanceErrors(instanceId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/clear-errors`,
      {
        method: 'POST'
      }
    )

    if (!response.ok) {
      throw new Error('Failed to clear instance errors')
    }
  }

  async getInstanceLogs(
    instanceId: string,
    tail?: number
  ): Promise<{ logs: string[] }> {
    const params = new URLSearchParams()
    if (tail) params.append('tail', tail.toString())

    const url = `${this.baseUrl}/instances/${instanceId}/logs${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to get instance logs')
    }

    return response.json()
  }

  // Statistics and Monitoring
  async getInstanceStats(): Promise<InstanceStatsResponse> {
    const response = await fetch(`${this.baseUrl}/instances/memory/stats`)

    if (!response.ok) {
      throw new Error('Failed to get instance stats')
    }

    return response.json()
  }

  async getSystemResources(): Promise<{
    ports: PortUsageResponse
    performance: SystemPerformanceResponse
  }> {
    const [portsResponse, performanceResponse] = await Promise.all([
      fetch(`${this.baseUrl}/resources/ports`),
      fetch(`${this.baseUrl}/resources/performance`)
    ])

    if (!portsResponse.ok || !performanceResponse.ok) {
      throw new Error('Failed to get system resources')
    }

    const [ports, performance] = await Promise.all([
      portsResponse.json(),
      performanceResponse.json()
    ])

    return { ports, performance }
  }

  async clearPortsCache(): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/resources/ports/clear-cache`,
      {
        method: 'POST'
      }
    )

    if (!response.ok) {
      throw new Error('Failed to clear ports cache')
    }
  }

  // Multi-Provider API
  async getActiveProviders(): Promise<{ providers: ProviderType[] }> {
    const response = await fetch(
      `${this.baseUrl}/multi-provider/active-providers`
    )

    if (!response.ok) {
      throw new Error('Failed to get active providers')
    }

    return response.json()
  }

  async getMultiProviderStats(): Promise<{ stats: Record<ProviderType, any> }> {
    const response = await fetch(`${this.baseUrl}/multi-provider/stats`)

    if (!response.ok) {
      throw new Error('Failed to get multi-provider stats')
    }

    return response.json()
  }

  async getMultiProviderInstances(
    provider?: ProviderType
  ): Promise<InstanceListResponse> {
    const params = new URLSearchParams()
    if (provider) params.append('provider', provider)

    const url = `${this.baseUrl}/multi-provider/instances${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to get multi-provider instances')
    }

    return response.json()
  }

  // Send messages through instances
  async sendMessage(
    provider: ProviderType,
    instanceId: string,
    payload: {
      to: string
      message: string
      api_token?: string
    }
  ): Promise<{ success: boolean; message_id?: string }> {
    const response = await fetch(
      `${this.baseUrl}/multi-provider/instances/${provider}/${instanceId}/send-message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(payload.api_token && {
            Authorization: `Bearer ${payload.api_token}`
          })
        },
        body: JSON.stringify({
          to: payload.to,
          message: payload.message
        })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to send message')
    }

    return response.json()
  }

  // Utility methods
  getInstanceManagerUrl(): string {
    return this.instanceManagerUrl
  }

  setInstanceManagerUrl(url: string): void {
    this.instanceManagerUrl = url
    this.baseUrl = `${url}/api/v1`
  }
}

// Default instance
export const messengerAPI = new MessengerAPIClient()

// Provider configurations for UI
export const PROVIDER_CONFIGS = {
  whatsappweb: {
    id: 'whatsappweb' as ProviderType,
    name: 'WhatsApp Web',
    description: 'WhatsApp Web integration using whatsapp-web.js',
    icon: 'whatsapp',
    color: '#25D366',
    requiresAuth: true,
    authType: 'qr' as const,
    dockerRequired: true,
    fields: [
      {
        key: 'user_id',
        label: 'User ID',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter user ID',
        description: 'Unique identifier for the instance'
      }
    ]
  },
  telegram: {
    id: 'telegram' as ProviderType,
    name: 'Telegram',
    description: 'Telegram Bot API integration',
    icon: 'telegram',
    color: '#0088CC',
    requiresAuth: true,
    authType: 'token' as const,
    dockerRequired: false,
    fields: [
      {
        key: 'user_id',
        label: 'User ID',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter user ID'
      },
      {
        key: 'token',
        label: 'Bot Token',
        type: 'password' as const,
        required: true,
        placeholder: 'Enter Telegram bot token',
        description: 'Get from @BotFather in Telegram'
      }
    ]
  },
  'whatsapp-official': {
    id: 'whatsapp-official' as ProviderType,
    name: 'WhatsApp Official',
    description: 'WhatsApp Business API (Official)',
    icon: 'whatsapp',
    color: '#25D366',
    requiresAuth: true,
    authType: 'api_key' as const,
    dockerRequired: false,
    fields: [
      {
        key: 'user_id',
        label: 'User ID',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter user ID'
      },
      {
        key: 'phone_number_id',
        label: 'Phone Number ID',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter phone number ID'
      },
      {
        key: 'access_token',
        label: 'Access Token',
        type: 'password' as const,
        required: true,
        placeholder: 'Enter access token'
      },
      {
        key: 'webhook_verify_token',
        label: 'Webhook Verify Token',
        type: 'password' as const,
        required: true,
        placeholder: 'Enter webhook verify token'
      }
    ]
  },
  discord: {
    id: 'discord' as ProviderType,
    name: 'Discord',
    description: 'Discord Bot integration',
    icon: 'discord',
    color: '#5865F2',
    requiresAuth: true,
    authType: 'token' as const,
    dockerRequired: false,
    fields: [
      {
        key: 'user_id',
        label: 'User ID',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter user ID'
      },
      {
        key: 'bot_token',
        label: 'Bot Token',
        type: 'password' as const,
        required: true,
        placeholder: 'Enter Discord bot token'
      },
      {
        key: 'client_id',
        label: 'Client ID',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter client ID'
      },
      {
        key: 'guild_id',
        label: 'Guild ID',
        type: 'text' as const,
        required: false,
        placeholder: 'Enter guild ID (optional)'
      }
    ]
  },
  slack: {
    id: 'slack' as ProviderType,
    name: 'Slack',
    description: 'Slack App integration',
    icon: 'slack',
    color: '#4A154B',
    requiresAuth: true,
    authType: 'token' as const,
    dockerRequired: false,
    fields: [
      {
        key: 'user_id',
        label: 'User ID',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter user ID'
      },
      {
        key: 'bot_token',
        label: 'Bot Token',
        type: 'password' as const,
        required: true,
        placeholder: 'Enter Slack bot token'
      },
      {
        key: 'app_token',
        label: 'App Token',
        type: 'password' as const,
        required: false,
        placeholder: 'Enter app token (optional)'
      },
      {
        key: 'signing_secret',
        label: 'Signing Secret',
        type: 'password' as const,
        required: false,
        placeholder: 'Enter signing secret (optional)'
      }
    ]
  },
  messenger: {
    id: 'messenger' as ProviderType,
    name: 'Facebook Messenger',
    description: 'Facebook Messenger integration',
    icon: 'messenger',
    color: '#006AFF',
    requiresAuth: true,
    authType: 'token' as const,
    dockerRequired: false,
    fields: [
      {
        key: 'user_id',
        label: 'User ID',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter user ID'
      },
      {
        key: 'page_access_token',
        label: 'Page Access Token',
        type: 'password' as const,
        required: true,
        placeholder: 'Enter page access token'
      },
      {
        key: 'verify_token',
        label: 'Verify Token',
        type: 'password' as const,
        required: true,
        placeholder: 'Enter verify token'
      },
      {
        key: 'page_id',
        label: 'Page ID',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter page ID'
      },
      {
        key: 'app_secret',
        label: 'App Secret',
        type: 'password' as const,
        required: false,
        placeholder: 'Enter app secret (optional)'
      }
    ]
  }
} as const
