import { IconType } from '@/components/ui/icon/types'

// WWEB-MCP Provider Types
export type ProviderType =
  | 'whatsappweb'
  | 'telegram'
  | 'whatsapp-official'
  | 'discord'
  | 'slack'
  | 'messenger'

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
  user_id: string
  provider: ProviderType
  type_instance: InstanceType[]
  status: InstanceStatus
  port?: number
  api_key?: string
  created_at: string
  updated_at: string

  // AGNO Configuration
  agno_config?: {
    model: string
    stream: boolean
    agnoUrl: string
    enabled: boolean
    agent_id: string
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

// Instance creation payloads
export interface CreateWhatsAppWebInstancePayload {
  user_id: string
  provider: 'whatsappweb'
  type_instance: InstanceType[]
  agno_config?: BaseMessengerInstance['agno_config']
  api_webhook_schema?: BaseMessengerInstance['api_webhook_schema']
}

export interface CreateTelegramInstancePayload {
  user_id: string
  provider: 'telegram'
  type_instance: InstanceType[]
  token: string
  agno_config?: BaseMessengerInstance['agno_config']
  api_webhook_schema?: BaseMessengerInstance['api_webhook_schema']
}

export interface CreateWhatsAppOfficialInstancePayload {
  user_id: string
  provider: 'whatsapp-official'
  type_instance: InstanceType[]
  phone_number_id: string
  access_token: string
  webhook_verify_token: string
  agno_config?: BaseMessengerInstance['agno_config']
  api_webhook_schema?: BaseMessengerInstance['api_webhook_schema']
}

export interface CreateDiscordInstancePayload {
  user_id: string
  provider: 'discord'
  type_instance: InstanceType[]
  bot_token: string
  client_id: string
  guild_id?: string
  agno_config?: BaseMessengerInstance['agno_config']
  api_webhook_schema?: BaseMessengerInstance['api_webhook_schema']
}

export interface CreateSlackInstancePayload {
  user_id: string
  provider: 'slack'
  type_instance: InstanceType[]
  bot_token: string
  app_token?: string
  signing_secret?: string
  agno_config?: BaseMessengerInstance['agno_config']
  api_webhook_schema?: BaseMessengerInstance['api_webhook_schema']
}

export interface CreateMessengerInstancePayload {
  user_id: string
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

export interface InstanceListResponse {
  instances: MessengerInstanceUnion[]
  total: number
  page?: number
  limit?: number
}

export interface InstanceMemoryData {
  data: {
    status: string
    port?: number
    api_key?: string
    auth_status?: string
    qr_code?: string
    [key: string]: unknown
  }
}

export interface InstanceStatsResponse {
  total_instances: number
  by_provider: Record<ProviderType, number>
  by_status: Record<InstanceStatus, number>
  active_instances: number
}

// Resource monitoring types
export interface PortUsageResponse {
  used_ports: number[]
  available_ports: number[]
  total_ports: number
}

export interface SystemPerformanceResponse {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  uptime: number
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
  getInstanceQR: (instanceId: string) => Promise<{ qr_code: string }>
  clearInstanceErrors: (instanceId: string) => Promise<void>
  setSelectedInstance: (instance: MessengerInstanceUnion | null) => void
  setFilters: (filters: Partial<MessengerProviderState['filters']>) => void
  setError: (error: string | null) => void
}
