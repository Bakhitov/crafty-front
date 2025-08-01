'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useQueryState } from 'nuqs'
import { usePlaygroundStore } from '@/store'
import useChatActions from '@/hooks/useChatActions'
import { useCompanyContext } from '@/components/CompanyProvider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import Sessions from '@/components/playground/Sidebar/Sessions'
import Tooltip from '@/components/ui/tooltip/CustomTooltip'
import { type Agent as APIAgent } from '@/lib/apiClient'

const AgentInfoSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [agentDetails, setAgentDetails] = useState<APIAgent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [agentId] = useQueryState('agent')
  const {
    isEndpointActive,
    hasStorage,
    selectedEndpoint,
    agents,
    isEndpointLoading,
    setIsAgentCreationMode,
    setEditingAgentId,
    setCopyingAgentData,
    streamingEnabled,
    setStreamingEnabled
  } = usePlaygroundStore()
  const { company } = useCompanyContext()
  const { clearChat, focusChatInput } = useChatActions()

  const isCreatingNewAgent = agentId === 'new'

  // Determine edit permissions based on company_id (same logic as left sidebar)
  useEffect(() => {
    if (agentDetails) {
      // Edit logic:
      // - Own company agents (private and public) - can edit
      // - Public agents from other companies - cannot edit
      // - Private agents from other companies - cannot edit
      const isOwnAgent = !!(
        company?.id && agentDetails.company_id === company.id
      )
      setCanEdit(isOwnAgent)
    } else {
      setCanEdit(false)
    }
  }, [agentDetails, company?.id])

  // Agent edit handler
  const handleEditAgent = useCallback(() => {
    if (!canEdit || !agentId) {
      toast.error('У вас нет прав для редактирования этого агента')
      return
    }
    setEditingAgentId(agentId)
    setIsAgentCreationMode(true)
  }, [canEdit, agentId, setEditingAgentId, setIsAgentCreationMode])

  // Обработчик копирования агента
  const handleCopyAgent = useCallback(async () => {
    if (!agentDetails || !agentId) return

    try {
      // Преобразуем APIAgent в Agent формат для копирования
      const agentForCopy = {
        id: agentDetails.id,
        agent_id: agentDetails.agent_id,
        name: agentDetails.name || '',
        description: agentDetails.description || '',
        model_config: agentDetails.model_config || { id: '', provider: '' },
        system_instructions: agentDetails.system_instructions || [],
        tool_ids: agentDetails.tool_ids || [],
        user_id: agentDetails.user_id,
        is_active: agentDetails.is_active || true,
        created_at: agentDetails.created_at || new Date().toISOString(),
        updated_at: agentDetails.updated_at || new Date().toISOString(),
        agent_config: agentDetails.agent_config || {},
        is_public: agentDetails.is_public || false,
        company_id: agentDetails.company_id
      }

      setCopyingAgentData(agentForCopy)
      setIsAgentCreationMode(true)
      toast.success(
        `Агент "${agentDetails.name}" скопирован для редактирования`
      )
    } catch (error) {
      console.error('Error copying agent:', error)
      toast.error('Ошибка при копировании агента')
    }
  }, [agentDetails, agentId, setCopyingAgentData, setIsAgentCreationMode])

  // Определяем возможность редактирования на основе company_id
  useEffect(() => {
    if (agentDetails) {
      // Логика редактирования:
      // - Агенты своей компании (приватные и публичные) - можно редактировать
      // - Публичные агенты других компаний - нельзя редактировать
      // - Приватные агенты других компаний - нельзя редактировать
      const isOwnAgent = !!(
        company?.id && agentDetails.company_id === company.id
      )
      setCanEdit(isOwnAgent)
    } else {
      setCanEdit(false)
    }
  }, [agentDetails, company?.id])

  // Handler for new chat
  const handleNewChat = () => {
    console.log('🆕 AgentInfoSidebar: Creating new chat')

    // Очищаем текущий чат
    clearChat()

    // Очищаем sessionId из URL чтобы создать новую сессию при следующем сообщении
    const url = new URL(window.location.href)
    url.searchParams.delete('session')
    window.history.replaceState({}, '', url.toString())
    console.log('🧹 AgentInfoSidebar: Cleared sessionId from URL for new chat')

    // Фокусируем поле ввода
    focusChatInput()
  }

  const fetchAgentDetails = async () => {
    if (!agentId || isCreatingNewAgent) {
      setAgentDetails(null)
      return
    }
    setIsLoading(true)

    try {
      // Проверяем, не идет ли еще загрузка агентов
      if (isEndpointLoading && agents.length === 0) {
        console.log('AgentInfoSidebar: Agents are still loading, waiting...')
        setIsLoading(false)
        return
      }

      // Ищем агента ТОЛЬКО в уже загруженном списке из store
      const agentFromStore = agents.find((agent) => agent.value === agentId)

      if (agentFromStore) {
        console.log('AgentInfoSidebar: Found agent in store:', agentFromStore)

        // Преобразуем AgentOption в APIAgent формат для отображения
        const agentForDisplay: APIAgent = {
          agent_id: agentFromStore.value,
          name: agentFromStore.label,
          model_config: {
            id: agentFromStore.model?.provider || 'unknown',
            provider: agentFromStore.model?.provider || 'unknown'
          },
          is_public: agentFromStore.is_public || false,
          company_id: agentFromStore.company_id || undefined,
          description: agentFromStore.description || undefined,
          system_instructions: agentFromStore.system_instructions || [],
          tool_ids: [],
          agent_config: {},
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: undefined
        }

        setAgentDetails(agentForDisplay)
        return
      }

      // Если агент не найден в store - просто не показываем информацию
      console.log(
        'AgentInfoSidebar: Agent not found in loaded agents:',
        agentId
      )
      setAgentDetails(null)
    } catch (error) {
      console.error('Error processing agent details:', error)
      setAgentDetails(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isCreatingNewAgent) {
      fetchAgentDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, isCreatingNewAgent, selectedEndpoint, agents])

  // Дополнительный useEffect для повторной попытки когда загрузка агентов завершится
  useEffect(() => {
    if (
      !isCreatingNewAgent &&
      !isEndpointLoading &&
      agentId &&
      !agentDetails &&
      !isLoading &&
      agents.length > 0
    ) {
      console.log(
        'AgentInfoSidebar: Agents loading completed, retrying fetch for agent:',
        agentId
      )
      fetchAgentDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isEndpointLoading,
    agentId,
    agentDetails,
    isLoading,
    isCreatingNewAgent,
    agents
  ])

  return (
    <motion.aside
      className="font-dmmono relative flex h-screen shrink-0 grow-0 flex-col overflow-hidden px-2 py-3"
      initial={{ width: '0rem' }}
      animate={{ width: isCollapsed ? '2.5rem' : '20.6rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="absolute right-2 top-4 z-10 flex items-center gap-2">
        {/* Action Buttons - Edit and Duplicate */}
        {!isLoading && agentDetails && !isCreatingNewAgent && (
          <>
            {/* Edit Button - show only if user has rights */}
            {canEdit && (
              <Button
                onClick={handleEditAgent}
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-transparent"
                aria-label="Edit agent"
              >
                <Icon
                  type="edit"
                  size="xs"
                  className="text-muted-foreground hover:text-primary"
                />
              </Button>
            )}

            {/* Copy Button - show for all agents */}
            <Button
              onClick={handleCopyAgent}
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-transparent"
              aria-label="Duplicate agent"
            >
              <Icon
                type="copy"
                size="xs"
                className="text-muted-foreground hover:text-primary"
              />
            </Button>
          </>
        )}

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
        {/* Agent Details Section - Read Only */}
        {!isLoading && agentDetails && !isCreatingNewAgent && (
          <div className="flex h-full flex-col space-y-3 overflow-hidden">
            <div className="shrink-0 space-y-3">
              <Icon type="agent" size="md" className="mx-auto" />

              <p className="text-muted text-center text-xs">{agentId}</p>

              <h2 className="text-primary text-center text-sm font-bold uppercase">
                {agentDetails.name}
              </h2>

              <div className="flex justify-center gap-x-4 py-2">
                <div className="flex flex-col items-center space-y-1">
                  <Label
                    htmlFor="streaming-toggle"
                    className="text-muted text-xs capitalize"
                  >
                    Stream
                  </Label>
                  <Switch
                    id="streaming-toggle"
                    checked={streamingEnabled}
                    onCheckedChange={setStreamingEnabled}
                  />
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <Label
                    htmlFor="is_active_api"
                    className="text-muted text-xs capitalize"
                  >
                    Active
                  </Label>
                  <Switch
                    id="is_active_api"
                    checked={
                      !!(agentDetails.is_active ?? agentDetails.is_active_api)
                    }
                    disabled={true}
                  />
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <Label
                    htmlFor="is_public"
                    className="text-muted text-xs capitalize"
                  >
                    Public
                  </Label>
                  <Switch
                    id="is_public"
                    checked={!!agentDetails.is_public}
                    disabled={true}
                  />
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="shrink-0 space-y-3">
              {agentDetails.description && (
                <div>
                  <div className="text-primary mb-2 text-xs font-medium uppercase">
                    Description
                  </div>
                  <Tooltip
                    content={
                      <div className="font-geist text-primary max-w-xs whitespace-pre-wrap break-words p-2 text-xs">
                        {agentDetails.description}
                      </div>
                    }
                    side="left"
                    delayDuration={300}
                    contentClassName="bg-background border border-border shadow-lg max-w-xs rounded-xl"
                  >
                    <p className="text-muted hover:text-foreground line-clamp-3 cursor-help font-sans text-xs transition-colors">
                      {agentDetails.description}
                    </p>
                  </Tooltip>
                </div>
              )}

              {agentDetails.system_instructions &&
                agentDetails.system_instructions.length > 0 && (
                  <div>
                    <div className="text-primary mb-2 text-xs font-medium uppercase">
                      Instructions
                    </div>
                    <Tooltip
                      content={
                        <div className="text-primary max-w-xs whitespace-pre-wrap break-words text-xs">
                          {agentDetails.system_instructions.join('\n\n')}
                        </div>
                      }
                      side="left"
                      delayDuration={300}
                      contentClassName="font-geist p-4 bg-background border border-border shadow-lg max-w-xs rounded-xl"
                    >
                      <p className="text-muted hover:text-foreground line-clamp-3 cursor-help font-sans text-xs transition-colors">
                        {agentDetails.system_instructions.join(' ')}
                      </p>
                    </Tooltip>
                  </div>
                )}
            </div>

            {isEndpointActive && agentId !== 'new' && (
              <div className="flex flex-grow flex-col overflow-hidden border-t border-zinc-700 pt-4">
                {/* Header with New Chat Button */}
                <div className="flex shrink-0 items-center justify-between pb-3">
                  <div className="text-primary text-xs font-medium uppercase">
                    Sessions
                  </div>
                  <Button
                    onClick={handleNewChat}
                    variant="ghost"
                    size="icon"
                    className="bg-background-secondary h-7 w-7 hover:bg-transparent"
                    title="Создать новый чат"
                  >
                    <Icon
                      type="plus-icon"
                      size="xs"
                      className="text-muted-foreground hover:text-primary"
                    />
                  </Button>
                </div>

                {/* Sessions - теперь с правильной прокруткой */}
                <div className="flex-grow overflow-hidden">
                  {hasStorage && <Sessions />}
                </div>
              </div>
            )}
          </div>
        )}

        {!isLoading && !agentDetails && !isCreatingNewAgent && (
          <p className="text-muted text-center text-xs">Агент не выбран</p>
        )}
      </motion.div>
    </motion.aside>
  )
}

export default AgentInfoSidebar
