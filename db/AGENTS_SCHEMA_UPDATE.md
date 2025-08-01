# Обновление схемы таблицы agents

## Обзор изменений

Таблица `public.agents` была обновлена в соответствии с новой схемой Supabase. Добавлены новые поля, изменены типы данных, созданы новые индексы и триггеры.

## Новые поля

Добавлены следующие поля в таблицу `agents`:

- `goal` (text, nullable) - Цель агента
- `expected_output` (text, nullable) - Ожидаемый результат работы агента
- `role` (character varying(255), nullable) - Роль агента в системе

## Изменения типов данных

1. **agent_id**: `TEXT` → `character varying(255)`
2. **name**: `TEXT` → `character varying(255)`
3. **user_id**: `UUID NOT NULL` → `character varying(255) NULL`
4. **tool_ids**: `TEXT[]` → `uuid[]`
5. **timestamps**: `TIMESTAMP WITH TIME ZONE` → `TIMESTAMP WITHOUT TIME ZONE`

## Новые индексы

- `idx_agents_agent_id_active` - B-tree индекс для `agent_id` с фильтром `WHERE is_active = true`
- `idx_agents_tool_ids` - GIN индекс для массива `tool_ids`

## Новые триггеры

- `agents_cache_invalidation_trigger` - Триггер для уведомления об инвалидации кэша
- Обновлен триггер `update_agents_updated_at` для автоматического обновления `updated_at`

## Файлы для выполнения

### 1. Миграция базы данных

Выполните файл `db/update_agents_schema.sql` в Supabase Dashboard -> SQL Editor:

```sql
-- Обновление схемы таблицы agents в соответствии с новыми требованиями
-- Выполните этот файл в Supabase Dashboard -> SQL Editor
```

### 2. Обновленные TypeScript интерфейсы

Обновлены следующие интерфейсы для поддержки новых полей:

- `src/types/playground.ts`:

  - `Agent` interface
  - `APIAgent` interface

- `src/lib/apiClient.ts`:

  - `Agent` interface

- `src/lib/supabaseCrudClient.ts`:

  - `SupabaseAgent` interface

- `src/lib/supabaseAgents.ts`:
  - `CreateAgentData` interface

### 3. Обновленные API маршруты

- `src/app/api/v1/agents/route.ts`:

  - `CreateAgentRequest` interface
  - POST маршрут для создания агентов

- `src/app/api/v1/agents/[id]/route.ts`:
  - `UpdateAgentRequest` interface
  - PUT маршрут для обновления агентов

## Совместимость

Все изменения обратно совместимы:

- Новые поля опциональны (nullable)
- Существующие API endpoints продолжают работать
- Старые данные сохраняются при миграции

## Проверка миграции

После выполнения миграции проверьте:

1. Таблица содержит новые поля:

   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'agents' AND table_schema = 'public'
   ORDER BY ordinal_position;
   ```

2. Индексы созданы:

   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'agents' AND schemaname = 'public';
   ```

3. Триггеры активны:
   ```sql
   SELECT trigger_name, event_manipulation, action_timing
   FROM information_schema.triggers
   WHERE event_object_table = 'agents';
   ```

## Использование новых полей

### Создание агента с новыми полями

```typescript
const newAgent = await apiClient.createAgent({
  agent_id: 'my-agent-001',
  name: 'My Agent',
  description: 'Agent description',
  goal: 'Help users with their tasks',
  expected_output: 'Clear and helpful responses',
  role: 'assistant'
  // ... другие поля
})
```

### Обновление агента

```typescript
const updatedAgent = await apiClient.updateAgent('my-agent-001', {
  goal: 'Updated goal',
  expected_output: 'Updated expected output',
  role: 'specialist'
})
```

## Откат изменений

Если необходимо откатить изменения:

1. Удалите новые поля:

   ```sql
   ALTER TABLE public.agents
   DROP COLUMN IF EXISTS goal,
   DROP COLUMN IF EXISTS expected_output,
   DROP COLUMN IF EXISTS role;
   ```

2. Восстановите старые типы данных (требует осторожности с существующими данными)

3. Удалите новые индексы и триггеры:
   ```sql
   DROP INDEX IF EXISTS idx_agents_agent_id_active;
   DROP INDEX IF EXISTS idx_agents_tool_ids;
   DROP TRIGGER IF EXISTS agents_cache_invalidation_trigger ON public.agents;
   ```
