'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useQueryState } from 'nuqs'
import { usePlaygroundStore } from '@/store'
import useChatActions from '@/hooks/useChatActions'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import Sessions from '@/components/playground/Sidebar/Sessions'
import Tooltip from '@/components/ui/tooltip/CustomTooltip'

interface AgentDetails {
  id?: number
  agent_id: string
  name: string
  description: string
  instructions?: string
  is_active?: boolean
  is_active_api?: boolean
  is_public?: boolean
  company_id?: string
  created_at?: string
  updated_at?: string
  model_configuration?: {
    id?: string
    provider?: string
    temperature?: number
    max_tokens?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
    stop?: string[]
    timeout?: number
    max_retries?: number
    seed?: number
    user?: string
    metadata?: Record<string, unknown>
  }
  tools_config?: {
    show_tool_calls?: boolean
    tool_call_limit?: number
    tool_choice?: string
    tools?: Array<{
      type: string
      function: {
        name: string
        description: string
        parameters: Record<string, unknown>
      }
    }>
    dynamic_tools?: string[]
    custom_tools?: string[]
    mcp_servers?: string[]
    tool_hooks?: Array<{
      hook_type: string
      registry_id: string
    }>
    function_declarations?: unknown[]
  }
  memory_config?: {
    memory_type?: string
    enable_agentic_memory?: boolean
    enable_user_memories?: boolean
    enable_session_summaries?: boolean
    add_memory_references?: boolean
    add_session_summary_references?: boolean
    memory_filters?: Record<string, unknown>
    db_url?: string
    table_name?: string
    db_schema?: string
  }
  knowledge_config?: {
    add_references?: boolean
    search_knowledge?: boolean
    update_knowledge?: boolean
    max_references?: number
    similarity_threshold?: number
    references_format?: string
    knowledge_filters?: Record<string, unknown>
    enable_agentic_knowledge_filters?: boolean
  }
  storage_config?: {
    storage_type?: string
    enabled?: boolean
    db_url?: string
    table_name?: string
    db_schema?: string
    store_events?: boolean
    extra_data?: Record<string, unknown>
  }
  reasoning_config?: {
    reasoning?: boolean
    reasoning_min_steps?: number
    reasoning_max_steps?: number
    goal?: string
    success_criteria?: string
    expected_output?: string
    reasoning_model?: string
    reasoning_agent?: string
    reasoning_prompt?: string
    reasoning_instructions?: string[]
    stream_reasoning?: boolean
    save_reasoning_steps?: boolean
    show_full_reasoning?: boolean
  }
  team_config?: {
    team_mode?: string
    role?: string
    respond_directly?: boolean
    add_transfer_instructions?: boolean
    team_response_separator?: string
    workflow_id?: string
    team_id?: string
    members?: Array<{
      agent_id: string
      role: string
      name: string
    }>
    add_member_tools_to_system_message?: boolean
    show_members_responses?: boolean
    stream_member_events?: boolean
    share_member_interactions?: boolean
    get_member_information_tool?: boolean
  }
  settings?: {
    introduction?: string
    system_message?: string
    system_message_role?: string
    create_default_system_message?: boolean
    user_message_role?: string
    create_default_user_message?: boolean
    add_messages?: Array<{
      role: string
      content: string
    }>
    context?: Record<string, unknown>
    add_context?: boolean
    resolve_context?: boolean
    additional_context?: string
    add_state_in_messages?: boolean
    add_history_to_messages?: boolean
    num_history_runs?: number
    search_previous_sessions_history?: boolean
    num_history_sessions?: number
    read_chat_history?: boolean
    read_tool_call_history?: boolean
    markdown?: boolean
    add_name_to_instructions?: boolean
    add_datetime_to_instructions?: boolean
    add_location_to_instructions?: boolean
    timezone_identifier?: string
    stream?: boolean
    stream_intermediate_steps?: boolean
    response_model?: Record<string, unknown>
    parse_response?: boolean
    use_json_mode?: boolean
    parser_model?: string
    parser_model_prompt?: string
    retries?: number
    delay_between_retries?: number
    exponential_backoff?: boolean
    debug_mode?: boolean
    monitoring?: boolean
    telemetry?: boolean
    store_events?: boolean
    events_to_skip?: string[]
    config_version?: string
    tags?: string[]
    app_id?: string
    extra_data?: Record<string, unknown>
  }
}

const AgentInfoSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [agentDetails, setAgentDetails] = useState<AgentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [agentId] = useQueryState('agent')
  const { isEndpointActive, messages, hasStorage } = usePlaygroundStore()
  const { clearChat, focusChatInput } = useChatActions()

  const isCreatingNewAgent = agentId === 'new'

  // Handler for new chat
  const handleNewChat = () => {
    clearChat()
    focusChatInput()
  }

  // Handler for refreshing agent cache
  const handleRefreshAgent = async () => {
    if (!agentId || isCreatingNewAgent || isRefreshing) {
      return
    }

    setIsRefreshing(true)
    try {
      const { selectedEndpoint } = usePlaygroundStore.getState()

      // Clear agent cache
      const cacheUrl = `${selectedEndpoint}/v1/agents/${agentId}/cache/refresh`
      const cacheResponse = await fetch(cacheUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!cacheResponse.ok) {
        throw new Error('Failed to refresh agent cache')
      }

      // Reload agent details
      await fetchAgentDetails()
      toast.success('Agent cache refreshed successfully!')
    } catch (error) {
      console.error('Error refreshing agent cache:', error)
      toast.error('Failed to refresh agent cache.')
    } finally {
      setIsRefreshing(false)
    }
  }

  const fetchAgentDetails = async () => {
    if (!agentId || isCreatingNewAgent) {
      setAgentDetails(null)
      return
    }
    setIsLoading(true)

    try {
      // Используем существующий API эндпоинт вместо Supabase
      const { selectedEndpoint } = usePlaygroundStore.getState()
      const url = `${selectedEndpoint}/v1/agents/detailed`
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch agents from API')
      }

      const allAgents = await response.json()

      // Находим нужного агента по agent_id
      const agent = allAgents.find((a: AgentDetails) => a.agent_id === agentId)

      if (!agent) {
        toast.error('Agent not found')
        setAgentDetails(null)
      } else {
        setAgentDetails(agent)
      }
    } catch (error) {
      console.error('Error fetching agent details:', error)
      toast.error('Failed to fetch agent details.')
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
  }, [agentId, isCreatingNewAgent])

  return (
    <motion.aside
      className="font-dmmono relative flex h-screen shrink-0 grow-0 flex-col overflow-hidden px-2 py-3"
      initial={{ width: '0rem' }}
      animate={{ width: isCollapsed ? '2.5rem' : '20.6rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="absolute right-2 top-4 z-10 flex items-center gap-2">
        <Button
          onClick={handleRefreshAgent}
          disabled={isRefreshing || isCreatingNewAgent}
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-transparent"
          aria-label="Refresh agent cache"
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
        {/* Agent Details Section - Read Only */}
        {!isLoading && agentDetails && !isCreatingNewAgent && (
          <div className="flex h-full flex-col space-y-3 overflow-hidden">
            <div className="shrink-0 space-y-3">
              <Icon type="agent" size="md" className="mx-auto" />

              <p className="text-muted text-center text-xs">{agentId}</p>

              <h2 className="text-primary text-center text-sm font-bold uppercase">
                {agentDetails.name}
              </h2>

              <div className="flex justify-center gap-x-6 py-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active_api"
                    checked={
                      !!(agentDetails.is_active ?? agentDetails.is_active_api)
                    }
                    disabled={true}
                  />
                  <Label
                    htmlFor="is_active_api"
                    className="text-muted text-xs capitalize"
                  >
                    Active
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_public"
                    checked={!!agentDetails.is_public}
                    disabled={true}
                  />
                  <Label
                    htmlFor="is_public"
                    className="text-muted text-xs capitalize"
                  >
                    Public
                  </Label>
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
                      <div className="max-w-xs whitespace-pre-wrap break-words">
                        {agentDetails.description}
                      </div>
                    }
                    side="left"
                    delayDuration={500}
                    contentClassName="max-w-xs"
                  >
                    <p className="text-muted line-clamp-3 cursor-help font-sans text-xs">
                      {agentDetails.description}
                    </p>
                  </Tooltip>
                </div>
              )}

              {agentDetails.instructions && (
                <div>
                  <div className="text-primary mb-2 text-xs font-medium uppercase">
                    Instructions
                  </div>
                  <Tooltip
                    content={
                      <div className="max-w-xs whitespace-pre-wrap break-words">
                        {agentDetails.instructions}
                      </div>
                    }
                    side="left"
                    delayDuration={500}
                    contentClassName="max-w-xs"
                  >
                    <p className="text-muted line-clamp-3 cursor-help font-sans text-xs">
                      {agentDetails.instructions}
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
                    disabled={messages.length === 0}
                    onClick={handleNewChat}
                    variant="ghost"
                    size="icon"
                    className="bg-background-secondary h-7 w-7 hover:bg-transparent"
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
