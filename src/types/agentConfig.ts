// Полная спецификация AgentConfig согласно документации Agno Framework
// Основано на анализе 100+ параметров из agno_agent_configs.md

// Базовые типы
export type ModelProvider =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'mistral'
  | 'ollama'
export type ToolChoice =
  | 'auto'
  | 'none'
  | 'required'
  | { type: 'function'; function: { name: string } }
export type ReferencesFormat = 'json' | 'yaml' | 'markdown' | 'text'
export type RunEvent =
  | 'run_response_content'
  | 'tool_call_started'
  | 'tool_call_completed'
  | 'reasoning_started'
  | 'reasoning_step'
  | 'run_error'

// Модель конфигурации
export interface ModelConfig {
  // Основные параметры
  provider: ModelProvider
  id: string
  temperature?: number
  max_tokens?: number
  max_completion_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  seed?: number
  stop?: string[]

  // Продвинутые параметры OpenAI
  reasoning_effort?: 'low' | 'medium' | 'high'
  store?: boolean
  metadata?: Record<string, string | number | boolean>
  modalities?: ('text' | 'audio')[]
  audio?: {
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
    format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm'
  }

  // Клиентские параметры
  api_key?: string
  organization?: string
  base_url?: string
  timeout?: number
  max_retries?: number
}

// Конфигурация хранилища
export interface StorageConfig {
  enabled?: boolean
  type?: 'postgres' | 'memory' | 'file'
  db_url?: string
  table_name?: string
  schema?: string
  mode?: 'agent' | 'team' | 'workflow' | 'workflow_v2'
}

// Конфигурация памяти (v2)
export interface MemoryConfig {
  enabled?: boolean
  type?: 'postgres' | 'memory' | 'file'
  db_url?: string
  table_name?: string
  schema?: string
  delete_memories?: boolean
  clear_memories?: boolean
}

// Конфигурация знаний (RAG)
export interface KnowledgeConfig {
  enabled?: boolean
  type?: 'url' | 'pdf' | 'text'
  urls?: string[]
  pdf_paths?: string[]
  table_name?: string
  vector_distance?: 'cosine' | 'euclidean' | 'dot_product'
  embedder_config?: {
    model?: string
    dimensions?: number
  }
}

// Конфигурация истории
export interface HistoryConfig {
  add_history_to_messages?: boolean
  num_history_runs?: number
  read_chat_history?: boolean
}

// Конфигурация рассуждений
export interface ReasoningConfig {
  enabled?: boolean
  model_id?: string
  min_steps?: number
  max_steps?: number
}

// Конфигурация парсера
export interface ParserConfig {
  enabled?: boolean
  model_id?: string
  prompt?: string
}

// Конфигурация команды
export interface TeamConfig {
  enabled?: boolean
  data?: Record<string, string | number | boolean>
}

// Полная конфигурация агента
export interface ExtendedAgentConfig {
  // 1. Хранилище и сессии
  storage?: StorageConfig
  session_name?: string
  session_state?: Record<string, string | number | boolean>
  search_previous_sessions_history?: boolean
  num_history_sessions?: number
  cache_session?: boolean

  // 2. Контекст
  context?: Record<string, string | number | boolean>
  add_context?: boolean
  resolve_context?: boolean

  // 3. Память (v2)
  memory?: MemoryConfig
  enable_agentic_memory?: boolean
  enable_user_memories?: boolean
  add_memory_references?: boolean
  enable_session_summaries?: boolean
  add_session_summary_references?: boolean

  // 4. История
  history?: HistoryConfig

  // 5. Знания (RAG)
  knowledge?: KnowledgeConfig
  knowledge_filters?: Record<string, string | number | boolean>
  enable_agentic_knowledge_filters?: boolean
  add_references?: boolean
  references_format?: ReferencesFormat
  search_knowledge?: boolean
  update_knowledge?: boolean

  // 6. Инструменты
  show_tool_calls?: boolean
  tool_call_limit?: number
  tool_choice?: ToolChoice
  read_tool_call_history?: boolean

  // 7. Рассуждения
  reasoning?: ReasoningConfig

  // 8. Системное сообщение
  introduction?: string
  goal?: string
  additional_context?: string
  markdown?: boolean
  add_name_to_instructions?: boolean
  add_datetime_to_instructions?: boolean
  add_location_to_instructions?: boolean
  timezone_identifier?: string
  add_state_in_messages?: boolean

  // 9. Дополнительные сообщения
  add_messages?: Array<{
    role: string
    content: string
  }>
  success_criteria?: string

  // 10. Пользовательские сообщения
  user_message_role?: string
  create_default_user_message?: boolean

  // 11. Ответы и парсинг
  retries?: number
  delay_between_retries?: number
  exponential_backoff?: boolean
  parser?: ParserConfig
  parse_response?: boolean
  structured_outputs?: boolean
  use_json_mode?: boolean
  save_response_to_file?: string

  // 12. Стриминг
  stream?: boolean
  stream_intermediate_steps?: boolean
  store_events?: boolean
  events_to_skip?: RunEvent[]

  // 13. Команда
  team?: TeamConfig
  respond_directly?: boolean
  add_transfer_instructions?: boolean
  team_response_separator?: string
  team_session_id?: string
  team_id?: string
  team_session_state?: Record<string, string | number | boolean>

  // 14. Workflow
  app_id?: string
  workflow_id?: string
  workflow_session_id?: string
  workflow_session_state?: Record<string, string | number | boolean>

  // 15. Отладка и мониторинг
  debug_mode?: boolean
  debug_level?: 1 | 2
  monitoring?: boolean
  telemetry?: boolean
}

// Валидация и зависимости
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: ValidationSuggestion[]
}

export interface ValidationError {
  field: string
  message: string
  type:
    | 'missing_dependency'
    | 'incompatible_config'
    | 'invalid_value'
    | 'resource_unavailable'
}

export interface ValidationWarning {
  field: string
  message: string
  type: 'performance' | 'compatibility' | 'deprecated' | 'suboptimal'
}

export interface ValidationSuggestion {
  field: string
  message: string
  suggestedValue?: string | number | boolean | Record<string, unknown>
  type: 'optimization' | 'best_practice' | 'alternative'
}

// Возможности модели
export interface ModelCapabilities {
  tool_calls: boolean
  structured_outputs: boolean
  streaming: boolean
  reasoning: boolean
  multimodal: boolean
  max_context: number
  supports_json_mode: boolean
}

// Карта возможностей моделей
export const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  'gpt-4o': {
    tool_calls: true,
    structured_outputs: true,
    streaming: true,
    reasoning: false,
    multimodal: true,
    max_context: 128000,
    supports_json_mode: true
  },
  'gpt-4.1-2025-04-14': {
    tool_calls: true,
    structured_outputs: true,
    streaming: true,
    reasoning: true,
    multimodal: false,
    max_context: 200000,
    supports_json_mode: true
  },
  'gpt-4.1-mini-2025-04-14': {
    tool_calls: true,
    structured_outputs: true,
    streaming: true,
    reasoning: false,
    multimodal: false,
    max_context: 128000,
    supports_json_mode: true
  },
  'claude-3-5-sonnet-20241022': {
    tool_calls: true,
    structured_outputs: false,
    streaming: true,
    reasoning: false,
    multimodal: true,
    max_context: 200000,
    supports_json_mode: false
  }
}

// Обязательные зависимости для компонентов
export interface ComponentDependencies {
  memory: {
    requires: ['user_id', 'postgres_db']
    optional: ['embedder']
    conflicts: []
  }
  knowledge: {
    requires: ['vector_db', 'embedder']
    optional: ['chunking_strategy']
    conflicts: []
  }
  reasoning: {
    requires: ['reasoning_capable_model']
    optional: ['separate_reasoning_model']
    conflicts: []
  }
  tools: {
    requires: ['tool_capable_model']
    optional: []
    conflicts: []
  }
  team: {
    requires: ['multiple_agents', 'role_definition']
    optional: ['transfer_instructions']
    conflicts: ['respond_directly']
  }
}

export const COMPONENT_DEPENDENCIES: ComponentDependencies = {
  memory: {
    requires: ['user_id', 'postgres_db'],
    optional: ['embedder'],
    conflicts: []
  },
  knowledge: {
    requires: ['vector_db', 'embedder'],
    optional: ['chunking_strategy'],
    conflicts: []
  },
  reasoning: {
    requires: ['reasoning_capable_model'],
    optional: ['separate_reasoning_model'],
    conflicts: []
  },
  tools: {
    requires: ['tool_capable_model'],
    optional: [],
    conflicts: []
  },
  team: {
    requires: ['multiple_agents', 'role_definition'],
    optional: ['transfer_instructions'],
    conflicts: ['respond_directly']
  }
}
