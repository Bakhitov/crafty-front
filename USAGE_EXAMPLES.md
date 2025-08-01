# 🚀 **ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ УМНОГО КОНФИГУРАТОРА**

## 📋 **Быстрый старт**

### **1. Создание базового ассистента**

```typescript
// 1. Открыть AgentCreator
// 2. Нажать кнопку "Шаблоны"
// 3. Выбрать "Базовый ассистент"
// 4. Настроить под свои нужды
// 5. Нажать "Валидация" для проверки
// 6. Сохранить агента

// Результат: готовый агент за 2 минуты!
```

### **2. Создание агента-аналитика с рассуждениями**

```typescript
// Выбираем шаблон "Агент-аналитик"
const analystTemplate = {
  modelConfig: {
    provider: 'openai',
    id: 'gpt-4.1-2025-04-14', // Поддерживает reasoning
    temperature: 0.1, // Низкая для точности
    max_tokens: 8000
  },
  agentConfig: {
    reasoning: {
      enabled: true,
      min_steps: 2,
      max_steps: 10
    },
    structured_outputs: true,
    show_tool_calls: true,
    tool_call_limit: 20
  }
}
```

### **3. Корпоративный агент с базой знаний**

```typescript
// Выбираем шаблон "Агент с базой знаний"
const knowledgeAgent = {
  agentConfig: {
    knowledge: {
      enabled: true,
      type: 'url',
      urls: ['https://docs.company.com'],
      table_name: 'company_knowledge'
    },
    search_knowledge: true,
    add_references: true,
    references_format: 'json'
  }
}
```

## 🛡️ **Примеры валидации**

### **Ошибка совместимости модели**

```typescript
// Проблема: включили reasoning для модели без поддержки
{
  modelConfig: { id: 'gpt-4o' },  // ❌ Не поддерживает reasoning
  agentConfig: { reasoning: { enabled: true } }
}

// Валидатор покажет:
// ❌ Ошибка: reasoning.enabled
// Модель "gpt-4o" не поддерживает рассуждения.
// Используйте gpt-4.1-2025-04-14 или новее.

// 💡 Предложение: Переключиться на gpt-4.1-2025-04-14
```

### **Отсутствие зависимостей**

```typescript
// Проблема: включили память без storage
{
  agentConfig: {
    memory: { enabled: true },  // ❌ Требует storage
    // storage отсутствует
  }
}

// Валидатор покажет:
// ❌ Ошибка: memory.enabled
// Память требует включения хранилища для персистентности.

// 🔧 Исправление: Включить storage.enabled = true
```

### **Предупреждения производительности**

```typescript
// Потенциальная проблема
{
  agentConfig: {
    tool_call_limit: 50,  // ⚠️ Слишком много
    use_json_mode: true,
    stream: true  // ⚠️ Конфликт с JSON mode
  }
}

// Валидатор покажет:
// ⚠️ Предупреждение: tool_call_limit
// Высокий лимит может повлиять на производительность и стоимость.

// ⚠️ Предупреждение: use_json_mode
// JSON mode со стримингом может создавать неполные JSON объекты.
```

## 🎨 **Кастомизация шаблонов**

### **Модификация базового ассистента**

```typescript
// Берем базовый шаблон и расширяем
const customAssistant = {
  ...basicAssistantTemplate,

  // Добавляем память
  agentConfig: {
    ...basicAssistantTemplate.agentConfig,
    memory: {
      enabled: true,
      table_name: 'user_memories'
    },
    enable_user_memories: true,
    add_memory_references: true
  },

  // Настраиваем инструкции
  systemInstructions: [
    'Ты персональный ассистент с долговременной памятью',
    'Запоминай предпочтения пользователя',
    'Ссылайся на предыдущие разговоры'
  ]
}
```

### **Создание командного агента**

```typescript
// Шаблон "Лидер команды" + кастомизация
const teamLeader = {
  modelConfig: {
    provider: 'openai',
    id: 'gpt-4.1-2025-04-14',
    temperature: 0.4 // Баланс креативности и точности
  },
  agentConfig: {
    team: {
      enabled: true,
      data: {
        team_name: 'AI Development Team',
        roles: ['analyst', 'developer', 'tester']
      }
    },
    respond_directly: false, // Координирует, не отвечает напрямую
    add_transfer_instructions: true,
    show_tool_calls: true
  }
}
```

## 🔧 **Автоматические исправления**

### **Применение предложений**

```typescript
// Система предлагает оптимизации
const suggestions = [
  {
    field: 'temperature',
    message: 'Рекомендуется температура 0.1-0.3 для structured outputs',
    suggestedValue: 0.2,
    type: 'optimization'
  },
  {
    field: 'storage.enabled',
    message: 'Включить storage для функций памяти',
    suggestedValue: true,
    type: 'best_practice'
  }
]

// Применяем одним кликом через UI
// или программно:
suggestions.forEach((suggestion) => {
  if (suggestion.type === 'optimization') {
    applyConfigSuggestion(suggestion)
  }
})
```

## 📊 **Мониторинг и отладка**

### **Включение отладочного режима**

```typescript
const debugAgent = {
  agentConfig: {
    debug_mode: true, // Детальные логи
    monitoring: true, // Метрики производительности
    store_events: true, // Сохранение событий
    stream_intermediate_steps: true // Промежуточные шаги
  }
}
```

### **Анализ производительности**

```typescript
// Валидатор анализирует конфигурацию
const performanceAnalysis = {
  estimatedCost: 'medium', // На основе модели и лимитов
  complexity: 'advanced', // Сложность настройки
  dependencies: [
    // Требуемые ресурсы
    'PostgreSQL для сессий',
    'VectorDB для знаний',
    'Reasoning-capable модель'
  ]
}
```

## 🚀 **Продвинутые сценарии**

### **Мультимодальный агент**

```typescript
const multimodalAgent = {
  modelConfig: {
    provider: 'openai',
    id: 'gpt-4o', // Поддерживает изображения
    modalities: ['text', 'audio'],
    audio: {
      voice: 'nova',
      format: 'mp3'
    }
  },
  agentConfig: {
    show_tool_calls: true,
    markdown: true,
    add_datetime_to_instructions: true
  }
}
```

### **Workflow интеграция**

```typescript
const workflowAgent = {
  agentConfig: {
    app_id: 'crm-system',
    workflow_id: 'customer-support',
    workflow_session_state: {
      stage: 'initial_contact',
      priority: 'high'
    },
    add_context: true,
    context: {
      customer_tier: 'premium',
      issue_category: 'technical'
    }
  }
}
```

## 🎯 **Лучшие практики**

### **1. Выбор модели**

- **gpt-4.1-2025-04-14** - для reasoning и сложных задач
- **gpt-4.1-mini-2025-04-14** - для быстрых ответов
- **gpt-4o** - для мультимодальности
- **claude-3-5-sonnet** - для длинных контекстов

### **2. Настройка параметров**

- **temperature**: 0.1-0.3 для точности, 0.7-0.9 для креативности
- **tool_call_limit**: 5-15 для большинства задач
- **max_tokens**: 2000-4000 для обычных ответов

### **3. Управление зависимостями**

- Всегда включайте **storage** для персистентных агентов
- **user_id** обязателен для памяти и персонализации
- **VectorDB** необходим для базы знаний

### **4. Оптимизация производительности**

- Используйте **structured_outputs** вместо **use_json_mode**
- Ограничивайте **tool_call_limit** разумными значениями
- Включайте **stream** для лучшего UX

---

## 🎉 **Результат**

С умным конфигуратором вы можете:

- ✅ **Создать агента за 2 минуты** с помощью шаблонов
- ✅ **Избежать 90% ошибок** благодаря валидации
- ✅ **Получить профессиональный результат** без глубоких знаний Agno
- ✅ **Оптимизировать производительность** через рекомендации

**Умный конфигуратор превращает создание AI агентов в простой и надежный процесс!** 🚀
