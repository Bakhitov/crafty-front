# 📊 Анализ эндпоинтов проекта Agent-UI

## 🏗️ Архитектура API

Проект использует многоуровневую архитектуру API с тремя основными компонентами:

1. **Next.js API Routes** - внутренние эндпоинты фронтенда
2. **Agno Framework** - только для запуска агентов и управления сессиями
3. **Messenger Server** - сервер для работы с мессенджерами
4. **Supabase Database** - CRUD операции для агентов и инструментов

---

## 🔗 1. Next.js API Routes (`/api/v1/*`)

### 👥 Agents API

#### `GET /api/v1/agents`

- **Описание**: Получение списка всех агентов с фильтрацией
- **Параметры**:
  - `company_id` - фильтр по компании
  - `is_public` - публичные агенты
  - `category` - категория агентов
  - `limit`, `offset` - пагинация
- **Источник данных**: Supabase (таблица agents)

#### `POST /api/v1/agents`

- **Описание**: Создание нового агента
- **Тело запроса**: Данные агента (name, description, instructions, etc.)
- **Источник данных**: Supabase

#### `GET /api/v1/agents/[id]`

- **Описание**: Получение конкретного агента по ID
- **Источник данных**: Supabase

#### `PUT /api/v1/agents/[id]`

- **Описание**: Обновление агента
- **Источник данных**: Supabase

#### `DELETE /api/v1/agents/[id]`

- **Описание**: Удаление агента
- **Источник данных**: Supabase

#### `GET /api/v1/agents/public`

- **Описание**: Получение только публичных агентов
- **Источник данных**: Supabase (фильтр is_public = true)

#### `GET /api/v1/agents/company/[companyId]`

- **Описание**: Агенты конкретной компании
- **Источник данных**: Supabase (фильтр по company_id)

#### `GET /api/v1/agents/company/[companyId]/accessible`

- **Описание**: Доступные агенты для компании (публичные + собственные)
- **Источник данных**: Supabase

#### `GET /api/v1/agents/search`

- **Описание**: Поиск агентов по запросу
- **Параметры**: `q` - поисковый запрос
- **Источник данных**: Supabase

### 🏢 Companies API

#### `GET /api/v1/companies`

- **Описание**: Получение информации о компании пользователя
- **Авторизация**: Требуется аутентификация через Supabase
- **Источник данных**: Supabase (функция `get_user_company`)

#### `POST /api/v1/companies`

- **Описание**: Создание новой компании
- **Источник данных**: Supabase

### 🔧 Instances API

#### `GET /api/v1/instances`

- **Описание**: Получение списка инстансов мессенджеров
- **Параметры**:
  - `provider` - тип провайдера (telegram, whatsapp, etc.)
  - `status` - статус инстанса
  - `company_id` - фильтр по компании
- **Прокси к**: `13.61.141.6/api/v1/instances`

### 📱 Messaging APIs

#### `POST /api/v1/telegram/send`

- **Описание**: Отправка сообщений через Telegram
- **Тело запроса**:
  ```json
  {
    "port": "number",
    "instanceId": "string",
    "chatId": "string",
    "message": "string"
  }
  ```
- **Прокси к**: `13.61.141.6:[port]/api/v1/telegram/send`

#### `POST /api/v1/telegram/send-media`

- **Описание**: Отправка медиа через Telegram
- **Прокси к**: `13.61.141.6:[port]/api/v1/telegram/send-media`

#### `POST /api/v1/whatsapp/send`

- **Описание**: Отправка сообщений через WhatsApp
- **Тело запроса**:
  ```json
  {
    "port": "number",
    "instanceId": "string",
    "number": "string",
    "message": "string",
    "source": "string", // для медиа
    "mediaType": "text|image|document"
  }
  ```
- **Прокси к**: `13.61.141.6:[port]/api/v1/send`

### 📊 Logs API

#### `GET /api/v1/logs`

- **Описание**: Получение логов Instance Manager
- **Параметры**:
  - `tail` - количество строк (1-10000)
  - `level` - уровень логирования (error, warn, info, http, debug)
- **Источник**: Файловая система сервера

#### `GET /api/v1/logs/latest`

- **Описание**: Получение последних логов
- **Параметры**: `lines` - количество строк
- **Источник**: Файловая система сервера

### 🗄️ Cache API

#### `POST /api/internal/cache/invalidate`

- **Описание**: Инвалидация кэша
- **Тело запроса**: Ключи для инвалидации

---

## 🤖 2. Agno Framework API (`localhost:8000/v1/*`)

> **⚠️ ВАЖНО**: CRUD операции агентов и инструментов были удалены из Agno API.
> Теперь используется только Supabase для управления данными.

### 🎯 Agent Runtime Operations (только запуск и сессии)

#### `POST /v1/agents/[id]/runs`

- **Описание**: Запуск агента
- **Тело запроса**:
  ```json
  {
    "message": "string",
    "session_id": "string",
    "stream": boolean
  }
  ```
- **Используется**: Основной интерфейс чата

#### `GET /v1/agents/[id]/sessions`

- **Описание**: Список сессий агента
- **Используется**: Sidebar для отображения чатов

#### `GET /v1/agents/[id]/sessions/[sessionId]`

- **Описание**: Конкретная сессия агента
- **Используется**: Загрузка истории чата

#### `DELETE /v1/agents/[id]/sessions/[sessionId]`

- **Описание**: Удаление сессии
- **Используется**: Удаление чатов

### 🏥 System Operations

#### `GET /v1/health`

- **Описание**: Проверка состояния Agno сервера
- **Используется**: Мониторинг доступности

---

## 📱 3. Messenger Server API (`13.61.141.6/*`)

### 🔧 Instance Management

#### `GET /api/v1/instances`

- **Описание**: Список всех инстансов мессенджеров
- **Параметры**: provider, status, company_id, limit, offset
- **Используется**: MessengerInstanceManager

#### `POST /api/v1/instances`

- **Описание**: Создание нового инстанса
- **Тело запроса**: Зависит от провайдера (WhatsApp, Telegram, etc.)
- **Используется**: Создание новых мессенджер-ботов

#### `GET /api/v1/instances/[id]`

- **Описание**: Детальная информация об инстансе
- **Используется**: MessengerInstanceDetail

#### `PUT /api/v1/instances/[id]`

- **Описание**: Обновление инстанса
- **Используется**: Редактирование настроек

#### `DELETE /api/v1/instances/[id]`

- **Описание**: Удаление инстанса
- **Используется**: Удаление мессенджер-ботов

### 📤 Direct Messaging

#### `POST :[port]/api/v1/telegram/send`

- **Описание**: Прямая отправка через Telegram
- **Авторизация**: Bearer [instanceId]
- **Тело запроса**:
  ```json
  {
    "chatId": "string",
    "message": "string"
  }
  ```

#### `POST :[port]/api/v1/send` (WhatsApp)

- **Описание**: Прямая отправка через WhatsApp
- **Авторизация**: Bearer [instanceId]
- **Тело запроса**:
  ```json
  {
    "number": "string",
    "message": "string",
    "mediaType": "text|image|document"
  }
  ```

### 🔗 Webhooks

#### `POST /api/v1/telegram/webhook`

- **Описание**: Webhook для получения Telegram событий
- **Используется**: Автоматическая обработка входящих сообщений

#### `POST /api/v1/whatsapp/webhook`

- **Описание**: Webhook для получения WhatsApp событий
- **Используется**: Автоматическая обработка входящих сообщений

---

## 🗄️ 4. Supabase Database Operations

### 👥 Agents CRUD

- **Таблица**: `agents`
- **Операции**: Все CRUD операции через `SupabaseCrudClient`
- **Фильтрация**: По компании, публичности, категории
- **Поиск**: Полнотекстовый поиск по названию и описанию

### 🛠️ Tools CRUD

- **Таблица**: `tools`
- **Операции**: Все CRUD операции через `SupabaseCrudClient`
- **Типы**: builtin, custom, mcp
- **Фильтрация**: По типу, компании, публичности

### 🏢 Companies Management

- **Таблица**: `companies`
- **Функция**: `get_user_company(p_user_id)`
- **Мультитенантность**: Изоляция данных по компаниям

---

## 🔄 Маршрутизация запросов

### API Router (`src/lib/apiRouter.ts`)

Проект использует интеллектуальную маршрутизацию запросов:

```typescript
export const API_ROUTES_MAP: Record<string, APIRoute> = {
  // Agno Framework (только запуск агентов)
  'agents.run': { target: 'agno' },
  'sessions.list': { target: 'agno' },
  'sessions.get': { target: 'agno' },
  'sessions.delete': { target: 'agno' },

  // Instances API
  'instances.list': { target: 'instances' },
  'instances.create': { target: 'instances' },

  // Internal Next.js
  'companies.get': { target: 'internal' },
  'logs.get': { target: 'internal' },

  // Supabase (через SupabaseCrudClient)
  'agents.crud': { target: 'supabase' },
  'tools.crud': { target: 'supabase' }
}
```

### Клиенты API

1. **APIClient** (`src/lib/apiClient.ts`) - основной клиент для агентов (использует Supabase)
2. **AgnoAPIClient** (`src/lib/agnoApiClient.ts`) - только для запуска агентов и сессий
3. **SupabaseCrudClient** (`src/lib/supabaseCrudClient.ts`) - CRUD операции
4. **InstancesAPIClient** (`src/lib/instancesApiClient.ts`) - клиент для мессенджеров
5. **MessengerAPIClient** (`src/lib/messengerApi.ts`) - расширенный клиент для мессенджеров

---

## 📊 Статистика использования

### По компонентам:

- **Agents API**: 10 эндпоинтов (CRUD + фильтрация) - **Supabase**
- **Agno Framework**: 5 эндпоинтов (только запуск и сессии) - **Сокращено**
- **Messenger Server**: 15+ эндпоинтов (инстансы, отправка, webhooks)
- **Internal APIs**: 8 эндпоинтов (компании, логи, кэш)

### По типам операций:

- **GET**: ~65% (получение данных)
- **POST**: ~30% (создание, отправка, запуск)
- **PUT/DELETE**: ~5% (обновление, удаление)

---

## 🔐 Аутентификация и авторизация

### Supabase Auth

- Используется для Next.js API routes и CRUD операций
- JWT токены в cookies
- Проверка пользователя через `supabase.auth.getUser()`

### Bearer Token Auth

- Используется для прямых запросов к мессенджер инстансам
- `Authorization: Bearer [instanceId]`

### Company-based Access Control

- Фильтрация данных по `company_id`
- Публичные ресурсы доступны всем (`is_public: true`)
- Приватные ресурсы только владельцам

---

## ✅ Изменения в архитектуре

### Удаленные эндпоинты Agno Framework:

❌ **Удалено (теперь через Supabase):**

- `GET /v1/agents` - список агентов
- `GET /v1/agents/detailed` - подробная информация
- `GET /v1/agents/public` - публичные агенты
- `GET /v1/agents/company/[companyId]` - агенты компании
- `GET /v1/agents/company/[companyId]/accessible` - доступные агенты
- `GET /v1/agents/search` - поиск агентов
- `POST /v1/agents/[id]/cache/refresh` - обновление кэша
- `GET /v1/tools` - список инструментов
- `GET /v1/tools/custom` - кастомные инструменты
- `GET /v1/tools/mcp` - MCP серверы
- `GET /v1/tools/mcp/[serverId]/tools` - инструменты MCP
- `GET /v1/tools/public` - публичные инструменты
- `GET /v1/tools/company/[companyId]/accessible` - доступные инструменты
- `GET /v1/tools/search` - поиск инструментов
- `GET /v1/models` - список моделей

✅ **Оставлено (критично для работы):**

- `POST /v1/agents/[id]/runs` - запуск агента
- `GET /v1/agents/[id]/sessions` - сессии агента
- `GET /v1/agents/[id]/sessions/[sessionId]` - конкретная сессия
- `DELETE /v1/agents/[id]/sessions/[sessionId]` - удаление сессии
- `GET /v1/health` - проверка состояния

---

## 🚀 Рекомендации по оптимизации

1. **Кэширование**: Использовать Redis для часто запрашиваемых данных из Supabase
2. **Пагинация**: Реализована для всех Supabase операций
3. **Мониторинг**: Добавить метрики производительности для каждого эндпоинта
4. **Rate Limiting**: Ограничить частоту запросов к внешним API
5. **Error Handling**: Унифицировать обработку ошибок во всех клиентах
6. **Database Optimization**: Оптимизировать запросы к Supabase с помощью индексов
