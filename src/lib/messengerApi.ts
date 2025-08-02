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
  ProviderType,
  InstanceType as MessengerInstanceType
} from '@/types/messenger'

// New API response types
export interface InstanceDetailsResponse {
  success: boolean
  instance: MessengerInstanceUnion & {
    health?: {
      healthy: boolean
      services: {
        api?: boolean
        mcp?: boolean
        docker?: boolean
      }
    }
    containers?: Array<{
      id: string
      name: string
      state: string
      status: string
      labels: Record<string, string>
    }>
    memory_data?: InstanceMemoryData
  }
}

export interface StatusHistoryResponse {
  success: boolean
  data: Array<{
    status: string
    timestamp: string
    source: string
    message?: string
  }>
  count: number
  limit: number
}

export interface QRHistoryResponse {
  success: boolean
  data: Array<{
    qr_code: string
    generated_at: string
    expires_at: string
    source: string
  }>
  count: number
  limit: number
}

export interface APIKeyHistoryResponse {
  success: boolean
  data: Array<{
    api_key: string
    created_at: string
    usage_count: number
    last_used_at: string
  }>
  count: number
  limit: number
}

export interface ActivityStatsResponse {
  success: boolean
  data: {
    uptime_hours: number
    messages_sent_today: number
    messages_received_today: number
    health_score: number
  }
}

export interface ErrorsResponse {
  success: boolean
  data: Array<{
    error: string
    timestamp: string
    source: string
    stack?: string
  }>
  count: number
  limit: number
}

export interface AuthStatusResponse {
  success: boolean
  auth_status: string
  whatsapp_state?: string
  phone_number?: string
  account?: string
  is_ready_for_messages: boolean
  last_seen: string
}

export interface CredentialsResponse {
  success: boolean
  api_key: string
  api_url: string
}

export interface MemoryResponse {
  success: boolean
  data: {
    instance_id: string
    user_id: string
    provider: string
    type_instance: MessengerInstanceType[]
    status: string
    auth_status?: string
    whatsapp_state?: string
    api_key?: string
    api_key_usage_count?: number
    api_key_last_use?: string
    api_key_first_use?: string
    is_ready_for_messages?: boolean
    last_seen?: string
    whatsapp_user?: {
      phone_number: string
      account: string
      authenticated_at: string
      last_seen_online: string
    }
    message_stats?: {
      sent_count: number
      received_count: number
      daily_sent: number
      daily_received: number
      daily_reset_at: string
    }
    system_info?: {
      restart_count: number
      health_check_count: number
      consecutive_failures: number
      uptime_start: string
    }
    error_info?: {
      error_count: number
      error_history: Array<{
        error_id: string
        error_type: string
        error_message: string
        timestamp: string
      }>
    }
    created_at: string
    updated_at: string
  }
  timestamp: string
}

export class MessengerAPIClient {
  private baseUrl: string
  private instanceManagerUrl: string

  constructor(instanceManagerUrl?: string) {
    // Используем переданный URL или дефолтный HTTP для 13.61.141.6:3000
    // Поддерживаем как HTTP, так и HTTPS в зависимости от конфигурации
    const defaultUrl = 'http://13.61.141.6:3000'

    this.instanceManagerUrl = instanceManagerUrl || defaultUrl
    this.baseUrl = `${this.instanceManagerUrl}/api/v1`
  }

  // Health check - используем proxy endpoint для избежания CSP блокировки
  async checkHealth(): Promise<{
    status: string
    timestamp: string
    uptime: number
  }> {
    // В браузере используем proxy endpoint
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/v1/instances/health')
      if (!response.ok) {
        throw new Error('Instance Manager is not available')
      }
      const data = await response.json()
      return data.health
    }

    // На сервере используем прямой запрос
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
    company_id?: string
  }): Promise<InstanceListResponse> {
    const params = new URLSearchParams()
    if (filters?.provider) params.append('provider', filters.provider)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    if (filters?.company_id) params.append('company_id', filters.company_id)

    // В браузере используем proxy endpoint для избежания Mixed Content блокировки
    if (typeof window !== 'undefined') {
      const url = `/api/v1/instances/list${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch instances')
      }

      const data = await response.json()
      return data
    }

    // На сервере используем прямой запрос
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
    // В браузере используем proxy endpoint для избежания Mixed Content блокировки
    if (typeof window !== 'undefined') {
      const response = await fetch(`/api/v1/instances/${instanceId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch instance')
      }

      return response.json()
    }

    // На сервере используем прямой запрос
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

  private async createInstance(
    payload:
      | CreateWhatsAppWebInstancePayload
      | CreateTelegramInstancePayload
      | CreateWhatsAppOfficialInstancePayload
      | CreateDiscordInstancePayload
      | CreateSlackInstancePayload
      | CreateMessengerInstancePayload
  ): Promise<CreateInstanceResponse> {
    // В браузере используем proxy endpoint для избежания Mixed Content блокировки
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/v1/instances/create', {
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

      const data = await response.json()
      return data.instance
    }

    // На сервере используем прямой запрос
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

  async getInstanceQR(
    instanceId: string
  ): Promise<{ qr_code: string; expires_in?: number; auth_status?: string }> {
    // В браузере используем proxy endpoint для избежания Mixed Content блокировки
    if (typeof window !== 'undefined') {
      const response = await fetch(`/api/v1/instances/${instanceId}/qr`)

      if (!response.ok) {
        throw new Error('Failed to get QR code')
      }

      const data = await response.json()
      // Возвращаем нужные поля для QR
      return {
        qr_code: data.qr_code,
        expires_in: data.expires_in,
        auth_status: data.auth_status
      }
    }

    // На сервере используем прямой запрос
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
    // В браузере используем proxy endpoint для избежания Mixed Content блокировки
    if (typeof window !== 'undefined') {
      const response = await fetch(
        `/api/v1/instances/${instanceId}/auth-status`
      )

      if (!response.ok) {
        throw new Error('Failed to get auth status')
      }

      const data = await response.json()
      return data.authStatus
    }

    // На сервере используем прямой запрос
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
    // В браузере используем proxy endpoint для избежания Mixed Content блокировки
    if (typeof window !== 'undefined') {
      const response = await fetch(`/api/v1/instances/${instanceId}/errors`)

      if (!response.ok) {
        throw new Error('Failed to get instance errors')
      }

      return response.json()
    }

    // На сервере используем прямой запрос
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/errors`
    )

    if (!response.ok) {
      throw new Error('Failed to get instance errors')
    }

    return response.json()
  }

  async clearInstanceErrors(instanceId: string): Promise<void> {
    // В браузере используем proxy endpoint для избежания Mixed Content блокировки
    if (typeof window !== 'undefined') {
      const response = await fetch(`/api/v1/instances/${instanceId}/errors`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to clear instance errors')
      }

      return
    }

    // На сервере используем прямой запрос
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

  // Instance management methods
  async startInstance(instanceId: string): Promise<{ message: string }> {
    // В браузере используем proxy endpoint для избежания Mixed Content блокировки
    if (typeof window !== 'undefined') {
      const response = await fetch(`/api/v1/instances/${instanceId}/start`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to start instance')
      }

      const data = await response.json()
      return data.result
    }

    // На сервере используем прямой запрос
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/start`,
      {
        method: 'POST'
      }
    )

    if (!response.ok) {
      throw new Error('Failed to start instance')
    }

    return response.json()
  }

  async stopInstance(instanceId: string): Promise<{ message: string }> {
    // В браузере используем proxy endpoint для избежания Mixed Content блокировки
    if (typeof window !== 'undefined') {
      const response = await fetch(`/api/v1/instances/${instanceId}/stop`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to stop instance')
      }

      const data = await response.json()
      return data.result
    }

    // На сервере используем прямой запрос
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/stop`,
      {
        method: 'POST'
      }
    )

    if (!response.ok) {
      throw new Error('Failed to stop instance')
    }

    return response.json()
  }

  async restartInstance(instanceId: string): Promise<{ message: string }> {
    // В браузере используем proxy endpoint для избежания Mixed Content блокировки
    if (typeof window !== 'undefined') {
      const response = await fetch(`/api/v1/instances/${instanceId}/restart`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to restart instance')
      }

      const data = await response.json()
      return data.result
    }

    // На сервере используем прямой запрос
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/restart`,
      {
        method: 'POST'
      }
    )

    if (!response.ok) {
      throw new Error('Failed to restart instance')
    }

    return response.json()
  }

  async deleteInstance(instanceId: string): Promise<{ message: string }> {
    // В браузере используем proxy endpoint для избежания Mixed Content блокировки
    if (typeof window !== 'undefined') {
      const response = await fetch(`/api/v1/instances/${instanceId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete instance')
      }

      const data = await response.json()
      return data.result
    }

    // На сервере используем прямой запрос
    const response = await fetch(`${this.baseUrl}/instances/${instanceId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete instance')
    }

    return response.json()
  }

  async getInstanceLogs(
    instanceId: string,
    options?: {
      tail?: number | boolean
      lines?: number
      level?: string
    }
  ): Promise<{ logs: string | Record<string, string> }> {
    const params = new URLSearchParams()
    if (options?.tail !== undefined) {
      params.append('tail', options.tail.toString())
    }
    if (options?.lines) {
      params.append('lines', options.lines.toString())
    }
    if (options?.level) {
      params.append('level', options.level)
    }

    // В браузере используем proxy endpoint для избежания Mixed Content блокировки
    if (typeof window !== 'undefined') {
      const url = `/api/v1/instances/${instanceId}/logs${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to get instance logs')
      }

      return response.json()
    }

    // На сервере используем прямой запрос
    const url = `${this.baseUrl}/instances/${instanceId}/logs${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to get instance logs')
    }

    return response.json()
  }

  // System Resources
  async getSystemPerformance(): Promise<SystemPerformanceResponse> {
    // В браузере используем proxy endpoint для избежания Mixed Content блокировки
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/v1/instances/performance')

      if (!response.ok) {
        throw new Error('Failed to get system performance')
      }

      const data = await response.json()
      return data.performance
    }

    // На сервере используем прямой запрос
    const response = await fetch(`${this.baseUrl}/resources/performance`)

    if (!response.ok) {
      throw new Error('Failed to get system performance')
    }

    return response.json()
  }

  async getPortUsage(): Promise<PortUsageResponse> {
    const response = await fetch(`${this.baseUrl}/resources/ports`)

    if (!response.ok) {
      throw new Error('Failed to get port usage')
    }

    return response.json()
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

  // Extended Instance Management Methods

  /**
   * Get detailed instance information including health, containers, and memory data
   */
  async getInstanceDetails(
    instanceId: string
  ): Promise<InstanceDetailsResponse> {
    const response = await fetch(`${this.baseUrl}/instances/${instanceId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch instance details')
    }

    return response.json()
  }

  /**
   * Get instance memory data
   */
  async getInstanceMemory(instanceId: string): Promise<MemoryResponse> {
    // В браузере используем proxy endpoint для избежания Mixed Content блокировки
    if (typeof window !== 'undefined') {
      const response = await fetch(`/api/v1/instances/${instanceId}/memory`)

      if (!response.ok) {
        throw new Error('Failed to fetch instance memory data')
      }

      return response.json()
    }

    // На сервере используем прямой запрос
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/memory`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch instance memory data')
    }

    return response.json()
  }

  /**
   * Get instance status history
   */
  async getInstanceStatusHistory(
    instanceId: string,
    limit?: number
  ): Promise<StatusHistoryResponse> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())

    const url = `${this.baseUrl}/instances/${instanceId}/status-history${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch status history')
    }

    return response.json()
  }

  /**
   * Get QR code history for WhatsApp instances
   */
  async getInstanceQRHistory(
    instanceId: string,
    limit?: number
  ): Promise<QRHistoryResponse> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())

    const url = `${this.baseUrl}/instances/${instanceId}/qr-history${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch QR history')
    }

    return response.json()
  }

  /**
   * Get API key history
   */
  async getInstanceAPIKeyHistory(
    instanceId: string,
    limit?: number
  ): Promise<APIKeyHistoryResponse> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())

    const url = `${this.baseUrl}/instances/${instanceId}/api-key-history${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch API key history')
    }

    return response.json()
  }

  /**
   * Get instance activity statistics
   */
  async getInstanceActivityStats(
    instanceId: string
  ): Promise<ActivityStatsResponse> {
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/activity-stats`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch activity stats')
    }

    return response.json()
  }

  /**
   * Get instance errors (extended version)
   */
  async getInstanceErrorsExtended(
    instanceId: string,
    limit?: number
  ): Promise<ErrorsResponse> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())

    const url = `${this.baseUrl}/instances/${instanceId}/errors${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch instance errors')
    }

    return response.json()
  }

  /**
   * Clear instance errors (extended version)
   */
  async clearInstanceErrorsExtended(
    instanceId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/clear-errors`,
      {
        method: 'POST'
      }
    )

    if (!response.ok) {
      throw new Error('Failed to clear instance errors')
    }

    return response.json()
  }

  /**
   * Process instance (create Docker containers)
   */
  async processInstance(
    instanceId: string,
    options?: Record<string, unknown>
  ): Promise<{ success: boolean; message: string }> {
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

    return response.json()
  }

  /**
   * Get authentication status (extended)
   */
  async getInstanceAuthStatusExtended(
    instanceId: string
  ): Promise<AuthStatusResponse> {
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/auth-status`
    )

    if (!response.ok) {
      throw new Error('Failed to get auth status')
    }

    return response.json()
  }

  /**
   * Get instance credentials
   */
  async getInstanceCredentials(
    instanceId: string
  ): Promise<CredentialsResponse> {
    const response = await fetch(
      `${this.baseUrl}/instances/${instanceId}/credentials`
    )

    if (!response.ok) {
      throw new Error('Failed to get instance credentials')
    }

    return response.json()
  }

  async getInstanceStats(): Promise<InstanceStatsResponse> {
    // В браузере используем proxy endpoint для избежания CSP блокировки
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/v1/instances/stats')

      if (!response.ok) {
        throw new Error('Failed to get instance stats')
      }

      const data = await response.json()
      return data.stats
    }

    // На сервере используем прямой запрос
    const response = await fetch(`${this.baseUrl}/instances/memory/stats`)

    if (!response.ok) {
      throw new Error('Failed to get instance stats')
    }

    return response.json()
  }

  // Statistics and Monitoring
  async getSystemPortsAndPerformance(): Promise<{
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

  /**
   * Get general system resources
   */
  async getSystemResources(): Promise<{
    success: boolean
    server: {
      cpu_usage: string
      memory_usage: string
      disk_usage: string
      uptime: string
    }
    docker: {
      total_containers: number
      running_containers: number
      stopped_containers: number
    }
    instances: {
      total: number
      running: number
      stopped: number
    }
  }> {
    // В браузере используем proxy endpoint для избежания Mixed Content блокировки
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/v1/instances/resources')

      if (!response.ok) {
        throw new Error('Failed to get system resources')
      }

      const data = await response.json()
      return data.resources
    }

    // На сервере используем прямой запрос
    const response = await fetch(`${this.baseUrl}/resources`)

    if (!response.ok) {
      throw new Error('Failed to get system resources')
    }

    return response.json()
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    success: boolean
    status: string
    issues: string[]
    recommendations: string[]
    portStatistics: {
      totalPorts: number
      usedPorts: number
      availablePorts: number
      reservedPorts: number
      portRange: {
        start: number
        end: number
      }
      utilizationPercent: number
      assignmentMetrics: {
        totalRequests: number
        successfulRequests: number
        failedRequests: number
        averageTime: number
        minTime: number
        maxTime: number
        concurrentPeak: number
        currentConcurrent: number
      }
    }
  }> {
    const response = await fetch(`${this.baseUrl}/resources/health`)

    if (!response.ok) {
      throw new Error('Failed to get system health')
    }

    return response.json()
  }

  /**
   * Get resources instances overview
   */
  async getResourcesInstancesOverview(): Promise<{
    instances: MessengerInstanceUnion[]
  }> {
    const response = await fetch(`${this.baseUrl}/resources/instances`)

    if (!response.ok) {
      throw new Error('Failed to get resources instances overview')
    }

    return response.json()
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

  async getMultiProviderStats(): Promise<{
    stats: Record<ProviderType, Record<string, unknown>>
  }> {
    const response = await fetch(`${this.baseUrl}/multi-provider/stats`)

    if (!response.ok) {
      throw new Error('Failed to get multi-provider stats')
    }

    return response.json()
  }

  async getMultiProviderInstances(): Promise<InstanceListResponse> {
    const response = await fetch(`${this.baseUrl}/multi-provider/instances`)

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

  // Send Telegram message with advanced formatting
  async sendTelegramMessage(
    port: number,
    botToken: string,
    payload: {
      chatId: string
      message: string
      parseMode?: 'Markdown' | 'HTML'
      disableWebPagePreview?: boolean
      disableNotification?: boolean
    }
  ): Promise<{ success: boolean; message_id?: string }> {
    const response = await fetch(
      `http://localhost:${port}/api/v1/telegram/send-telegram-message`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: payload.chatId,
          message: payload.message,
          parseMode: payload.parseMode || 'Markdown',
          disableWebPagePreview: payload.disableWebPagePreview || false,
          disableNotification: payload.disableNotification || false
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to send Telegram message')
    }

    return response.json()
  }

  // Instance Manager Logs methods
  async getInstanceManagerLogs(
    tail: number = 100,
    level?: 'error' | 'warn' | 'info' | 'http' | 'debug'
  ): Promise<{
    success: boolean
    logs: string[]
    total: number
    filtered: number
    params: { tail: number; level?: string }
  }> {
    const params = new URLSearchParams({ tail: tail.toString() })
    if (level) params.append('level', level)

    const url = `/api/v1/logs?${params.toString()}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to get instance manager logs')
    }

    return response.json()
  }

  async getLatestInstanceManagerLogs(lines: number = 50): Promise<{
    success: boolean
    logs: string[]
    count: number
    timestamp: string
    params: { lines: number }
  }> {
    const url = `/api/v1/logs/latest?lines=${lines}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to get latest instance manager logs')
    }

    return response.json()
  }
}

// Create singleton instance
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
        key: 'company_id',
        label: 'Company ID',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter company ID',
        description: 'Company identifier for the instance'
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
        key: 'company_id',
        label: 'Company ID',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter company ID'
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
        key: 'company_id',
        label: 'Company ID',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter company ID'
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
        key: 'company_id',
        label: 'Company ID',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter company ID'
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
    description: 'Slack Bot integration',
    icon: 'slack',
    color: '#4A154B',
    requiresAuth: true,
    authType: 'token' as const,
    dockerRequired: false,
    fields: [
      {
        key: 'company_id',
        label: 'Company ID',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter company ID'
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
        key: 'company_id',
        label: 'Company ID',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter company ID'
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
