# 🚀 **РУКОВОДСТВО ПО ИНТЕГРАЦИИ AGENT-API ДЛЯ ФРОНТЕНДА**

**Дата:** Декабрь 2024  
**Версия API:** v1  
**Проект:** Agent API - расширение для Agno фреймворка

---

## 📋 **СОДЕРЖАНИЕ**

1. [Введение](#введение)
2. [Архитектура API](#архитектура-api)
3. [Основные эндпоинты](#основные-эндпоинты)
4. [Структуры данных](#структуры-данных)
5. [Система стриминга](#система-стриминга)
6. [Мультимодальность](#мультимодальность)
7. [Управление сессиями](#управление-сессиями)
8. [Система кэширования](#система-кэширования)
9. [Обработка ошибок](#обработка-ошибок)
10. [Примеры интеграции](#примеры-интеграции)

---

## 🎯 **ВВЕДЕНИЕ**

Agent API - это мощный REST API для работы с AI агентами, построенный на базе Agno фреймворка. API предоставляет полную поддержку:

- **Гибридных агентов** - статические (предопределенные) и динамические (из БД)
- **Мультимодальности** - текст, изображения, аудио, видео, файлы
- **Real-time стриминга** - события в реальном времени
- **Управления сессиями** - память и история диалогов
- **Высокопроизводительного кэширования** - автоматическая оптимизация

### 🔗 **Базовый URL**

```
http://localhost:8000/v1
```

### 🔑 **Основные концепции**

- **Agent** - AI агент с определенными возможностями
- **Run** - выполнение задачи агентом
- **Session** - контекст диалога с агентом
- **Tool** - инструмент, доступный агенту
- **Event** - событие в процессе выполнения (стриминг)

---

## 🏗️ **АРХИТЕКТУРА API**

### **Структура эндпоинтов:**

```
/v1/
├── health              # Проверка состояния
├── agents/             # Управление агентами
│   ├── GET /           # Список агентов
│   ├── POST /{id}/runs # Запуск агента
│   ├── POST /{id}/runs/{run_id}/continue # Продолжение
│   ├── GET /{id}/sessions # Сессии
│   ├── GET /{id}/memories # Память
│   └── POST /{id}/knowledge/load # Загрузка знаний
├── tools/              # Управление инструментами
│   └── GET /           # Список инструментов
└── cache/              # Управление кэшем
    ├── GET /stats      # Статистика
    ├── POST /invalidate # Инвалидация
    └── POST /clear     # Очистка
```

### **Типы агентов:**

1. **Статические агенты** (предопределенные):

   - `web_agent` - веб-поиск и исследования
   - `agno_assist` - помощь с Agno фреймворком
   - `finance_agent` - финансовый анализ

2. **Динамические агенты** (из БД):
   - Создаются и настраиваются через админку
   - Поддерживают кэширование и продолжение выполнения
   - Мультитенантность (пользователи/организации)

---

## 🌐 **ОСНОВНЫЕ ЭНДПОИНТЫ**

### **1. Проверка состояния**

```http
GET /v1/health
```

**Ответ:**

```json
{
  "status": "success"
}
```

### **2. Список агентов**

```http
GET /v1/agents
```

**Ответ:**

```json
["web_agent", "agno_assist", "finance_agent", "my_custom_agent"]
```

### **3. Запуск агента**

```http
POST /v1/agents/{agent_id}/runs
Content-Type: multipart/form-data

message: "Привет! Как дела?"
stream: true
model: "gpt-4.1-mini-2025-04-14"
session_id: "session-123"
user_id: "user-456"
files: [file1.jpg, file2.pdf]
```

**Параметры:**

- `message` (обязательно) - сообщение пользователя
- `stream` (bool, по умолчанию true) - потоковый ответ
- `model` (string) - модель для использования
- `session_id` (string) - ID сессии для контекста
- `user_id` (string) - ID пользователя
- `files` (array) - загружаемые файлы

### **4. Продолжение выполнения**

```http
POST /v1/agents/{agent_id}/runs/{run_id}/continue
Content-Type: multipart/form-data

tools: "[]"
session_id: "session-123"
user_id: "user-456"
stream: true
```

### **5. Список инструментов**

```http
GET /v1/tools?type_filter=builtin&category=search&is_active=true
```

**Параметры:**

- `type_filter` - тип (builtin, mcp, custom)
- `category` - категория (search, files, etc.)
- `is_active` - только активные (по умолчанию true)

---

## 📊 **СТРУКТУРЫ ДАННЫХ**

### **Agent Response (Non-streaming)**

```typescript
interface AgentResponse {
  content: string // Основной ответ
  run_id?: string // ID выполнения
  session_id?: string // ID сессии
  created_at?: number // Timestamp
  images?: MediaItem[] // Изображения
  videos?: MediaItem[] // Видео
  audio?: MediaItem[] // Аудио
  response_audio?: string // Синтезированная речь
  metrics?: {
    input_tokens: number
    output_tokens: number
    total_cost: number
  }
}
```

### **Tool Structure**

```typescript
interface Tool {
  id: string
  name: string
  type: 'builtin' | 'mcp' | 'custom'
  description: string
  display_name: string
  category: string
  is_public: boolean
  is_active: boolean
}
```

### **Session Structure**

```typescript
interface Session {
  session_id: string
  session_name?: string
  created_at: string
  title: string
}
```

### **Memory Structure**

```typescript
interface Memory {
  memory: string
  topics: string[]
  last_updated?: string
}
```

---

## 🌊 **СИСТЕМА СТРИМИНГА**

### **События Agno**

API поддерживает полный набор событий Agno для real-time интерфейсов:

```typescript
type AgnoEvent =
  | 'RunStarted'
  | 'RunResponseContent' // Основной контент
  | 'RunCompleted'
  | 'ToolCallStarted'
  | 'ToolCallCompleted' // Результат инструмента
  | 'ReasoningStarted'
  | 'ReasoningStep'
  | 'RunError' // Ошибка выполнения
```

### **Структура события**

```typescript
interface StreamEvent {
  event: AgnoEvent
  content?: string
  agent_id?: string
  run_id?: string
  created_at: number

  // Медиа контент (в зависимости от события)
  images?: MediaItem[]
  videos?: MediaItem[]
  audio?: MediaItem[]
  response_audio?: string

  // Информация об инструменте (для ToolCall событий)
  tool_name?: string
  tool_input?: any
  tool_output?: any

  // Ошибки
  error_type?: 'NotFound' | 'RuntimeError' | 'General'
}
```

### **Обработка стрима на фронтенде**

```javascript
// Создание EventSource для стриминга
const eventSource = new EventSource('/v1/agents/web_agent/runs', {
  method: 'POST',
  body: formData
})

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)

  switch (data.event) {
    case 'RunStarted':
      console.log('Агент начал работу')
      break

    case 'RunResponseContent':
      // Добавляем контент в UI
      appendContent(data.content)

      // Обрабатываем медиа
      if (data.images) {
        displayImages(data.images)
      }
      break

    case 'ToolCallStarted':
      showToolIndicator(data.tool_name)
      break

    case 'ToolCallCompleted':
      hideToolIndicator()
      if (data.tool_output) {
        displayToolResult(data.tool_output)
      }
      break

    case 'RunCompleted':
      console.log('Выполнение завершено')
      eventSource.close()
      break

    case 'RunError':
      console.error('Ошибка:', data.content)
      showError(data.content)
      break
  }
}
```

---

## 🎭 **МУЛЬТИМОДАЛЬНОСТЬ**

### **Поддерживаемые форматы файлов**

#### **Изображения:**

- JPEG, PNG, GIF, WebP
- Автоматическое распознавание и анализ
- Поддержка в стриминге

#### **Документы:**

- PDF - нативная обработка Agno
- CSV - конвертация в текст
- TXT, JSON - прямая обработка

#### **Аудио и видео:**

- MP3, WAV, MP4, MOV
- Транскрипция и анализ содержимого

### **Загрузка файлов**

```javascript
// Создание FormData с файлами
const formData = new FormData()
formData.append('message', 'Проанализируй эти файлы')
formData.append('files', imageFile)
formData.append('files', pdfFile)
formData.append('stream', 'true')

fetch('/v1/agents/web_agent/runs', {
  method: 'POST',
  body: formData
})
```

### **Медиа в ответах**

```typescript
interface MediaItem {
  url?: string // URL для скачивания
  content?: string // Base64 контент
  content_type: string // MIME тип
  name?: string // Имя файла
  size?: number // Размер в байтах
}
```

---

## 💾 **УПРАВЛЕНИЕ СЕССИЯМИ**

### **Получение сессий**

```http
GET /v1/agents/{agent_id}/sessions?user_id=user-123
```

### **Конкретная сессия**

```http
GET /v1/agents/{agent_id}/sessions/{session_id}?user_id=user-123
```

### **Переименование сессии**

```http
POST /v1/agents/{agent_id}/sessions/{session_id}/rename
Content-Type: application/json

{
  "name": "Новое название сессии",
  "user_id": "user-123"
}
```

### **Удаление сессии**

```http
DELETE /v1/agents/{agent_id}/sessions/{session_id}?user_id=user-123
```

### **Получение памяти**

```http
GET /v1/agents/{agent_id}/memories?user_id=user-123
```

---

## ⚡ **СИСТЕМА КЭШИРОВАНИЯ**

### **Статистика кэша**

```http
GET /v1/cache/stats
```

**Ответ:**

```json
{
  "agents_cache": {
    "total": 5,
    "active": 3,
    "expired": 2,
    "ttl_seconds": 3600
  },
  "tools_cache": {
    "total": 12,
    "active": 10,
    "expired": 2,
    "ttl_seconds": 7200
  },
  "total_cached_objects": 17
}
```

### **Инвалидация кэша**

```http
POST /v1/cache/invalidate
Content-Type: application/json

{
  "agent_id": "my_custom_agent"  // или user_id, tool_id
}
```

### **Полная очистка**

```http
POST /v1/cache/clear
```

---

## ❌ **ОБРАБОТКА ОШИБОК**

### **HTTP коды ошибок:**

- `400 Bad Request` - неверные параметры
- `404 Not Found` - агент/сессия не найдены
- `422 Validation Error` - ошибки валидации
- `500 Internal Server Error` - внутренние ошибки
- `501 Not Implemented` - функция не поддерживается

### **Структура ошибки:**

```json
{
  "detail": "Agent not found",
  "status_code": 404
}
```

### **Ошибки в стриминге:**

```json
{
  "event": "RunError",
  "content": "Continue run failed: Run not found",
  "error_type": "NotFound",
  "created_at": 1703123456
}
```

---

## 💻 **ПРИМЕРЫ ИНТЕГРАЦИИ**

### **React Hook для агента**

```typescript
import { useState, useCallback } from 'react'

interface UseAgentOptions {
  agentId: string
  userId?: string
  sessionId?: string
}

export const useAgent = ({ agentId, userId, sessionId }: UseAgentOptions) => {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (message: string, files?: File[]) => {
      setIsLoading(true)
      setError(null)
      setResponse('')

      const formData = new FormData()
      formData.append('message', message)
      formData.append('stream', 'true')

      if (userId) formData.append('user_id', userId)
      if (sessionId) formData.append('session_id', sessionId)

      files?.forEach((file) => {
        formData.append('files', file)
      })

      try {
        const response = await fetch(`/v1/agents/${agentId}/runs`, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) return

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = new TextDecoder().decode(value)
          const lines = chunk.split('\n').filter(Boolean)

          for (const line of lines) {
            try {
              const event = JSON.parse(line)

              if (event.event === 'RunResponseContent') {
                setResponse((prev) => prev + event.content)
              } else if (event.event === 'RunError') {
                setError(event.content)
              }
            } catch (e) {
              // Игнорируем невалидный JSON
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    },
    [agentId, userId, sessionId]
  )

  return { sendMessage, isLoading, response, error }
}
```

### **Vue Composable**

```typescript
import { ref, computed } from 'vue'

export const useAgentChat = (agentId: string) => {
  const messages = ref<
    Array<{
      id: string
      content: string
      role: 'user' | 'assistant'
      timestamp: Date
      files?: File[]
    }>
  >([])

  const isLoading = ref(false)
  const currentResponse = ref('')

  const sendMessage = async (content: string, files?: File[]) => {
    const userMessage = {
      id: Date.now().toString(),
      content,
      role: 'user' as const,
      timestamp: new Date(),
      files
    }

    messages.value.push(userMessage)
    isLoading.value = true
    currentResponse.value = ''

    const formData = new FormData()
    formData.append('message', content)
    formData.append('stream', 'true')

    files?.forEach((file) => {
      formData.append('files', file)
    })

    try {
      const response = await fetch(`/v1/agents/${agentId}/runs`, {
        method: 'POST',
        body: formData
      })

      const reader = response.body?.getReader()
      if (!reader) return

      let assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant' as const,
        timestamp: new Date()
      }

      messages.value.push(assistantMessage)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n').filter(Boolean)

        for (const line of lines) {
          try {
            const event = JSON.parse(line)

            if (event.event === 'RunResponseContent') {
              assistantMessage.content += event.content
              currentResponse.value = assistantMessage.content
            }
          } catch (e) {
            // Игнорируем невалидный JSON
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      isLoading.value = false
      currentResponse.value = ''
    }
  }

  return {
    messages: computed(() => messages.value),
    isLoading: computed(() => isLoading.value),
    currentResponse: computed(() => currentResponse.value),
    sendMessage
  }
}
```

### **Vanilla JavaScript класс**

```javascript
class AgentAPI {
  constructor(baseUrl = '/v1') {
    this.baseUrl = baseUrl
  }

  async getAgents() {
    const response = await fetch(`${this.baseUrl}/agents`)
    return response.json()
  }

  async getTools(filters = {}) {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${this.baseUrl}/tools?${params}`)
    return response.json()
  }

  async *streamChat(agentId, message, options = {}) {
    const formData = new FormData()
    formData.append('message', message)
    formData.append('stream', 'true')

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'files' && Array.isArray(value)) {
          value.forEach((file) => formData.append('files', file))
        } else {
          formData.append(key, value.toString())
        }
      }
    })

    const response = await fetch(`${this.baseUrl}/agents/${agentId}/runs`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const reader = response.body.getReader()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n').filter(Boolean)

        for (const line of lines) {
          try {
            const event = JSON.parse(line)
            yield event
          } catch (e) {
            // Игнорируем невалидный JSON
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async getSessions(agentId, userId) {
    const params = userId ? `?user_id=${userId}` : ''
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/sessions${params}`
    )
    return response.json()
  }

  async getMemories(agentId, userId) {
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/memories?user_id=${userId}`
    )
    return response.json()
  }

  async getCacheStats() {
    const response = await fetch(`${this.baseUrl}/cache/stats`)
    return response.json()
  }
}

// Использование
const api = new AgentAPI()

// Получение списка агентов
const agents = await api.getAgents()

// Стриминг чата
for await (const event of api.streamChat('web_agent', 'Привет!', {
  user_id: 'user-123',
  session_id: 'session-456'
})) {
  if (event.event === 'RunResponseContent') {
    console.log('Новый контент:', event.content)
  }
}
```

---

---

**🎯 Этот документ содержит всю необходимую информацию для интеграции Agent API с любым фронтенд фреймворком. Для дополнительных вопросов обращайтесь к API_ENDPOINT_TEST.md для детальных примеров тестирования.**
