import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  MessengerInstanceUnion,
  MessengerProviderState,
  ProviderType,
  InstanceStatus,
  InstanceType,
  CreateInstanceResponse,
  CreateInstanceResponseWithStatus
} from '@/types/messenger'
import { messengerAPI } from '@/lib/messengerApi'

type CreateInstancePayload =
  | { provider: 'whatsappweb'; user_id: string; type_instance: InstanceType[] }
  | {
      provider: 'telegram'
      user_id: string
      type_instance: InstanceType[]
      token: string
    }
  | {
      provider: 'whatsapp-official'
      user_id: string
      type_instance: InstanceType[]
      phone_number_id: string
      access_token: string
      webhook_verify_token: string
    }
  | {
      provider: 'discord'
      user_id: string
      type_instance: InstanceType[]
      bot_token: string
      client_id: string
      guild_id?: string
    }
  | {
      provider: 'slack'
      user_id: string
      type_instance: InstanceType[]
      bot_token: string
      app_token?: string
      signing_secret?: string
    }
  | {
      provider: 'messenger'
      user_id: string
      type_instance: InstanceType[]
      page_access_token: string
      verify_token: string
      page_id: string
      app_secret?: string
    }

export function useMessengerProvider() {
  const [state, setState] = useState<MessengerProviderState>({
    instances: [],
    selectedInstance: null,
    isLoading: false,
    isCreating: false,
    error: null,
    filters: {},
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    },
    stats: null
  })

  // Destructure state for easier access
  const {
    instances,
    selectedInstance,
    isLoading,
    isCreating,
    error,
    filters,
    pagination,
    stats
  } = state

  // Fetch instances
  const fetchInstances = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await messengerAPI.getInstances({
        provider: state.filters.provider,
        status: state.filters.status,
        limit: state.pagination.limit,
        offset: (state.pagination.page - 1) * state.pagination.limit
      })

      // Convert API response to internal format
      const instances: MessengerInstanceUnion[] = response.instances.map(
        (instance) => ({
          ...instance,
          instance_id: instance.id, // Map id to instance_id for compatibility
          port: instance.port_api || instance.port_mcp // Use api port as primary
        })
      ) as MessengerInstanceUnion[]

      setState((prev) => ({
        ...prev,
        instances,
        pagination: {
          ...prev.pagination,
          total: response.total
        },
        isLoading: false
      }))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch instances'
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }))
      toast.error(errorMessage)
    }
  }, [state.filters, state.pagination.page, state.pagination.limit])

  // Create instance with auto-close after 10 seconds
  const createInstance = useCallback(
    async (
      payload: CreateInstancePayload
    ): Promise<CreateInstanceResponseWithStatus | null> => {
      setState((prev) => ({ ...prev, isCreating: true, error: null }))

      try {
        let response: CreateInstanceResponse

        // Show initial creating toast
        const creatingToastId = toast.loading(
          `Создание ${payload.provider} инстанса...`
        )

        // Route to appropriate creation method based on provider
        switch (payload.provider) {
          case 'whatsappweb':
            response = await messengerAPI.createWhatsAppWebInstance(payload)
            break
          case 'telegram':
            response = await messengerAPI.createTelegramInstance(payload)
            break
          case 'whatsapp-official':
            response =
              await messengerAPI.createWhatsAppOfficialInstance(payload)
            break
          case 'discord':
            response = await messengerAPI.createDiscordInstance(payload)
            break
          case 'slack':
            response = await messengerAPI.createSlackInstance(payload)
            break
          case 'messenger':
            response = await messengerAPI.createMessengerInstance(payload)
            break
          default:
            throw new Error(
              `Unsupported provider: ${(payload as { provider: string }).provider}`
            )
        }

        // Show success message and auto-close after 10 seconds
        toast.success(
          `${payload.provider} инстанс создан! Окно закроется через 10 секунд...`,
          {
            id: creatingToastId,
            duration: 10000
          }
        )

        // Refresh instances list
        await fetchInstances()

        setState((prev) => ({ ...prev, isCreating: false }))

        // Return success with auto-close flag
        return { ...response, instanceFoundInList: true }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create instance'
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isCreating: false
        }))
        toast.error(`Ошибка создания инстанса: ${errorMessage}`)
        return null
      }
    },
    [fetchInstances]
  )

  // Delete instance
  const deleteInstance = useCallback(
    async (instanceId: string) => {
      try {
        await messengerAPI.deleteInstance(instanceId)
        toast.success('Instance deleted successfully!')
        await fetchInstances()
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete instance'
        toast.error(errorMessage)
      }
    },
    [fetchInstances]
  )

  // Start instance
  const startInstance = useCallback(
    async (instanceId: string) => {
      try {
        await messengerAPI.startInstance(instanceId)
        toast.success('Instance started successfully!')
        await fetchInstances()
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to start instance'
        toast.error(errorMessage)
      }
    },
    [fetchInstances]
  )

  // Stop instance
  const stopInstance = useCallback(
    async (instanceId: string) => {
      try {
        await messengerAPI.stopInstance(instanceId)
        toast.success('Instance stopped successfully!')
        await fetchInstances()
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to stop instance'
        toast.error(errorMessage)
      }
    },
    [fetchInstances]
  )

  // Restart instance
  const restartInstance = useCallback(
    async (instanceId: string) => {
      try {
        await messengerAPI.restartInstance(instanceId)
        toast.success('Instance restarted successfully!')
        await fetchInstances()
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to restart instance'
        toast.error(errorMessage)
      }
    },
    [fetchInstances]
  )

  // Get instance memory data
  const getInstanceMemory = useCallback(
    async (
      instanceId: string
    ): Promise<import('@/lib/messengerApi').MemoryResponse['data'] | null> => {
      try {
        const memoryData = await messengerAPI.getInstanceMemory(instanceId)
        return memoryData.data
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get instance memory'
        toast.error(errorMessage)
        return null
      }
    },
    []
  )

  // Get instance QR code
  const getInstanceQR = useCallback(
    async (
      instanceId: string
    ): Promise<{
      qr_code: string
      expires_in?: number
      auth_status?: string
    } | null> => {
      try {
        const qrData = await messengerAPI.getInstanceQR(instanceId)
        return qrData
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get QR code'
        toast.error(errorMessage)
        return null
      }
    },
    []
  )

  // Clear instance errors
  const clearInstanceErrors = useCallback(
    async (instanceId: string) => {
      try {
        await messengerAPI.clearInstanceErrors(instanceId)
        toast.success('Instance errors cleared!')
        await fetchInstances()
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to clear errors'
        toast.error(errorMessage)
      }
    },
    [fetchInstances]
  )

  // Set selected instance
  const setSelectedInstance = useCallback(
    (instance: MessengerInstanceUnion | null) => {
      setState((prev) => ({ ...prev, selectedInstance: instance }))
    },
    []
  )

  // Set filters
  const setFilters = useCallback(
    (filters: Partial<MessengerProviderState['filters']>) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, ...filters },
        pagination: { ...prev.pagination, page: 1 } // Reset to first page when filtering
      }))
    },
    []
  )

  // Set error
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }))
  }, [])

  // Refresh stats
  const refreshStats = useCallback(async () => {
    try {
      const stats = await messengerAPI.getInstanceStats()
      setState((prev) => ({ ...prev, stats }))
    } catch (err) {
      console.error('Failed to refresh stats:', err)
    }
  }, [])

  // Check health
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      await messengerAPI.checkHealth()
      return true
    } catch {
      return false
    }
  }, [])

  // Auto-refresh instances and stats
  useEffect(() => {
    fetchInstances()
    refreshStats()
  }, [state.filters, state.pagination.page, fetchInstances, refreshStats])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInstances()
      refreshStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchInstances, refreshStats])

  return {
    // State values
    instances,
    selectedInstance,
    isLoading,
    isCreating,
    error,
    filters,
    pagination,
    stats,
    // Actions
    fetchInstances,
    createInstance,
    deleteInstance,
    startInstance,
    stopInstance,
    restartInstance,
    getInstanceMemory,
    getInstanceQR,
    clearInstanceErrors,
    setSelectedInstance,
    setFilters,
    setError,
    refreshStats,
    checkHealth
  }
}

// Utility hook for instance status color
export function useInstanceStatusColor(status: InstanceStatus): string {
  const colors = {
    created: 'bg-blue-500',
    processing: 'bg-yellow-500',
    running: 'bg-green-500',
    stopped: 'bg-gray-500',
    error: 'bg-red-500',
    deleted: 'bg-gray-400'
  }

  return colors[status] || 'bg-gray-500'
}

// Utility hook for provider icon and color
export function useProviderConfig(provider: ProviderType) {
  const configs = {
    whatsappweb: { icon: 'whatsapp', color: '#25D366', name: 'WhatsApp Web' },
    telegram: { icon: 'telegram', color: '#0088CC', name: 'Telegram' },
    'whatsapp-official': {
      icon: 'whatsapp',
      color: '#25D366',
      name: 'WhatsApp Official'
    },
    discord: { icon: 'discord', color: '#5865F2', name: 'Discord' },
    slack: { icon: 'slack', color: '#4A154B', name: 'Slack' },
    messenger: { icon: 'messenger', color: '#006AFF', name: 'Messenger' }
  }

  return (
    configs[provider] || {
      icon: 'message-circle',
      color: '#6B7280',
      name: provider
    }
  )
}
