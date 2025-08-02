'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

import { Separator } from '@/components/ui/separator'
import Icon from '@/components/ui/icon'
import { IconType } from '@/components/ui/icon/types'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  MessengerInstanceUnion,
  InstanceStatus,
  InstanceStatsResponse,
  SystemPerformanceResponse
} from '@/types/messenger'
import {
  useMessengerProvider,
  useProviderConfig
} from '@/hooks/useMessengerProvider'
import { messengerAPI } from '@/lib/messengerApi'
import { formatLogsWithAnsi } from '@/lib/ansiToHtml'
import InstanceManagerLogs from './InstanceManagerLogs'

interface MessengerInstanceManagerProps {
  onEditInstance: (instance: MessengerInstanceUnion) => void
  onClose?: () => void
}

interface InstanceItemProps {
  instance: MessengerInstanceUnion
  onSelect: (instance: MessengerInstanceUnion) => void
  onEdit: (instance: MessengerInstanceUnion) => void
  onRestart: (instanceId: string) => void
  onStop: (instanceId: string) => void
  onStart: (instanceId: string) => void
  onViewLogs: (instanceId: string) => void
  onViewQR: (instanceId: string) => void
  onViewDetails: (instanceId: string) => void
  onViewMemory: (instanceId: string) => void
  onViewStatusHistory: (instanceId: string) => void
  onViewErrors: (instanceId: string) => void
  onViewApiKeys: (instanceId: string) => void
  onViewQRHistory: (instanceId: string) => void
  isSelected: boolean
}

// Новые интерфейсы для расширенных данных
interface SystemResourcesData {
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
}

// Используем тип из messengerApi.ts
type InstanceDetailsData = import('@/lib/messengerApi').InstanceDetailsResponse

const InstanceItem = ({
  instance,
  onSelect,
  onEdit,
  onRestart,
  onStop,
  onStart,
  onViewLogs,
  onViewQR,
  onViewDetails,
  onViewMemory,
  onViewStatusHistory,
  onViewErrors,
  onViewApiKeys,
  onViewQRHistory,
  isSelected
}: InstanceItemProps) => {
  const providerConfig = useProviderConfig(instance.provider)
  const [isLoading, setIsLoading] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Instance ID copied to clipboard')
  }

  const getStatusText = (status: InstanceStatus) => {
    const statusMap: Record<InstanceStatus, string> = {
      created: 'Created',
      processing: 'Processing',
      running: 'Running',
      stopped: 'Stopped',
      error: 'Error',
      deleted: 'Deleted'
    }
    return statusMap[status] || status
  }

  const handleAction = async (action: () => Promise<void>) => {
    setIsLoading(true)
    try {
      await action()
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const instanceId =
    instance.instance_id || (instance as unknown as { id?: string }).id || ''

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'group relative cursor-pointer rounded-lg border p-4 transition-all duration-200',
        isSelected
          ? 'border-primary/50 bg-primary/5'
          : 'border-border bg-background-secondary hover:border-primary/30'
      )}
      onClick={() => onSelect(instance)}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: providerConfig.color }}
          >
            <Icon
              type={providerConfig.icon as IconType}
              size="sm"
              className="text-white"
            />
          </div>
          <div>
            <h3 className="text-primary text-sm font-semibold">
              {providerConfig.name}
            </h3>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground font-mono text-xs">
                {instanceId.substring(0, 10)}...
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  copyToClipboard(instanceId)
                }}
                title="Copy Instance ID"
              >
                <Icon type="copy" size="xs" />
              </Button>
            </div>
          </div>
        </div>

        {/* Port and Date */}
        <div className="flex items-center gap-3 text-xs">
          {(instance.port || (instance as { port_api?: number }).port_api) && (
            <div className="flex items-center gap-1">
              <Icon type="link" size="xs" className="text-muted-foreground" />
              <span className="text-muted-foreground">
                {instance.port || (instance as { port_api?: number }).port_api}
              </span>
            </div>
          )}

          <div className="text-muted-foreground flex items-center gap-1">
            <Icon type="calendar" size="xs" />
            <span>
              {new Date(instance.created_at).toLocaleDateString('en-US')}
            </span>
          </div>
        </div>
      </div>

      {/* Diagnostics Panel - Collapsible */}
      {showDiagnostics && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-border mb-3 border-t pt-3"
        >
          <div className="space-y-2">
            <div className="text-primary mb-2 text-xs font-medium">
              Diagnostic Actions:
            </div>
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    const response =
                      await messengerAPI.getInstanceDetails(instanceId)
                    console.log('Instance Details:', response)
                    toast.success('Check console for details')
                  } catch (error) {
                    console.error('Error:', error)
                    toast.error('Failed to get instance details')
                  }
                }}
              >
                <Icon type="file-text" size="xs" className="mr-1" />
                Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={async (e) => {
                  e.stopPropagation()
                  onViewMemory(instanceId)
                }}
              >
                <Icon type="database" size="xs" className="mr-1" />
                Memory
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={async (e) => {
                  e.stopPropagation()
                  onViewStatusHistory(instanceId)
                }}
              >
                <Icon type="clock" size="xs" className="mr-1" />
                History
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={async (e) => {
                  e.stopPropagation()
                  onViewErrors(instanceId)
                }}
              >
                <Icon type="alert-circle" size="xs" className="mr-1" />
                Errors
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={async (e) => {
                  e.stopPropagation()
                  onViewApiKeys(instanceId)
                }}
              >
                <Icon type="key" size="xs" className="mr-1" />
                API Keys
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    const response =
                      await messengerAPI.processInstance(instanceId)
                    console.log('Process Instance Response:', response)
                    toast.success('Instance processing started')
                  } catch (error) {
                    console.error('Error:', error)
                    toast.error('Failed to process instance')
                  }
                }}
              >
                <Icon type="play" size="xs" className="mr-1" />
                Process
              </Button>
            </div>

            {/* WhatsApp specific diagnostics */}
            {instance.provider === 'whatsappweb' && (
              <div className="mt-2 grid grid-cols-2 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={async (e) => {
                    e.stopPropagation()
                    onViewQRHistory(instanceId)
                  }}
                >
                  <Icon type="qr-code" size="xs" className="mr-1" />
                  QR History
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={async (e) => {
                    e.stopPropagation()
                    try {
                      const response =
                        await messengerAPI.clearInstanceErrorsExtended(
                          instanceId
                        )
                      console.log('Clear Errors Response:', response)
                      toast.success('Errors cleared successfully')
                    } catch (error) {
                      console.error('Error:', error)
                      toast.error('Failed to clear errors')
                    }
                  }}
                >
                  <Icon type="trash" size="xs" className="mr-1" />
                  Clear Errors
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <div className="border-border flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-3">
          {/* Статус соединения - точка и текст */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div
                className={cn(
                  'size-3 shrink-0 rounded-full transition-colors',
                  instance.status === 'running' && 'bg-green-500',
                  instance.status === 'error' && 'bg-red-500',
                  instance.status === 'processing' && 'bg-yellow-500',
                  instance.status === 'stopped' && 'bg-gray-400',
                  instance.status === 'created' && 'bg-blue-500'
                )}
              />
              {instance.status === 'running' && (
                <div className="absolute -inset-1 animate-pulse rounded-full bg-green-400 opacity-20" />
              )}
            </div>
            <span
              className={cn(
                'text-xs font-medium transition-colors',
                instance.status === 'running' && 'text-green-500',
                instance.status === 'error' && 'text-destructive',
                instance.status === 'processing' && 'text-yellow-500',
                instance.status === 'stopped' && 'text-muted-foreground',
                instance.status === 'created' && 'text-blue-500'
              )}
            >
              {getStatusText(instance.status)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation()
              setShowDiagnostics(!showDiagnostics)
            }}
            title="Toggle Diagnostics"
          >
            <Icon type="settings" size="xs" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails(instanceId)
            }}
            title="View Details"
          >
            <Icon type="info" size="xs" />
          </Button>

          {instance.provider === 'whatsappweb' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onViewQR(instanceId)
              }}
              title="Show QR Code"
            >
              <Icon type="qr-code" size="xs" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onViewLogs(instanceId)
            }}
            title="Instance Logs"
          >
            <Icon type="file-text" size="xs" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(instance)
            }}
            title="Edit"
          >
            <Icon type="edit" size="xs" />
          </Button>

          {instance.status === 'running' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-orange-500 hover:text-orange-600"
              onClick={(e) => {
                e.stopPropagation()
                handleAction(async () => onRestart(instanceId))
              }}
              disabled={isLoading}
              title="Restart"
            >
              <Icon
                type="refresh-cw"
                size="xs"
                className={isLoading ? 'animate-spin' : ''}
              />
            </Button>
          )}

          {instance.status === 'running' ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation()
                handleAction(async () => onStop(instanceId))
              }}
              disabled={isLoading}
              title="Stop"
            >
              <Icon type="square" size="xs" />
            </Button>
          ) : instance.status === 'stopped' ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-green-500 hover:text-green-600"
              onClick={(e) => {
                e.stopPropagation()
                handleAction(async () => onStart(instanceId))
              }}
              disabled={isLoading}
              title="Start"
            >
              <Icon type="play" size="xs" />
            </Button>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}

const MessengerInstanceManager = ({
  onEditInstance,
  onClose
}: MessengerInstanceManagerProps) => {
  const {
    instances,
    isLoading,
    error,
    selectedInstance,
    fetchInstances,
    setSelectedInstance
  } = useMessengerProvider()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [providerFilter, setProviderFilter] = useState<string>('all')

  // Manager state
  const [systemStats, setSystemStats] = useState<InstanceStatsResponse | null>(
    null
  )
  const [systemResources, setSystemResources] =
    useState<SystemResourcesData | null>(null)
  const [performance, setPerformance] =
    useState<SystemPerformanceResponse | null>(null)
  const [selectedInstanceLogs, setSelectedInstanceLogs] = useState<string>('')
  const [selectedInstanceQR, setSelectedInstanceQR] = useState<string>('')
  const [selectedInstanceDetails, setSelectedInstanceDetails] =
    useState<InstanceDetailsData | null>(null)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [instanceToDelete, setInstanceToDelete] = useState<string | null>(null)
  const [currentLogsInstanceId, setCurrentLogsInstanceId] = useState<
    string | null
  >(null)
  const logsContainerRef = useRef<HTMLDivElement>(null)

  // Diagnostic modals state
  const [showMemoryDialog, setShowMemoryDialog] = useState(false)
  const [showStatusHistoryDialog, setShowStatusHistoryDialog] = useState(false)
  const [showErrorsDialog, setShowErrorsDialog] = useState(false)
  const [showApiKeysDialog, setShowApiKeysDialog] = useState(false)
  const [showQRHistoryDialog, setShowQRHistoryDialog] = useState(false)

  // Diagnostic data state
  const [selectedMemoryData, setSelectedMemoryData] = useState<
    import('@/lib/messengerApi').MemoryResponse | null
  >(null)
  const [selectedStatusHistory, setSelectedStatusHistory] = useState<
    import('@/lib/messengerApi').StatusHistoryResponse | null
  >(null)
  const [selectedErrors, setSelectedErrors] = useState<
    import('@/lib/messengerApi').ErrorsResponse | null
  >(null)
  const [selectedApiKeys, setSelectedApiKeys] = useState<
    import('@/lib/messengerApi').APIKeyHistoryResponse | null
  >(null)
  const [selectedQRHistory, setSelectedQRHistory] = useState<
    import('@/lib/messengerApi').QRHistoryResponse | null
  >(null)

  // Instance Manager Logs state
  const [showInstanceManagerLogs, setShowInstanceManagerLogs] = useState(false)

  // Load system data with error handling
  const loadSystemStats = useCallback(async () => {
    try {
      const stats = await messengerAPI.getInstanceStats()
      setSystemStats(stats)
    } catch (error) {
      console.error('Failed to load system stats:', error)
    }
  }, [])

  const loadSystemResources = useCallback(async () => {
    try {
      // Поддерживаем как HTTP, так и HTTPS через environment variables
      const protocol = process.env.NEXT_PUBLIC_MESSENGER_PROTOCOL || 'http'
      const host = process.env.NEXT_PUBLIC_MESSENGER_HOST || '13.61.141.6:3000'
      const resourcesUrl = `${protocol}://${host}/api/v1/resources`

      const response = await fetch(resourcesUrl)
      const resources: SystemResourcesData = await response.json()
      setSystemResources(resources)
    } catch (error) {
      console.error('Failed to load system resources:', error)
    }
  }, [])

  const loadPerformanceData = useCallback(async () => {
    try {
      const perf = await messengerAPI.getSystemPerformance()
      setPerformance(perf)
    } catch (error) {
      console.error('Failed to load performance data:', error)
    }
  }, [])

  // Load system data
  useEffect(() => {
    loadSystemStats()
    loadSystemResources()
    loadPerformanceData()
    const interval = setInterval(() => {
      loadSystemStats()
      loadSystemResources()
      loadPerformanceData()
    }, 30000)

    return () => clearInterval(interval)
  }, [loadSystemStats, loadSystemResources, loadPerformanceData])

  // Filter instances with null safety
  const filteredInstances = instances.filter((instance) => {
    if (!instance) return false

    const matchesSearch =
      instance.instance_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instance.provider?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || instance.status === statusFilter
    const matchesProvider =
      providerFilter === 'all' || instance.provider === providerFilter

    return matchesSearch && matchesStatus && matchesProvider
  })

  // Instance actions with proper error handling
  const handleStartInstance = async (instanceId: string) => {
    try {
      await messengerAPI.startInstance(instanceId)
      toast.success('Instance started')
      fetchInstances()
    } catch (error) {
      console.error('Error starting instance:', error)
      toast.error('Failed to start instance')
    }
  }

  const handleStopInstance = async (instanceId: string) => {
    try {
      await messengerAPI.stopInstance(instanceId)
      toast.success('Instance stopped')
      fetchInstances()
    } catch (error) {
      console.error('Error stopping instance:', error)
      toast.error('Failed to stop instance')
    }
  }

  const handleRestartInstance = async (instanceId: string) => {
    try {
      await messengerAPI.restartInstance(instanceId)
      toast.success('Instance restarted')
      fetchInstances()
    } catch (error) {
      console.error('Error restarting instance:', error)
      toast.error('Failed to restart instance')
    }
  }

  const confirmDeleteInstance = async () => {
    if (!instanceToDelete) return

    try {
      await messengerAPI.deleteInstance(instanceToDelete)
      toast.success('Instance deleted')
      fetchInstances()
    } catch (error) {
      console.error('Error deleting instance:', error)
      toast.error('Failed to delete instance')
    } finally {
      setShowDeleteDialog(false)
      setInstanceToDelete(null)
    }
  }

  const handleViewDetails = async (instanceId: string) => {
    try {
      const details = await messengerAPI.getInstanceDetails(instanceId)
      setSelectedInstanceDetails(details)
      setShowDetailsDialog(true)
    } catch (error) {
      console.error('Error loading instance details:', error)
      toast.error('Failed to load instance details')
    }
  }

  const handleViewLogs = async (instanceId: string) => {
    try {
      const logs = await messengerAPI.getInstanceLogs(instanceId, { tail: 500 })

      // API returns logs as an object with container names as keys
      // Extract the logs content from the response
      let logsContent = 'Logs not found'

      if (
        logs.logs &&
        typeof logs.logs === 'object' &&
        !Array.isArray(logs.logs)
      ) {
        // Get the first container's logs (there might be multiple containers)
        const logsObject = logs.logs as Record<string, string>
        const containerNames = Object.keys(logsObject)
        if (containerNames.length > 0) {
          const firstContainerLogs = logsObject[containerNames[0]]
          if (typeof firstContainerLogs === 'string') {
            logsContent = firstContainerLogs
          } else {
            // If all containers, join them
            logsContent = containerNames
              .map((name) => `=== ${name} ===\n${logsObject[name]}`)
              .join('\n\n')
          }
        }
      } else if (typeof logs.logs === 'string') {
        logsContent = logs.logs
      }

      // Format logs with ANSI colors and clean timestamps
      const formattedLogs = formatLogsWithAnsi(logsContent)
      setSelectedInstanceLogs(formattedLogs)
      setCurrentLogsInstanceId(instanceId)
      setShowLogsDialog(true)

      // Auto scroll to end of logs
      setTimeout(() => {
        if (logsContainerRef.current) {
          logsContainerRef.current.scrollTop =
            logsContainerRef.current.scrollHeight
        }
      }, 100)
    } catch (error) {
      console.error('Error loading logs:', error)
      toast.error('Error loading logs')
    }
  }

  const handleViewQR = async (instanceId: string) => {
    try {
      const qrData = await messengerAPI.getInstanceQR(instanceId)
      setSelectedInstanceQR(qrData.qr_code || '')
      setShowQRDialog(true)
    } catch (error) {
      console.error('Error loading QR code:', error)
      toast.error('QR code not available')
    }
  }

  // Diagnostic functions
  const handleViewMemory = async (instanceId: string) => {
    try {
      const response = await messengerAPI.getInstanceMemory(instanceId)
      setSelectedMemoryData(response)
      setShowMemoryDialog(true)
      toast.success('Memory data loaded')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to get memory data')
    }
  }

  const handleViewStatusHistory = async (instanceId: string) => {
    try {
      const response = await messengerAPI.getInstanceStatusHistory(
        instanceId,
        10
      )
      setSelectedStatusHistory(response)
      setShowStatusHistoryDialog(true)
      toast.success('Status history loaded')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to get status history')
    }
  }

  const handleViewErrors = async (instanceId: string) => {
    try {
      const response = await messengerAPI.getInstanceErrorsExtended(
        instanceId,
        10
      )
      setSelectedErrors(response)
      setShowErrorsDialog(true)
      toast.success('Errors loaded')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to get errors')
    }
  }

  const handleViewApiKeys = async (instanceId: string) => {
    try {
      const response = await messengerAPI.getInstanceAPIKeyHistory(
        instanceId,
        5
      )
      setSelectedApiKeys(response)
      setShowApiKeysDialog(true)
      toast.success('API keys history loaded')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to get API key history')
    }
  }

  const handleViewQRHistory = async (instanceId: string) => {
    try {
      const response = await messengerAPI.getInstanceQRHistory(instanceId, 10)
      setSelectedQRHistory(response)
      setShowQRHistoryDialog(true)
      toast.success('QR history loaded')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to get QR history')
    }
  }

  // Get unique providers and statuses for filters with null safety
  const availableProviders = Array.from(
    new Set(instances.filter((i) => i?.provider).map((i) => i.provider))
  )
  const availableStatuses = Array.from(
    new Set(instances.filter((i) => i?.status).map((i) => i.status))
  )

  return (
    <motion.main
      className="bg-background-primary relative flex flex-grow flex-col rounded-xl p-3"
      style={{ margin: '5px' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex-1 overflow-hidden">
        <div className="h-full px-3 py-3">
          {/* Header with Close Button */}
          <motion.div
            className="mb-4 flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-primary text-lg font-semibold">
              Instance Manager
            </h1>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onClose}
                title="Close Manager"
              >
                <Icon type="x" size="sm" />
              </Button>
            )}
          </motion.div>

          {/* Instance Statistics - Full Width */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-background-secondary border-none pt-4">
              <CardContent className="space-y-2 pt-2">
                {systemStats ? (
                  <div className="grid grid-cols-4 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                        <Icon
                          type="cpu"
                          size="sm"
                          className="text-green-600 dark:text-green-400"
                        />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Active</p>
                        <p className="text-xl font-bold">
                          {systemStats.stats?.active_instances || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                        <Icon
                          type="database"
                          size="sm"
                          className="text-blue-600 dark:text-blue-400"
                        />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Total</p>
                        <p className="text-xl font-bold">
                          {systemStats.stats?.total_instances || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900/20">
                        <Icon
                          type="alert-circle"
                          size="sm"
                          className="text-yellow-600 dark:text-yellow-400"
                        />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Errors</p>
                        <p className="text-xl font-bold">
                          {systemStats.stats?.error_instances || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/20">
                        <Icon
                          type="link"
                          size="sm"
                          className="text-purple-600 dark:text-purple-400"
                        />
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Auth</p>
                        <p className="text-xl font-bold">
                          {systemStats.stats?.authenticated_instances || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-5 w-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Memory usage and Performance */}
                {(systemStats?.stats || performance) && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-6 gap-4">
                      {systemStats?.stats && (
                        <>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Memory Usage
                            </span>
                            <span className="font-medium">
                              {systemStats.stats.memory_usage_mb}MB
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Avg Uptime
                            </span>
                            <span className="font-medium">
                              {Math.floor(systemStats.stats.avg_uptime_hours)}h
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Messages Today
                            </span>
                            <span className="font-medium">
                              {systemStats.stats.total_messages_today}
                            </span>
                          </div>
                        </>
                      )}
                      {performance && (
                        <>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Failure Rate
                            </span>
                            <span className="font-medium">
                              {(
                                (
                                  performance as {
                                    performance?: { failureRate?: number }
                                  }
                                ).performance?.failureRate || 0
                              ).toFixed(2)}
                              %
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Concurrent Req
                            </span>
                            <span className="font-medium">
                              {(
                                performance as {
                                  performance?: { concurrentRequests?: number }
                                }
                              ).performance?.concurrentRequests || 0}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Peak Concurrency
                            </span>
                            <span className="font-medium">
                              {(
                                performance as {
                                  performance?: { peakConcurrency?: number }
                                }
                              ).performance?.peakConcurrency || 0}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <div
            className="grid h-full grid-cols-1 gap-8"
            style={{ gridTemplateColumns: '1fr 0.28fr' }}
          >
            {/* Main Content */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex h-full flex-col">
                <div className="flex-1 space-y-6 overflow-y-auto">
                  {/* Filters */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search by User ID or Provider..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-secondary bg-background-primary text-primary text-xs"
                      />
                    </div>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="border-secondary bg-primary text-primary-foreground w-32 text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-primary border-none">
                        <SelectItem value="all">All Status</SelectItem>
                        {availableStatuses.map((status) => (
                          <SelectItem key={`status-${status}`} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={providerFilter}
                      onValueChange={setProviderFilter}
                    >
                      <SelectTrigger className="border-secondary bg-primary text-primary-foreground w-32 text-xs">
                        <SelectValue placeholder="Provider" />
                      </SelectTrigger>
                      <SelectContent className="bg-primary border-none">
                        <SelectItem value="all">All Providers</SelectItem>
                        {availableProviders.map((provider) => (
                          <SelectItem
                            key={`provider-${provider}`}
                            value={provider}
                          >
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Instances grid */}
                  <div className="flex-1 overflow-hidden">
                    {isLoading ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {[1, 2, 3, 4].map((i) => (
                          <Card
                            key={`skeleton-${i}`}
                            className="bg-background-secondary border-none"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <div className="space-y-1">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-24" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : error ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="text-center">
                          <Icon
                            type="alert-circle"
                            size="md"
                            className="text-destructive mx-auto mb-2"
                          />
                          <p className="text-destructive text-sm">{error}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => fetchInstances()}
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    ) : filteredInstances.length === 0 ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="text-center">
                          <Icon
                            type="message-circle"
                            size="md"
                            className="text-muted-foreground mx-auto mb-2"
                          />
                          <p className="text-muted-foreground text-sm">
                            {searchQuery ||
                            statusFilter !== 'all' ||
                            providerFilter !== 'all'
                              ? 'No instances found'
                              : 'No messenger instances'}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {searchQuery ||
                            statusFilter !== 'all' ||
                            providerFilter !== 'all'
                              ? 'Try changing filters'
                              : 'Create your first instance to get started'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4 overflow-y-auto pb-4 pr-2 md:grid-cols-2">
                        <AnimatePresence>
                          {filteredInstances.map((instance) =>
                            instance && instance.instance_id ? (
                              <InstanceItem
                                key={`instance-${instance.instance_id}`}
                                instance={instance}
                                onSelect={setSelectedInstance}
                                onEdit={onEditInstance}
                                onRestart={handleRestartInstance}
                                onStop={handleStopInstance}
                                onStart={handleStartInstance}
                                onViewLogs={handleViewLogs}
                                onViewQR={handleViewQR}
                                onViewDetails={handleViewDetails}
                                onViewMemory={handleViewMemory}
                                onViewStatusHistory={handleViewStatusHistory}
                                onViewErrors={handleViewErrors}
                                onViewApiKeys={handleViewApiKeys}
                                onViewQRHistory={handleViewQRHistory}
                                isSelected={
                                  selectedInstance?.instance_id ===
                                  instance.instance_id
                                }
                              />
                            ) : null
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.aside
              className="space-y-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {/* System Resources */}
              <Card className="bg-background-secondary border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="font-dmmono text-xs font-medium uppercase">
                    System Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-2">
                  {systemResources ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="font-dmmono text-xs font-medium uppercase">
                          Server
                        </Label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">CPU:</span>
                            <span>{systemResources.server.cpu_usage}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Memory:
                            </span>
                            <span>{systemResources.server.memory_usage}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Disk:</span>
                            <span>{systemResources.server.disk_usage}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Uptime:
                            </span>
                            <span className="truncate">
                              {systemResources.server.uptime}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label className="font-dmmono text-xs font-medium uppercase">
                          Docker
                        </Label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Total:
                            </span>
                            <span>
                              {systemResources.docker.total_containers}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Running:
                            </span>
                            <span>
                              {systemResources.docker.running_containers}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-3 w-full" />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resource Management */}
              <Card className="bg-background-secondary border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="font-dmmono text-xs font-medium uppercase">
                    Resource Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs"
                    onClick={() => setShowInstanceManagerLogs(true)}
                  >
                    <Icon type="server" size="xs" className="mr-2" />
                    System Logs
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs"
                    onClick={async () => {
                      try {
                        await messengerAPI.clearPortsCache()
                        toast.success('Ports cache cleared')
                      } catch (error) {
                        console.error('Error clearing ports cache:', error)
                        toast.error('Failed to clear cache')
                      }
                    }}
                  >
                    <Icon type="refresh-cw" size="xs" className="mr-2" />
                    Clear Ports Cache
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs"
                    onClick={loadSystemStats}
                  >
                    <Icon type="cpu" size="xs" className="mr-2" />
                    Refresh Statistics
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs"
                    onClick={() => fetchInstances()}
                  >
                    <Icon type="database" size="xs" className="mr-2" />
                    Refresh Instances
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-xs"
                    onClick={loadSystemResources}
                  >
                    <Icon type="server" size="xs" className="mr-2" />
                    Refresh Resources
                  </Button>
                </CardContent>
              </Card>
            </motion.aside>
          </div>
        </div>
      </div>

      {/* Dialogs */}

      {/* Instance Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-background-primary max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>Instance Details</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden">
            {selectedInstanceDetails && (
              <div className="max-h-96 space-y-4 overflow-auto">
                {/* Health Information */}
                {selectedInstanceDetails.instance.health && (
                  <Card className="bg-background-secondary border-none">
                    <CardHeader>
                      <CardTitle className="text-sm">Health Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon
                          type={
                            selectedInstanceDetails.instance.health.healthy
                              ? 'check-circle'
                              : 'alert-circle'
                          }
                          size="xs"
                          className={
                            selectedInstanceDetails.instance.health.healthy
                              ? 'text-green-500'
                              : 'text-red-500'
                          }
                        />
                        <span className="text-sm">
                          {selectedInstanceDetails.instance.health.healthy
                            ? 'Healthy'
                            : 'Unhealthy'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span>API:</span>
                          <span
                            className={
                              selectedInstanceDetails.instance.health.services
                                .api
                                ? 'text-green-500'
                                : 'text-red-500'
                            }
                          >
                            {selectedInstanceDetails.instance.health.services
                              .api
                              ? '✓'
                              : '✗'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>MCP:</span>
                          <span
                            className={
                              selectedInstanceDetails.instance.health.services
                                .mcp
                                ? 'text-green-500'
                                : 'text-red-500'
                            }
                          >
                            {selectedInstanceDetails.instance.health.services
                              .mcp
                              ? '✓'
                              : '✗'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Docker:</span>
                          <span
                            className={
                              selectedInstanceDetails.instance.health.services
                                .docker
                                ? 'text-green-500'
                                : 'text-red-500'
                            }
                          >
                            {selectedInstanceDetails.instance.health.services
                              .docker
                              ? '✓'
                              : '✗'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Containers Information */}
                {selectedInstanceDetails.instance.containers &&
                  selectedInstanceDetails.instance.containers.length > 0 && (
                    <Card className="bg-background-secondary border-none">
                      <CardHeader>
                        <CardTitle className="text-sm">Containers</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {selectedInstanceDetails.instance.containers.map(
                          (container, index) => (
                            <div
                              key={index}
                              className="rounded border p-2 text-xs"
                            >
                              <div className="mb-1 flex items-center justify-between">
                                <span className="truncate font-semibold">
                                  {container.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs',
                                    container.state === 'running'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                  )}
                                >
                                  {container.state}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground">
                                <div>
                                  ID: {container.id.substring(0, 12)}...
                                </div>
                                <div>Status: {container.status}</div>
                              </div>
                            </div>
                          )
                        )}
                      </CardContent>
                    </Card>
                  )}

                {/* Memory Data */}
                {selectedInstanceDetails.instance.memory_data && (
                  <Card className="bg-background-secondary border-none">
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Memory Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex justify-between">
                          <span>API Key Usage:</span>
                          <span>
                            {selectedInstanceDetails.instance.memory_data?.data
                              ?.api_key_usage_count || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Error Count:</span>
                          <span>
                            {selectedInstanceDetails.instance.memory_data?.data
                              ?.error_info?.error_count || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Restart Count:</span>
                          <span>
                            {selectedInstanceDetails.instance.memory_data?.data
                              ?.system_info?.restart_count || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ready for Messages:</span>
                          <span
                            className={
                              selectedInstanceDetails.instance.memory_data?.data
                                ?.is_ready_for_messages
                                ? 'text-green-500'
                                : 'text-red-500'
                            }
                          >
                            {selectedInstanceDetails.instance.memory_data?.data
                              ?.is_ready_for_messages
                              ? 'Yes'
                              : 'No'}
                          </span>
                        </div>
                      </div>
                      {selectedInstanceDetails.instance.memory_data?.data
                        ?.message_stats && (
                        <div className="mt-2 rounded border p-2">
                          <div className="mb-1 font-semibold">
                            Message Statistics:
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              Sent:{' '}
                              {
                                selectedInstanceDetails.instance.memory_data
                                  ?.data?.message_stats?.sent_count
                              }
                            </div>
                            <div>
                              Received:{' '}
                              {
                                selectedInstanceDetails.instance.memory_data
                                  ?.data?.message_stats?.received_count
                              }
                            </div>
                            <div>
                              Daily Sent:{' '}
                              {
                                selectedInstanceDetails.instance.memory_data
                                  ?.data?.message_stats?.daily_sent
                              }
                            </div>
                            <div>
                              Daily Received:{' '}
                              {
                                selectedInstanceDetails.instance.memory_data
                                  ?.data?.message_stats?.daily_received
                              }
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="bg-background-primary max-h-[80vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>Instance Logs (Container)</DialogTitle>
            <div className="mb-4 mr-8 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (currentLogsInstanceId) {
                    await handleViewLogs(currentLogsInstanceId)
                  }
                }}
              >
                <Icon type="refresh-cw" size="xs" className="mr-2" />
                Refresh
              </Button>
            </div>
          </DialogHeader>
          <div className="overflow-hidden">
            <div
              ref={logsContainerRef}
              className="bg-background-secondary max-h-96 overflow-auto whitespace-pre-wrap rounded-lg p-4 font-mono text-xs"
              dangerouslySetInnerHTML={{ __html: selectedInstanceLogs }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Authentication QR Code</DialogTitle>
            <DialogDescription>
              Scan the QR code with the WhatsApp mobile app
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {selectedInstanceQR ? (
              <Image
                src={selectedInstanceQR}
                alt="QR Code"
                width={256}
                height={256}
                className="max-h-64 max-w-full"
              />
            ) : (
              <div className="text-center">
                <Icon
                  type="qr-code"
                  size="lg"
                  className="text-muted-foreground mx-auto mb-2"
                />
                <p className="text-muted-foreground text-sm">
                  QR code not available
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Instance</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this messenger instance? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteInstance}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Memory Data Dialog */}
      <Dialog open={showMemoryDialog} onOpenChange={setShowMemoryDialog}>
        <DialogContent className="bg-background-primary max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>Instance Memory Data</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden">
            {selectedMemoryData && (
              <div className="max-h-96 space-y-4 overflow-auto">
                <Card className="bg-background-secondary border-none">
                  <CardHeader>
                    <CardTitle className="text-sm">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline">
                          {selectedMemoryData.data?.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Auth Status:
                        </span>
                        <Badge variant="outline">
                          {selectedMemoryData.data?.auth_status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          API Key Usage:
                        </span>
                        <span>
                          {selectedMemoryData.data?.api_key_usage_count || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Ready for Messages:
                        </span>
                        <span
                          className={
                            selectedMemoryData.data?.is_ready_for_messages
                              ? 'text-green-500'
                              : 'text-red-500'
                          }
                        >
                          {selectedMemoryData.data?.is_ready_for_messages
                            ? 'Yes'
                            : 'No'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedMemoryData.data?.whatsapp_user && (
                  <Card className="bg-background-secondary border-none">
                    <CardHeader>
                      <CardTitle className="text-sm">WhatsApp User</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>
                            {selectedMemoryData.data.whatsapp_user.phone_number}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Account:
                          </span>
                          <span>
                            {selectedMemoryData.data.whatsapp_user.account}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Authenticated:
                          </span>
                          <span>
                            {new Date(
                              selectedMemoryData.data.whatsapp_user.authenticated_at
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Last Seen:
                          </span>
                          <span>
                            {new Date(
                              selectedMemoryData.data.whatsapp_user.last_seen_online
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedMemoryData.data?.message_stats && (
                  <Card className="bg-background-secondary border-none">
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Message Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Sent Count:
                          </span>
                          <span>
                            {selectedMemoryData.data.message_stats.sent_count}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Received Count:
                          </span>
                          <span>
                            {
                              selectedMemoryData.data.message_stats
                                .received_count
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Daily Sent:
                          </span>
                          <span>
                            {selectedMemoryData.data.message_stats.daily_sent}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Daily Received:
                          </span>
                          <span>
                            {
                              selectedMemoryData.data.message_stats
                                .daily_received
                            }
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedMemoryData.data?.system_info && (
                  <Card className="bg-background-secondary border-none">
                    <CardHeader>
                      <CardTitle className="text-sm">
                        System Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Restart Count:
                          </span>
                          <span>
                            {selectedMemoryData.data.system_info.restart_count}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Health Checks:
                          </span>
                          <span>
                            {
                              selectedMemoryData.data.system_info
                                .health_check_count
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Consecutive Failures:
                          </span>
                          <span>
                            {
                              selectedMemoryData.data.system_info
                                .consecutive_failures
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Uptime Start:
                          </span>
                          <span>
                            {new Date(
                              selectedMemoryData.data.system_info.uptime_start
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Status History Dialog */}
      <Dialog
        open={showStatusHistoryDialog}
        onOpenChange={setShowStatusHistoryDialog}
      >
        <DialogContent className="bg-background-primary max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>Status History</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden">
            {selectedStatusHistory && (
              <div className="max-h-96 overflow-auto">
                {selectedStatusHistory.data &&
                selectedStatusHistory.data.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStatusHistory.data.map(
                      (
                        item: {
                          status: string
                          source: string
                          timestamp: string
                          message?: string
                        },
                        index: number
                      ) => (
                        <Card
                          key={index}
                          className="bg-background-secondary border-none"
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.status}
                                </Badge>
                                <span className="text-muted-foreground text-xs">
                                  {item.source}
                                </span>
                              </div>
                              <span className="text-muted-foreground text-xs">
                                {new Date(item.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {item.message && (
                              <p className="text-muted-foreground mt-2 text-xs">
                                {item.message}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Icon
                      type="clock"
                      size="md"
                      className="text-muted-foreground mx-auto mb-2"
                    />
                    <p className="text-muted-foreground text-sm">
                      No status history available
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Errors Dialog */}
      <Dialog open={showErrorsDialog} onOpenChange={setShowErrorsDialog}>
        <DialogContent className="bg-background-primary max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>Instance Errors</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden">
            {selectedErrors && (
              <div className="max-h-96 overflow-auto">
                {selectedErrors.data && selectedErrors.data.length > 0 ? (
                  <div className="space-y-2">
                    {selectedErrors.data.map(
                      (
                        error: {
                          error: string
                          timestamp: string
                          source?: string
                          stack?: string
                        },
                        index: number
                      ) => (
                        <Card
                          key={index}
                          className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                        >
                          <CardContent className="p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <Badge variant="destructive" className="text-xs">
                                Error
                              </Badge>
                              <span className="text-muted-foreground text-xs">
                                {new Date(error.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-destructive font-mono text-sm">
                              {error.error}
                            </p>
                            {error.source && (
                              <p className="text-muted-foreground mt-1 text-xs">
                                Source: {error.source}
                              </p>
                            )}
                            {error.stack && (
                              <details className="mt-2">
                                <summary className="text-muted-foreground cursor-pointer text-xs">
                                  Stack trace
                                </summary>
                                <pre className="text-muted-foreground mt-1 whitespace-pre-wrap text-xs">
                                  {error.stack}
                                </pre>
                              </details>
                            )}
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Icon
                      type="check-circle"
                      size="md"
                      className="mx-auto mb-2 text-green-500"
                    />
                    <p className="text-muted-foreground text-sm">
                      No errors found
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* API Keys Dialog */}
      <Dialog open={showApiKeysDialog} onOpenChange={setShowApiKeysDialog}>
        <DialogContent className="bg-background-primary max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>API Keys History</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden">
            {selectedApiKeys && (
              <div className="max-h-96 overflow-auto">
                {selectedApiKeys.data && selectedApiKeys.data.length > 0 ? (
                  <div className="space-y-2">
                    {selectedApiKeys.data.map(
                      (
                        key: {
                          api_key: string
                          created_at: string
                          usage_count: number
                          last_used_at: string
                        },
                        index: number
                      ) => (
                        <Card
                          key={index}
                          className="bg-background-secondary border-none"
                        >
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-primary font-mono text-sm">
                                  {key.api_key.substring(0, 12)}...
                                  {key.api_key.substring(
                                    key.api_key.length - 6
                                  )}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {key.usage_count} uses
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Created:
                                  </span>
                                  <span>
                                    {new Date(key.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Last Used:
                                  </span>
                                  <span>
                                    {new Date(
                                      key.last_used_at
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Icon
                      type="key"
                      size="md"
                      className="text-muted-foreground mx-auto mb-2"
                    />
                    <p className="text-muted-foreground text-sm">
                      No API keys found
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR History Dialog */}
      <Dialog open={showQRHistoryDialog} onOpenChange={setShowQRHistoryDialog}>
        <DialogContent className="bg-background-primary max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>QR Code History</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden">
            {selectedQRHistory && (
              <div className="max-h-96 overflow-auto">
                {selectedQRHistory.data && selectedQRHistory.data.length > 0 ? (
                  <div className="space-y-2">
                    {selectedQRHistory.data.map(
                      (
                        qr: {
                          qr_code: string
                          generated_at: string
                          expires_at: string
                          source: string
                        },
                        index: number
                      ) => (
                        <Card
                          key={index}
                          className="bg-background-secondary border-none"
                        >
                          <CardContent className="p-3">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  QR Code #{index + 1}
                                </Badge>
                                <span className="text-muted-foreground text-xs">
                                  {qr.source}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Generated:
                                  </span>
                                  <span>
                                    {new Date(qr.generated_at).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Expires:
                                  </span>
                                  <span>
                                    {new Date(qr.expires_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs">
                                <span className="text-muted-foreground">
                                  QR Data:
                                </span>
                                <p className="text-primary mt-1 break-all font-mono">
                                  {qr.qr_code.substring(0, 100)}...
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Icon
                      type="qr-code"
                      size="md"
                      className="text-muted-foreground mx-auto mb-2"
                    />
                    <p className="text-muted-foreground text-sm">
                      No QR code history found
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Instance Manager Logs Dialog */}
      <InstanceManagerLogs
        open={showInstanceManagerLogs}
        onOpenChange={setShowInstanceManagerLogs}
      />
    </motion.main>
  )
}

export default MessengerInstanceManager
