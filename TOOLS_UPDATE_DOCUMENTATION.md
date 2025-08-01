# Обновление структуры тулзов

Данный документ описывает обновление системы тулзов для работы с новой структурой Supabase.

## Изменения в схеме БД

### Новая структура таблицы `tools`

```sql
create table public.tools (
  id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  type character varying(50) not null,
  description text not null,
  configuration jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  is_public boolean not null default false,
  company_id uuid null,
  user_id uuid null,
  display_name text null,
  category text null,
  constraint tools_pkey primary key (id),
  constraint tools_name_key unique (name)
);
```

### Ключевые изменения

1. **Удален `tool_id`** - теперь `name` является уникальным идентификатором
2. **Добавлен `type`** - тип тула (dynamic, custom, mcp)
3. **`configuration` вместо `tool_config`** - стандартизация названий
4. **`description` теперь NOT NULL** - обязательное описание
5. **Добавлен `display_name`** - человекочитаемое название
6. **Улучшенная индексация** - добавлен составной индекс `(type, is_active)`

## Обновленные компоненты

### 1. `supabaseCrudClient.ts`

- Обновлен интерфейс `SupabaseTool`
- Исправлены CRUD операции для работы с `name` как уникальным ключом
- Добавлена поддержка поиска по ID или name
- Улучшена валидация и обработка ошибок

### 2. `useTools.ts`

- Адаптирован под новую структуру данных
- Добавлена обратная совместимость с `tool_id`
- Улучшено преобразование данных из Supabase

### 3. `ToolCreator.tsx`

- Полностью реализован функционал создания тулзов
- Добавлена валидация формы
- Интеграция с Supabase для сохранения тулзов
- Поддержка всех типов тулзов (dynamic, custom, mcp)
- Конфигурация в формате JSON

### 4. `ToolsList.tsx`

- Обновлен для работы с новой структурой
- Поддержка обратной совместимости

### 5. `apiClient.ts`

- Обновлен интерфейс `Tool`
- Добавлены новые поля
- Сохранена обратная совместимость

## Типы тулзов

### Dynamic Tools

Встроенные инструменты Agno с предопределенной функциональностью.

**Конфигурация:**

```json
{
  "agno_class": "ToolClassName",
  "module_path": "path.to.module"
}
```

### Custom Tools

Пользовательские Python функции с собственной логикой.

**Конфигурация:**

```json
{
  "source_code": "python code here",
  "dependencies": ["package1", "package2"]
}
```

### MCP Tools

Интеграция с Model Context Protocol серверами.

**Конфигурация:**

```json
{
  "command": "server start command",
  "url": "http://server.url",
  "transport": "stdio",
  "env_config": {
    "ENV_VAR": "value"
  }
}
```

## Миграция данных

Для обновления существующей БД используйте файл `db/update_tools_schema.sql`:

```bash
# В Supabase Dashboard -> SQL Editor
# Выполните содержимое файла db/update_tools_schema.sql
```

Миграция:

1. Создает новую таблицу с правильной структурой
2. Переносит данные из старой таблицы
3. Обновляет индексы и ограничения
4. Создает триггеры для автообновления `updated_at` и кэширования

## API изменения

### Создание тула

```typescript
await supabaseCrud.createTool({
  name: 'unique-tool-name',
  display_name: 'Human Readable Name',
  type: 'custom',
  description: 'Tool description',
  configuration: {
    /* JSON config */
  },
  category: 'general',
  is_public: false
})
```

### Получение тула

```typescript
// По ID или name
const tool = await supabaseCrud.getTool('tool-name-or-uuid')
```

### Обновление тула

```typescript
await supabaseCrud.updateTool('tool-name', {
  description: 'Updated description',
  configuration: {
    /* new config */
  }
})
```

## Обратная совместимость

Все компоненты поддерживают обратную совместимость:

- Поле `tool_id` сохранено для совместимости (заполняется из `id`)
- Поле `config` дублирует `configuration`
- Старые методы поиска работают с новой структурой

## Категории тулзов

Доступные категории:

- `general` - Общие инструменты
- `data-processing` - Обработка данных
- `web-scraping` - Веб-скрапинг
- `api-integration` - API интеграции
- `file-management` - Управление файлами
- `communication` - Коммуникации
- `analysis` - Анализ данных
- `automation` - Автоматизация
- `development` - Разработка
- `other` - Прочее

## Индексы и производительность

Созданы оптимальные индексы:

- `idx_tools_type_active` - для фильтрации по типу и активности
- `idx_tools_is_public` - для публичных тулзов
- `idx_tools_company_id` - для тулзов компании
- `idx_tools_user_id` - для тулзов пользователя
- `idx_tools_category` - для фильтрации по категориям
- Полнотекстовый поиск по `name` и `description`

## Безопасность

- Поддержка Row Level Security (RLS)
- Проверка прав доступа в CRUD операциях
- Валидация JSON конфигурации
- Защита от SQL инъекций через параметризованные запросы
