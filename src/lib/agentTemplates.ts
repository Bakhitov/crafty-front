import { ExtendedAgentConfig, ModelConfig } from '@/types/agentConfig'

// Интерфейс шаблона агента
export interface AgentTemplate {
  id: string
  name: string
  description: string
  category: 'assistant' | 'analyst' | 'specialist' | 'team'
  icon: string
  modelConfig: ModelConfig
  agentConfig: ExtendedAgentConfig
  systemInstructions: string[]
  dependencies: string[]
  estimatedCost: 'low' | 'medium' | 'high'
  complexity: 'beginner' | 'intermediate' | 'advanced'
  useCase: string
  tags: string[]
}

// Коллекция шаблонов агентов
export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'basic_assistant',
    name: 'Базовый ассистент',
    description: 'Простой помощник для общих задач и вопросов',
    category: 'assistant',
    icon: 'user-circle',
    modelConfig: {
      provider: 'openai',
      id: 'gpt-4.1-mini-2025-04-14',
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 0.9
    },
    agentConfig: {
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
      markdown: true,
      add_datetime_to_instructions: true,
      stream: true,
      debug_mode: false
    },
    systemInstructions: [
      'Ты полезный ассистент, который помогает пользователям с различными задачами',
      'Отвечай кратко и по делу',
      'Используй русский язык для общения',
      'Будь вежливым и профессиональным'
    ],
    dependencies: ['PostgreSQL для сессий'],
    estimatedCost: 'low',
    complexity: 'beginner',
    useCase: 'Общие вопросы, базовая помощь, простые задачи',
    tags: ['базовый', 'универсальный', 'начинающий']
  },

  {
    id: 'smart_assistant',
    name: 'Умный ассистент с памятью',
    description: 'Ассистент с долговременной памятью и персонализацией',
    category: 'assistant',
    icon: 'brain',
    modelConfig: {
      provider: 'openai',
      id: 'gpt-4.1-2025-04-14',
      temperature: 0.3,
      max_tokens: 4000,
      top_p: 0.9
    },
    agentConfig: {
      storage: {
        enabled: true,
        table_name: 'sessions',
        schema: 'public'
      },
      memory: {
        enabled: true,
        table_name: 'user_memories',
        delete_memories: true,
        clear_memories: true
      },
      enable_agentic_memory: true,
      enable_user_memories: true,
      add_memory_references: true,
      enable_session_summaries: true,
      add_session_summary_references: true,
      history: {
        add_history_to_messages: true,
        num_history_runs: 5,
        read_chat_history: true
      },
      search_previous_sessions_history: true,
      num_history_sessions: 3,
      markdown: true,
      add_datetime_to_instructions: true,
      add_state_in_messages: true,
      stream: true
    },
    systemInstructions: [
      'Ты умный ассистент с доступом к долговременной памяти',
      'Используй свою память для персонализации ответов',
      'Запоминай важную информацию о пользователе и его предпочтениях',
      'Ссылайся на предыдущие разговоры когда это уместно'
    ],
    dependencies: [
      'PostgreSQL для сессий',
      'PostgreSQL для памяти',
      'user_id обязателен'
    ],
    estimatedCost: 'medium',
    complexity: 'intermediate',
    useCase:
      'Персональный помощник, долгосрочные проекты, обучение предпочтений',
    tags: ['память', 'персонализация', 'умный', 'долгосрочный']
  },

  {
    id: 'analyst_agent',
    name: 'Агент-аналитик',
    description:
      'Специализированный агент для сложного анализа с пошаговым рассуждением',
    category: 'analyst',
    icon: 'chart-bar',
    modelConfig: {
      provider: 'openai',
      id: 'gpt-4.1-2025-04-14',
      temperature: 0.1,
      max_tokens: 8000,
      top_p: 0.95
    },
    agentConfig: {
      storage: {
        enabled: true,
        table_name: 'sessions',
        schema: 'public'
      },
      reasoning: {
        enabled: true,
        model_id: 'gpt-4.1-2025-04-14',
        min_steps: 2,
        max_steps: 10
      },
      parser: {
        enabled: true,
        model_id: 'gpt-4.1-mini-2025-04-14'
      },
      history: {
        add_history_to_messages: true,
        num_history_runs: 10,
        read_chat_history: true
      },
      structured_outputs: true,
      show_tool_calls: true,
      tool_call_limit: 20,
      markdown: true,
      add_datetime_to_instructions: true,
      stream: true,
      stream_intermediate_steps: true
    },
    systemInstructions: [
      'Ты эксперт-аналитик данных с глубокими знаниями статистики и анализа',
      'Используй пошаговое рассуждение для сложных задач',
      'Всегда показывай логику своих выводов',
      'Предоставляй структурированные ответы с четкими выводами',
      'Используй визуализацию данных когда это возможно'
    ],
    dependencies: ['PostgreSQL для сессий', 'Reasoning-capable модель'],
    estimatedCost: 'high',
    complexity: 'advanced',
    useCase:
      'Анализ данных, исследования, сложные вычисления, бизнес-аналитика',
    tags: ['анализ', 'рассуждение', 'данные', 'экспертный', 'структурированный']
  },

  {
    id: 'knowledge_agent',
    name: 'Агент с базой знаний',
    description: 'Агент с доступом к корпоративной базе знаний (RAG)',
    category: 'specialist',
    icon: 'book-open',
    modelConfig: {
      provider: 'openai',
      id: 'gpt-4.1-mini-2025-04-14',
      temperature: 0.2,
      max_tokens: 6000,
      top_p: 0.9
    },
    agentConfig: {
      storage: {
        enabled: true,
        table_name: 'sessions',
        schema: 'public'
      },
      knowledge: {
        enabled: true,
        type: 'url',
        urls: [],
        table_name: 'knowledge'
      },
      search_knowledge: true,
      add_references: true,
      references_format: 'json',
      enable_agentic_knowledge_filters: true,
      history: {
        add_history_to_messages: true,
        num_history_runs: 5,
        read_chat_history: true
      },
      markdown: true,
      add_datetime_to_instructions: true,
      stream: true
    },
    systemInstructions: [
      'Ты эксперт с доступом к корпоративной базе знаний',
      'При поиске информации всегда ссылайся на источники',
      'Используй только проверенную информацию из базы знаний',
      'Если информации нет в базе, честно об этом сообщи'
    ],
    dependencies: [
      'PostgreSQL для сессий',
      'VectorDB для знаний',
      'Embedder',
      'Документы для индексации'
    ],
    estimatedCost: 'medium',
    complexity: 'intermediate',
    useCase: 'Корпоративная поддержка, FAQ, документация, обучение',
    tags: ['знания', 'RAG', 'документы', 'поиск', 'корпоративный']
  },

  {
    id: 'tool_master',
    name: 'Мастер инструментов',
    description: 'Агент с широким набором инструментов для автоматизации задач',
    category: 'specialist',
    icon: 'wrench-screwdriver',
    modelConfig: {
      provider: 'openai',
      id: 'gpt-4.1-2025-04-14',
      temperature: 0.3,
      max_tokens: 6000,
      top_p: 0.9
    },
    agentConfig: {
      storage: {
        enabled: true,
        table_name: 'sessions',
        schema: 'public'
      },
      show_tool_calls: true,
      tool_call_limit: 15,
      tool_choice: 'auto',
      read_tool_call_history: true,
      history: {
        add_history_to_messages: true,
        num_history_runs: 5,
        read_chat_history: true
      },
      markdown: true,
      add_datetime_to_instructions: true,
      stream: true
    },
    systemInstructions: [
      'Ты эксперт по автоматизации с доступом к множеству инструментов',
      'Эффективно используй доступные инструменты для решения задач',
      'Объясняй какие инструменты используешь и почему',
      'Всегда проверяй результаты работы инструментов'
    ],
    dependencies: [
      'PostgreSQL для сессий',
      'Активные инструменты',
      'Tool-capable модель'
    ],
    estimatedCost: 'medium',
    complexity: 'intermediate',
    useCase: 'Автоматизация, интеграции, API взаимодействие, вычисления',
    tags: ['инструменты', 'автоматизация', 'API', 'интеграция', 'вычисления']
  },

  {
    id: 'team_leader',
    name: 'Лидер команды',
    description: 'Координирующий агент для работы в команде агентов',
    category: 'team',
    icon: 'users',
    modelConfig: {
      provider: 'openai',
      id: 'gpt-4.1-2025-04-14',
      temperature: 0.4,
      max_tokens: 4000,
      top_p: 0.9
    },
    agentConfig: {
      storage: {
        enabled: true,
        table_name: 'sessions',
        schema: 'public'
      },
      team: {
        enabled: true,
        data: { team_name: 'AI Team' }
      },
      respond_directly: false,
      add_transfer_instructions: true,
      team_response_separator: '\n---\n',
      show_tool_calls: true,
      tool_call_limit: 10,
      history: {
        add_history_to_messages: true,
        num_history_runs: 5,
        read_chat_history: true
      },
      markdown: true,
      add_datetime_to_instructions: true,
      stream: true
    },
    systemInstructions: [
      'Ты лидер команды AI агентов',
      'Координируй работу других агентов для решения сложных задач',
      'Делегируй задачи подходящим специалистам',
      'Собирай результаты и предоставляй итоговый ответ'
    ],
    dependencies: [
      'PostgreSQL для сессий',
      'Другие агенты в команде',
      'Team coordination система'
    ],
    estimatedCost: 'high',
    complexity: 'advanced',
    useCase:
      'Сложные проекты, мультидисциплинарные задачи, координация команды',
    tags: [
      'команда',
      'координация',
      'лидерство',
      'делегирование',
      'сложные задачи'
    ]
  },

  {
    id: 'creative_writer',
    name: 'Креативный писатель',
    description:
      'Специализированный агент для создания контента и творческого письма',
    category: 'specialist',
    icon: 'pencil',
    modelConfig: {
      provider: 'openai',
      id: 'gpt-4.1-2025-04-14',
      temperature: 0.8,
      max_tokens: 8000,
      top_p: 0.95,
      frequency_penalty: 0.3,
      presence_penalty: 0.2
    },
    agentConfig: {
      storage: {
        enabled: true,
        table_name: 'sessions',
        schema: 'public'
      },
      history: {
        add_history_to_messages: true,
        num_history_runs: 7,
        read_chat_history: true
      },
      markdown: true,
      add_datetime_to_instructions: true,
      stream: true,
      context: {
        writing_style: 'creative',
        target_audience: 'general',
        content_type: 'varied'
      },
      add_context: true
    },
    systemInstructions: [
      'Ты талантливый креативный писатель с богатым воображением',
      'Создавай увлекательный и оригинальный контент',
      'Адаптируй стиль письма под задачу и аудиторию',
      'Используй яркие образы и эмоциональные описания',
      'Всегда проверяй грамматику и стилистику'
    ],
    dependencies: ['PostgreSQL для сессий'],
    estimatedCost: 'medium',
    complexity: 'intermediate',
    useCase:
      'Создание контента, копирайтинг, сторителлинг, маркетинговые тексты',
    tags: ['креатив', 'письмо', 'контент', 'сторителлинг', 'маркетинг']
  },

  {
    id: 'code_reviewer',
    name: 'Ревьюер кода',
    description:
      'Специализированный агент для анализа и ревью программного кода',
    category: 'specialist',
    icon: 'code-bracket',
    modelConfig: {
      provider: 'openai',
      id: 'gpt-4.1-2025-04-14',
      temperature: 0.1,
      max_tokens: 8000,
      top_p: 0.9
    },
    agentConfig: {
      storage: {
        enabled: true,
        table_name: 'sessions',
        schema: 'public'
      },
      structured_outputs: true,
      show_tool_calls: true,
      tool_call_limit: 10,
      history: {
        add_history_to_messages: true,
        num_history_runs: 8,
        read_chat_history: true
      },
      markdown: true,
      add_datetime_to_instructions: true,
      context: {
        review_focus: 'quality',
        languages: 'multiple',
        standards: 'industry'
      },
      add_context: true
    },
    systemInstructions: [
      'Ты опытный senior разработчик и эксперт по ревью кода',
      'Анализируй код на предмет качества, безопасности и производительности',
      'Предоставляй конструктивную обратную связь с конкретными предложениями',
      'Следуй лучшим практикам и стандартам индустрии',
      'Объясняй свои рекомендации с примерами'
    ],
    dependencies: ['PostgreSQL для сессий', 'Code analysis tools'],
    estimatedCost: 'medium',
    complexity: 'advanced',
    useCase:
      'Ревью кода, анализ качества, обучение программированию, рефакторинг',
    tags: ['код', 'ревью', 'качество', 'программирование', 'анализ', 'обучение']
  }
]

// Функции для работы с шаблонами
export class AgentTemplateManager {
  /**
   * Получить все шаблоны
   */
  static getAllTemplates(): AgentTemplate[] {
    return AGENT_TEMPLATES
  }

  /**
   * Получить шаблоны по категории
   */
  static getTemplatesByCategory(
    category: AgentTemplate['category']
  ): AgentTemplate[] {
    return AGENT_TEMPLATES.filter((template) => template.category === category)
  }

  /**
   * Получить шаблон по ID
   */
  static getTemplateById(id: string): AgentTemplate | undefined {
    return AGENT_TEMPLATES.find((template) => template.id === id)
  }

  /**
   * Поиск шаблонов по тегам
   */
  static searchTemplatesByTags(tags: string[]): AgentTemplate[] {
    return AGENT_TEMPLATES.filter((template) =>
      template.tags.some((tag) =>
        tags.some((searchTag) =>
          tag.toLowerCase().includes(searchTag.toLowerCase())
        )
      )
    )
  }

  /**
   * Получить шаблоны по сложности
   */
  static getTemplatesByComplexity(
    complexity: AgentTemplate['complexity']
  ): AgentTemplate[] {
    return AGENT_TEMPLATES.filter(
      (template) => template.complexity === complexity
    )
  }

  /**
   * Получить шаблоны по стоимости
   */
  static getTemplatesByCost(
    cost: AgentTemplate['estimatedCost']
  ): AgentTemplate[] {
    return AGENT_TEMPLATES.filter((template) => template.estimatedCost === cost)
  }

  /**
   * Применить шаблон к конфигурации агента
   */
  static applyTemplate(templateId: string): {
    modelConfig: ModelConfig
    agentConfig: ExtendedAgentConfig
    systemInstructions: string[]
    name: string
    description: string
  } | null {
    const template = this.getTemplateById(templateId)
    if (!template) return null

    return {
      modelConfig: { ...template.modelConfig },
      agentConfig: JSON.parse(JSON.stringify(template.agentConfig)), // Deep copy
      systemInstructions: [...template.systemInstructions],
      name: template.name,
      description: template.description
    }
  }

  /**
   * Получить рекомендуемые шаблоны для новичков
   */
  static getBeginnerTemplates(): AgentTemplate[] {
    return this.getTemplatesByComplexity('beginner')
  }

  /**
   * Получить популярные шаблоны (по использованию)
   */
  static getPopularTemplates(): AgentTemplate[] {
    // В реальном приложении здесь была бы статистика использования
    return [
      this.getTemplateById('basic_assistant')!,
      this.getTemplateById('smart_assistant')!,
      this.getTemplateById('analyst_agent')!,
      this.getTemplateById('knowledge_agent')!
    ].filter(Boolean)
  }

  /**
   * Получить категории шаблонов
   */
  static getCategories(): {
    id: AgentTemplate['category']
    name: string
    description: string
  }[] {
    return [
      {
        id: 'assistant',
        name: 'Ассистенты',
        description: 'Универсальные помощники для общих задач'
      },
      {
        id: 'analyst',
        name: 'Аналитики',
        description: 'Специализированные агенты для анализа данных'
      },
      {
        id: 'specialist',
        name: 'Специалисты',
        description: 'Узкоспециализированные агенты для конкретных задач'
      },
      {
        id: 'team',
        name: 'Командные',
        description: 'Агенты для работы в команде и координации'
      }
    ]
  }
}
