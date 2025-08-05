import {
  ExtendedAgentConfig,
  ModelConfig,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationSuggestion,
  MODEL_CAPABILITIES
} from '@/types/agentConfig'

// Класс для валидации конфигурации агентов
export class AgentConfigValidator {
  /**
   * Основная функция валидации конфигурации агента
   */
  static validateConfig(
    modelConfig: ModelConfig,
    agentConfig: ExtendedAgentConfig,
    toolIds: string[] = []
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: ValidationSuggestion[] = []

    // 1. Валидация модели и её возможностей
    const modelValidation = this.validateModelCapabilities(
      modelConfig,
      agentConfig
    )
    errors.push(...modelValidation.errors)
    warnings.push(...modelValidation.warnings)
    suggestions.push(...modelValidation.suggestions)

    // 2. Валидация зависимостей компонентов
    const dependencyValidation = this.validateDependencies(agentConfig)
    errors.push(...dependencyValidation.errors)
    warnings.push(...dependencyValidation.warnings)
    suggestions.push(...dependencyValidation.suggestions)

    // 3. Валидация инструментов
    const toolsValidation = this.validateTools(
      modelConfig,
      toolIds,
      agentConfig
    )
    errors.push(...toolsValidation.errors)
    warnings.push(...toolsValidation.warnings)
    suggestions.push(...toolsValidation.suggestions)

    // 4. Валидация ресурсов
    const resourceValidation = this.validateResources(agentConfig)
    errors.push(...resourceValidation.errors)
    warnings.push(...resourceValidation.warnings)
    suggestions.push(...resourceValidation.suggestions)

    // 5. Валидация конфликтов конфигурации
    const conflictValidation = this.validateConflicts(agentConfig)
    errors.push(...conflictValidation.errors)
    warnings.push(...conflictValidation.warnings)
    suggestions.push(...conflictValidation.suggestions)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  /**
   * Валидация возможностей модели
   */
  private static validateModelCapabilities(
    modelConfig: ModelConfig,
    agentConfig: ExtendedAgentConfig
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: ValidationSuggestion[] = []

    const capabilities = MODEL_CAPABILITIES[modelConfig.id]

    if (!capabilities) {
      warnings.push({
        field: 'model_config.id',
        message: `Unknown model "${modelConfig.id}". Capabilities cannot be verified.`,
        type: 'compatibility'
      })
      return { isValid: true, errors, warnings, suggestions }
    }

    // Проверка рассуждений
    if (agentConfig.reasoning?.enabled && !capabilities.reasoning) {
      errors.push({
        field: 'reasoning.enabled',
        message: `Model "${modelConfig.id}" does not support reasoning. Use gpt-4.1-2025-04-14 or newer.`,
        type: 'incompatible_config'
      })

      suggestions.push({
        field: 'model_config.id',
        message: 'Switch to gpt-4.1-2025-04-14 for reasoning support',
        suggestedValue: 'gpt-4.1-2025-04-14',
        type: 'alternative'
      })
    }

    // Проверка инструментов
    if (agentConfig.show_tool_calls && !capabilities.tool_calls) {
      errors.push({
        field: 'show_tool_calls',
        message: `Model "${modelConfig.id}" does not support tool calls.`,
        type: 'incompatible_config'
      })
    }

    // Проверка structured outputs
    if (agentConfig.structured_outputs && !capabilities.structured_outputs) {
      warnings.push({
        field: 'structured_outputs',
        message: `Model "${modelConfig.id}" does not natively support structured outputs. Parser will be used instead.`,
        type: 'performance'
      })

      suggestions.push({
        field: 'parser.enabled',
        message: 'Enable parser for structured outputs with this model',
        suggestedValue: true,
        type: 'optimization'
      })
    }

    // Проверка JSON mode
    if (agentConfig.use_json_mode && !capabilities.supports_json_mode) {
      errors.push({
        field: 'use_json_mode',
        message: `Model "${modelConfig.id}" does not support JSON mode.`,
        type: 'incompatible_config'
      })
    }

    // Проверка стриминга
    if (agentConfig.stream && !capabilities.streaming) {
      warnings.push({
        field: 'stream',
        message: `Model "${modelConfig.id}" may not support streaming optimally.`,
        type: 'performance'
      })
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions }
  }

  /**
   * Валидация зависимостей компонентов
   */
  private static validateDependencies(
    agentConfig: ExtendedAgentConfig
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: ValidationSuggestion[] = []

    // Валидация памяти
    if (agentConfig.memory?.enabled || agentConfig.enable_agentic_memory) {
      if (!agentConfig.storage?.enabled) {
        errors.push({
          field: 'memory.enabled',
          message: 'Memory requires storage to be enabled for persistence.',
          type: 'missing_dependency'
        })

        suggestions.push({
          field: 'storage.enabled',
          message: 'Enable storage for memory functionality',
          suggestedValue: true,
          type: 'best_practice'
        })
      }

      if (!agentConfig.memory?.table_name) {
        warnings.push({
          field: 'memory.table_name',
          message:
            'Memory table name not specified. Using default "user_memories".',
          type: 'suboptimal'
        })
      }
    }

    // Валидация знаний (RAG)
    if (agentConfig.knowledge?.enabled) {
      if (
        !agentConfig.knowledge.urls?.length &&
        !agentConfig.knowledge.pdf_paths?.length
      ) {
        errors.push({
          field: 'knowledge',
          message: 'Knowledge base enabled but no URLs or PDF paths provided.',
          type: 'missing_dependency'
        })
      }

      if (!agentConfig.knowledge.table_name) {
        warnings.push({
          field: 'knowledge.table_name',
          message:
            'Knowledge table name not specified. Using default "knowledge".',
          type: 'suboptimal'
        })
      }

      if (agentConfig.search_knowledge && !agentConfig.knowledge?.enabled) {
        errors.push({
          field: 'search_knowledge',
          message:
            'Knowledge search enabled but knowledge base is not configured.',
          type: 'missing_dependency'
        })
      }
    }

    // Валидация команды
    if (agentConfig.team?.enabled) {
      if (agentConfig.respond_directly) {
        warnings.push({
          field: 'respond_directly',
          message:
            'Direct response conflicts with team coordination. Consider disabling for better team flow.',
          type: 'compatibility'
        })
      }

      if (!agentConfig.add_transfer_instructions) {
        suggestions.push({
          field: 'add_transfer_instructions',
          message: 'Enable transfer instructions for better team coordination',
          suggestedValue: true,
          type: 'best_practice'
        })
      }
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions }
  }

  /**
   * Валидация инструментов
   */
  private static validateTools(
    modelConfig: ModelConfig,
    toolIds: string[],
    agentConfig: ExtendedAgentConfig
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: ValidationSuggestion[] = []

    const capabilities = MODEL_CAPABILITIES[modelConfig.id]

    if (toolIds.length > 0) {
      // Проверка поддержки tool calls
      if (!capabilities?.tool_calls) {
        errors.push({
          field: 'tool_ids',
          message: `Model "${modelConfig.id}" does not support tool calls but ${toolIds.length} tools are selected.`,
          type: 'incompatible_config'
        })
      }

      // Проверка лимита инструментов
      if (agentConfig.tool_call_limit && agentConfig.tool_call_limit > 20) {
        warnings.push({
          field: 'tool_call_limit',
          message: 'High tool call limit may impact performance and cost.',
          type: 'performance'
        })
      }

      // Автоматические инструменты
      if (
        agentConfig.search_knowledge &&
        !toolIds.includes('search_knowledge')
      ) {
        suggestions.push({
          field: 'tool_ids',
          message:
            'Knowledge search will automatically add search_knowledge tool',
          type: 'optimization'
        })
      }

      if (
        agentConfig.history?.read_chat_history &&
        !toolIds.includes('read_chat_history')
      ) {
        suggestions.push({
          field: 'tool_ids',
          message:
            'Chat history reading will automatically add read_chat_history tool',
          type: 'optimization'
        })
      }
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions }
  }

  /**
   * Валидация ресурсов
   */
  private static validateResources(
    agentConfig: ExtendedAgentConfig
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: ValidationSuggestion[] = []

    // Проверка URL базы данных для памяти
    if (agentConfig.memory?.enabled && agentConfig.memory.db_url) {
      if (!this.isValidPostgresUrl(agentConfig.memory.db_url)) {
        errors.push({
          field: 'memory.db_url',
          message: 'Invalid PostgreSQL connection URL for memory storage.',
          type: 'resource_unavailable'
        })
      }
    }

    // Проверка URL базы данных для хранилища
    if (agentConfig.storage?.enabled && !agentConfig.storage.table_name) {
      warnings.push({
        field: 'storage.table_name',
        message: 'Storage table name not specified. Using default "sessions".',
        type: 'suboptimal'
      })
    }

    // Проверка схемы базы данных
    if (
      agentConfig.storage?.schema &&
      !['public', 'ai'].includes(agentConfig.storage.schema)
    ) {
      warnings.push({
        field: 'storage.schema',
        message: `Schema "${agentConfig.storage.schema}" is not standard. Ensure it exists in your database.`,
        type: 'compatibility'
      })
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions }
  }

  /**
   * Валидация конфликтов конфигурации
   */
  private static validateConflicts(
    agentConfig: ExtendedAgentConfig
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: ValidationSuggestion[] = []

    // Конфликт JSON mode и streaming
    if (agentConfig.use_json_mode && agentConfig.stream) {
      warnings.push({
        field: 'use_json_mode',
        message:
          'JSON mode with streaming may produce incomplete JSON objects.',
        type: 'compatibility'
      })
    }

    // Конфликт structured outputs и JSON mode
    if (agentConfig.structured_outputs && agentConfig.use_json_mode) {
      warnings.push({
        field: 'structured_outputs',
        message:
          'Structured outputs and JSON mode are redundant. Choose one approach.',
        type: 'suboptimal'
      })
    }

    // Высокая температура с structured outputs
    if (agentConfig.structured_outputs && agentConfig.parser?.enabled) {
      suggestions.push({
        field: 'temperature',
        message:
          'Consider lower temperature (0.1-0.3) for more consistent structured outputs',
        type: 'optimization'
      })
    }

    // Много retries с высоким timeout
    if ((agentConfig.retries || 0) > 5) {
      warnings.push({
        field: 'retries',
        message: 'High retry count may cause long delays on failures.',
        type: 'performance'
      })
    }

    return { isValid: errors.length === 0, errors, warnings, suggestions }
  }

  /**
   * Проверка валидности PostgreSQL URL
   */
  private static isValidPostgresUrl(url: string): boolean {
    try {
      const parsed = new URL(url)
      return (
        parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:'
      )
    } catch {
      return false
    }
  }

  /**
   * Получить рекомендации для типа агента
   */
  static getRecommendationsForAgentType(
    agentType: string
  ): Partial<ExtendedAgentConfig> {
    const recommendations: Record<string, Partial<ExtendedAgentConfig>> = {
      basic_with_storage: {
        storage: { enabled: true, table_name: 'sessions', schema: 'public' },
        history: {
          add_history_to_messages: true,
          num_history_runs: 3,
          read_chat_history: true
        },
        add_datetime_to_instructions: true,
        markdown: true,
        stream: true
      },
      simple_no_storage: {
        markdown: true,
        stream: true
      },
      basic_assistant: {
        storage: { enabled: true, table_name: 'sessions' },
        history: { add_history_to_messages: true, num_history_runs: 3 },
        markdown: true,
        stream: true
      },
      smart_assistant: {
        storage: { enabled: true, table_name: 'sessions' },
        memory: { enabled: true, table_name: 'user_memories' },
        enable_agentic_memory: true,
        enable_user_memories: true,
        history: { add_history_to_messages: true, num_history_runs: 5 },
        markdown: true,
        stream: true
      },
      analyst_agent: {
        reasoning: { enabled: true, min_steps: 2, max_steps: 10 },
        structured_outputs: true,
        show_tool_calls: true,
        tool_call_limit: 20,
        history: { add_history_to_messages: true, num_history_runs: 10 },
        markdown: true
      },
      knowledge_agent: {
        knowledge: { enabled: true, type: 'url' },
        search_knowledge: true,
        add_references: true,
        references_format: 'json',
        storage: { enabled: true },
        history: { add_history_to_messages: true, num_history_runs: 5 }
      }
    }

    return recommendations[agentType] || {}
  }

  /**
   * Автоматическая настройка зависимостей
   */
  static autoConfigureDependencies(
    config: ExtendedAgentConfig
  ): ExtendedAgentConfig {
    const newConfig = { ...config }

    // Если включена память, автоматически включаем storage
    if (config.memory?.enabled || config.enable_agentic_memory) {
      if (!newConfig.storage) {
        newConfig.storage = { enabled: true, table_name: 'sessions' }
      }
      if (!newConfig.memory?.table_name) {
        if (!newConfig.memory) newConfig.memory = { enabled: true }
        newConfig.memory.table_name = 'user_memories'
      }
    }

    // Если включены знания, настраиваем поиск
    if (config.knowledge?.enabled) {
      if (newConfig.search_knowledge === undefined) {
        newConfig.search_knowledge = true
      }
      if (!newConfig.knowledge?.table_name) {
        if (!newConfig.knowledge) newConfig.knowledge = { enabled: true }
        newConfig.knowledge.table_name = 'knowledge'
      }
    }

    // Если включены инструменты, настраиваем отображение
    if (config.show_tool_calls === undefined && config.tool_call_limit) {
      newConfig.show_tool_calls = true
    }

    // Если включено рассуждение, настраиваем параметры
    if (config.reasoning?.enabled) {
      if (!newConfig.reasoning?.min_steps) {
        if (!newConfig.reasoning) newConfig.reasoning = { enabled: true }
        newConfig.reasoning.min_steps = 1
      }
      if (!newConfig.reasoning?.max_steps) {
        if (!newConfig.reasoning) newConfig.reasoning = { enabled: true }
        newConfig.reasoning.max_steps = 10
      }
    }

    return newConfig
  }
}
