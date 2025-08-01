# 📚 **AGENT-API ДОКУМЕНТАЦИЯ ДЛЯ ФРОНТЕНДА**

Техническая документация REST API для интеграции с Agent-API проектом.

---

## 🌐 **БАЗОВАЯ ИНФОРМАЦИЯ**

**Base URL:** `http://localhost:8000/v1`  
**Content-Type:** `multipart/form-data` для запросов с файлами, `application/json` для остальных  
**Методы:** GET, POST, DELETE

---

## 📋 **ПОЛНЫЙ СПИСОК ЭНДПОИНТОВ**

### **Health & System**

- `GET /health` - проверка состояния API

### **Agents**

- `GET /agents` - список всех агентов
- `POST /agents/{agent_id}/runs` - запуск агента
- `POST /agents/{agent_id}/runs/{run_id}/continue` - продолжение выполнения
- `GET /agents/{agent_id}/sessions` - список сессий агента
- `GET /agents/{agent_id}/sessions/{session_id}` - конкретная сессия
- `POST /agents/{agent_id}/sessions/{session_id}/rename` - переименование сессии
- `DELETE /agents/{agent_id}/sessions/{session_id}` - удаление сессии
- `GET /agents/{agent_id}/memories` - память агента
- `POST /agents/{agent_id}/knowledge/load` - загрузка базы знаний
- `GET /agents/tool-hooks` - список доступных tool hooks
- `GET /agents/response-models` - список доступных response models
- `GET /agents/response-models/{model_name}/schema` - JSON Schema модели
- `GET /agents/teams/cache-stats` - статистика кэша команд
- `DELETE /agents/teams/cache` - очистка кэша команд

### **Tools**

- `GET /tools` - список инструментов

### **Cache**

- `GET /cache/stats` - статистика кэша
- `POST /cache/invalidate` - инвалидация кэша
- `POST /cache/clear` - полная очистка кэша

---

## 🔍 **ДЕТАЛЬНОЕ ОПИСАНИЕ ЭНДПОИНТОВ**

### **1. Health Check**

```http
GET /v1/health
```

**Ответ:**

```json
{
  "status": "success"
}
```

**HTTP коды:** `200 OK`

---

### **2. Список агентов**

```http
GET /v1/agents
```

**Ответ:**

```json
["web_agent", "agno_assist", "finance_agent", "custom_agent_1"]
```

**HTTP коды:** `200 OK`

---

### **3. Запуск агента**

```http
POST /v1/agents/{agent_id}/runs
Content-Type: multipart/form-data
```

**Параметры формы:**

```
message: string (обязательно) - сообщение пользователя
stream: boolean (по умолчанию true) - потоковый ответ
model: string (по умолчанию "gpt-4.1-mini-2025-04-14") - модель
session_id: string (опционально) - ID сессии
user_id: string (опционально) - ID пользователя
files: File[] (опционально) - массив файлов
```

**Пример запроса:**

```javascript
const formData = new FormData()
formData.append('message', 'Привет! Как дела?')
formData.append('stream', 'true')
formData.append('model', 'gpt-4.1-mini-2025-04-14')
formData.append('session_id', 'session-123')
formData.append('user_id', 'user-456')
formData.append('files', fileInput.files[0])

fetch('/v1/agents/web_agent/runs', {
  method: 'POST',
  body: formData
})
```

**Ответ (stream: false):**

```json
{
  "content": "Привет! У меня все отлично, спасибо!",
  "run_id": "run_abc123",
  "session_id": "session-123",
  "created_at": 1703123456,
  "images": [
    {
      "url": "/media/image123.jpg",
      "content_type": "image/jpeg",
      "name": "generated_image.jpg",
      "size": 245760
    }
  ],
  "metrics": {
    "input_tokens": 15,
    "output_tokens": 42,
    "total_cost": 0.0012
  }
}
```

**Ответ (stream: true):**

```
data: {"event": "RunStarted", "run_id": "run_abc123", "created_at": 1703123456}

data: {"event": "RunResponseContent", "content": "Привет! У меня все", "created_at": 1703123456}

data: {"event": "RunResponseContent", "content": " отлично, спасибо!", "created_at": 1703123456}

data: {"event": "ToolCallStarted", "tool_name": "duckduckgo_search", "created_at": 1703123456}

data: {"event": "ToolCallCompleted", "tool_name": "duckduckgo_search", "tool_output": {...}, "created_at": 1703123456}

data: {"event": "RunCompleted", "run_id": "run_abc123", "created_at": 1703123456}
```

**HTTP коды:** `200 OK`, `404 Not Found` (агент не найден)

---

### **4. Продолжение выполнения**

```http
POST /v1/agents/{agent_id}/runs/{run_id}/continue
Content-Type: multipart/form-data
```

**Параметры формы:**

```
tools: string (обязательно) - JSON строка с инструментами
session_id: string (опционально) - ID сессии
user_id: string (опционально) - ID пользователя
stream: boolean (по умолчанию true) - потоковый ответ
```

**Пример запроса:**

```javascript
const formData = new FormData()
formData.append('tools', '[]') // или JSON с инструментами
formData.append('session_id', 'session-123')
formData.append('user_id', 'user-456')
formData.append('stream', 'true')

fetch('/v1/agents/web_agent/runs/run_abc123/continue', {
  method: 'POST',
  body: formData
})
```

**Ответ:** Аналогично запуску агента (стрим или полный ответ)

**HTTP коды:** `200 OK`, `404 Not Found` (run не найден), `400 Bad Request` (неверный JSON)

---

### **5. Список сессий агента**

```http
GET /v1/agents/{agent_id}/sessions?user_id=user-123
```

**Query параметры:**

- `user_id` (опционально) - фильтр по пользователю

**Ответ:**

```json
[
  {
    "session_id": "session-123",
    "session_name": "Диалог о погоде",
    "created_at": "2024-12-01T10:30:00Z",
    "title": "Session abc12345"
  },
  {
    "session_id": "session-456",
    "session_name": null,
    "created_at": "2024-12-01T11:15:00Z",
    "title": "Session def67890"
  }
]
```

**HTTP коды:** `200 OK`, `404 Not Found` (агент не найден)

---

### **6. Конкретная сессия**

```http
GET /v1/agents/{agent_id}/sessions/{session_id}?user_id=user-123
```

**Query параметры:**

- `user_id` (опционально) - ID пользователя

**Ответ:**

```json
{
  "session_id": "session-123",
  "agent_id": "web_agent",
  "user_id": "user-123",
  "created_at": "2024-12-01T10:30:00Z",
  "updated_at": "2024-12-01T10:35:00Z",
  "session_data": {
    "session_name": "Диалог о погоде",
    "messages_count": 5
  },
  "runs": [
    {
      "run_id": "run_abc123",
      "created_at": "2024-12-01T10:30:00Z",
      "message": "Какая погода сегодня?",
      "response": "Сегодня солнечно, +20°C"
    }
  ]
}
```

**HTTP коды:** `200 OK`, `404 Not Found` (сессия не найдена)

---

### **7. Переименование сессии**

```http
POST /v1/agents/{agent_id}/sessions/{session_id}/rename
Content-Type: application/json
```

**Тело запроса:**

```json
{
  "name": "Новое название сессии",
  "user_id": "user-123"
}
```

**Ответ:**

```json
{
  "message": "Successfully renamed session session-123"
}
```

**HTTP коды:** `200 OK`, `404 Not Found`, `500 Internal Server Error`

---

### **8. Удаление сессии**

```http
DELETE /v1/agents/{agent_id}/sessions/{session_id}?user_id=user-123
```

**Query параметры:**

- `user_id` (опционально) - ID пользователя

**Ответ:**

```json
{
  "message": "Successfully deleted session session-123"
}
```

**HTTP коды:** `200 OK`, `404 Not Found`, `500 Internal Server Error`

---

### **9. Память агента**

```http
GET /v1/agents/{agent_id}/memories?user_id=user-123
```

**Query параметры:**

- `user_id` (обязательно) - ID пользователя

**Ответ:**

```json
[
  {
    "memory": "Пользователь интересуется погодой и любит точные прогнозы",
    "topics": ["погода", "прогнозы", "температура"],
    "last_updated": "2024-12-01T10:35:00Z"
  },
  {
    "memory": "Предпочитает краткие ответы без лишних деталей",
    "topics": ["предпочтения", "стиль общения"],
    "last_updated": "2024-12-01T09:20:00Z"
  }
]
```

**HTTP коды:** `200 OK`, `404 Not Found` (агент без памяти), `422 Validation Error` (отсутствует user_id)

---

### **10. Загрузка базы знаний**

```http
POST /v1/agents/{agent_id}/knowledge/load
```

**Ответ:**

```json
{
  "message": "Knowledge base for agno_assist loaded successfully."
}
```

**HTTP коды:** `200 OK`, `400 Bad Request` (агент без базы знаний), `500 Internal Server Error`

---

### **11. Список Tool Hooks**

```http
GET /v1/agents/tool-hooks
```

**Ответ:**

```json
[
  "logging",
  "rate_limiting",
  "rate_limiting_strict",
  "rate_limiting_relaxed",
  "validation",
  "cache_5min",
  "cache_1min",
  "cache_15min",
  "metrics",
  "error_recovery"
]
```

**HTTP коды:** `200 OK`

---

### **12. Список Response Models**

```http
GET /v1/agents/response-models
```

**Ответ:**

```json
[
  "TaskResult",
  "UserAnalysis",
  "SearchResult",
  "DocumentSummary",
  "FinancialAnalysis",
  "CodeAnalysis",
  "TranslationResult",
  "QuestionAnswer",
  "EmailDraft"
]
```

**HTTP коды:** `200 OK`

---

### **13. JSON Schema модели**

```http
GET /v1/agents/response-models/{model_name}/schema
```

**Пример запроса:**

```http
GET /v1/agents/response-models/TaskResult/schema
```

**Ответ:**

```json
{
  "$defs": {
    "TaskStatus": {
      "enum": ["pending", "in_progress", "completed", "failed"],
      "title": "TaskStatus",
      "type": "string"
    }
  },
  "properties": {
    "success": {
      "description": "Успешно ли выполнена задача",
      "title": "Success",
      "type": "boolean"
    },
    "message": {
      "description": "Сообщение о результате",
      "title": "Message",
      "type": "string"
    },
    "status": {
      "$ref": "#/$defs/TaskStatus",
      "description": "Статус задачи"
    },
    "data": {
      "anyOf": [{ "type": "object" }, { "type": "null" }],
      "default": null,
      "description": "Дополнительные данные",
      "title": "Data"
    },
    "timestamp": {
      "description": "Время выполнения",
      "format": "date-time",
      "title": "Timestamp",
      "type": "string"
    }
  },
  "required": ["success", "message", "status", "timestamp"],
  "title": "TaskResult",
  "type": "object"
}
```

**HTTP коды:** `200 OK`, `404 Not Found` (модель не найдена)

---

### **14. Статистика кэша команд**

```http
GET /v1/agents/teams/cache-stats
```

**Ответ:**

```json
{
  "db_session_140234567890": {
    "size": 3,
    "keys": [
      "['agno_assist', 'web_agent']:user123:True",
      "['finance_agent', 'web_agent']:user456:False",
      "['agno_assist', 'finance_agent', 'web_agent']:None:True"
    ]
  },
  "db_session_140234567891": {
    "size": 1,
    "keys": ["['web_agent']:user123:True"]
  }
}
```

**HTTP коды:** `200 OK`

---

### **15. Очистка кэша команд**

```http
DELETE /v1/agents/teams/cache
```

**Ответ:**

```json
{
  "message": "All team caches cleared successfully",
  "cleared_sessions": 2,
  "total_teams_cleared": 4
}
```

**HTTP коды:** `200 OK`

---

### **16. Список инструментов**

```http
GET /v1/tools?type_filter=builtin&category=search&is_active=true
```

**Query параметры:**

- `type_filter` (опционально) - тип: `builtin`, `mcp`, `custom`
- `category` (опционально) - категория: `search`, `files`, `api`, etc.
- `is_active` (по умолчанию true) - только активные инструменты

**Ответ:**

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "duckduckgo_search",
    "type": "builtin",
    "description": "Поиск информации в интернете через DuckDuckGo",
    "display_name": "DuckDuckGo Search",
    "category": "search",
    "is_public": true,
    "is_active": true
  },
  {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "name": "file_processor",
    "type": "custom",
    "description": "Обработка и анализ загруженных файлов",
    "display_name": "File Processor",
    "category": "files",
    "is_public": false,
    "is_active": true
  }
]
```

**HTTP коды:** `200 OK`

---

### **12. Статистика кэша**

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

**HTTP коды:** `200 OK`

---

### **13. Инвалидация кэша**

```http
POST /v1/cache/invalidate
Content-Type: application/json
```

**Тело запроса (один из вариантов):**

```json
{
  "agent_id": "custom_agent_1"
}
```

```json
{
  "user_id": "user-123"
}
```

```json
{
  "tool_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

```json
{
  "tool_ids": [
    "123e4567-e89b-12d3-a456-426614174000",
    "456e7890-e89b-12d3-a456-426614174001"
  ]
}
```

**Ответ:**

```json
{
  "message": "Invalidated agent: custom_agent_1",
  "invalidated_count": 3,
  "type": "agent"
}
```

**HTTP коды:** `200 OK`, `400 Bad Request` (неверные параметры)

---

### **14. Полная очистка кэша**

```http
POST /v1/cache/clear
```

**Ответ:**

```json
{
  "message": "All caches cleared completely",
  "agents_cleared": 5,
  "tools_cleared": 12,
  "available_agents_cache_cleared": true,
  "total_cleared": 17
}
```

**HTTP коды:** `200 OK`

---

## 📊 **СТРУКТУРЫ ДАННЫХ**

### **StreamEvent (События стриминга)**

```typescript
interface StreamEvent {
  event:
    | 'RunStarted'
    | 'RunResponseContent'
    | 'RunCompleted'
    | 'ToolCallStarted'
    | 'ToolCallCompleted'
    | 'ReasoningStarted'
    | 'ReasoningStep'
    | 'RunError'
  content?: string
  agent_id?: string
  run_id?: string
  created_at: number

  // Медиа контент
  images?: MediaItem[]
  videos?: MediaItem[]
  audio?: MediaItem[]
  response_audio?: string

  // Инструменты
  tool_name?: string
  tool_input?: any
  tool_output?: any

  // Ошибки
  error_type?: 'NotFound' | 'RuntimeError' | 'General'
}
```

### **MediaItem**

```typescript
interface MediaItem {
  url?: string // URL для скачивания
  content?: string // Base64 контент
  content_type: string // MIME тип
  name?: string // Имя файла
  size?: number // Размер в байтах
}
```

### **Tool**

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

### **Session**

```typescript
interface Session {
  session_id: string
  session_name?: string
  created_at: string
  title: string
}
```

### **Memory**

```typescript
interface Memory {
  memory: string
  topics: string[]
  last_updated?: string
}
```

---

## 🔄 **ПОДДЕРЖИВАЕМЫЕ ФАЙЛЫ**

### **Изображения**

- JPEG, PNG, GIF, WebP
- Автоматическое распознавание содержимого

### **Документы**

- PDF - нативная обработка
- CSV - конвертация в текст
- TXT, JSON - прямая обработка

### **Аудио/Видео**

- MP3, WAV, MP4, MOV
- Транскрипция и анализ

---

## ❌ **КОДЫ ОШИБОК**

| Код | Описание              | Примеры                             |
| --- | --------------------- | ----------------------------------- |
| 200 | OK                    | Успешный запрос                     |
| 400 | Bad Request           | Неверные параметры, невалидный JSON |
| 404 | Not Found             | Агент/сессия/run не найдены         |
| 422 | Validation Error      | Отсутствует обязательный параметр   |
| 500 | Internal Server Error | Внутренние ошибки сервера           |
| 501 | Not Implemented       | Функция не поддерживается агентом   |

### **Формат ошибки**

```json
{
  "detail": "Agent not found",
  "status_code": 404
}
```

### **Ошибки в стриминге**

```json
{
  "event": "RunError",
  "content": "Continue run failed: Run not found",
  "error_type": "NotFound",
  "created_at": 1703123456
}
```

---

## 🧪 **ПРИМЕРЫ ЗАПРОСОВ**

### **JavaScript/Fetch**

```javascript
// Простой запрос к агенту
const response = await fetch('/v1/agents/web_agent/runs', {
  method: 'POST',
  body: new FormData([
    ['message', 'Привет!'],
    ['stream', 'false']
  ])
})
const data = await response.json()

// Стриминг
const response = await fetch('/v1/agents/web_agent/runs', {
  method: 'POST',
  body: formData
})

const reader = response.body.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = new TextDecoder().decode(value)
  const events = chunk.split('\n').filter(Boolean)

  for (const event of events) {
    try {
      const data = JSON.parse(event)
      console.log('Event:', data.event, 'Content:', data.content)
    } catch (e) {
      // Игнорируем невалидный JSON
    }
  }
}
```

### **cURL**

```bash
# Простой запрос
curl -X POST "http://localhost:8000/v1/agents/web_agent/runs" \
  -F "message=Привет!" \
  -F "stream=false"

# С файлами
curl -X POST "http://localhost:8000/v1/agents/web_agent/runs" \
  -F "message=Проанализируй этот файл" \
  -F "files=@image.jpg" \
  -F "user_id=user-123" \
  -F "session_id=session-456"

# Получение сессий
curl "http://localhost:8000/v1/agents/web_agent/sessions?user_id=user-123"

# Инвалидация кэша
curl -X POST "http://localhost:8000/v1/cache/invalidate" \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "web_agent"}'

# Получение доступных tool hooks
curl "http://localhost:8000/v1/agents/tool-hooks"

# Получение доступных response models
curl "http://localhost:8000/v1/agents/response-models"

# Получение JSON Schema модели
curl "http://localhost:8000/v1/agents/response-models/TaskResult/schema"

# Статистика кэша команд
curl "http://localhost:8000/v1/agents/teams/cache-stats"

# Очистка кэша команд
curl -X DELETE "http://localhost:8000/v1/agents/teams/cache"
```

---

## 🚀 **НОВЫЕ ВОЗМОЖНОСТИ ДИНАМИЧЕСКИХ АГЕНТОВ (2025-01-27)**

### **Примеры созданных агентов с новыми возможностями**

После выполнения миграции `8fbe5808c235` в базе данных созданы демонстрационные агенты:

#### **1. Структурированный ассистент (`task_manager`)**

```bash
# Запрос к агенту с структурированным ответом
curl -X POST "http://localhost:8000/v1/agents/task_manager/runs" \
  -F "message=Проанализируй статус проекта и верни результат" \
  -F "stream=false" \
  -F "user_id=user-123"

# Ответ будет в формате TaskResult:
{
  "content": {
    "success": true,
    "message": "Проект выполнен успешно",
    "status": "completed",
    "data": {"progress": 100, "issues": 0},
    "timestamp": "2025-01-27T15:30:00Z"
  }
}
```

#### **2. Production агент (`production_assistant`)**

```bash
# Агент с полным набором middleware (логирование, валидация, rate limiting)
curl -X POST "http://localhost:8000/v1/agents/production_assistant/runs" \
  -F "message=Выполни поиск информации о компании Apple" \
  -F "stream=true" \
  -F "user_id=user-123"

# В логах будут видны hook'и:
# [INFO] 🔧 Tool called: duckduckgo_search
# [INFO] ✅ Tool duckduckgo_search completed in 2.45s
```

#### **3. Лидер команды (`research_team_leader`)**

```bash
# Агент, который координирует работу команды других агентов
curl -X POST "http://localhost:8000/v1/agents/research_team_leader/runs" \
  -F "message=Проведи исследование рынка криптовалют" \
  -F "stream=true" \
  -F "user_id=user-123"

# Агент автоматически привлечет:
# - web_agent для поиска информации
# - finance_agent для финансового анализа
# - agno_assist для обобщения результатов
```

#### **4. Ультимативный ассистент (`ultimate_assistant`)**

```bash
# Агент с всеми возможностями: память, знания, команда, структурированный ответ
curl -X POST "http://localhost:8000/v1/agents/ultimate_assistant/runs" \
  -F "message=Помоги мне спланировать инвестиционную стратегию" \
  -F "stream=true" \
  -F "user_id=user-123"

# UserAnalysis response с памятью о пользователе и командной работой
```

### **Примеры API запросов для управления новыми системами**

#### **Tool Hooks управление**

```javascript
// Получить список доступных hook'ов
const hooks = await fetch('/v1/agents/tool-hooks').then((r) => r.json())
console.log('Available hooks:', hooks)
// ["logging", "rate_limiting", "validation", "cache_5min", "metrics", ...]

// Использовать в динамическом агенте
const agentConfig = {
  tool_hooks: ['logging', 'validation', 'metrics'],
  show_tool_calls: true,
  tool_call_limit: 10
}
```

#### **Response Models управление**

```javascript
// Получить список доступных моделей
const models = await fetch('/v1/agents/response-models').then((r) => r.json())
console.log('Available models:', models)
// ["TaskResult", "UserAnalysis", "SearchResult", ...]

// Получить JSON Schema модели
const schema = await fetch('/v1/agents/response-models/TaskResult/schema').then(
  (r) => r.json()
)
console.log('TaskResult schema:', schema)

// Использовать в динамическом агенте
const agentConfig = {
  response_model: 'TaskResult',
  structured_outputs: true,
  parse_response: true
}
```

#### **Team Agents управление**

```javascript
// Проверить статистику кэша команд
const stats = await fetch('/v1/agents/teams/cache-stats').then((r) => r.json())
console.log('Team cache stats:', stats)
// {"db_session_123": {"size": 3, "keys": [...]}}

// Очистить кэш команд
await fetch('/v1/agents/teams/cache', { method: 'DELETE' })

// Использовать в динамическом агенте
const agentConfig = {
  team: ['web_agent', 'finance_agent', 'agno_assist'],
  team_data: { project: 'market_analysis' },
  add_transfer_instructions: true
}
```

### **SQL примеры создания агентов с новыми возможностями**

```sql
-- Создание агента с tool hooks
INSERT INTO agents (agent_id, name, description, agent_config, is_public) VALUES (
  'secure_assistant',
  'Безопасный ассистент',
  'Агент с полной защитой и мониторингом',
  '{
    "tool_hooks": ["logging", "validation", "rate_limiting_strict", "metrics"],
    "show_tool_calls": true,
    "tool_call_limit": 5,
    "debug_mode": false
  }',
  true
);

-- Создание агента с структурированными ответами
INSERT INTO agents (agent_id, name, description, agent_config, is_public) VALUES (
  'document_analyzer',
  'Анализатор документов',
  'Агент для анализа документов с структурированным выводом',
  '{
    "response_model": "DocumentSummary",
    "structured_outputs": true,
    "parse_response": true,
    "markdown": false
  }',
  true
);

-- Создание лидера команды специалистов
INSERT INTO agents (agent_id, name, description, agent_config, is_public) VALUES (
  'expert_team_lead',
  'Лидер команды экспертов',
  'Координирует работу команды специализированных агентов',
  '{
    "team": ["web_agent", "finance_agent", "agno_assist"],
    "team_data": {"domain": "business_analysis"},
    "add_transfer_instructions": true,
    "team_response_separator": "\n\n---\n\n",
    "response_model": "TaskResult"
  }',
  true
);
```

---

**📋 Данная документация содержит полное описание всех доступных эндпоинтов, форматов запросов и ответов для интеграции с Agent-API, включая новые возможности динамических агентов с 100% совместимостью с Agno Framework.**
