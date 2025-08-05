export interface ToolCall {
  role?: 'user' | 'tool' | 'system' | 'assistant'
  content?: string | null
  tool_call_id?: string
  tool_name: string
  tool_args?: Record<string, string>
  tool_call_error?: boolean
  metrics?: {
    time: number
  }
  created_at: number
  // Дополнительные поля для Agno API
  tool_input?: unknown
  tool_output?: unknown
  status?: 'running' | 'completed' | 'failed'
}

export interface ReasoningSteps {
  title: string
  action?: string
  result: string
  reasoning: string
  confidence?: number
  next_action?: string
}
export interface ReasoningStepProps {
  index: number
  stepTitle: string
}
export interface ReasoningProps {
  reasoning: ReasoningSteps[] | ReasoningSteps
}

export type ToolCallProps = {
  tools: ToolCall
}
interface ModelMessage {
  content: string | null
  context?: MessageContext[]
  created_at: number
  metrics?: {
    time: number
    prompt_tokens: number
    input_tokens: number
    completion_tokens: number
    output_tokens: number
  }
  name: string | null
  role: string
  tool_args?: unknown
  tool_call_id: string | null
  tool_calls: Array<{
    function: {
      arguments: string
      name: string
    }
    id: string
    type: string
  }> | null
}

export interface Model {
  name: string
  model: string
  provider: string
}

// New interfaces for the updated agent structure
export interface ModelConfiguration {
  id: string
  provider: string
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

export interface ToolsConfiguration {
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

export interface MemoryConfiguration {
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

export interface KnowledgeConfiguration {
  add_references?: boolean
  search_knowledge?: boolean
  update_knowledge?: boolean
  max_references?: number
  similarity_threshold?: number
  references_format?: string
  knowledge_filters?: Record<string, unknown>
  enable_agentic_knowledge_filters?: boolean
}

export interface StorageConfiguration {
  storage_type?: string
  enabled?: boolean
  db_url?: string
  table_name?: string
  db_schema?: string
  store_events?: boolean
  extra_data?: Record<string, unknown>
}

export interface ReasoningConfiguration {
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

export interface TeamMember {
  agent_id: string
  role: string
  name: string
}

export interface TeamConfiguration {
  team_mode?: string
  role?: string
  respond_directly?: boolean
  add_transfer_instructions?: boolean
  team_response_separator?: string
  workflow_id?: string
  team_id?: string
  members?: TeamMember[]
  add_member_tools_to_system_message?: boolean
  show_members_responses?: boolean
  stream_member_events?: boolean
  share_member_interactions?: boolean
  get_member_information_tool?: boolean
}

export interface AgentSettings {
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

// Updated Agent interface with new Supabase structure
export interface Agent {
  id?: string // UUID from Supabase
  agent_id: string // Unique agent identifier
  name: string
  description?: string
  model_config: {
    id: string
    provider: string
    temperature?: number
    max_tokens?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
    stop?: string[]
    seed?: number
    timeout?: number
    max_retries?: number
  }
  system_instructions?: string[]
  tool_ids?: string[] // UUID array for tools
  user_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  agent_config: Record<string, unknown>
  is_public: boolean
  company_id?: string // UUID
  photo?: string
  category?: string

  // New fields added to match updated schema
  goal?: string
  expected_output?: string
  role?: string

  // Legacy fields for backward compatibility
  instructions?: string
  is_active_api?: boolean
  model_configuration?: ModelConfiguration
  tools_config?: ToolsConfiguration
  memory_config?: MemoryConfiguration
  knowledge_config?: KnowledgeConfiguration
  storage_config?: StorageConfiguration
  reasoning_config?: ReasoningConfiguration
  team_config?: TeamConfiguration
  settings?: AgentSettings
  model?: Model
  storage?: boolean
}

// API Agent interface for responses from Supabase
export interface APIAgent {
  id: string
  agent_id: string
  name: string
  description?: string
  model_config: {
    id: string
    provider: string
    temperature?: number
    max_tokens?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
    stop?: string[]
    seed?: number
    timeout?: number
    max_retries?: number
  }
  system_instructions: string[]
  tool_ids: string[]
  user_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  agent_config: Record<string, unknown>
  is_public: boolean
  company_id?: string
  photo?: string
  category?: string

  // New fields added to match updated schema
  goal?: string
  expected_output?: string
  role?: string
}

interface MessageContext {
  query: string
  docs?: Array<Record<string, object>>
  time?: number
}

export enum RunEvent {
  RunStarted = 'RunStarted',
  RunResponse = 'RunResponse',
  RunResponseContent = 'RunResponseContent',
  RunCompleted = 'RunCompleted',
  RunError = 'RunError',
  ToolCallStarted = 'ToolCallStarted',
  ToolCallCompleted = 'ToolCallCompleted',
  UpdatingMemory = 'UpdatingMemory',
  ReasoningStarted = 'ReasoningStarted',
  ReasoningStep = 'ReasoningStep',
  ReasoningCompleted = 'ReasoningCompleted'
}

// Новые типы событий для Agno API
export type AgnoEvent =
  | 'RunStarted'
  | 'RunResponseContent'
  | 'RunCompleted'
  | 'ToolCallStarted'
  | 'ToolCallCompleted'
  | 'ReasoningStarted'
  | 'ReasoningStep'
  | 'RunError'

// Структура события стриминга Agno
export interface AgnoStreamEvent {
  event: AgnoEvent
  content?: string
  agent_id?: string
  run_id?: string
  session_id?: string
  created_at: number

  // Медиа контент
  images?: AgnoMediaItem[]
  videos?: AgnoMediaItem[]
  audio?: AgnoMediaItem[]
  response_audio?: string

  // Информация об инструменте
  tool_name?: string
  tool_input?: unknown
  tool_output?: unknown

  // Ошибки
  error_type?: 'NotFound' | 'RuntimeError' | 'General'
}

// Структура медиа элемента для Agno API
export interface AgnoMediaItem {
  url?: string
  content?: string
  content_type: string
  name?: string
  size?: number
}

export interface ResponseAudio {
  id?: string
  content?: string
  transcript?: string
  channels?: number
  sample_rate?: number
}

export interface NewRunResponse {
  status: 'RUNNING' | 'PAUSED' | 'CANCELLED'
}

export interface RunResponseContent {
  content?: string | object
  content_type: string
  context?: MessageContext[]
  event: RunEvent
  event_data?: object
  messages?: ModelMessage[]
  metrics?: object
  model?: string
  run_id?: string
  agent_id?: string
  session_id?: string
  tool?: ToolCall
  tools?: Array<ToolCall>
  created_at: number
  extra_data?: PlaygroundAgentExtraData
  images?: ImageData[]
  videos?: VideoData[]
  audio?: AudioData[]
  response_audio?: ResponseAudio
}

export interface RunResponse {
  content?: string | object
  content_type: string
  context?: MessageContext[]
  event: RunEvent
  event_data?: object
  messages?: ModelMessage[]
  metrics?: object
  model?: string
  run_id?: string
  agent_id?: string
  session_id?: string
  tool?: ToolCall
  tools?: Array<ToolCall>
  created_at: number
  extra_data?: PlaygroundAgentExtraData
  images?: ImageData[]
  videos?: VideoData[]
  audio?: AudioData[]
  response_audio?: ResponseAudio
}

export interface AgentExtraData {
  reasoning_steps?: ReasoningSteps[] | ReasoningSteps
  reasoning_messages?: ReasoningMessage[]
  references?: ReferenceData[]
}

export interface PlaygroundAgentExtraData extends AgentExtraData {
  reasoning_messages?: ReasoningMessage[]
  references?: ReferenceData[]
}

export interface ReasoningMessage {
  role: 'user' | 'tool' | 'system' | 'assistant'
  content: string | null
  tool_call_id?: string
  tool_name?: string
  tool_args?: Record<string, string>
  tool_call_error?: boolean
  metrics?: {
    time: number
  }
  created_at?: number
}
export interface PlaygroundChatMessage {
  role: 'user' | 'agent' | 'system' | 'tool'
  content: string
  streamingError?: boolean
  created_at: number
  tool_calls?: ToolCall[]
  extra_data?: {
    reasoning_steps?: ReasoningSteps[] | ReasoningSteps
    reasoning_messages?: ReasoningMessage[]
    references?: ReferenceData[]
  }
  // Поддержка как старых типов, так и новых типов Agno API
  images?: ImageData[] | AgnoMediaItem[]
  videos?: VideoData[] | AgnoMediaItem[]
  audio?: AudioData[] | AgnoMediaItem[]
  response_audio?: ResponseAudio | string
  files?: string[]
}

export interface ComboboxAgent {
  value: string
  label: string
  model: {
    provider: string
  }
  storage?: boolean
  storage_config?: {
    enabled?: boolean
  }
  is_public?: boolean
  company_id?: string
  category?: string
  photo?: string
}
export interface ImageData {
  revised_prompt: string
  url: string
}

export interface VideoData {
  id: number
  eta: number
  url: string
}

export interface AudioData {
  base64_audio?: string
  mime_type?: string
  url?: string
  id?: string
  content?: string
  channels?: number
  sample_rate?: number
}

export interface ReferenceData {
  query: string
  references: Reference[]
  time?: number
}

export interface Reference {
  content: string
  meta_data: {
    chunk: number
    chunk_size: number
  }
  name: string
}

export interface SessionEntry {
  session_id: string
  title: string
  created_at: number
  session_data?: {
    session_name?: string
    [key: string]: unknown
  }
}

export interface ChatEntry {
  message: {
    role: 'user' | 'system' | 'tool' | 'assistant'
    content: string
    created_at: number
  }
  response: {
    content: string
    tools?: ToolCall[]
    extra_data?: {
      reasoning_steps?: ReasoningSteps[] | ReasoningSteps
      reasoning_messages?: ReasoningMessage[]
      references?: ReferenceData[]
    }
    images?: ImageData[]
    videos?: VideoData[]
    audio?: AudioData[]
    response_audio?: {
      transcript?: string
    }
    created_at: number
  }
}

// Интерфейс для памяти агента (AGNO API)
export interface AgentMemory {
  memory: string
  topics: string[]
  last_updated: string
}
