'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useQueryState } from 'nuqs'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TextArea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { X, Save, Loader2, Shield } from 'lucide-react'
import { usePlaygroundStore } from '@/store'
import { toast } from 'sonner'
import useChatActions from '@/hooks/useChatActions'
import { useCompany } from '@/hooks/useCompany'

import Icon from '@/components/ui/icon'

import { SupabaseAgentsAPI } from '@/lib/supabaseAgents'
import { AgentTemplate, AgentTemplateManager } from '@/lib/agentTemplates'
import { AgentConfigValidator } from '@/lib/agentValidation'
import {
  ExtendedAgentConfig,
  ModelConfig,
  ModelProvider,
  ValidationResult
} from '@/types/agentConfig'
import { APIAgent } from '@/types/playground'
import AgentTemplateSelector from './AgentTemplateSelector'
import { ValidationContent } from './AgentValidationPanel'

// LLM Providers with supported models
const llmProviders = [
  {
    id: 'openai',
    name: 'OpenAI',
    displayName: 'OpenAI',
    models: ['gpt-4o', 'gpt-4.1', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    displayName: 'Anthropic',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus',
      'claude-3-sonnet',
      'claude-3-haiku'
    ]
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    displayName: 'Google Gemini',
    models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro']
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    displayName: 'Mistral AI',
    models: ['mistral-large', 'mistral-medium', 'mistral-small']
  },
  {
    id: 'ollama',
    name: 'Ollama',
    displayName: 'Ollama (Local)',
    models: ['llama2', 'codellama', 'mistral']
  }
]

// Memory types, storage types and other options
const memoryTypes = [
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Recommended for production'
  }
]

const storageTypes = [
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Only supported type'
  }
]

const toolChoiceOptions = [
  {
    id: 'auto',
    name: 'Auto',
    description: 'AI decides when to use tools'
  },
  { id: 'none', name: 'None', description: 'Never use tools' },
  {
    id: 'required',
    name: 'Required',
    description: 'Always use tools'
  }
]

const referencesFormats = [
  { id: 'json', name: 'JSON', description: 'Structured format' },
  { id: 'markdown', name: 'Markdown', description: 'Formatted text' },
  { id: 'text', name: 'Text', description: 'Plain text' }
]

const timezones = [
  { id: 'UTC', name: 'UTC' },
  { id: 'Europe/Moscow', name: 'Moscow (UTC+3)' },
  { id: 'Europe/Kiev', name: 'Kiev (UTC+2)' },
  { id: 'Asia/Almaty', name: 'Almaty (UTC+6)' },
  { id: 'America/New_York', name: 'New York (UTC-5)' },
  { id: 'Europe/London', name: 'London (UTC+0)' }
]

// Типы инструментов (взято из ToolsList.tsx)
interface DynamicTool {
  id: number
  tool_id: string
  name: string
  display_name?: string
  agno_class: string
  module_path?: string
  config?: Record<string, unknown>
  description?: string
  category?: string
  icon?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CustomTool {
  id: number
  tool_id: string
  name: string
  description?: string
  source_code: string
  config: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

interface McpServer {
  id: number
  server_id: string
  name: string
  description?: string
  command?: string | null
  url?: string | null
  transport: string
  env_config?: Record<string, unknown> | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// API response types
interface DynamicToolsResponse {
  tools: DynamicTool[]
  total: number
}

interface CustomToolsResponse {
  success: boolean
  tools: CustomTool[]
  total: number
}

interface McpServersResponse {
  success: boolean
  servers: McpServer[]
  total: number
}

// Move FormField component outside to prevent re-renders
const FormField = ({
  label,
  description,
  children
}: {
  label: string
  description?: string
  children: React.ReactNode
}) => (
  <div className="space-y-2">
    <Label className="font-dmmono text-xs font-medium uppercase">{label}</Label>
    {description && <p className="text-xs text-zinc-400">{description}</p>}
    {children}
  </div>
)

// Интерфейс для agent_config
interface AgentConfig {
  storage?: {
    enabled?: boolean
    table_name?: string
    schema?: string
  }
  memory?: {
    enabled?: boolean
  }
  knowledge?: {
    enabled?: boolean
  }
  reasoning?: {
    enabled?: boolean
    min_steps?: number
    max_steps?: number
  }
  team?: {
    enabled?: boolean
  }
  history?: {
    read_chat_history?: boolean
    num_history_runs?: number
  }
  show_tool_calls?: boolean
  tool_call_limit?: number
  tool_choice?: string
  enable_agentic_memory?: boolean
  enable_user_memories?: boolean
  enable_session_summaries?: boolean
  add_memory_references?: boolean
  add_references?: boolean
  search_knowledge?: boolean
  update_knowledge?: boolean
  references_format?: string
  respond_directly?: boolean
  add_transfer_instructions?: boolean
  markdown?: boolean
  add_datetime_to_instructions?: boolean
  timezone_identifier?: string
  stream?: boolean
  store_events?: boolean
  debug_mode?: boolean
  monitoring?: boolean
  introduction?: string
  additional_context?: string
  add_context?: boolean
  use_json_mode?: boolean
  retries?: number
  delay_between_retries?: number
  exponential_backoff?: boolean
}

export default function AgentCreator() {
  const {
    setIsAgentCreationMode,
    editingAgentId,
    selectedEndpoint,
    setEditingAgentId,
    setSelectedAgent
  } = usePlaygroundStore()
  const { refreshAgentsList, clearChat } = useChatActions()
  const { company } = useCompany()
  const [, setAgentId] = useQueryState('agent')
  const [, setSessionId] = useQueryState('session')

  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Template and validation states
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Dynamic tools states
  const [dynamicToolsFromAPI, setDynamicToolsFromAPI] = useState<DynamicTool[]>(
    []
  )
  const [customToolsFromAPI, setCustomToolsFromAPI] = useState<CustomTool[]>([])
  const [mcpServersFromAPI, setMcpServersFromAPI] = useState<McpServer[]>([])
  const [areToolsLoading, setAreToolsLoading] = useState(false)

  // === BASIC INFORMATION ===
  const [agentName, setAgentName] = useState('')
  const [agentPhoto, setAgentPhoto] = useState('')
  const [agentDescription, setAgentDescription] = useState('')
  const [instructions, setInstructions] = useState('Ты простой ассистент') // Дефолтная инструкция
  const [isActive, setIsActive] = useState(true)
  const [isPublic, setIsPublic] = useState(false)

  // === MODEL CONFIGURATION === (минимальные настройки)
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [selectedModel, setSelectedModel] = useState('gpt-4.1-mini-2025-04-14') // более дешевая модель по умолчанию
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2000) // уменьшил лимит
  const [topP, setTopP] = useState(0.9)
  const [frequencyPenalty, setFrequencyPenalty] = useState(0) // отключил штрафы
  const [presencePenalty, setPresencePenalty] = useState(0) // отключил штрафы
  const [stopSequences, setStopSequences] = useState('')
  const [seed, setSeed] = useState('')
  const [timeout, setTimeout] = useState(60)
  const [maxRetries, setMaxRetries] = useState(2) // уменьшил ретраи

  // === TOOLS === (ВСЕ ОТКЛЮЧЕНО)
  const [toolsEnabled, setToolsEnabled] = useState(false)
  const [showToolCalls, setShowToolCalls] = useState(false) // отключил
  const [toolCallLimit, setToolCallLimit] = useState(5) // уменьшил лимит
  const [toolChoice, setToolChoice] = useState('auto')
  const [selectedDynamicTools, setSelectedDynamicTools] = useState<string[]>([])
  const [selectedCustomTools, setSelectedCustomTools] = useState<string[]>([])
  const [selectedMcpServers, setSelectedMcpServers] = useState<string[]>([])

  // === MEMORY === (ВСЕ ОТКЛЮЧЕНО)
  const [memoryEnabled, setMemoryEnabled] = useState(false)
  const [memoryType, setMemoryType] = useState('postgres')
  const [enableAgenticMemory, setEnableAgenticMemory] = useState(false) // отключил
  const [enableUserMemories, setEnableUserMemories] = useState(false) // отключил
  const [enableSessionSummaries, setEnableSessionSummaries] = useState(false) // отключил
  const [addMemoryReferences, setAddMemoryReferences] = useState(false) // отключил
  const [memorySchema, setMemorySchema] = useState('public') // упростил
  const [memoryDbUrl, setMemoryDbUrl] = useState('') // очистил
  const [memoryTopics, setMemoryTopics] = useState('')
  const [memoryMinImportance, setMemoryMinImportance] = useState(0.7)

  // === KNOWLEDGE BASE === (ВСЕ ОТКЛЮЧЕНО)
  const [knowledgeEnabled, setKnowledgeEnabled] = useState(false)
  const [addReferences, setAddReferences] = useState(false) // отключил
  const [searchKnowledge, setSearchKnowledge] = useState(false) // отключил
  const [updateKnowledge, setUpdateKnowledge] = useState(false)
  const [maxReferences, setMaxReferences] = useState(3) // уменьшил
  const [similarityThreshold, setSimilarityThreshold] = useState(0.75)
  const [referencesFormat, setReferencesFormat] = useState('json')
  const [knowledgeFilters, setKnowledgeFilters] = useState('')

  // === STORAGE === (ВКЛЮЧЕНО ПО УМОЛЧАНИЮ)
  const [storageEnabled, setStorageEnabled] = useState(true) // Включено по умолчанию
  const [storageType, setStorageType] = useState('postgres')
  const [storageDbUrl, setStorageDbUrl] = useState(
    'postgresql://postgres:your_password@your_host:5432/postgres'
  )
  const [storageTableName, setStorageTableName] = useState('sessions')
  const [storageSchema, setStorageSchema] = useState('public')
  const [storeEvents, setStoreEvents] = useState(true) // Включено для storage

  // === REASONING === (ОТКЛЮЧЕНО)
  const [reasoning, setReasoning] = useState(false)
  const [reasoningGoal, setReasoningGoal] = useState('')
  const [reasoningMinSteps, setReasoningMinSteps] = useState(1) // уменьшил
  const [reasoningMaxSteps, setReasoningMaxSteps] = useState(5) // уменьшил
  const [streamReasoning, setStreamReasoning] = useState(false) // отключил
  const [saveReasoningSteps, setSaveReasoningSteps] = useState(false) // отключил

  // === ADDITIONAL SETTINGS === (МИНИМАЛЬНЫЕ)
  const [systemMessage, setSystemMessage] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [debugMode, setDebugMode] = useState(false)
  const [stream, setStream] = useState(false) // отключил стриминг по умолчанию
  const [markdown, setMarkdown] = useState(true) // Включен по умолчанию
  const [addDatetimeToInstructions, setAddDatetimeToInstructions] =
    useState(false) // отключил
  const [readChatHistory, setReadChatHistory] = useState(true) // Включен для storage
  const [numHistoryRuns, setNumHistoryRuns] = useState(3) // уменьшил
  const [tags, setTags] = useState('')
  const [timezoneIdentifier, setTimezoneIdentifier] = useState('UTC')
  const [retries, setRetries] = useState(1) // уменьшил
  const [delayBetweenRetries, setDelayBetweenRetries] = useState(1) // уменьшил
  const [exponentialBackoff, setExponentialBackoff] = useState(false) // отключил
  const [useJsonMode, setUseJsonMode] = useState(false)
  const [monitoring, setMonitoring] = useState(false) // отключил

  // === CONTEXT SETTINGS === (ОЧИЩЕНО)
  const [contextPairs, setContextPairs] = useState<
    Array<{ key: string; value: string }>
  >([]) // очистил предустановленные пары
  const [additionalContext, setAdditionalContext] = useState('') // очистил
  const [addContext, setAddContext] = useState(false) // отключил

  // === TEAM SETTINGS === (ОТКЛЮЧЕНО)
  const [teamRole, setTeamRole] = useState('')
  const [respondDirectly, setRespondDirectly] = useState(false) // отключил
  const [addTransferInstructions, setAddTransferInstructions] = useState(false) // отключил

  const isEditMode = !!editingAgentId

  // Template functions
  const handleSelectTemplate = (template: AgentTemplate) => {
    const applied = AgentTemplateManager.applyTemplate(template.id)
    if (!applied) return

    // Apply template to form state
    setAgentName(applied.name)
    setAgentDescription(applied.description)
    setInstructions(applied.systemInstructions.join('\n'))

    // Apply model config
    setSelectedProvider(applied.modelConfig.provider)
    setSelectedModel(applied.modelConfig.id)
    setTemperature(applied.modelConfig.temperature || 0.7)
    setMaxTokens(applied.modelConfig.max_tokens || 2000)
    setTopP(applied.modelConfig.top_p || 0.9)
    setFrequencyPenalty(applied.modelConfig.frequency_penalty || 0)
    setPresencePenalty(applied.modelConfig.presence_penalty || 0)

    // Apply agent config
    const config = applied.agentConfig as ExtendedAgentConfig

    // Storage
    if (config.storage?.enabled) {
      setStorageEnabled(true)
      setStorageTableName(config.storage.table_name || 'sessions')
      setStorageSchema(config.storage.schema || 'public')
    }

    // Memory
    if (config.memory?.enabled) {
      setMemoryEnabled(true)
      setEnableAgenticMemory(config.enable_agentic_memory || false)
      setEnableUserMemories(config.enable_user_memories || false)
      setEnableSessionSummaries(config.enable_session_summaries || false)
      setAddMemoryReferences(config.add_memory_references || false)
    }

    // Knowledge
    if (config.knowledge?.enabled) {
      setKnowledgeEnabled(true)
      setSearchKnowledge(config.search_knowledge || false)
      setAddReferences(config.add_references || false)
      setReferencesFormat(config.references_format || 'json')
    }

    // Tools
    if (config.show_tool_calls) {
      setToolsEnabled(true)
      setShowToolCalls(config.show_tool_calls)
      setToolCallLimit(config.tool_call_limit || 10)
      setToolChoice((config.tool_choice as string) || 'auto')
    }

    // Reasoning
    if (config.reasoning?.enabled) {
      setReasoning(true)
      setReasoningMinSteps(config.reasoning.min_steps || 1)
      setReasoningMaxSteps(config.reasoning.max_steps || 10)
    }

    // Other settings
    setMarkdown(config.markdown || false)
    setAddDatetimeToInstructions(config.add_datetime_to_instructions || false)
    setStream(config.stream || false)
    setDebugMode(config.debug_mode || false)
    setMonitoring(config.monitoring || false)

    toast.success(`Шаблон "${template.name}" применен!`)
    validateConfiguration()
  }

  // Validation function
  const validateConfiguration = useCallback(() => {
    setIsValidating(true)

    try {
      // Build current model config
      const currentModelConfig: ModelConfig = {
        provider: selectedProvider as ModelProvider,
        id: selectedModel,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        stop: stopSequences
          ? stopSequences.split(',').map((s) => s.trim())
          : [],
        timeout,
        max_retries: maxRetries,
        seed: seed ? parseInt(seed) : undefined
      }

      // Build current agent config
      const currentAgentConfig: ExtendedAgentConfig = {
        storage: storageEnabled
          ? {
              enabled: true,
              table_name: storageTableName,
              schema: storageSchema
            }
          : undefined,
        memory: memoryEnabled
          ? {
              enabled: true,
              type: 'postgres',
              db_url: storageDbUrl, // Используем тот же URL что и для storage
              table_name: 'user_memories',
              schema: storageSchema || 'public',
              delete_memories: true,
              clear_memories: true
            }
          : undefined,
        knowledge: knowledgeEnabled
          ? {
              enabled: true,
              type: 'url'
            }
          : undefined,
        reasoning: reasoning
          ? {
              enabled: true,
              min_steps: reasoningMinSteps,
              max_steps: reasoningMaxSteps
            }
          : undefined,
        show_tool_calls: toolsEnabled ? showToolCalls : undefined,
        tool_call_limit: toolsEnabled ? toolCallLimit : undefined,
        enable_agentic_memory: memoryEnabled ? enableAgenticMemory : undefined,
        enable_user_memories: memoryEnabled ? enableUserMemories : undefined,
        search_knowledge: knowledgeEnabled ? searchKnowledge : undefined,
        add_references: knowledgeEnabled ? addReferences : undefined,
        markdown,
        add_datetime_to_instructions: addDatetimeToInstructions,
        stream,
        debug_mode: debugMode,
        monitoring
      }

      // Get selected tool IDs
      const currentToolIds = [
        ...selectedDynamicTools,
        ...selectedCustomTools,
        ...selectedMcpServers
      ]

      // Validate configuration
      const result = AgentConfigValidator.validateConfig(
        currentModelConfig,
        currentAgentConfig,
        currentToolIds
      )

      setValidationResult(result)
    } catch (error) {
      console.error('Validation error:', error)
      toast.error('Ошибка валидации конфигурации')
    } finally {
      setIsValidating(false)
    }
  }, [
    selectedProvider,
    selectedModel,
    temperature,
    maxTokens,
    topP,
    frequencyPenalty,
    presencePenalty,
    stopSequences,
    timeout,
    maxRetries,
    seed,
    storageEnabled,
    storageDbUrl,
    storageTableName,
    storageSchema,
    memoryEnabled,
    enableAgenticMemory,
    enableUserMemories,
    knowledgeEnabled,
    searchKnowledge,
    addReferences,
    reasoning,
    reasoningMinSteps,
    reasoningMaxSteps,
    toolsEnabled,
    showToolCalls,
    toolCallLimit,
    markdown,
    addDatetimeToInstructions,
    stream,
    debugMode,
    monitoring,
    selectedDynamicTools,
    selectedCustomTools,
    selectedMcpServers
  ])

  // Context pairs management functions
  const addContextPair = () => {
    setContextPairs([...contextPairs, { key: '', value: '' }])
  }

  const removeContextPair = (index: number) => {
    setContextPairs(contextPairs.filter((_, i) => i !== index))
  }

  const updateContextPair = (
    index: number,
    field: 'key' | 'value',
    newValue: string
  ) => {
    const updated = [...contextPairs]
    updated[index][field] = newValue
    setContextPairs(updated)
  }

  const toggleDynamicTool = (toolId: string) => {
    setSelectedDynamicTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    )
  }

  const toggleCustomTool = (toolId: string) => {
    setSelectedCustomTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    )
  }

  const toggleMcpServer = (serverId: string) => {
    setSelectedMcpServers((prev) =>
      prev.includes(serverId)
        ? prev.filter((id) => id !== serverId)
        : [...prev, serverId]
    )
  }

  const selectedProviderData = llmProviders.find(
    (p) => p.id === selectedProvider
  )

  // Загрузка инструментов из API
  const fetchToolsFromAPI = useCallback(async () => {
    if (!selectedEndpoint) return

    setAreToolsLoading(true)
    try {
      // Динамические инструменты
      try {
        const dynamicResponse = await fetch(`${selectedEndpoint}/v1/tools/`)
        if (dynamicResponse.ok) {
          const dynamicData: DynamicToolsResponse = await dynamicResponse.json()
          setDynamicToolsFromAPI(
            Array.isArray(dynamicData.tools) ? dynamicData.tools : []
          )
        }
      } catch (error) {
        console.error('Error fetching dynamic tools:', error)
      }

      // Кастомные инструменты
      try {
        const customResponse = await fetch(
          `${selectedEndpoint}/v1/tools/custom`
        )
        if (customResponse.ok) {
          const customData: CustomToolsResponse = await customResponse.json()
          if (customData.success && Array.isArray(customData.tools)) {
            setCustomToolsFromAPI(customData.tools)
          }
        }
      } catch (error) {
        console.error('Error fetching custom tools:', error)
      }

      // MCP серверы
      try {
        const mcpResponse = await fetch(`${selectedEndpoint}/v1/tools/mcp`)
        if (mcpResponse.ok) {
          const mcpData: McpServersResponse = await mcpResponse.json()
          if (mcpData.success && Array.isArray(mcpData.servers)) {
            setMcpServersFromAPI(mcpData.servers)
          }
        }
      } catch (error) {
        console.error('Error fetching MCP servers:', error)
      }
    } catch (error) {
      console.error('Error fetching tools:', error)
      toast.error('Error loading tools')
    } finally {
      setAreToolsLoading(false)
    }
  }, [selectedEndpoint])

  // Получаем объединенные списки инструментов для отображения
  const availableDynamicTools = dynamicToolsFromAPI.map((tool) => ({
    id: tool.tool_id,
    name: tool.display_name || tool.name,
    description: tool.description || `${tool.agno_class} tool`,
    category: tool.category || 'utility'
  }))

  const availableCustomTools = customToolsFromAPI.map((tool) => ({
    id: tool.tool_id,
    name: tool.name,
    description: tool.description || 'Custom Python tool'
  }))

  const availableMcpServers = mcpServersFromAPI.map((server) => ({
    id: server.server_id,
    name: server.name,
    description: server.description || `${server.transport} server`
  }))

  const handleClose = () => {
    setIsAgentCreationMode(false)
    setEditingAgentId(null)
  }

  // Function to select agent and navigate to chat
  const navigateToAgentChat = useCallback(
    async (agentId: string, agentData?: APIAgent) => {
      try {
        console.log('AgentCreator: Navigating to agent chat for:', agentId)

        let agent
        if (agentData) {
          // Use the provided agent data directly
          agent = agentData
          console.log('AgentCreator: Using provided agent data')
        } else {
          // Fallback to fetching from Supabase
          console.log('AgentCreator: Fetching agent from Supabase...')
          agent = await SupabaseAgentsAPI.getAgent(agentId)
        }

        if (agent) {
          // Set selected agent for chat
          const agentOption = {
            value: agent.agent_id,
            label: agent.name,
            model: {
              provider: agent.model_config?.provider || 'unknown'
            },
            storage: Boolean(
              (agent.agent_config as AgentConfig)?.storage?.enabled
            ),
            storage_config: (agent.agent_config as AgentConfig)?.storage,
            is_public: agent.is_public,
            company_id: agent.company_id,
            description: agent.description,
            system_instructions: agent.system_instructions
          }

          console.log('AgentCreator: Setting selected agent:', agentOption)
          setSelectedAgent(agentOption)

          // Set agent ID in URL and clear session/chat
          await setAgentId(agent.agent_id)
          setSessionId(null)
          clearChat()

          console.log('AgentCreator: Successfully navigated to agent chat')
        } else {
          console.error('AgentCreator: Agent not found after creation')
          toast.error('Failed to load the created agent')
        }

        // Close agent creator and navigate to playground
        setIsAgentCreationMode(false)
        setEditingAgentId(null)
      } catch (error) {
        console.error('Error navigating to agent chat:', error)
        toast.error('Failed to open chat with the created agent')
        // Still close the creator even if navigation fails
        setIsAgentCreationMode(false)
        setEditingAgentId(null)
      }
    },
    [
      setSelectedAgent,
      setIsAgentCreationMode,
      setEditingAgentId,
      setAgentId,
      setSessionId,
      clearChat
    ]
  )

  const handleSave = async () => {
    if (!agentName.trim()) {
      toast.error('Agent name is required')
      return
    }

    if (!selectedProvider || !selectedModel) {
      toast.error('Model configuration is required')
      return
    }

    setIsSaving(true)
    try {
      const payload = buildAgentPayload()

      // Payload уже в правильном формате для Supabase
      const agentData = {
        agent_id: payload.agent_id,
        name: payload.name,
        description: payload.description,
        model_config: payload.model_config,
        system_instructions: payload.system_instructions,
        tool_ids: payload.tool_ids,
        agent_config: payload.agent_config,
        goal: payload.goal,
        expected_output: payload.expected_output,
        role: payload.role,
        is_public: payload.is_public,
        photo: payload.photo,
        category: payload.category,
        is_active: payload.is_active
      }

      let result
      if (isEditMode) {
        result = await SupabaseAgentsAPI.updateAgent(editingAgentId!, agentData)
      } else {
        result = await SupabaseAgentsAPI.createAgent(agentData)
      }

      const agentId = result.agent_id

      toast.success(`Agent ${isEditMode ? 'updated' : 'created'} successfully!`)

      // Invalidate cache to ensure fresh data
      const { globalDataCache } = await import('@/lib/requestCache')
      globalDataCache.invalidateAgents(company?.id || undefined)

      // Force refresh agents list to get the newly created agent
      console.log('AgentCreator: Refreshing agents list after creation...')
      await refreshAgentsList()

      // Navigate to agent chat - use the result directly instead of searching
      await navigateToAgentChat(agentId, result)
    } catch (error) {
      console.error('Error saving agent:', error)
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} agent`)
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!editingAgentId) return

    try {
      await SupabaseAgentsAPI.deleteAgent(editingAgentId)

      toast.success('Agent deleted successfully!')

      // Refresh agents list and navigate back to playground
      await refreshAgentsList()
      setIsAgentCreationMode(false)
      setEditingAgentId(null)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting agent:', error)
      toast.error('Failed to delete agent')
      setShowDeleteDialog(false)
    }
  }

  // Load agent data for editing
  const loadAgentData = useCallback(async () => {
    if (!editingAgentId) return

    setIsLoading(true)
    try {
      // Get agent from Supabase instead of Agno API
      const agent = await SupabaseAgentsAPI.getAgent(editingAgentId)

      if (!agent) {
        toast.error('Agent not found')
        return
      }

      // Load basic information
      setAgentName(agent.name || '')
      setAgentDescription(agent.description || '')
      setInstructions(agent.system_instructions?.[0] || '')
      setIsActive(agent.is_active ?? true)
      setIsPublic(agent.is_public ?? false)

      // Load model configuration
      if (agent.model_config) {
        setSelectedProvider(agent.model_config.provider || 'openai')
        setSelectedModel(agent.model_config.id || 'gpt-4.1-mini-2025-04-14')
        setTemperature(agent.model_config.temperature ?? 0.7)
        setMaxTokens(agent.model_config.max_tokens ?? 2000)
        setTopP(agent.model_config.top_p ?? 0.9)
        setFrequencyPenalty(agent.model_config.frequency_penalty ?? 0)
        setPresencePenalty(agent.model_config.presence_penalty ?? 0)
        setStopSequences(agent.model_config.stop?.join(', ') || '')
        setTimeout(agent.model_config.timeout ?? 60)
        setMaxRetries(agent.model_config.max_retries ?? 3)
        setSeed(agent.model_config.seed?.toString() || '')
      }

      // Load agent_config settings
      const config = (agent.agent_config || {}) as AgentConfig

      // Memory settings
      if (config.memory?.enabled) {
        setMemoryEnabled(true)
        setEnableAgenticMemory(Boolean(config.enable_agentic_memory))
        setEnableUserMemories(Boolean(config.enable_user_memories))
        setEnableSessionSummaries(Boolean(config.enable_session_summaries))
        setAddMemoryReferences(Boolean(config.add_memory_references))
      }

      // Knowledge settings
      if (config.knowledge?.enabled) {
        setKnowledgeEnabled(true)
        setAddReferences(Boolean(config.add_references))
        setSearchKnowledge(Boolean(config.search_knowledge ?? true))
        setUpdateKnowledge(Boolean(config.update_knowledge))
        setReferencesFormat(String(config.references_format || 'json'))
      }

      // Storage settings
      if (config.storage) {
        setStorageEnabled(true)
        setStorageTableName(String(config.storage.table_name || 'sessions'))
        setStorageSchema(String(config.storage.schema || 'public'))
      }

      // Tools settings
      if (config.show_tool_calls !== undefined) {
        setToolsEnabled(true)
        setShowToolCalls(Boolean(config.show_tool_calls))
        setToolCallLimit(Number(config.tool_call_limit || 10))
        setToolChoice(String(config.tool_choice || 'auto'))
      }

      // Reasoning settings
      if (config.reasoning?.enabled) {
        setReasoning(true)
        setReasoningMinSteps(Number(config.reasoning.min_steps || 1))
        setReasoningMaxSteps(Number(config.reasoning.max_steps || 10))
      }

      // Team settings
      if (config.team?.enabled) {
        setTeamRole('assistant') // Исправляю тип - должна быть строка
        setRespondDirectly(Boolean(config.respond_directly))
        setAddTransferInstructions(
          Boolean(config.add_transfer_instructions ?? true)
        )
      }

      // Other settings
      setMarkdown(Boolean(config.markdown))
      setAddDatetimeToInstructions(Boolean(config.add_datetime_to_instructions))
      setTimezoneIdentifier(String(config.timezone_identifier || ''))
      setStream(Boolean(config.stream))
      setStoreEvents(Boolean(config.store_events))
      setDebugMode(Boolean(config.debug_mode))
      setMonitoring(Boolean(config.monitoring))
      setIntroduction(String(config.introduction || ''))
      setAdditionalContext(String(config.additional_context || ''))
      setAddContext(Boolean(config.add_context))
      setReadChatHistory(Boolean(config.history?.read_chat_history))
      setNumHistoryRuns(Number(config.history?.num_history_runs || 3))
      setUseJsonMode(Boolean(config.use_json_mode))
      setRetries(Number(config.retries || 0))
      setDelayBetweenRetries(Number(config.delay_between_retries || 1))
      setExponentialBackoff(Boolean(config.exponential_backoff))

      // Load natively stored fields
      setReasoningGoal(agent.goal || '')
      setTeamRole(agent.role || '')

      // Load tool IDs
      setSelectedDynamicTools(agent.tool_ids || [])
    } catch (error) {
      console.error('Error loading agent data:', error)
      toast.error('Failed to load agent data')
    } finally {
      setIsLoading(false)
    }
  }, [editingAgentId])

  // Generate agent ID for new agents
  const generateAgentId = (name: string): string => {
    const timestamp = Date.now()

    // Карта транслитерации кириллицы в латиницу
    const translitMap: Record<string, string> = {
      а: 'a',
      б: 'b',
      в: 'v',
      г: 'g',
      д: 'd',
      е: 'e',
      ё: 'yo',
      ж: 'zh',
      з: 'z',
      и: 'i',
      й: 'y',
      к: 'k',
      л: 'l',
      м: 'm',
      н: 'n',
      о: 'o',
      п: 'p',
      р: 'r',
      с: 's',
      т: 't',
      у: 'u',
      ф: 'f',
      х: 'h',
      ц: 'ts',
      ч: 'ch',
      ш: 'sh',
      щ: 'sch',
      ъ: '',
      ы: 'y',
      ь: '',
      э: 'e',
      ю: 'yu',
      я: 'ya'
    }

    const cleanName = name
      .toLowerCase()
      .split('')
      .map((char) => translitMap[char] || char)
      .join('')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30)

    return cleanName ? `${cleanName}-${timestamp}` : `agent-${timestamp}`
  }

  // Build agent payload for API
  const buildAgentPayload = () => {
    const agentIdValue = isEditMode
      ? editingAgentId
      : generateAgentId(agentName)

    // Строим agent_config согласно документации Agno
    // ТОЛЬКО ВКЛЮЧЕННЫЕ БЛОКИ добавляются в конфигурацию
    const agent_config: Record<string, unknown> = {}

    // 1. Хранилище и сессии (ТОЛЬКО если включено)
    if (storageEnabled) {
      agent_config.storage = {
        enabled: true,
        type: storageType || 'postgres',
        db_url: storageDbUrl,
        table_name: storageTableName || 'sessions',
        schema: storageSchema || 'public',
        mode: 'agent'
      }
      agent_config.cache_session = true

      // История (только если включено хранилище)
      if (readChatHistory) {
        agent_config.history = {
          add_history_to_messages: true,
          num_history_runs: numHistoryRuns || 3,
          read_chat_history: true
        }
        agent_config.search_previous_sessions_history = true
        agent_config.num_history_sessions = 5
      }
    }

    // 2. Контекст (ТОЛЬКО если есть данные)
    if (addContext && (contextPairs.length > 0 || additionalContext)) {
      if (contextPairs.length > 0) {
        agent_config.context = contextPairs.reduce(
          (acc, pair) => {
            if (pair.key && pair.value) {
              acc[pair.key] = pair.value
            }
            return acc
          },
          {} as Record<string, string>
        )
      }
      agent_config.add_context = addContext
      agent_config.resolve_context = true
      if (additionalContext) {
        agent_config.additional_context = additionalContext
      }
    }

    // 3. Память v2 (ТОЛЬКО если включена)
    if (memoryEnabled) {
      agent_config.memory = {
        enabled: true,
        type: memoryType || 'postgres',
        db_url: memoryDbUrl || storageDbUrl, // Используем URL хранилища если не задан отдельный
        table_name: 'user_memories',
        schema: memorySchema || 'public',
        delete_memories: true,
        clear_memories: true
      }

      if (enableAgenticMemory) {
        agent_config.enable_agentic_memory = true
      }
      if (enableUserMemories) {
        agent_config.enable_user_memories = true
      }
      if (addMemoryReferences) {
        agent_config.add_memory_references = true
      }
      if (enableSessionSummaries) {
        agent_config.enable_session_summaries = true
        agent_config.add_session_summary_references = true
      }
    }

    // 4. База знаний (ТОЛЬКО если включена)
    if (knowledgeEnabled) {
      agent_config.knowledge = {
        enabled: true,
        type: 'url',
        table_name: 'knowledge'
      }

      if (searchKnowledge) {
        agent_config.search_knowledge = true
      }
      if (addReferences) {
        agent_config.add_references = true
        agent_config.references_format = referencesFormat || 'json'
      }
      if (updateKnowledge) {
        agent_config.update_knowledge = true
      }
      if (knowledgeFilters) {
        try {
          agent_config.knowledge_filters = JSON.parse(knowledgeFilters)
        } catch {
          // Игнорируем невалидный JSON
        }
      }
    }

    // 5. Инструменты (ТОЛЬКО если включены)
    if (toolsEnabled) {
      agent_config.show_tool_calls = showToolCalls
      if (toolCallLimit && toolCallLimit > 0) {
        agent_config.tool_call_limit = toolCallLimit
      }
      if (toolChoice && toolChoice !== 'auto') {
        agent_config.tool_choice = toolChoice
      }
      if (readChatHistory) {
        agent_config.read_tool_call_history = true
      }
    }

    // 6. Рассуждения (ТОЛЬКО если включены)
    if (reasoning) {
      agent_config.reasoning = {
        enabled: true,
        model_id: selectedModel, // Используем выбранную модель
        min_steps: reasoningMinSteps || 1,
        max_steps: reasoningMaxSteps || 10
      }

      if (streamReasoning) {
        agent_config.stream_intermediate_steps = true
      }
    }

    // 7. Системное сообщение (только базовые настройки)
    if (markdown) {
      agent_config.markdown = true
    }
    if (addDatetimeToInstructions) {
      agent_config.add_datetime_to_instructions = true
    }

    // 8. Ответы и стриминг (только если включены)
    if (stream) {
      agent_config.stream = true
    }
    if (retries && retries > 1) {
      agent_config.retries = retries
      agent_config.delay_between_retries = delayBetweenRetries || 1
      if (exponentialBackoff) {
        agent_config.exponential_backoff = true
      }
    }

    // 9. Отладка и мониторинг (только если включены)
    if (debugMode) {
      agent_config.debug_mode = true
    }
    if (monitoring) {
      agent_config.monitoring = true
    }
    agent_config.telemetry = true // всегда включена для улучшения фреймворка

    // 10. Команда (только если настроена)
    if (addTransferInstructions || !respondDirectly) {
      if (addTransferInstructions) {
        agent_config.add_transfer_instructions = true
      }
      if (!respondDirectly) {
        agent_config.respond_directly = false
      }
    }

    // Возвращаем структуру для Supabase
    return {
      agent_id: agentIdValue,
      name: agentName,
      description: agentDescription,

      // Конфигурация модели (model_config)
      model_config: {
        provider: selectedProvider || 'openai',
        id: selectedModel || 'gpt-4.1-mini-2025-04-14',
        temperature: temperature,
        max_tokens: maxTokens,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        stop: stopSequences
          ? stopSequences.split(',').map((s) => s.trim())
          : [],
        timeout: timeout,
        max_retries: maxRetries,
        seed: seed ? parseInt(seed) : undefined
      },

      // Системные инструкции
      system_instructions: instructions ? [instructions] : [],

      // ID инструментов (только если инструменты включены)
      tool_ids: toolsEnabled
        ? [
            ...(selectedDynamicTools || []),
            ...(selectedCustomTools || []),
            ...(selectedMcpServers || [])
          ]
        : [],

      // Основная конфигурация агента (только активные блоки)
      agent_config: agent_config,

      // Нативные поля Agno (только если заданы)
      goal: reasoningGoal || undefined,
      expected_output: reasoning
        ? 'Structured reasoning with explanation'
        : undefined,
      role: teamRole || undefined,

      // Мультитенантность
      is_public: isPublic,
      photo: agentPhoto || undefined,
      category: undefined,

      // Метаданные
      is_active: isActive
    }
  }

  // Load agent data when editing
  useEffect(() => {
    if (isEditMode) {
      loadAgentData()
    }
  }, [isEditMode, editingAgentId, loadAgentData])

  // Load tools when endpoint changes
  useEffect(() => {
    if (selectedEndpoint) {
      fetchToolsFromAPI()
    }
  }, [selectedEndpoint, fetchToolsFromAPI])

  // Auto-validate configuration when key settings change
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (agentName && selectedProvider && selectedModel) {
        validateConfiguration()
      }
    }, 1000) // Debounce validation

    return () => window.clearTimeout(timeoutId)
  }, [
    agentName,
    selectedProvider,
    selectedModel,
    toolsEnabled,
    memoryEnabled,
    knowledgeEnabled,
    reasoning,
    storageEnabled,
    selectedDynamicTools.length,
    selectedCustomTools.length,
    selectedMcpServers.length,
    validateConfiguration
  ])

  return (
    <motion.main
      className="bg-background-primary relative flex flex-grow flex-col rounded-xl p-6"
      style={{ margin: '5px' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <motion.header
        className="border-secondary border-b px-6 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="font-dmmono text-primary text-xs font-medium uppercase">
              {isEditMode ? 'Edit Agent' : 'Create New Agent'}
              {isLoading && (
                <span className="text-muted ml-2">(Loading...)</span>
              )}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateSelector(true)}
              className="text-primary border-accent hover:bg-accent/10"
            >
              <Icon type="bot" size="xs" className="mr-2" />
              Шаблоны
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                validateConfiguration()
              }}
              disabled={isValidating}
              className="text-primary border-blue-400 hover:bg-blue-400/10"
            >
              <Icon type="alert-circle" size="xs" className="mr-2" />
              {isValidating ? 'Проверка...' : 'Валидация'}
            </Button>
            <Button
              className="text-primary bg-secondary border-primary border-1 border border-dashed"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="mr-2 h-3 w-3" />

              {isSaving
                ? 'Saving...'
                : isEditMode
                  ? 'Update Agent'
                  : 'Save Agent'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-primary"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="flex-1 overflow-hidden">
        <div className="h-full px-3 py-6">
          <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-4">
            {/* LEFT SIDEBAR */}
            <div className="order-2 lg:order-1 lg:col-span-1">
              <div className="space-y-6">
                {/* Validation Panel */}
                {validationResult && (
                  <Card className="bg-background-primary border-primary/10">
                    <CardHeader className="pb-3">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-muted-foreground text-sm font-medium">
                          Валидация конфигурации
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={validateConfiguration}
                          disabled={isValidating}
                          className="h-7 text-xs"
                        >
                          {isValidating ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Shield className="mr-1 h-3 w-3" />
                          )}
                          {isValidating ? 'Проверка...' : 'Перепроверить'}
                        </Button>
                      </div>
                      <ValidationContent
                        validationResult={validationResult}
                        className="text-xs"
                      />
                    </CardHeader>
                  </Card>
                )}
              </div>
            </div>

            {/* Main Content */}
            <motion.div
              className="space-y-6 lg:col-span-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Tabs defaultValue="basic" className="flex h-full flex-col">
                <TabsList className="bg-background-secondary grid w-full grid-cols-5">
                  <TabsTrigger
                    value="basic"
                    className="font-dmmono text-primary text-xs font-medium uppercase"
                  >
                    Profile
                  </TabsTrigger>
                  <TabsTrigger
                    value="model"
                    className="font-dmmono text-primary text-xs font-medium uppercase"
                  >
                    Model
                  </TabsTrigger>
                  <TabsTrigger
                    value="tools"
                    className="font-dmmono text-primary text-xs font-medium uppercase"
                  >
                    Tools
                  </TabsTrigger>
                  <TabsTrigger
                    value="memory"
                    className="font-dmmono text-primary text-xs font-medium uppercase"
                  >
                    Memory
                  </TabsTrigger>
                  <TabsTrigger
                    value="advanced"
                    className="font-dmmono text-primary text-xs font-medium uppercase"
                  >
                    Advanced
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6 flex-1 overflow-y-auto">
                  {/* BASIC INFORMATION */}
                  <TabsContent value="basic" className="mt-0 space-y-6">
                    <Card className="bg-background-secondary border-none">
                      <CardContent className="space-y-4 pt-6">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-foreground col-span-2">
                            <FormField
                              label="Agent Name"
                              description="Human-readable name"
                            >
                              <Input
                                placeholder="e.g., Marketing Assistant"
                                value={agentName}
                                onChange={(e) => setAgentName(e.target.value)}
                                className="border-secondary bg-background-primary text-primary text-xs"
                              />
                            </FormField>
                          </div>

                          <FormField
                            label="Agent Photo"
                            description="Upload agent avatar"
                          >
                            <div className="flex items-center space-x-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    const reader = new FileReader()
                                    reader.onload = (e) => {
                                      setAgentPhoto(e.target?.result as string)
                                    }
                                    reader.readAsDataURL(file)
                                  }
                                }}
                                className="hidden"
                                id="agent-photo-upload"
                              />
                              <label
                                htmlFor="agent-photo-upload"
                                className="bg-background-primary border-secondary text-primary hover:bg-background-muted hover:text-primary flex h-9 w-full cursor-pointer items-center justify-center rounded-md border px-3 text-xs shadow-sm"
                              >
                                {agentPhoto ? 'Change Photo' : 'Upload Photo'}
                              </label>
                            </div>
                          </FormField>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField label="Description">
                            <TextArea
                              placeholder="You are an expert marketing assistant. Help users create effective content, analyze trends and develop promotion strategies..."
                              value={agentDescription}
                              onChange={(e) =>
                                setAgentDescription(e.target.value)
                              }
                              className="border-secondary bg-background-primary text-primary min-h-[100px] text-xs"
                            />
                          </FormField>

                          <FormField label="Instructions">
                            <TextArea
                              placeholder="You are an expert marketing assistant. Help users create effective content, analyze trends and develop promotion strategies..."
                              value={instructions}
                              onChange={(e) => setInstructions(e.target.value)}
                              className="border-secondary bg-background-primary text-primary min-h-[100px] text-xs"
                            />
                          </FormField>
                        </div>

                        <FormField
                          label="System Message"
                          description="Core message defining the agent's role"
                        >
                          <TextArea
                            placeholder="You are a helpful AI assistant with expertise in marketing..."
                            value={systemMessage}
                            onChange={(e) => setSystemMessage(e.target.value)}
                            className="border-secondary bg-background-primary text-primary min-h-[100px] text-xs"
                          />
                        </FormField>

                        <FormField
                          label="Introduction"
                          description="Message when starting conversation"
                        >
                          <TextArea
                            placeholder="Hi! I'm your marketing assistant. Ready to help with content creation and trend analysis!"
                            value={introduction}
                            onChange={(e) => setIntroduction(e.target.value)}
                            className="text-xsborder-secondary bg-background-primary text-primary min-h-[60px] text-xs"
                          />
                        </FormField>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                            <div className="space-y-1">
                              <Label className="font-dmmono text-xs font-medium uppercase">
                                Active
                              </Label>
                              <p className="text-xs text-zinc-400">
                                Enable access
                              </p>
                            </div>
                            <Switch
                              checked={isActive}
                              onCheckedChange={setIsActive}
                            />
                          </div>

                          <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                            <div className="space-y-1">
                              <Label className="font-dmmono text-xs font-medium uppercase">
                                Public Agent
                              </Label>
                              <p className="text-xs text-zinc-400">
                                Make agent publicly available
                              </p>
                            </div>
                            <Switch
                              checked={isPublic}
                              onCheckedChange={setIsPublic}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* MODEL CONFIGURATION */}
                  <TabsContent value="model" className="mt-0 space-y-6">
                    <Card className="bg-background-secondary border-none">
                      <CardHeader>
                        <CardTitle className="font-dmmono text-xs font-medium uppercase">
                          Model & Reasoning Configuration
                        </CardTitle>
                        <CardDescription className="text-xs text-zinc-400">
                          Language model, generation parameters and reasoning
                          settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="model-config" className="w-full">
                          <TabsList className="bg-background-primary grid w-full grid-cols-2">
                            <TabsTrigger
                              value="model-config"
                              className="font-dmmono text-xs font-medium uppercase"
                            >
                              Model Configuration
                            </TabsTrigger>
                            <TabsTrigger
                              value="reasoning-config"
                              className="font-dmmono text-xs font-medium uppercase"
                            >
                              Reasoning Configuration
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent
                            value="model-config"
                            className="mt-6 space-y-4"
                          >
                            <div className="grid grid-cols-4 gap-4">
                              <FormField
                                label="LLM Provider"
                                description="Choose AI model provider"
                              >
                                <Select
                                  value={selectedProvider}
                                  onValueChange={setSelectedProvider}
                                >
                                  <SelectTrigger className="border-primary/15 bg-background-primary h-9 border text-xs font-medium uppercase">
                                    <SelectValue placeholder="Select provider" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background-primary font-dmmono border-none shadow-lg">
                                    {llmProviders.map((provider) => (
                                      <SelectItem
                                        key={provider.id}
                                        value={provider.id}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <div className="flex h-4 w-4 items-center justify-center rounded bg-zinc-600">
                                            <span className="text-xs text-zinc-300">
                                              {provider.displayName.charAt(0)}
                                            </span>
                                          </div>
                                          <span className="text-xs font-medium uppercase">
                                            {provider.displayName}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormField>

                              {selectedProviderData && (
                                <FormField
                                  label="Model"
                                  description="Select specific model"
                                >
                                  <Select
                                    value={selectedModel}
                                    onValueChange={setSelectedModel}
                                  >
                                    <SelectTrigger className="border-primary/15 bg-background-primary h-9 border text-xs font-medium uppercase">
                                      <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background-primary font-dmmono border-none shadow-lg">
                                      {selectedProviderData.models.map(
                                        (model) => (
                                          <SelectItem key={model} value={model}>
                                            <span className="text-xs font-medium uppercase">
                                              {model}
                                            </span>
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                </FormField>
                              )}

                              <FormField
                                label="Max Tokens"
                                description="Maximum response length"
                              >
                                <Input
                                  type="number"
                                  value={maxTokens}
                                  onChange={(e) =>
                                    setMaxTokens(
                                      Number.parseInt(e.target.value)
                                    )
                                  }
                                  min="1"
                                  max="8192"
                                  className="border-secondary bg-background-primary text-primary"
                                />
                              </FormField>

                              <FormField
                                label="Timeout (sec)"
                                description="Response timeout"
                              >
                                <Input
                                  type="number"
                                  value={timeout}
                                  onChange={(e) =>
                                    setTimeout(Number.parseInt(e.target.value))
                                  }
                                  className="border-secondary bg-background-primary text-primary"
                                />
                              </FormField>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                label={`Temperature: ${temperature}`}
                                description="Creativity (0.0 = deterministic, 2.0 = creative)"
                              >
                                <input
                                  type="range"
                                  min="0"
                                  max="2"
                                  step="0.1"
                                  value={temperature}
                                  onChange={(e) =>
                                    setTemperature(
                                      Number.parseFloat(e.target.value)
                                    )
                                  }
                                  className="w-full accent-zinc-300"
                                />
                              </FormField>

                              <FormField
                                label={`Top P: ${topP}`}
                                description="Nucleus sampling for diversity"
                              >
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={topP}
                                  onChange={(e) =>
                                    setTopP(Number.parseFloat(e.target.value))
                                  }
                                  className="w-full accent-zinc-300"
                                />
                              </FormField>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                label={`Frequency Penalty: ${frequencyPenalty}`}
                                description="Penalty for repetitions"
                              >
                                <input
                                  type="range"
                                  min="-2"
                                  max="2"
                                  step="0.1"
                                  value={frequencyPenalty}
                                  onChange={(e) =>
                                    setFrequencyPenalty(
                                      Number.parseFloat(e.target.value)
                                    )
                                  }
                                  className="w-full accent-zinc-300"
                                />
                              </FormField>

                              <FormField
                                label={`Presence Penalty: ${presencePenalty}`}
                                description="Penalty for token usage"
                              >
                                <input
                                  type="range"
                                  min="-2"
                                  max="2"
                                  step="0.1"
                                  value={presencePenalty}
                                  onChange={(e) =>
                                    setPresencePenalty(
                                      Number.parseFloat(e.target.value)
                                    )
                                  }
                                  className="w-full accent-zinc-300"
                                />
                              </FormField>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <FormField
                                label="Stop Sequences"
                                description="Comma separated"
                              >
                                <Input
                                  placeholder="END,STOP,\\n"
                                  value={stopSequences}
                                  onChange={(e) =>
                                    setStopSequences(e.target.value)
                                  }
                                  className="border-secondary bg-background-primary text-primary text-xs"
                                />
                              </FormField>

                              <FormField
                                label="Seed"
                                description="For reproducibility"
                              >
                                <Input
                                  type="number"
                                  placeholder="12345"
                                  value={seed}
                                  onChange={(e) => setSeed(e.target.value)}
                                  className="text-xsborder-secondary bg-background-primary text-primary"
                                />
                              </FormField>

                              <FormField
                                label="Max Retries"
                                description="On errors"
                              >
                                <Input
                                  type="number"
                                  value={maxRetries}
                                  onChange={(e) =>
                                    setMaxRetries(
                                      Number.parseInt(e.target.value)
                                    )
                                  }
                                  className="border-secondary bg-background-primary text-primary"
                                />
                              </FormField>
                            </div>
                          </TabsContent>

                          <TabsContent
                            value="reasoning-config"
                            className="mt-6 space-y-4"
                          >
                            <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                              <div className="space-y-1">
                                <Label className="font-dmmono text-xs font-medium uppercase">
                                  Enable Reasoning
                                </Label>
                                <p className="text-xs text-zinc-400">
                                  Step-by-step analysis and decision explanation
                                </p>
                              </div>
                              <Switch
                                checked={reasoning}
                                onCheckedChange={setReasoning}
                              />
                            </div>

                            {reasoning && (
                              <>
                                <FormField
                                  label="Reasoning Goal"
                                  description="Main task to solve"
                                >
                                  <TextArea
                                    placeholder="Solve the user's task as efficiently as possible, providing a complete and accurate answer with explanation of each step..."
                                    value={reasoningGoal}
                                    onChange={(e) =>
                                      setReasoningGoal(e.target.value)
                                    }
                                    className="border-secondary bg-background-primary text-primary min-h-[80px] text-xs"
                                  />
                                </FormField>

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    label="Min Reasoning Steps"
                                    description="Minimum number of reasoning steps"
                                  >
                                    <Input
                                      type="number"
                                      value={reasoningMinSteps}
                                      onChange={(e) =>
                                        setReasoningMinSteps(
                                          Number.parseInt(e.target.value)
                                        )
                                      }
                                      min="1"
                                      max="20"
                                      className="border-secondary bg-background-primary text-primary"
                                    />
                                  </FormField>

                                  <FormField
                                    label="Max Reasoning Steps"
                                    description="Maximum number of reasoning steps"
                                  >
                                    <Input
                                      type="number"
                                      value={reasoningMaxSteps}
                                      onChange={(e) =>
                                        setReasoningMaxSteps(
                                          Number.parseInt(e.target.value)
                                        )
                                      }
                                      min="1"
                                      max="50"
                                      className="border-secondary bg-background-primary text-primary"
                                    />
                                  </FormField>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                    <div className="space-y-1">
                                      <Label className="font-dmmono text-xs font-medium uppercase">
                                        Stream Reasoning
                                      </Label>
                                      <p className="text-xs text-zinc-400">
                                        View steps in real-time
                                      </p>
                                    </div>
                                    <Switch
                                      checked={streamReasoning}
                                      onCheckedChange={setStreamReasoning}
                                    />
                                  </div>

                                  <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                    <div className="space-y-1">
                                      <Label className="font-dmmono text-xs font-medium uppercase">
                                        Save Steps
                                      </Label>
                                      <p className="text-xs text-zinc-400">
                                        Save reasoning steps to storage
                                      </p>
                                    </div>
                                    <Switch
                                      checked={saveReasoningSteps}
                                      onCheckedChange={setSaveReasoningSteps}
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* TOOLS */}
                  <TabsContent value="tools" className="mt-0 space-y-6">
                    <Card className="bg-background-secondary border-none">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="font-dmmono text-xs font-medium uppercase">
                              Tools Configuration
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-400">
                              Configure available tools and their behavior
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label className="font-dmmono text-xs font-medium uppercase">
                              Enable Tools
                            </Label>
                            <Switch
                              checked={toolsEnabled}
                              onCheckedChange={setToolsEnabled}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {toolsEnabled && (
                          <>
                            {/* General tool settings */}
                            <div className="grid grid-cols-3 gap-4">
                              <FormField
                                label="Show Tool Calls"
                                description="Display tool usage in chat"
                              >
                                <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                  <Label className="font-dmmono text-xs font-medium uppercase">
                                    Show
                                  </Label>
                                  <Switch
                                    checked={showToolCalls}
                                    onCheckedChange={setShowToolCalls}
                                  />
                                </div>
                              </FormField>

                              <FormField
                                label="Call Limit"
                                description="Max tools per response"
                              >
                                <Input
                                  type="number"
                                  value={toolCallLimit}
                                  onChange={(e) =>
                                    setToolCallLimit(
                                      Number.parseInt(e.target.value)
                                    )
                                  }
                                  className="border-secondary bg-background-primary text-primary"
                                />
                              </FormField>

                              <FormField
                                label="Choice Strategy"
                                description="When to use tools"
                              >
                                <Select
                                  value={toolChoice}
                                  onValueChange={setToolChoice}
                                >
                                  <SelectTrigger className="border-primary/15 bg-background-primary h-9 border text-xs font-medium uppercase">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background-primary font-dmmono border-none shadow-lg">
                                    {toolChoiceOptions.map((option) => (
                                      <SelectItem
                                        key={option.id}
                                        value={option.id}
                                      >
                                        <div>
                                          <div className="text-xs font-medium uppercase">
                                            {option.name}
                                          </div>
                                          <div className="text-xs text-zinc-400">
                                            {option.description}
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormField>
                            </div>

                            {/* Tools tabs */}
                            <Tabs
                              defaultValue="dynamic"
                              className="mt-8 w-full"
                            >
                              <TabsList className="bg-background-primary grid w-full grid-cols-3">
                                <TabsTrigger
                                  value="dynamic"
                                  className="font-dmmono text-xs font-medium uppercase"
                                >
                                  Native
                                </TabsTrigger>
                                <TabsTrigger
                                  value="mcp"
                                  className="font-dmmono text-xs font-medium uppercase"
                                >
                                  MCP
                                </TabsTrigger>
                                <TabsTrigger
                                  value="custom"
                                  className="font-dmmono text-xs font-medium uppercase"
                                >
                                  Custom
                                </TabsTrigger>
                              </TabsList>

                              {areToolsLoading ? (
                                <div className="mt-4 flex items-center justify-center p-8">
                                  <div className="text-xs text-zinc-400">
                                    Loading tools...
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <TabsContent value="dynamic" className="mt-4">
                                    <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto">
                                      {availableDynamicTools.map((tool) => (
                                        <div
                                          key={tool.id}
                                          className="bg-background-primary flex items-center justify-between rounded-lg p-3"
                                        >
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                              <h5 className="text-primary text-xs font-medium">
                                                {tool.name}
                                              </h5>
                                              <Badge
                                                variant="outline"
                                                className="border-accent text-muted text-xs"
                                              >
                                                {tool.category}
                                              </Badge>
                                            </div>
                                            <p className="mt-1 text-xs text-zinc-400">
                                              {tool.description}
                                            </p>
                                          </div>
                                          <Switch
                                            checked={selectedDynamicTools.includes(
                                              tool.id
                                            )}
                                            onCheckedChange={() =>
                                              toggleDynamicTool(tool.id)
                                            }
                                          />
                                        </div>
                                      ))}
                                      {availableDynamicTools.length === 0 && (
                                        <div className="p-4 text-center text-xs text-zinc-400">
                                          No dynamic tools available
                                        </div>
                                      )}
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="mcp" className="mt-4">
                                    <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto">
                                      {availableMcpServers.map((server) => (
                                        <div
                                          key={server.id}
                                          className="bg-background-primary flex items-center justify-between rounded-lg p-3"
                                        >
                                          <div className="flex-1">
                                            <h5 className="text-primary text-xs font-medium">
                                              {server.name}
                                            </h5>
                                            <p className="text-xs text-zinc-400">
                                              {server.description}
                                            </p>
                                          </div>
                                          <Switch
                                            checked={selectedMcpServers.includes(
                                              server.id
                                            )}
                                            onCheckedChange={() =>
                                              toggleMcpServer(server.id)
                                            }
                                          />
                                        </div>
                                      ))}
                                      {availableMcpServers.length === 0 && (
                                        <div className="p-4 text-center text-xs text-zinc-400">
                                          No MCP servers available
                                        </div>
                                      )}
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="custom" className="mt-4">
                                    <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto">
                                      {availableCustomTools.map((tool) => (
                                        <div
                                          key={tool.id}
                                          className="bg-background-primary flex items-center justify-between rounded-lg p-3"
                                        >
                                          <div className="flex-1">
                                            <h5 className="text-primary text-xs font-medium">
                                              {tool.name}
                                            </h5>
                                            <p className="text-xs text-zinc-400">
                                              {tool.description}
                                            </p>
                                          </div>
                                          <Switch
                                            checked={selectedCustomTools.includes(
                                              tool.id
                                            )}
                                            onCheckedChange={() =>
                                              toggleCustomTool(tool.id)
                                            }
                                          />
                                        </div>
                                      ))}
                                      {availableCustomTools.length === 0 && (
                                        <div className="p-4 text-center text-xs text-zinc-400">
                                          No custom tools available
                                        </div>
                                      )}
                                    </div>
                                  </TabsContent>
                                </>
                              )}
                            </Tabs>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* MEMORY AND KNOWLEDGE */}
                  <TabsContent value="memory" className="mt-0 space-y-6">
                    <Card className="bg-background-secondary border-none">
                      <CardHeader>
                        <CardTitle className="font-dmmono text-xs font-medium uppercase">
                          Memory & Knowledge & Storage
                        </CardTitle>
                        <CardDescription className="text-xs text-zinc-400">
                          Memory storage, knowledge base and storage
                          configuration
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="memory-config" className="w-full">
                          <TabsList className="bg-background-primary grid w-full grid-cols-3">
                            <TabsTrigger
                              value="memory-config"
                              className="font-dmmono text-xs font-medium uppercase"
                            >
                              Memory
                            </TabsTrigger>
                            <TabsTrigger
                              value="storage-config"
                              className="font-dmmono text-xs font-medium uppercase"
                            >
                              Storage
                            </TabsTrigger>
                            <TabsTrigger
                              value="knowledge-base"
                              className="font-dmmono text-xs font-medium uppercase"
                            >
                              Knowledge Base
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent
                            value="memory-config"
                            className="mt-6 space-y-4"
                          >
                            {/* Memory header with toggle */}
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-dmmono text-xs font-medium uppercase">
                                  Memory Configuration
                                </h3>
                                <p className="text-xs text-zinc-400">
                                  Long-term memory and session storage
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Label className="font-dmmono text-xs font-medium uppercase">
                                  Enable Memory
                                </Label>
                                <Switch
                                  checked={memoryEnabled}
                                  onCheckedChange={setMemoryEnabled}
                                />
                              </div>
                            </div>

                            {memoryEnabled && (
                              <>
                                <div className="grid grid-cols-10 gap-4">
                                  <div className="col-span-3">
                                    <FormField
                                      label="Memory Type"
                                      description="Database type"
                                    >
                                      <Select
                                        value={memoryType}
                                        onValueChange={setMemoryType}
                                      >
                                        <SelectTrigger className="border-primary/15 bg-background-primary h-9 border text-xs font-medium uppercase">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background-primary font-dmmono border-none shadow-lg">
                                          {memoryTypes.map((type) => (
                                            <SelectItem
                                              key={type.id}
                                              value={type.id}
                                            >
                                              <div>
                                                <div className="text-xs font-medium uppercase">
                                                  {type.name}
                                                </div>
                                                <div className="text-xs text-zinc-400">
                                                  {type.description}
                                                </div>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormField>
                                  </div>

                                  <div className="col-span-3">
                                    <FormField
                                      label="DB Schema"
                                      description="Database schema name"
                                    >
                                      <Input
                                        placeholder="ai"
                                        value={memorySchema}
                                        onChange={(e) =>
                                          setMemorySchema(e.target.value)
                                        }
                                        className="border-secondary bg-background-primary text-primary text-xs"
                                      />
                                    </FormField>
                                  </div>

                                  <div className="col-span-4">
                                    <FormField
                                      label="Memory Database URL"
                                      description="PostgreSQL connection"
                                    >
                                      <Input
                                        type="password"
                                        placeholder="postgresql://user:password@host:port/database"
                                        value={memoryDbUrl}
                                        onChange={(e) =>
                                          setMemoryDbUrl(e.target.value)
                                        }
                                        className="text-xsborder-secondary bg-background-primary text-primary"
                                      />
                                    </FormField>
                                  </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                  <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                    <div className="space-y-1">
                                      <Label className="font-dmmono text-xs font-medium uppercase">
                                        Agentic Memory
                                      </Label>
                                      <p className="text-xs text-zinc-400">
                                        Enable AI memory system
                                      </p>
                                    </div>
                                    <Switch
                                      checked={enableAgenticMemory}
                                      onCheckedChange={setEnableAgenticMemory}
                                    />
                                  </div>

                                  <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                    <div className="space-y-1">
                                      <Label className="font-dmmono text-xs font-medium uppercase">
                                        User Memories
                                      </Label>
                                      <p className="text-xs text-zinc-400">
                                        Store user-specific memories
                                      </p>
                                    </div>
                                    <Switch
                                      checked={enableUserMemories}
                                      onCheckedChange={setEnableUserMemories}
                                    />
                                  </div>

                                  <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                    <div className="space-y-1">
                                      <Label className="font-dmmono text-xs font-medium uppercase">
                                        Session Summaries
                                      </Label>
                                      <p className="text-xs text-zinc-400">
                                        Generate session summaries
                                      </p>
                                    </div>
                                    <Switch
                                      checked={enableSessionSummaries}
                                      onCheckedChange={
                                        setEnableSessionSummaries
                                      }
                                    />
                                  </div>

                                  <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                    <div className="space-y-1">
                                      <Label className="font-dmmono text-xs font-medium uppercase">
                                        Memory References
                                      </Label>
                                      <p className="text-xs text-zinc-400">
                                        Include memory references
                                      </p>
                                    </div>
                                    <Switch
                                      checked={addMemoryReferences}
                                      onCheckedChange={setAddMemoryReferences}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    label="Topic Filter"
                                    description="Comma separated"
                                  >
                                    <Input
                                      placeholder="work, projects, hobbies"
                                      value={memoryTopics}
                                      onChange={(e) =>
                                        setMemoryTopics(e.target.value)
                                      }
                                      className="border-secondary bg-background-primary text-primary text-xs"
                                    />
                                  </FormField>

                                  <FormField
                                    label={`Min Importance: ${memoryMinImportance}`}
                                    description="Memory importance filter"
                                  >
                                    <input
                                      type="range"
                                      min="0"
                                      max="1"
                                      step="0.1"
                                      value={memoryMinImportance}
                                      onChange={(e) =>
                                        setMemoryMinImportance(
                                          Number.parseFloat(e.target.value)
                                        )
                                      }
                                      className="w-full border-zinc-300 accent-zinc-300"
                                    />
                                  </FormField>
                                </div>
                              </>
                            )}
                          </TabsContent>

                          <TabsContent
                            value="knowledge-base"
                            className="mt-6 space-y-4"
                          >
                            {/* Knowledge header with toggle */}
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-dmmono text-xs font-medium uppercase">
                                  Knowledge Base Configuration
                                </h3>
                                <p className="text-xs text-zinc-400">
                                  RAG (Retrieval-Augmented Generation) settings
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Label className="font-dmmono text-xs font-medium uppercase">
                                  Enable Knowledge Base
                                </Label>
                                <Switch
                                  checked={knowledgeEnabled}
                                  onCheckedChange={setKnowledgeEnabled}
                                />
                              </div>
                            </div>

                            {knowledgeEnabled && (
                              <>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                    <div className="space-y-1">
                                      <Label className="font-dmmono text-xs font-medium uppercase">
                                        Add References
                                      </Label>
                                      <p className="text-xs text-zinc-400">
                                        Include knowledge references
                                      </p>
                                    </div>
                                    <Switch
                                      checked={addReferences}
                                      onCheckedChange={setAddReferences}
                                    />
                                  </div>

                                  <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                    <div className="space-y-1">
                                      <Label className="font-dmmono text-xs font-medium uppercase">
                                        Search Knowledge
                                      </Label>
                                      <p className="text-xs text-zinc-400">
                                        Enable knowledge base search
                                      </p>
                                    </div>
                                    <Switch
                                      checked={searchKnowledge}
                                      onCheckedChange={setSearchKnowledge}
                                    />
                                  </div>

                                  <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                    <div className="space-y-1">
                                      <Label className="font-dmmono text-xs font-medium uppercase">
                                        Update Knowledge
                                      </Label>
                                      <p className="text-xs text-zinc-400">
                                        Allow knowledge updates
                                      </p>
                                    </div>
                                    <Switch
                                      checked={updateKnowledge}
                                      onCheckedChange={setUpdateKnowledge}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <FormField
                                    label="Max References"
                                    description="Maximum number"
                                  >
                                    <Input
                                      type="number"
                                      value={maxReferences}
                                      onChange={(e) =>
                                        setMaxReferences(
                                          Number.parseInt(e.target.value)
                                        )
                                      }
                                      className="border-secondary bg-background-primary text-primary"
                                    />
                                  </FormField>

                                  <FormField
                                    label={`Similarity Threshold: ${similarityThreshold}`}
                                    description="Minimum similarity score"
                                  >
                                    <input
                                      type="range"
                                      min="0"
                                      max="1"
                                      step="0.05"
                                      value={similarityThreshold}
                                      onChange={(e) =>
                                        setSimilarityThreshold(
                                          Number.parseFloat(e.target.value)
                                        )
                                      }
                                      className="w-full accent-zinc-300"
                                    />
                                  </FormField>

                                  <FormField
                                    label="References Format"
                                    description="Output format for references"
                                  >
                                    <Select
                                      value={referencesFormat}
                                      onValueChange={setReferencesFormat}
                                    >
                                      <SelectTrigger className="border-primary/15 bg-background-primary h-9 border text-xs font-medium uppercase">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background-primary font-dmmono border-none shadow-lg">
                                        {referencesFormats.map((format) => (
                                          <SelectItem
                                            key={format.id}
                                            value={format.id}
                                          >
                                            <div>
                                              <div className="text-xs font-medium uppercase">
                                                {format.name}
                                              </div>
                                              <div className="text-xs text-zinc-400">
                                                {format.description}
                                              </div>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormField>
                                </div>

                                <FormField
                                  label="Knowledge Filters"
                                  description="JSON object with filters"
                                >
                                  <TextArea
                                    placeholder='{"document_type": ["manual", "faq"], "department": "engineering"}'
                                    value={knowledgeFilters}
                                    onChange={(e) =>
                                      setKnowledgeFilters(e.target.value)
                                    }
                                    className="border-secondary bg-background-primary text-primary min-h-[120px] text-xs"
                                  />
                                </FormField>
                              </>
                            )}
                          </TabsContent>

                          <TabsContent
                            value="storage-config"
                            className="mt-6 space-y-4"
                          >
                            {/* Storage header with toggle */}
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-dmmono text-xs font-medium uppercase">
                                  Storage Configuration
                                </h3>
                                <p className="text-xs text-zinc-400">
                                  Session storage and event logging
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Label className="font-dmmono text-xs font-medium uppercase">
                                  Enable Storage
                                </Label>
                                <Switch
                                  checked={storageEnabled}
                                  onCheckedChange={setStorageEnabled}
                                />
                              </div>
                            </div>

                            {storageEnabled && (
                              <>
                                <div className="grid grid-cols-3 gap-4">
                                  <FormField
                                    label="Storage Type"
                                    description="Database type for storage"
                                  >
                                    <Select
                                      value={storageType}
                                      onValueChange={setStorageType}
                                    >
                                      <SelectTrigger className="border-primary/15 bg-background-primary h-9 border text-xs font-medium uppercase">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-background-primary font-dmmono border-none shadow-lg">
                                        {storageTypes.map((type) => (
                                          <SelectItem
                                            key={type.id}
                                            value={type.id}
                                          >
                                            <div>
                                              <div className="text-xs font-medium uppercase">
                                                {type.name}
                                              </div>
                                              <div className="text-xs text-zinc-400">
                                                {type.description}
                                              </div>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormField>

                                  <FormField
                                    label="Storage Database URL"
                                    description="PostgreSQL connection"
                                  >
                                    <Input
                                      type="password"
                                      placeholder="postgresql://user:password@host:port/database"
                                      value={storageDbUrl}
                                      onChange={(e) =>
                                        setStorageDbUrl(e.target.value)
                                      }
                                      className="border-secondary bg-background-primary text-primary text-xs"
                                    />
                                  </FormField>

                                  <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                    <div className="space-y-1">
                                      <Label className="font-dmmono text-xs font-medium uppercase">
                                        Store Events
                                      </Label>
                                      <p className="text-xs text-zinc-400">
                                        Store detailed event logs
                                      </p>
                                    </div>
                                    <Switch
                                      checked={storeEvents}
                                      onCheckedChange={setStoreEvents}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    label="Table Name"
                                    description="Database table name"
                                  >
                                    <Input
                                      placeholder="sessions"
                                      value={storageTableName}
                                      onChange={(e) =>
                                        setStorageTableName(e.target.value)
                                      }
                                      className="border-secondary bg-background-primary text-primary text-xs"
                                    />
                                  </FormField>

                                  <FormField
                                    label="Schema"
                                    description="Database schema name"
                                  >
                                    <Input
                                      placeholder="ai"
                                      value={storageSchema}
                                      onChange={(e) =>
                                        setStorageSchema(e.target.value)
                                      }
                                      className="border-secondary bg-background-primary text-primary text-xs"
                                    />
                                  </FormField>
                                </div>
                              </>
                            )}
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ADVANCED SETTINGS */}
                  <TabsContent value="advanced" className="mt-0 space-y-6">
                    <Card className="bg-background-secondary border-none">
                      <CardHeader>
                        <CardTitle className="font-dmmono text-xs font-medium uppercase">
                          Advanced Settings
                        </CardTitle>
                        <CardDescription className="text-xs text-zinc-400">
                          Extended behavior and formatting parameters
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="behavior" className="w-full">
                          <TabsList className="bg-background-primary grid w-full grid-cols-3">
                            <TabsTrigger
                              value="behavior"
                              className="font-dmmono text-xs font-medium uppercase"
                            >
                              Behavior
                            </TabsTrigger>
                            <TabsTrigger
                              value="context"
                              className="font-dmmono text-xs font-medium uppercase"
                            >
                              Context
                            </TabsTrigger>
                            <TabsTrigger
                              value="system"
                              className="font-dmmono text-xs font-medium uppercase"
                            >
                              System
                            </TabsTrigger>
                          </TabsList>

                          {/* BEHAVIOR TAB */}
                          <TabsContent
                            value="behavior"
                            className="mt-6 space-y-6"
                          >
                            {/* Response behavior toggles */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                <div className="space-y-1">
                                  <Label className="font-dmmono text-xs font-medium uppercase">
                                    Stream Response
                                  </Label>
                                  <p className="text-xs text-zinc-400">
                                    Stream responses in real-time
                                  </p>
                                </div>
                                <Switch
                                  checked={stream}
                                  onCheckedChange={setStream}
                                />
                              </div>

                              <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                <div className="space-y-1">
                                  <Label className="font-dmmono text-xs font-medium uppercase">
                                    Markdown Support
                                  </Label>
                                  <p className="text-xs text-zinc-400">
                                    Render markdown formatting
                                  </p>
                                </div>
                                <Switch
                                  checked={markdown}
                                  onCheckedChange={setMarkdown}
                                />
                              </div>

                              <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                <div className="space-y-1">
                                  <Label className="font-dmmono text-xs font-medium uppercase">
                                    Add Date/Time
                                  </Label>
                                  <p className="text-xs text-zinc-400">
                                    Include timestamp in instructions
                                  </p>
                                </div>
                                <Switch
                                  checked={addDatetimeToInstructions}
                                  onCheckedChange={setAddDatetimeToInstructions}
                                />
                              </div>

                              <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                <div className="space-y-1">
                                  <Label className="font-dmmono text-xs font-medium uppercase">
                                    Read Chat History
                                  </Label>
                                  <p className="text-xs text-zinc-400">
                                    Access previous conversations
                                  </p>
                                </div>
                                <Switch
                                  checked={readChatHistory}
                                  onCheckedChange={setReadChatHistory}
                                />
                              </div>

                              <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                <div className="space-y-1">
                                  <Label className="font-dmmono text-xs font-medium uppercase">
                                    JSON Mode
                                  </Label>
                                  <p className="text-xs text-zinc-400">
                                    Force JSON formatted responses
                                  </p>
                                </div>
                                <Switch
                                  checked={useJsonMode}
                                  onCheckedChange={setUseJsonMode}
                                />
                              </div>
                            </div>

                            {/* History and timing parameters */}
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                label="History Runs Count"
                                description="Number of past runs to include"
                              >
                                <Input
                                  type="number"
                                  value={numHistoryRuns}
                                  onChange={(e) =>
                                    setNumHistoryRuns(
                                      Number.parseInt(e.target.value)
                                    )
                                  }
                                  className="border-secondary bg-background-primary text-primary"
                                />
                              </FormField>

                              <FormField
                                label="Timezone"
                                description="Agent's timezone setting"
                              >
                                <Select
                                  value={timezoneIdentifier}
                                  onValueChange={setTimezoneIdentifier}
                                >
                                  <SelectTrigger className="border-primary/15 bg-background-primary h-9 border text-xs font-medium uppercase">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background-primary font-dmmono border-none shadow-lg">
                                    {timezones.map((tz) => (
                                      <SelectItem key={tz.id} value={tz.id}>
                                        <span className="text-xs font-medium uppercase">
                                          {tz.name}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormField>
                            </div>

                            <FormField
                              label="Tags"
                              description="For categorization and search"
                            >
                              <Input
                                placeholder="marketing, analytics, production"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="border-secondary bg-background-primary text-primary text-xs"
                              />
                            </FormField>
                          </TabsContent>

                          {/* CONTEXT TAB */}
                          <TabsContent
                            value="context"
                            className="mt-6 space-y-6"
                          >
                            <div>
                              {/* Context Enable Toggle */}
                              <div className="bg-background-primary mb-6 flex items-center justify-between rounded-lg p-3">
                                <div className="space-y-1">
                                  <Label className="font-dmmono text-xs font-medium uppercase">
                                    Enable Context
                                  </Label>
                                  <p className="text-xs text-zinc-400">
                                    Include context information in agent
                                    responses
                                  </p>
                                </div>
                                <Switch
                                  checked={addContext}
                                  onCheckedChange={setAddContext}
                                />
                              </div>

                              {addContext && (
                                <>
                                  <div className="mb-4 flex items-center justify-between">
                                    <div>
                                      <h4 className="font-dmmono text-xs font-medium uppercase">
                                        Context Configuration
                                      </h4>
                                      <p className="text-xs text-zinc-400">
                                        Agent&apos;s operating context and
                                        environment
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={addContextPair}
                                      className="bg-background-primary text-primary hover:bg-background-muted hover:text-primary"
                                    >
                                      <span className="mr-1">+</span>
                                      Add Pair
                                    </Button>
                                  </div>

                                  {/* Context Key-Value Pairs */}
                                  <div className="space-y-3">
                                    {contextPairs.map((pair, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-3"
                                      >
                                        <div className="flex-1">
                                          <Input
                                            placeholder="Key (e.g., company)"
                                            value={pair.key}
                                            onChange={(e) =>
                                              updateContextPair(
                                                index,
                                                'key',
                                                e.target.value
                                              )
                                            }
                                            className="border-secondary bg-background-primary text-primary text-xs"
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <Input
                                            placeholder="Value (e.g., TechCorp)"
                                            value={pair.value}
                                            onChange={(e) =>
                                              updateContextPair(
                                                index,
                                                'value',
                                                e.target.value
                                              )
                                            }
                                            className="border-secondary bg-background-primary text-primary text-xs"
                                          />
                                        </div>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            removeContextPair(index)
                                          }
                                          className="text-zinc-400 hover:bg-red-950 hover:text-red-400"
                                        >
                                          <Icon type="trash" size="xs" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>

                                  {contextPairs.length === 0 && (
                                    <div className="py-8 text-center text-xs text-zinc-400">
                                      No context pairs defined. Click &quot;Add
                                      Pair&quot; to create context variables.
                                    </div>
                                  )}

                                  <FormField
                                    label="Additional Context"
                                    description="Extra context information for the agent"
                                  >
                                    <TextArea
                                      placeholder="User works in analytics department and has access to financial data..."
                                      value={additionalContext}
                                      onChange={(e) =>
                                        setAdditionalContext(e.target.value)
                                      }
                                      className="border-secondary bg-background-primary text-primary min-h-[60px] text-xs"
                                    />
                                  </FormField>
                                </>
                              )}
                            </div>
                          </TabsContent>

                          {/* SYSTEM TAB */}
                          <TabsContent
                            value="system"
                            className="mt-6 space-y-6"
                          >
                            {/* System behavior toggles */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                <div className="space-y-1">
                                  <Label className="font-dmmono text-xs font-medium uppercase">
                                    Debug Mode
                                  </Label>
                                  <p className="text-xs text-zinc-400">
                                    Enable debugging information
                                  </p>
                                </div>
                                <Switch
                                  checked={debugMode}
                                  onCheckedChange={setDebugMode}
                                />
                              </div>

                              <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                <div className="space-y-1">
                                  <Label className="font-dmmono text-xs font-medium uppercase">
                                    Monitoring
                                  </Label>
                                  <p className="text-xs text-zinc-400">
                                    Enable performance monitoring
                                  </p>
                                </div>
                                <Switch
                                  checked={monitoring}
                                  onCheckedChange={setMonitoring}
                                />
                              </div>

                              <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                <div className="space-y-1">
                                  <Label className="font-dmmono text-xs font-medium uppercase">
                                    Exponential Backoff
                                  </Label>
                                  <p className="text-xs text-zinc-400">
                                    Increase retry delays exponentially
                                  </p>
                                </div>
                                <Switch
                                  checked={exponentialBackoff}
                                  onCheckedChange={setExponentialBackoff}
                                />
                              </div>
                            </div>

                            {/* System parameters */}
                            <div className="grid grid-cols-3 gap-4">
                              <FormField
                                label="Retries"
                                description="Maximum retry attempts"
                              >
                                <Input
                                  type="number"
                                  value={retries}
                                  onChange={(e) =>
                                    setRetries(Number.parseInt(e.target.value))
                                  }
                                  className="border-secondary bg-background-primary text-primary"
                                />
                              </FormField>

                              <FormField
                                label="Retry Delay (sec)"
                                description="Delay between retry attempts"
                              >
                                <Input
                                  type="number"
                                  value={delayBetweenRetries}
                                  onChange={(e) =>
                                    setDelayBetweenRetries(
                                      Number.parseInt(e.target.value)
                                    )
                                  }
                                  className="border-secondary bg-background-primary text-primary"
                                />
                              </FormField>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Template Selector Dialog */}
      <AgentTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this agent? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.main>
  )
}
