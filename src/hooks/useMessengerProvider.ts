import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  MessengerInstanceUnion,
  MessengerProviderState,
  ProviderType,
  InstanceStatus,
  CreateInstanceResponse,
  CreateInstanceResponseWithStatus,
  CreateWhatsAppWebInstancePayload,
  CreateTelegramInstancePayload,
  CreateWhatsAppOfficialInstancePayload,
  CreateDiscordInstancePayload,
  CreateSlackInstancePayload,
  CreateMessengerInstancePayload
} from '@/types/messenger'
import { messengerAPI } from '@/lib/messengerApi'
import { useCompanyContext } from '@/components/CompanyProvider'
import { InternalAPIRoutes } from '@/api/routes'

type CreateInstancePayload =
  | CreateWhatsAppWebInstancePayload
  | CreateTelegramInstancePayload
  | CreateWhatsAppOfficialInstancePayload
  | CreateDiscordInstancePayload
  | CreateSlackInstancePayload
  | CreateMessengerInstancePayload

// Simple cache for instances
const instancesCache = new Map<
  string,
  { data: MessengerInstanceUnion[]; timestamp: number }
>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useMessengerProvider() {
  const { company } = useCompanyContext()
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

  // Fetch instances with company filtering
  const fetchInstances = useCallback(
    async (useCache = true) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        // Check cache first
        const cacheKey = `instances-${company?.id || 'all'}-${JSON.stringify(state.filters)}-${state.pagination.page}`
        const cached = instancesCache.get(cacheKey)
        const now = Date.now()

        if (useCache && cached && now - cached.timestamp < CACHE_DURATION) {
          setState((prev) => ({
            ...prev,
            instances: cached.data,
            isLoading: false
          }))
          return
        }

        // Используем наш API endpoint вместо прямого вызова messengerAPI
        const params = new URLSearchParams()
        if (state.filters.provider)
          params.append('provider', state.filters.provider)
        if (state.filters.status) params.append('status', state.filters.status)
        if (state.pagination.limit)
          params.append('limit', state.pagination.limit.toString())
        params.append(
          'offset',
          ((state.pagination.page - 1) * state.pagination.limit).toString()
        )
        if (company?.id) params.append('company_id', company.id)

        const apiUrl = `${InternalAPIRoutes.GetInstances}${params.toString() ? `?${params.toString()}` : ''}`
        const response = await fetch(apiUrl)

        if (!response.ok) {
          throw new Error('Failed to fetch instances')
        }

        const instancesData = await response.json()

        // Convert API response to internal format
        const instances: MessengerInstanceUnion[] = instancesData.instances.map(
          (instance: {
            id: string
            port_api?: number
            port_mcp?: number
            [key: string]: unknown
          }) => ({
            ...instance,
            instance_id: instance.id, // Map id to instance_id for compatibility
            port: instance.port_api || instance.port_mcp // Use api port as primary
          })
        ) as MessengerInstanceUnion[]

        // Cache the results
        instancesCache.set(cacheKey, { data: instances, timestamp: now })

        setState((prev) => ({
          ...prev,
          instances,
          pagination: {
            ...prev.pagination,
            total: instancesData.total
          },
          isLoading: false
        }))
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch instances'
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }))
        toast.error(errorMessage)
      }
    },
    [state.filters, state.pagination.page, state.pagination.limit, company?.id]
  )

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
          `${payload.provider} Messenger connection established! Fine-tuning in progress... just a couple more minutes and everything will be ready!`,
          {
            id: creatingToastId,
            duration: 10000
          }
        )

        // Refresh instances list (skip cache)
        await fetchInstances(false)

        setState((prev) => ({ ...prev, isCreating: false }))

        return {
          ...response,
          status: 'created'
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to create messenger instance'

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isCreating: false
        }))
        toast.error(errorMessage)
        return null
      }
    },
    [fetchInstances]
  )

  // Delete instance
  const deleteInstance = useCallback(
    async (instanceId: string): Promise<boolean> => {
      try {
        await messengerAPI.deleteInstance(instanceId)
        await fetchInstances(false)
        toast.success('Instance deleted successfully')
        return true
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete instance'
        toast.error(errorMessage)
        return false
      }
    },
    [fetchInstances]
  )

  // Instance control methods
  const startInstance = useCallback(
    async (instanceId: string): Promise<boolean> => {
      try {
        await messengerAPI.startInstance(instanceId)
        await fetchInstances(false)
        toast.success('Instance started successfully')
        return true
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to start instance'
        toast.error(errorMessage)
        return false
      }
    },
    [fetchInstances]
  )

  const stopInstance = useCallback(
    async (instanceId: string): Promise<boolean> => {
      try {
        await messengerAPI.stopInstance(instanceId)
        await fetchInstances(false)
        toast.success('Instance stopped successfully')
        return true
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to stop instance'
        toast.error(errorMessage)
        return false
      }
    },
    [fetchInstances]
  )

  const restartInstance = useCallback(
    async (instanceId: string): Promise<boolean> => {
      try {
        await messengerAPI.restartInstance(instanceId)
        await fetchInstances(false)
        toast.success('Instance restarted successfully')
        return true
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to restart instance'
        toast.error(errorMessage)
        return false
      }
    },
    [fetchInstances]
  )

  // Get instance memory data
  const getInstanceMemory = useCallback(async (instanceId: string) => {
    try {
      return await messengerAPI.getInstanceMemory(instanceId)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to get instance memory'
      toast.error(errorMessage)
      return null
    }
  }, [])

  // Get QR code for WhatsApp instances
  const getInstanceQR = useCallback(async (instanceId: string) => {
    try {
      return await messengerAPI.getInstanceQR(instanceId)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to get QR code'
      toast.error(errorMessage)
      return null
    }
  }, [])

  // Clear instance errors
  const clearInstanceErrors = useCallback(
    async (instanceId: string): Promise<boolean> => {
      try {
        await messengerAPI.clearInstanceErrors(instanceId)
        await fetchInstances(false)
        toast.success('Instance errors cleared')
        return true
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to clear instance errors'
        toast.error(errorMessage)
        return false
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
    messenger: { icon: 'messenger', color: '#006AFF', name: 'Messenger' },
    instagram: { icon: 'instagram', color: '#E4405F', name: 'Instagram' }
  }

  return (
    configs[provider] || {
      icon: 'message-circle',
      color: '#6B7280',
      name: provider
    }
  )
}
