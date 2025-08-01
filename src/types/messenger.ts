import { IconType } from '@/components/ui/icon/types'

// WWEB-MCP Provider Types
export type ProviderType =
  | 'whatsappweb'
  | 'telegram'
  | 'whatsapp-official'
  | 'discord'
  | 'slack'
  | 'messenger'
  | 'instagram'

export type InstanceStatus =
  | 'created'
  | 'processing'
  | 'running'
  | 'stopped'
  | 'error'
  | 'deleted'

export type InstanceType = 'api' | 'mcp'

// Base instance interface
export interface BaseMessengerInstance {
  instance_id: string
  provider: ProviderType
  type_instance: InstanceType[]
  status: InstanceStatus
  port?: number
  api_key?: string
  company_id: string // Теперь обязательное поле
  created_at: string
  updated_at: string

  // AGNO Configuration
  agno_config?: {
    model: string
    stream: boolean
    agnoUrl: string
    enabled: boolean
    agent_id: string
    session_id?: string
  }

  // Webhook Configuration
  api_webhook_schema?: {
    enabled: boolean
    url: string
    filters?: {
      allowGroups: boolean
      allowPrivate: boolean
    }
  }
}

// WhatsApp Web Instance
export interface WhatsAppWebInstance extends BaseMessengerInstance {
  provider: 'whatsappweb'
  qr_code?: string
  auth_status?: 'pending' | 'authenticated' | 'failed'
  phone_number?: string
  profile_name?: string
  profile_picture?: string
}

// Telegram Instance
export interface TelegramInstance extends BaseMessengerInstance {
  provider: 'telegram'
  token: string
  bot_username?: string
  bot_name?: string
  polling_enabled?: boolean
}

// WhatsApp Official Instance
export interface WhatsAppOfficialInstance extends BaseMessengerInstance {
  provider: 'whatsapp-official'
  phone_number_id: string
  access_token: string
  webhook_verify_token: string
  business_account_id?: string
}

// Discord Instance
export interface DiscordInstance extends BaseMessengerInstance {
  provider: 'discord'
  bot_token: string
  client_id: string
  guild_id?: string
  bot_username?: string
}

// Slack Instance
export interface SlackInstance extends BaseMessengerInstance {
  provider: 'slack'
  bot_token: string
  app_token?: string
  signing_secret?: string
  workspace_id?: string
}

// Messenger Instance
export interface MessengerInstance extends BaseMessengerInstance {
  provider: 'messenger'
  page_access_token: string
  verify_token: string
  page_id: string
  app_secret?: string
}

// Union type for all instances
export type MessengerInstanceUnion =
  | WhatsAppWebInstance
  | TelegramInstance
  | WhatsAppOfficialInstance
  | DiscordInstance
  | SlackInstance
  | MessengerInstance

// Real API response from Instance Manager has id field instead of instance_id
export interface RealInstanceResponse
  extends Omit<BaseMessengerInstance, 'instance_id'> {
  id: string
  port_api?: number
  port_mcp?: number
  api_key_generated_at?: string
  last_qr_generated_at?: string
  auth_status?: string
  account?: string | null
  whatsapp_state?: string | null
  token?: string | null
  memory_status?: string
  is_ready_for_messages?: boolean
  message_stats?: {
    sent_count: number
    received_count: number
    daily_sent: number
    daily_received: number
    daily_reset_at: string
  }
  whatsapp_user?: {
    phone_number: string
    account: string
    authenticated_at: string
    last_seen_online: string
  }
}

// Instance creation payloads
export interface CreateWhatsAppWebInstancePayload {
  company_id: string
  provider: 'whatsappweb'
  type_instance: InstanceType[]
  agno_config?: BaseMessengerInstance['agno_config']
  api_webhook_schema?: BaseMessengerInstance['api_webhook_schema']
}

export interface CreateTelegramInstancePayload {
  company_id: string
  provider: 'telegram'
  type_instance: InstanceType[]
  token: string
  bot_username?: string
  agno_config?: BaseMessengerInstance['agno_config']
  api_webhook_schema?: BaseMessengerInstance['api_webhook_schema']
}

export interface CreateWhatsAppOfficialInstancePayload {
  company_id: string
  provider: 'whatsapp-official'
  type_instance: InstanceType[]
  phone_number_id: string
  access_token: string
  webhook_verify_token: string
  business_account_id?: string
  agno_config?: BaseMessengerInstance['agno_config']
  api_webhook_schema?: BaseMessengerInstance['api_webhook_schema']
}

export interface CreateDiscordInstancePayload {
  company_id: string
  provider: 'discord'
  type_instance: InstanceType[]
  bot_token: string
  client_id: string
  guild_id?: string
  agno_config?: BaseMessengerInstance['agno_config']
  api_webhook_schema?: BaseMessengerInstance['api_webhook_schema']
}

export interface CreateSlackInstancePayload {
  company_id: string
  provider: 'slack'
  type_instance: InstanceType[]
  bot_token: string
  app_token?: string
  signing_secret?: string
  workspace_id?: string
  agno_config?: BaseMessengerInstance['agno_config']
  api_webhook_schema?: BaseMessengerInstance['api_webhook_schema']
}

export interface CreateMessengerInstancePayload {
  company_id: string
  provider: 'messenger'
  type_instance: InstanceType[]
  page_access_token: string
  verify_token: string
  page_id: string
  app_secret?: string
  agno_config?: BaseMessengerInstance['agno_config']
  api_webhook_schema?: BaseMessengerInstance['api_webhook_schema']
}

// API Response types
export interface CreateInstanceResponse {
  instance_id: string
  status: string
  message: string
  port?: number
  api_key?: string
}

export interface CreateInstanceResponseWithStatus
  extends CreateInstanceResponse {
  status: string
}

export interface InstanceListResponse {
  success?: boolean
  instances: RealInstanceResponse[]
  total: number
  page?: number
  limit?: number
}

export interface InstanceMemoryData {
  success?: boolean
  data: {
    instance_id: string
    user_id: string
    provider: string
    type_instance: InstanceType[]
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
    [key: string]: unknown
  }
  timestamp?: string
}

export interface InstanceStatsResponse {
  success?: boolean
  stats: {
    total_instances: number
    active_instances: number
    authenticated_instances: number
    error_instances: number
    qr_pending_instances: number
    memory_usage_mb: number
    avg_uptime_hours: number
    total_messages_today: number
  }
}

// Resource monitoring types
export interface PortUsageResponse {
  success?: boolean
  used_ports: number[]
  available_ports: number[]
  port_range: {
    start: number
    end: number
  }
}

export interface SystemPerformanceResponse {
  success?: boolean
  performance: {
    portAssignmentTime: number[]
    concurrentRequests: number
    failureRate: number
    averageResponseTime: number
    peakConcurrency: number
    lastResetTime: string
  }
  portAssignment: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageTime: number
    minTime: number
    maxTime: number
    concurrentPeak: number
    currentConcurrent: number
  }
  systemHealth: {
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
  }
}

// Error types
export interface InstanceError {
  error_id: string
  instance_id: string
  error_type: string
  error_message: string
  stack_trace?: string
  created_at: string
}

// Provider configurations for UI
export interface ProviderConfig {
  id: ProviderType
  name: string
  description: string
  icon: IconType
  color: string
  requiresAuth: boolean
  authType: 'token' | 'qr' | 'oauth' | 'api_key'
  dockerRequired: boolean
  fields: ProviderField[]
}

export interface ProviderField {
  key: string
  label: string
  type: 'text' | 'password' | 'url' | 'select' | 'boolean'
  required: boolean
  placeholder?: string
  description?: string
  options?: { label: string; value: string }[]
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
  }
}

// UI State types
export interface MessengerProviderState {
  instances: MessengerInstanceUnion[]
  selectedInstance: MessengerInstanceUnion | null
  isLoading: boolean
  isCreating: boolean
  error: string | null
  filters: {
    provider?: ProviderType
    status?: InstanceStatus
    search?: string
  }
  pagination: {
    page: number
    limit: number
    total: number
  }
  stats: InstanceStatsResponse | null
}

// Action types for store
export interface MessengerProviderActions {
  fetchInstances: () => Promise<void>
  createInstance: (
    payload:
      | CreateWhatsAppWebInstancePayload
      | CreateTelegramInstancePayload
      | CreateWhatsAppOfficialInstancePayload
      | CreateDiscordInstancePayload
      | CreateSlackInstancePayload
      | CreateMessengerInstancePayload
  ) => Promise<CreateInstanceResponse>
  deleteInstance: (instanceId: string) => Promise<void>
  startInstance: (instanceId: string) => Promise<void>
  stopInstance: (instanceId: string) => Promise<void>
  restartInstance: (instanceId: string) => Promise<void>
  getInstanceMemory: (instanceId: string) => Promise<InstanceMemoryData>
  getInstanceQR: (
    instanceId: string
  ) => Promise<{ qr_code: string; expires_in?: number; auth_status?: string }>
  clearInstanceErrors: (instanceId: string) => Promise<void>
  setSelectedInstance: (instance: MessengerInstanceUnion | null) => void
  setFilters: (filters: Partial<MessengerProviderState['filters']>) => void
  setError: (error: string | null) => void
}

// Chat and Messages types for Supabase
export interface Message {
  id: string
  instance_id: string
  message_id: string
  chat_id: string | null
  from_number: string | null
  to_number: string | null
  message_body: string | null
  message_type: string
  is_from_me: boolean
  is_group: boolean
  group_id: string | null
  contact_name: string | null
  timestamp: number | null
  agent_id: string | null
  created_at: string
  updated_at: string
  session_id: string | null
  message_source: string
}

export interface Chat {
  chat_id: string
  instance_id: string
  session_id: string | null
  contact_name: string | null
  from_number: string | null
  is_group: boolean
  group_id: string | null
  last_message: string | null
  last_message_timestamp: number | null
  updated_at: string | null
  unread_count: number
  provider: ProviderType
}

// Message Instance from Supabase
export interface MessageInstance {
  id: string
  user_id: string | null
  provider: string
  type_instance: string[]
  port_api: number | null
  port_mcp: number | null
  api_key: string | null
  api_key_generated_at: string | null
  last_qr_generated_at: string | null
  api_webhook_schema: Record<string, unknown> | null
  mcp_schema: Record<string, unknown> | null
  created_at: string | null
  updated_at: string | null
  auth_status: string | null
  account: string | null
  whatsapp_state: string | null
  token: string | null
  agno_config: {
    enabled?: boolean
    agent_id?: string
    model?: string
    stream?: boolean
    agnoUrl?: string
    session_id?: string
  } | null
}

export interface ChatListResponse {
  chats: Chat[]
  total: number
}
