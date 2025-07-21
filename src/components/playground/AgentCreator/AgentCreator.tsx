'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
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
import { Separator } from '@/components/ui/separator'
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
import { X, Save, Play } from 'lucide-react'
import { usePlaygroundStore } from '@/store'
import { toast } from 'sonner'
import useChatActions from '@/hooks/useChatActions'
import { APIRoutes } from '@/api/routes'
import { Agent } from '@/types/playground'
import Icon from '@/components/ui/icon'

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

export default function AgentCreator() {
  const {
    setIsAgentCreationMode,
    editingAgentId,
    selectedEndpoint,
    setEditingAgentId,
    setSelectedAgent
  } = usePlaygroundStore()
  const { refreshAgentsList } = useChatActions()

  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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
  const [instructions, setInstructions] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isActiveApi, setIsActiveApi] = useState(true)
  const [isPublic, setIsPublic] = useState(false)

  // === PREVIEW STATES (for sidebar display only) ===
  const [previewAgentName, setPreviewAgentName] = useState('')
  const [previewAgentDescription, setPreviewAgentDescription] = useState('')

  // Update preview states with debounce
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreviewAgentName(agentName)
      setPreviewAgentDescription(agentDescription)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [agentName, agentDescription])

  // === MODEL CONFIGURATION ===
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [selectedModel, setSelectedModel] = useState('gpt-4.1')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(4000)
  const [topP, setTopP] = useState(0.9)
  const [frequencyPenalty, setFrequencyPenalty] = useState(0.1)
  const [presencePenalty, setPresencePenalty] = useState(0.1)
  const [stopSequences, setStopSequences] = useState('')
  const [seed, setSeed] = useState('')
  const [timeout, setTimeout] = useState(60)
  const [maxRetries, setMaxRetries] = useState(3)

  // === TOOLS ===
  const [toolsEnabled, setToolsEnabled] = useState(false)
  const [showToolCalls, setShowToolCalls] = useState(true)
  const [toolCallLimit, setToolCallLimit] = useState(10)
  const [toolChoice, setToolChoice] = useState('auto')
  const [selectedDynamicTools, setSelectedDynamicTools] = useState<string[]>([])
  const [selectedCustomTools, setSelectedCustomTools] = useState<string[]>([])
  const [selectedMcpServers, setSelectedMcpServers] = useState<string[]>([])

  // === MEMORY ===
  const [memoryEnabled, setMemoryEnabled] = useState(false)
  const [memoryType, setMemoryType] = useState('postgres')
  const [enableAgenticMemory, setEnableAgenticMemory] = useState(true)
  const [enableUserMemories, setEnableUserMemories] = useState(true)
  const [enableSessionSummaries, setEnableSessionSummaries] = useState(true)
  const [addMemoryReferences, setAddMemoryReferences] = useState(true)
  const [memorySchema, setMemorySchema] = useState('ai')
  const [memoryDbUrl, setMemoryDbUrl] = useState(
    'postgresql://postgres:Ginifi51!@db.wyehpfzafbjfvyjzgjss.supabase.co:5432/postgres'
  )
  const [memoryTopics, setMemoryTopics] = useState('')
  const [memoryMinImportance, setMemoryMinImportance] = useState(0.7)

  // === KNOWLEDGE BASE ===
  const [knowledgeEnabled, setKnowledgeEnabled] = useState(false)
  const [addReferences, setAddReferences] = useState(true)
  const [searchKnowledge, setSearchKnowledge] = useState(true)
  const [updateKnowledge, setUpdateKnowledge] = useState(false)
  const [maxReferences, setMaxReferences] = useState(5)
  const [similarityThreshold, setSimilarityThreshold] = useState(0.75)
  const [referencesFormat, setReferencesFormat] = useState('json')
  const [knowledgeFilters, setKnowledgeFilters] = useState('')

  // === STORAGE ===
  const [storageEnabled, setStorageEnabled] = useState(false)
  const [storageType, setStorageType] = useState('postgres')
  const [storageDbUrl, setStorageDbUrl] = useState(
    'postgresql://postgres:Ginifi51!@db.wyehpfzafbjfvyjzgjss.supabase.co:5432/postgres'
  )
  const [storageTableName, setStorageTableName] = useState('sessions')
  const [storageSchema, setStorageSchema] = useState('ai')
  const [storeEvents, setStoreEvents] = useState(true)

  // === REASONING ===
  const [reasoning, setReasoning] = useState(false)
  const [reasoningGoal, setReasoningGoal] = useState('')
  const [reasoningMinSteps, setReasoningMinSteps] = useState(2)
  const [reasoningMaxSteps, setReasoningMaxSteps] = useState(8)
  const [streamReasoning, setStreamReasoning] = useState(true)
  const [saveReasoningSteps, setSaveReasoningSteps] = useState(true)

  // === ADDITIONAL SETTINGS ===
  const [systemMessage, setSystemMessage] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [debugMode, setDebugMode] = useState(false)
  const [stream, setStream] = useState(true)
  const [markdown, setMarkdown] = useState(true)
  const [addDatetimeToInstructions, setAddDatetimeToInstructions] =
    useState(true)
  const [readChatHistory, setReadChatHistory] = useState(true)
  const [numHistoryRuns, setNumHistoryRuns] = useState(5)
  const [tags, setTags] = useState('')
  const [timezoneIdentifier, setTimezoneIdentifier] = useState('UTC')
  const [retries, setRetries] = useState(3)
  const [delayBetweenRetries, setDelayBetweenRetries] = useState(2)
  const [exponentialBackoff, setExponentialBackoff] = useState(true)
  const [useJsonMode, setUseJsonMode] = useState(false)
  const [monitoring, setMonitoring] = useState(true)

  // === CONTEXT SETTINGS ===
  const [contextPairs, setContextPairs] = useState<
    Array<{ key: string; value: string }>
  >([
    { key: 'company', value: 'TechCorp' },
    { key: 'department', value: 'Analytics' },
    { key: 'access_level', value: 'senior' }
  ])
  const [additionalContext, setAdditionalContext] = useState(
    'User works in analytics department'
  )
  const [addContext, setAddContext] = useState(true)

  // === TEAM SETTINGS ===
  const [teamMode, setTeamMode] = useState('')
  const [teamRole, setTeamRole] = useState('')
  const [respondDirectly, setRespondDirectly] = useState(true)
  const [addTransferInstructions, setAddTransferInstructions] = useState(true)

  const isEditMode = !!editingAgentId

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
    async (agentId: string) => {
      try {
        // Refresh agents list to get updated data
        await refreshAgentsList()

        // Find the agent to set it as selected
        const url = `${selectedEndpoint}/v1/agents/detailed`
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })

        if (response.ok) {
          const allAgents = await response.json()
          const agent = allAgents.find((a: Agent) => a.agent_id === agentId)

          if (agent) {
            // Set selected agent for chat
            setSelectedAgent({
              value: agent.agent_id,
              label: agent.name,
              model: {
                provider: agent.model_configuration?.provider || 'unknown'
              },
              storage: agent.storage_config?.enabled,
              storage_config: agent.storage_config
            })
          }
        }

        // Close agent creator and navigate to playground
        setIsAgentCreationMode(false)
        setEditingAgentId(null)
      } catch (error) {
        console.error('Error navigating to agent chat:', error)
        // Still close the creator even if navigation fails
        setIsAgentCreationMode(false)
        setEditingAgentId(null)
      }
    },
    [
      selectedEndpoint,
      refreshAgentsList,
      setSelectedAgent,
      setIsAgentCreationMode,
      setEditingAgentId
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
      const url = isEditMode
        ? APIRoutes.UpdateAgent(selectedEndpoint, editingAgentId!)
        : APIRoutes.CreateAgent(selectedEndpoint)

      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} agent`)
      }

      const result = await response.json()
      const agentId = isEditMode
        ? editingAgentId!
        : result.agent_id || payload.agent_id

      toast.success(`Agent ${isEditMode ? 'updated' : 'created'} successfully!`)

      // Navigate to agent chat
      await navigateToAgentChat(agentId)
    } catch (error) {
      console.error('Error saving agent:', error)
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} agent`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = () => {
    if (!agentName.trim()) {
      toast.error('Please save the agent first before testing')
      return
    }
    toast.info('Agent testing functionality coming soon!')
  }

  const handleDelete = () => {
    if (!isEditMode || !editingAgentId) {
      return
    }
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!editingAgentId) return

    try {
      const url = APIRoutes.DeleteAgent(selectedEndpoint, editingAgentId)
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete agent')
      }

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
    if (!editingAgentId || !selectedEndpoint) return

    setIsLoading(true)
    try {
      const url = `${selectedEndpoint}/v1/agents/detailed`
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch agent data')
      }

      const allAgents = await response.json()
      const agent = allAgents.find((a: Agent) => a.agent_id === editingAgentId)

      if (!agent) {
        toast.error('Agent not found')
        return
      }

      // Load basic information
      setAgentName(agent.name || '')
      setAgentDescription(agent.description || '')
      setInstructions(agent.instructions || '')
      setIsActive(agent.is_active ?? true)
      setIsActiveApi(agent.is_active_api ?? true)
      setIsPublic(agent.is_public ?? false)

      // Load model configuration
      if (agent.model_configuration) {
        setSelectedProvider(agent.model_configuration.provider || '')
        setSelectedModel(agent.model_configuration.id || '')
        setTemperature(agent.model_configuration.temperature ?? 0.7)
        setMaxTokens(agent.model_configuration.max_tokens ?? 4000)
        setTopP(agent.model_configuration.top_p ?? 0.9)
        setFrequencyPenalty(agent.model_configuration.frequency_penalty ?? 0.1)
        setPresencePenalty(agent.model_configuration.presence_penalty ?? 0.1)
        setStopSequences(agent.model_configuration.stop?.join(',') || '')
        setSeed(agent.model_configuration.seed?.toString() || '')
        setTimeout(agent.model_configuration.timeout ?? 60)
        setMaxRetries(agent.model_configuration.max_retries ?? 3)
      }

      // Load tools configuration
      if (agent.tools_config && Object.keys(agent.tools_config).length > 0) {
        setToolsEnabled(true)
        setShowToolCalls(agent.tools_config.show_tool_calls ?? true)
        setToolCallLimit(agent.tools_config.tool_call_limit ?? 10)
        setToolChoice(agent.tools_config.tool_choice || 'auto')
        setSelectedDynamicTools(agent.tools_config.dynamic_tools || [])
        setSelectedCustomTools(agent.tools_config.custom_tools || [])
        setSelectedMcpServers(agent.tools_config.mcp_servers || [])
      } else {
        setToolsEnabled(false)
      }

      // Load memory configuration
      if (agent.memory_config && Object.keys(agent.memory_config).length > 0) {
        setMemoryEnabled(true)
        setMemoryType(agent.memory_config.memory_type || 'postgres')
        setEnableAgenticMemory(
          agent.memory_config.enable_agentic_memory ?? true
        )
        setEnableUserMemories(agent.memory_config.enable_user_memories ?? true)
        setEnableSessionSummaries(
          agent.memory_config.enable_session_summaries ?? true
        )
        setAddMemoryReferences(
          agent.memory_config.add_memory_references ?? true
        )
        setMemorySchema(agent.memory_config.db_schema || 'ai')
        setMemoryDbUrl(agent.memory_config.db_url || '')
        const memoryFilters = agent.memory_config.memory_filters as {
          min_importance?: number
          topics?: string[]
        }
        if (memoryFilters?.min_importance) {
          setMemoryMinImportance(memoryFilters.min_importance)
        }
      } else {
        setMemoryEnabled(false)
      }

      // Load knowledge configuration
      if (
        agent.knowledge_config &&
        Object.keys(agent.knowledge_config).length > 0
      ) {
        setKnowledgeEnabled(true)
        setAddReferences(agent.knowledge_config.add_references ?? true)
        setSearchKnowledge(agent.knowledge_config.search_knowledge ?? true)
        setUpdateKnowledge(agent.knowledge_config.update_knowledge ?? false)
        setMaxReferences(agent.knowledge_config.max_references ?? 5)
        setSimilarityThreshold(
          agent.knowledge_config.similarity_threshold ?? 0.75
        )
        setReferencesFormat(agent.knowledge_config.references_format || 'json')
        setKnowledgeFilters(
          JSON.stringify(
            agent.knowledge_config.knowledge_filters || {},
            null,
            2
          )
        )
      } else {
        setKnowledgeEnabled(false)
      }

      // Load storage configuration
      if (
        agent.storage_config &&
        Object.keys(agent.storage_config).length > 0
      ) {
        setStorageEnabled(true)
        setStorageType(agent.storage_config.storage_type || 'postgres')
        setStorageDbUrl(agent.storage_config.db_url || '')
        setStorageTableName(agent.storage_config.table_name || 'sessions')
        setStorageSchema(agent.storage_config.db_schema || 'ai')
        setStoreEvents(agent.storage_config.store_events ?? true)
      } else {
        setStorageEnabled(false)
      }

      // Load reasoning configuration
      if (agent.reasoning_config) {
        setReasoning(agent.reasoning_config.reasoning ?? false)
        setReasoningGoal(agent.reasoning_config.goal || '')
        setReasoningMinSteps(agent.reasoning_config.reasoning_min_steps ?? 2)
        setReasoningMaxSteps(agent.reasoning_config.reasoning_max_steps ?? 8)
        setStreamReasoning(agent.reasoning_config.stream_reasoning ?? true)
        setSaveReasoningSteps(
          agent.reasoning_config.save_reasoning_steps ?? true
        )
      }

      // Load settings
      if (agent.settings) {
        setSystemMessage(agent.settings.system_message || '')
        setIntroduction(agent.settings.introduction || '')
        setDebugMode(agent.settings.debug_mode ?? false)
        setStream(agent.settings.stream ?? true)
        setMarkdown(agent.settings.markdown ?? true)
        setAddDatetimeToInstructions(
          agent.settings.add_datetime_to_instructions ?? true
        )
        setReadChatHistory(agent.settings.read_chat_history ?? true)
        setNumHistoryRuns(agent.settings.num_history_runs ?? 5)
        setTags(
          Array.isArray(agent.settings.tags)
            ? agent.settings.tags.join(', ')
            : ''
        )
        setTimezoneIdentifier(agent.settings.timezone_identifier || 'UTC')
        setRetries(agent.settings.retries ?? 3)
        setDelayBetweenRetries(agent.settings.delay_between_retries ?? 2)
        setExponentialBackoff(agent.settings.exponential_backoff ?? true)
        setUseJsonMode(agent.settings.use_json_mode ?? false)
        setMonitoring(agent.settings.monitoring ?? true)

        // Load context settings
        if (agent.settings.context) {
          const contextObject = agent.settings.context
          const pairs = Object.entries(contextObject).map(([key, value]) => ({
            key,
            value: String(value)
          }))
          setContextPairs(
            pairs.length > 0
              ? pairs
              : [
                  { key: 'company', value: 'TechCorp' },
                  { key: 'department', value: 'Analytics' },
                  { key: 'access_level', value: 'senior' }
                ]
          )
        }
        setAdditionalContext(
          agent.settings.additional_context ||
            'User works in analytics department'
        )
        setAddContext(agent.settings.add_context ?? true)
      }

      // Load team configuration
      if (agent.team_config) {
        setTeamMode(agent.team_config.team_mode || '')
        setTeamRole(agent.team_config.role || '')
        setRespondDirectly(agent.team_config.respond_directly ?? true)
        setAddTransferInstructions(
          agent.team_config.add_transfer_instructions ?? true
        )
      }
    } catch (error) {
      console.error('Error loading agent data:', error)
      toast.error('Failed to load agent data')
    } finally {
      setIsLoading(false)
    }
  }, [editingAgentId, selectedEndpoint])

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

    return {
      id: isEditMode ? undefined : Date.now(),
      name: agentName,
      agent_id: agentIdValue,
      description: agentDescription,
      instructions: instructions,
      is_active: isActive,
      is_active_api: isActiveApi,
      is_public: isPublic,
      company_id: null,
      created_at: isEditMode ? undefined : new Date().toISOString(),
      updated_at: new Date().toISOString(),

      model_configuration: {
        id: selectedModel,
        provider: selectedProvider,
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
        seed: seed ? parseInt(seed) : undefined,
        user: 'production-user',
        metadata: {
          environment: 'production',
          version: '1.0'
        }
      },

      tools_config: toolsEnabled
        ? {
            show_tool_calls: showToolCalls,
            tool_call_limit: toolCallLimit,
            tool_choice: toolChoice,
            tools: [],
            dynamic_tools: selectedDynamicTools,
            custom_tools: selectedCustomTools,
            mcp_servers: selectedMcpServers,
            tool_hooks: [],
            function_declarations: []
          }
        : {},

      memory_config: memoryEnabled
        ? {
            memory_type: memoryType,
            enable_agentic_memory: enableAgenticMemory,
            enable_user_memories: enableUserMemories,
            enable_session_summaries: enableSessionSummaries,
            add_memory_references: addMemoryReferences,
            add_session_summary_references: true,
            memory_filters: {
              topics: memoryTopics
                ? memoryTopics.split(',').map((t) => t.trim())
                : [],
              min_importance: memoryMinImportance
            },
            db_url:
              memoryDbUrl ||
              'postgresql://postgres:Ginifi51!@db.wyehpfzafbjfvyjzgjss.supabase.co:5432/postgres',
            table_name: 'agent_memory',
            db_schema: memorySchema || 'ai'
          }
        : {},

      knowledge_config: knowledgeEnabled
        ? {
            add_references: addReferences,
            search_knowledge: searchKnowledge,
            update_knowledge: updateKnowledge,
            max_references: maxReferences,
            similarity_threshold: similarityThreshold,
            references_format: referencesFormat,
            knowledge_filters: knowledgeFilters
              ? JSON.parse(knowledgeFilters)
              : {},
            enable_agentic_knowledge_filters: true
          }
        : {},

      storage_config: storageEnabled
        ? {
            storage_type: storageType,
            enabled: storageEnabled,
            db_url:
              storageDbUrl ||
              'postgresql://postgres:Ginifi51!@db.wyehpfzafbjfvyjzgjss.supabase.co:5432/postgres',
            table_name: storageTableName || 'sessions',
            db_schema: storageSchema || 'ai',
            store_events: storeEvents,
            extra_data: {
              retention_days: 90,
              backup_enabled: true
            }
          }
        : {},

      reasoning_config: reasoning
        ? {
            reasoning: reasoning,
            reasoning_min_steps: reasoningMinSteps,
            reasoning_max_steps: reasoningMaxSteps,
            goal: reasoningGoal,
            success_criteria: 'User received complete and accurate answer',
            expected_output: 'Structured answer with explanation',
            reasoning_model: 'gpt-4-reasoning',
            reasoning_agent: 'expert-reasoner',
            reasoning_prompt: 'Think step by step and explain your actions',
            reasoning_instructions: [
              'Break down the task into subtasks',
              'Analyze each step',
              'Make reasoned conclusion'
            ],
            stream_reasoning: streamReasoning,
            save_reasoning_steps: saveReasoningSteps,
            show_full_reasoning: false
          }
        : {},

      team_config: teamMode
        ? {
            team_mode: teamMode,
            role: teamRole,
            respond_directly: respondDirectly,
            add_transfer_instructions: addTransferInstructions,
            team_response_separator: '\n---\n',
            workflow_id: '',
            team_id: '',
            members: [],
            add_member_tools_to_system_message: true,
            show_members_responses: true,
            stream_member_events: true,
            share_member_interactions: true,
            get_member_information_tool: true
          }
        : undefined,

      settings: {
        introduction: introduction,
        system_message: systemMessage,
        system_message_role: 'system',
        create_default_system_message: true,
        user_message_role: 'user',
        create_default_user_message: true,
        add_messages: introduction
          ? [
              {
                role: 'assistant',
                content: introduction
              }
            ]
          : [],
        context: contextPairs.reduce(
          (acc, pair) => {
            if (pair.key && pair.value) {
              acc[pair.key] = pair.value
            }
            return acc
          },
          {} as Record<string, string>
        ),
        add_context: addContext,
        resolve_context: true,
        additional_context: additionalContext,
        add_state_in_messages: true,
        add_history_to_messages: true,
        num_history_runs: numHistoryRuns,
        search_previous_sessions_history: true,
        num_history_sessions: 3,
        read_chat_history: readChatHistory,
        read_tool_call_history: true,
        markdown: markdown,
        add_name_to_instructions: true,
        add_datetime_to_instructions: addDatetimeToInstructions,
        add_location_to_instructions: false,
        timezone_identifier: timezoneIdentifier,
        stream: stream,
        stream_intermediate_steps: true,
        response_model: useJsonMode
          ? {
              type: 'object',
              properties: {
                answer: { type: 'string' },
                confidence: { type: 'number' },
                sources: { type: 'array' }
              }
            }
          : undefined,
        parse_response: false,
        use_json_mode: useJsonMode,
        parser_model: 'parser-model-v1',
        parser_model_prompt: 'Extract structured data from response',
        retries: retries,
        delay_between_retries: delayBetweenRetries,
        exponential_backoff: exponentialBackoff,
        debug_mode: debugMode,
        monitoring: monitoring,
        telemetry: true,
        store_events: true,
        events_to_skip: ['ToolCallStarted'],
        config_version: '2.0',
        tags: tags ? tags.split(',').map((t) => t.trim()) : [],
        app_id: 'analytics-platform',
        extra_data: {
          created_by: 'admin',
          environment: 'production',
          feature_flags: {
            experimental_reasoning: reasoning,
            enhanced_memory: enableAgenticMemory
          }
        }
      }
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

  return (
    <div className="bg-background-primary flex h-screen flex-1 flex-col">
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
              onClick={handleTest}
              className="text-primary bg-primary"
            >
              <Play className="mr-2 h-3 w-3" />
              Test Agent
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
        <div className="h-full px-6 py-6">
          <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-4">
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
                                API Active
                              </Label>
                              <p className="text-xs text-zinc-400">
                                Enable API access
                              </p>
                            </div>
                            <Switch
                              checked={isActiveApi}
                              onCheckedChange={setIsActiveApi}
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

            {/* Sidebar - Agent Preview */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="bg-background-secondary border-none">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-zinc-600">
                        {agentPhoto ? (
                          <Image
                            src={agentPhoto}
                            alt="Agent"
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-zinc-300">A</span>
                        )}
                      </div>
                      <div>
                        <CardTitle className="font-dmmono text-xs font-medium uppercase">
                          {previewAgentName || 'New Agent'}
                        </CardTitle>
                        <CardDescription className="text-muted mt-1 text-xs">
                          {previewAgentDescription || 'No description provided'}
                        </CardDescription>
                      </div>
                    </div>
                    {isEditMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDelete}
                        className="text-muted h-6 w-6 hover:bg-red-950 hover:text-red-400"
                      >
                        <Icon type="trash" size="xs" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Separator className="bg-accent mb-4" />

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-secondary">Provider:</span>
                      <span className="text-muted">
                        {selectedProvider
                          ? llmProviders.find((p) => p.id === selectedProvider)
                              ?.displayName
                          : 'Not selected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Model:</span>
                      <span className="text-muted">
                        {selectedModel || 'Not selected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Tools:</span>
                      <span className="text-muted">
                        {selectedDynamicTools.length +
                          selectedCustomTools.length +
                          selectedMcpServers.length}{' '}
                        active
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Memory:</span>
                      <span className="text-muted">
                        {enableAgenticMemory ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Storage:</span>
                      <span className="text-muted">
                        {storageEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Reasoning:</span>
                      <span className="text-muted">
                        {reasoning ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Status:</span>
                      <span
                        className={`text-xs ${isActive ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">API Access:</span>
                      <span
                        className={`text-xs ${isActiveApi ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {isActiveApi ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Visibility:</span>
                      <span className="text-muted">
                        {isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>

                  {(selectedDynamicTools.length > 0 ||
                    selectedCustomTools.length > 0 ||
                    selectedMcpServers.length > 0) && (
                    <>
                      <Separator className="my-4 bg-zinc-700" />
                      <div>
                        <p className="font-dmmono mb-2 text-xs font-medium uppercase text-zinc-200">
                          Active Tools:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {selectedDynamicTools.map((toolId) => {
                            const tool = availableDynamicTools.find(
                              (t) => t.id === toolId
                            )
                            return (
                              <Badge
                                key={toolId}
                                variant="secondary"
                                className="bg-zinc-700 text-xs text-zinc-300"
                              >
                                {tool?.name}
                              </Badge>
                            )
                          })}
                          {selectedCustomTools.map((toolId) => {
                            const tool = availableCustomTools.find(
                              (t) => t.id === toolId
                            )
                            return (
                              <Badge
                                key={toolId}
                                variant="outline"
                                className="border-zinc-600 text-xs text-zinc-300"
                              >
                                {tool?.name}
                              </Badge>
                            )
                          })}
                          {selectedMcpServers.map((serverId) => {
                            const server = availableMcpServers.find(
                              (s) => s.id === serverId
                            )
                            return (
                              <Badge
                                key={serverId}
                                variant="destructive"
                                className="bg-red-900 text-xs text-red-200"
                              >
                                {server?.name}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-background-primary border-zinc-700">
          <DialogHeader>
            <DialogTitle className="font-dmmono text-xs font-medium uppercase">
              Delete Agent
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Are you sure you want to delete this agent? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
