'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePlaygroundStore } from '@/store'
import { supabase } from '@/lib/supabase'
import { MessageInstance } from '@/types/messenger'
import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import Tooltip from '@/components/ui/tooltip/CustomTooltip'
import { messengerAPI } from '@/lib/messengerApi'

interface Agent {
  value: string
  label: string
  model: {
    provider: string
  }
  storage?: boolean
  storage_config?: {
    enabled?: boolean
  }
}

interface AuthStatus {
  status: string
  authenticated: boolean
  is_ready_for_messages?: boolean
}

const MessengerAgentSidebar = () => {
  const { selectedInstanceId } = usePlaygroundStore()
  const [instance, setInstance] = useState<MessageInstance | null>(null)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshInstance = async () => {
    setIsRefreshing(true)
    try {
      await fetchInstanceAndAgent()
    } finally {
      setIsRefreshing(false)
    }
  }

  const fetchInstanceAndAgent = useCallback(async () => {
    if (!selectedInstanceId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      // Загружаем данные инстанса
      const { data: instanceData, error: instanceError } = await supabase
        .from('message_instances')
        .select('*')
        .eq('id', selectedInstanceId)
        .single()

      if (instanceError) {
        console.error('Error fetching instance:', {
          error: instanceError,
          message: instanceError.message,
          details: instanceError.details,
          hint: instanceError.hint,
          code: instanceError.code
        })
        setInstance(null)
        setAgent(null)
        setAuthStatus(null)
        return
      }

      setInstance(instanceData)

      // Загружаем статус аутентификации
      try {
        const authResponse =
          await messengerAPI.getInstanceAuthStatus(selectedInstanceId)
        setAuthStatus(authResponse)
      } catch (error) {
        console.error('Error fetching auth status:', error)
        setAuthStatus(null)
      }

      // Если у инстанса есть agent_id, загружаем информацию об агенте
      const agentId = instanceData?.agno_config?.agent_id
      if (agentId) {
        try {
          // Попробуем загрузить агента из таблицы agents (если есть)
          const { data: agentData, error: agentError } = await supabase
            .from('agents')
            .select('*')
            .eq('agent_id', agentId)
            .single()

          // Проверяем тип ошибки - если таблица не существует или нет доступа
          if (
            agentError &&
            (agentError.code === 'PGRST116' || // table not found
              agentError.code === '42P01' || // relation does not exist
              agentError.message?.includes('does not exist') ||
              agentError.message?.includes('not found'))
          ) {
            console.log(
              'Agents table not available, using fallback agent data for:',
              agentId
            )
            // Создаем заглушку без ошибки в логах
            setAgent({
              value: agentId,
              label: `Agent ${agentId.slice(0, 8)}`,
              model: {
                provider: instanceData?.agno_config?.model || 'unknown'
              }
            })
          } else if (agentError) {
            console.error('Error fetching agent from agents table:', {
              error: agentError,
              message: agentError?.message || 'Unknown error',
              details: agentError?.details || 'No details',
              hint: agentError?.hint || 'No hint',
              code: agentError?.code || 'No code',
              agentId
            })

            // Если другая ошибка, создаем заглушку
            console.log('Creating fallback agent data for:', agentId)
            setAgent({
              value: agentId,
              label: `Agent ${agentId.slice(0, 8)}`,
              model: {
                provider: instanceData?.agno_config?.model || 'unknown'
              }
            })
          } else if (agentData) {
            // Успешно загружен агент из базы
            console.log('Successfully loaded agent from database:', agentData)
            setAgent({
              value: agentData.agent_id || agentId,
              label: agentData.name || `Agent ${agentId.slice(0, 8)}`,
              model: {
                provider:
                  agentData.model ||
                  instanceData?.agno_config?.model ||
                  'unknown'
              },
              storage: agentData.storage,
              storage_config: agentData.storage_config
            })
          } else {
            // Нет данных об агенте
            console.log('No agent data returned, creating fallback')
            setAgent({
              value: agentId,
              label: `Agent ${agentId.slice(0, 8)}`,
              model: {
                provider: instanceData?.agno_config?.model || 'unknown'
              }
            })
          }
        } catch (error) {
          console.error('Exception while loading agent:', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            agentId
          })

          // При любой ошибке создаем заглушку
          setAgent({
            value: agentId,
            label: `Agent ${agentId.slice(0, 8)}`,
            model: {
              provider: instanceData?.agno_config?.model || 'unknown'
            }
          })
        }
      } else {
        // Нет agent_id в конфигурации
        console.log('No agent_id found in instance agno_config')
        setAgent(null)
      }
    } catch (error) {
      console.error('Exception in fetchInstanceAndAgent:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        selectedInstanceId
      })
      setInstance(null)
      setAgent(null)
      setAuthStatus(null)
    } finally {
      setIsLoading(false)
    }
  }, [selectedInstanceId])

  useEffect(() => {
    fetchInstanceAndAgent()

    // Автоматическое обновление каждые 2 минуты
    const interval = setInterval(() => {
      if (selectedInstanceId && !isRefreshing) {
        fetchInstanceAndAgent()
      }
    }, 120000)

    return () => clearInterval(interval)
  }, [fetchInstanceAndAgent, selectedInstanceId, isRefreshing])

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'whatsappweb':
      case 'whatsapp-official':
        return 'whatsapp'
      case 'telegram':
        return 'telegram'
      case 'discord':
        return 'discord'
      case 'slack':
        return 'slack'
      case 'messenger':
        return 'messenger'
      default:
        return 'message-circle'
    }
  }

  const getAuthStatusInfo = (status: string | undefined, isReady?: boolean) => {
    if (status === 'client_ready' || (status === 'authenticated' && isReady)) {
      return {
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-500',
        text: 'Ready to send messages',
        showPulse: true,
        canSendMessages: true
      }
    } else if (status === 'failed' || status === 'error') {
      return {
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-500',
        text: 'Failed - restart required',
        showPulse: false,
        canSendMessages: false
      }
    } else if (status === 'pending' || status === 'processing') {
      return {
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-500',
        text: 'Starting up...',
        showPulse: false,
        canSendMessages: false
      }
    } else {
      return {
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-500',
        text: 'Unknown status',
        showPulse: false,
        canSendMessages: false
      }
    }
  }

  const hasAgentConfig = Boolean(
    instance?.agno_config?.enabled && instance?.agno_config?.agent_id
  )
  const isAuthenticated = instance?.auth_status === 'authenticated'
  const statusInfo = getAuthStatusInfo(
    authStatus?.status || instance?.auth_status || undefined,
    authStatus?.is_ready_for_messages
  )

  return (
    <motion.aside
      className="font-dmmono relative flex h-screen shrink-0 grow-0 flex-col overflow-hidden px-2 py-3"
      initial={{ width: '0rem' }}
      animate={{ width: isCollapsed ? '2.5rem' : '20.6rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="absolute right-2 top-4 z-10 flex items-center gap-2">
        <Button
          onClick={handleRefreshInstance}
          disabled={isRefreshing}
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-transparent"
          aria-label="Refresh instance"
        >
          <motion.div
            key={isRefreshing ? 'rotating' : 'idle'}
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <Icon
              type="refresh"
              size="xs"
              className="text-muted-foreground hover:text-primary"
            />
          </motion.div>
        </Button>
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
          whileTap={{ scale: 0.95 }}
        >
          <Icon
            type="sheet"
            size="xs"
            className={`text-primary transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
          />
        </motion.button>
      </div>

      <motion.div
        className="mt-10 flex w-80 flex-grow flex-col overflow-hidden pr-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? 20 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ pointerEvents: isCollapsed ? 'none' : 'auto' }}
      >
        {!isLoading && instance ? (
          <div className="flex h-full flex-col space-y-3 overflow-hidden">
            {/* Instance Header */}
            <div className="shrink-0 space-y-3">
              <Icon
                type={getProviderIcon(instance.provider)}
                size="md"
                className="mx-auto"
              />

              <p className="text-muted text-center text-xs">
                {instance.id.slice(0, 8)}...
              </p>

              <h2 className="text-primary text-center text-sm font-bold uppercase">
                {instance.provider} Messenger
              </h2>

              {/* Connection Status */}
              <div className="bg-background-secondary/30 space-y-3 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="text-primary text-xxs font-semibold uppercase tracking-wide">
                    Connection Status
                  </div>
                  <div className="relative">
                    <div
                      className={`h-2 w-2 rounded-full ${statusInfo.bgColor}`}
                    />
                    {statusInfo.showPulse && (
                      <div className="absolute -inset-1 animate-pulse rounded-full bg-green-400 opacity-20" />
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <span className={`text-sm font-medium ${statusInfo.color}`}>
                    {statusInfo.text}
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-x-6 py-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="authenticated"
                    checked={isAuthenticated}
                    disabled={true}
                  />
                  <Label
                    htmlFor="authenticated"
                    className="text-muted text-xs capitalize"
                  >
                    Authenticated
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="agno_enabled"
                    checked={hasAgentConfig}
                    disabled={true}
                  />
                  <Label
                    htmlFor="agno_enabled"
                    className="text-muted text-xs capitalize"
                  >
                    Agent
                  </Label>
                </div>
              </div>
            </div>

            {/* Instance Details */}
            <div className="shrink-0 space-y-3">
              <div>
                <div className="text-primary mb-2 text-xs font-medium uppercase">
                  Provider Details
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Status:</span>
                    <span className="text-primary font-medium">
                      {authStatus?.status || instance.auth_status || 'unknown'}
                    </span>
                  </div>
                  {instance.account && (
                    <div className="flex justify-between">
                      <span className="text-muted">Account:</span>
                      <Tooltip
                        content={instance.account}
                        side="left"
                        delayDuration={500}
                      >
                        <span className="text-primary cursor-help truncate font-medium">
                          {instance.account}
                        </span>
                      </Tooltip>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted">Type:</span>
                    <span className="text-primary font-medium">
                      {instance.type_instance.join(', ')}
                    </span>
                  </div>
                  {instance.port_api && (
                    <div className="flex justify-between">
                      <span className="text-muted">API Port:</span>
                      <span className="text-primary font-medium">
                        {instance.port_api}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {hasAgentConfig && agent && (
                <div>
                  <div className="text-primary mb-2 text-xs font-medium uppercase">
                    Agent Configuration
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted">Name:</span>
                      <span className="text-primary font-medium">
                        {agent.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Model:</span>
                      <span className="text-primary font-medium">
                        {agent.model.provider}
                      </span>
                    </div>
                    {instance.agno_config?.agnoUrl && (
                      <div className="flex justify-between">
                        <span className="text-muted">Agno URL:</span>
                        <Tooltip
                          content={instance.agno_config.agnoUrl}
                          side="left"
                          delayDuration={500}
                        >
                          <span className="text-primary cursor-help truncate text-xs font-medium">
                            {instance.agno_config.agnoUrl.split('/').pop()}
                          </span>
                        </Tooltip>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted">Stream:</span>
                      <span className="text-primary font-medium">
                        {instance.agno_config?.stream ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!hasAgentConfig && (
                <div>
                  <div className="text-primary mb-2 text-xs font-medium uppercase">
                    Agent Configuration
                  </div>
                  <div className="py-4 text-center">
                    <Icon
                      type="bot"
                      size="md"
                      className="text-muted-foreground mx-auto mb-2"
                    />
                    <p className="text-muted text-xs">No agent configured</p>
                    <p className="text-muted mt-1 text-xs">
                      Configure an agent for AI responses
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="shrink-0 space-y-2 border-t border-zinc-700 pt-3">
              <div className="text-primary mb-2 text-xs font-medium uppercase">
                Actions
              </div>
              <Button
                variant="ghost"
                className="h-8 w-full justify-start text-xs"
                size="sm"
                disabled
              >
                <Icon type="settings" size="xs" className="mr-2" />
                Configure Agent
              </Button>
              <Button
                variant="ghost"
                className="h-8 w-full justify-start text-xs"
                size="sm"
                disabled
              >
                <Icon type="refresh" size="xs" className="mr-2" />
                Restart Instance
              </Button>
            </div>
          </div>
        ) : !isLoading ? (
          <p className="text-muted text-center text-xs">Инстанс не выбран</p>
        ) : null}
      </motion.div>
    </motion.aside>
  )
}

export default MessengerAgentSidebar
