-- Обновление схемы таблицы agents в соответствии с новыми требованиями
-- Выполните этот файл в Supabase Dashboard -> SQL Editor

-- 1. Добавляем новые поля к таблице agents
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS goal text NULL,
ADD COLUMN IF NOT EXISTS expected_output text NULL,
ADD COLUMN IF NOT EXISTS role character varying(255) NULL;

-- 2. Изменяем типы данных для существующих полей
-- Изменяем agent_id с TEXT на character varying(255)
ALTER TABLE public.agents 
ALTER COLUMN agent_id TYPE character varying(255);

-- Изменяем name с TEXT на character varying(255)  
ALTER TABLE public.agents 
ALTER COLUMN name TYPE character varying(255);

-- Изменяем user_id с UUID NOT NULL на character varying(255) NULL
ALTER TABLE public.agents 
ALTER COLUMN user_id DROP NOT NULL,
ALTER COLUMN user_id TYPE character varying(255) USING user_id::text;

-- Изменяем tool_ids с TEXT[] на uuid[]
-- Сначала создаем временную колонку
ALTER TABLE public.agents 
ADD COLUMN tool_ids_temp uuid[] DEFAULT '{}';

-- Обновляем данные: пытаемся конвертировать существующие TEXT значения в UUID
UPDATE public.agents 
SET tool_ids_temp = CASE 
  WHEN tool_ids IS NULL OR array_length(tool_ids, 1) IS NULL THEN '{}'::uuid[]
  ELSE (
    SELECT array_agg(t::uuid)
    FROM unnest(tool_ids) t
    WHERE t ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  )
END;

-- Удаляем старую колонку и переименовываем новую
ALTER TABLE public.agents DROP COLUMN tool_ids;
ALTER TABLE public.agents RENAME COLUMN tool_ids_temp TO tool_ids;

-- Изменяем timestamps с WITH TIME ZONE на WITHOUT TIME ZONE
ALTER TABLE public.agents 
ALTER COLUMN created_at TYPE timestamp without time zone,
ALTER COLUMN updated_at TYPE timestamp without time zone;

-- 3. Создаем функцию для уведомления об инвалидации кэша (если не существует)
CREATE OR REPLACE FUNCTION notify_cache_invalidation()
RETURNS TRIGGER AS $$
BEGIN
    -- Уведомляем о необходимости очистки кэша
    PERFORM pg_notify('cache_invalidation', 'agents');
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 4. Создаем новые индексы
-- Индекс для agent_id с фильтром по is_active
CREATE INDEX IF NOT EXISTS idx_agents_agent_id_active 
ON public.agents USING btree (agent_id) 
WHERE (is_active = true);

-- GIN индекс для tool_ids
CREATE INDEX IF NOT EXISTS idx_agents_tool_ids 
ON public.agents USING gin (tool_ids);

-- Обновляем существующие индексы (если нужно пересоздать)
DROP INDEX IF EXISTS idx_agents_user_id;
CREATE INDEX IF NOT EXISTS idx_agents_user_id 
ON public.agents USING btree (user_id);

DROP INDEX IF EXISTS idx_agents_is_public;
CREATE INDEX IF NOT EXISTS idx_agents_is_public 
ON public.agents USING btree (is_public);

DROP INDEX IF EXISTS idx_agents_company_id;
CREATE INDEX IF NOT EXISTS idx_agents_company_id 
ON public.agents USING btree (company_id);

DROP INDEX IF EXISTS idx_agents_category;
CREATE INDEX IF NOT EXISTS idx_agents_category 
ON public.agents USING btree (category);

-- 5. Создаем триггер для инвалидации кэша
DROP TRIGGER IF EXISTS agents_cache_invalidation_trigger ON public.agents;
CREATE TRIGGER agents_cache_invalidation_trigger
AFTER INSERT OR DELETE ON public.agents 
FOR EACH ROW
EXECUTE FUNCTION notify_cache_invalidation();

-- 6. Обновляем триггер для updated_at (пересоздаем с правильной функцией)
DROP TRIGGER IF EXISTS update_agents_updated_at ON public.agents;
CREATE TRIGGER update_agents_updated_at 
BEFORE UPDATE ON public.agents 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 7. Добавляем комментарии к новым полям
COMMENT ON COLUMN public.agents.goal IS 'Цель агента';
COMMENT ON COLUMN public.agents.expected_output IS 'Ожидаемый результат работы агента';
COMMENT ON COLUMN public.agents.role IS 'Роль агента в системе';

-- 8. Проверяем результат миграции
DO $$
BEGIN
    -- Проверяем наличие новых полей
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'goal') THEN
        RAISE EXCEPTION 'Migration failed: goal column was not added';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'expected_output') THEN
        RAISE EXCEPTION 'Migration failed: expected_output column was not added';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agents' AND column_name = 'role') THEN
        RAISE EXCEPTION 'Migration failed: role column was not added';
    END IF;
    
    RAISE NOTICE 'Agents table migration completed successfully!';
    RAISE NOTICE 'Added fields: goal, expected_output, role';
    RAISE NOTICE 'Updated data types: agent_id, name, user_id, tool_ids, timestamps';
    RAISE NOTICE 'Added indexes and triggers for cache invalidation';
END
$$; 