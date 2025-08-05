// Примеры создания агентов для базовых кейсов
// Соответствует документации из agent_template.md

export const BASIC_AGENT_EXAMPLES = {
  // Кейс 1: Базовый агент с хранилищем (storage=true по умолчанию)
  withStorage: {
    name: 'Мой помощник',
    description: 'Персональный ассистент с памятью',
    system_instructions: ['Ты полезный ассистент'],
    model_config: {
      provider: 'openai',
      id: 'gpt-4.1-mini-2025-04-14',
      temperature: 0.7,
      max_tokens: 2000
    },
    agent_config: {
      // Базовые настройки storage=true (дефолтное)
      storage: {
        enabled: true,
        table_name: 'sessions',
        schema: 'public'
      },
      history: {
        add_history_to_messages: true,
        num_history_runs: 3,
        read_chat_history: true
      },
      add_datetime_to_instructions: true,
      markdown: true,
      stream: true
    },
    is_active: true,
    is_public: false
  },

  // Кейс 2: Простой агент без хранилища (storage=false)
  withoutStorage: {
    name: 'Быстрый помощник',
    description: 'Простой агент для разовых запросов',
    system_instructions: ['Ты полезный ассистент'],
    model_config: {
      provider: 'openai',
      id: 'gpt-4.1-mini-2025-04-14',
      temperature: 0.7,
      max_tokens: 2000
    },
    agent_config: {
      // Базовые настройки storage=false
      markdown: true,
      stream: true
      // Без storage, history, memory - минимальная конфигурация
    },
    is_active: true,
    is_public: false
  }
} as const

// Функция для применения примера к форме агента
export const applyAgentExample = (
  example: keyof typeof BASIC_AGENT_EXAMPLES
) => {
  return BASIC_AGENT_EXAMPLES[example]
}

// Валидация соответствия документации
export const validateAgentExample = (example: Record<string, unknown>) => {
  const required = [
    'name',
    'system_instructions',
    'model_config',
    'agent_config'
  ]
  const missing = required.filter((field) => !example[field])

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`)
  }

  // Проверяем модель
  const modelConfig = example.model_config as { provider?: string; id?: string }
  if (!modelConfig.provider || !modelConfig.id) {
    throw new Error('Model config must have provider and id')
  }

  // Проверяем storage логику
  const agentConfig = example.agent_config as {
    storage?: { enabled?: boolean }
    history?: { add_history_to_messages?: boolean }
  }
  const hasStorage = agentConfig.storage?.enabled
  const hasHistory = agentConfig.history?.add_history_to_messages

  if (hasHistory && !hasStorage) {
    throw new Error('History requires storage to be enabled')
  }

  return true
}

// Утилиты для генерации agent_id
export const generateAgentId = (name: string) => {
  const timestamp = Date.now().toString(36)
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 20)

  return `${cleanName}-${timestamp}`
}
