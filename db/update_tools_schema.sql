-- Обновление схемы таблицы tools до новой структуры
-- Выполните этот файл в Supabase Dashboard -> SQL Editor

-- 1. Сначала создаем новую таблицу с правильной структурой
CREATE TABLE IF NOT EXISTS public.tools_new (
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
  constraint tools_new_pkey primary key (id),
  constraint tools_new_name_key unique (name)
) TABLESPACE pg_default;

-- 2. Создаем индексы для новой таблицы
create index IF not exists idx_tools_new_type_active on public.tools_new using btree (type, is_active) TABLESPACE pg_default;
create index IF not exists idx_tools_new_is_public on public.tools_new using btree (is_public) TABLESPACE pg_default;
create index IF not exists idx_tools_new_company_id on public.tools_new using btree (company_id) TABLESPACE pg_default;
create index IF not exists idx_tools_new_user_id on public.tools_new using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_tools_new_category on public.tools_new using btree (category) TABLESPACE pg_default;

-- 3. Миграция данных из старой таблицы в новую (если старая таблица существует)
INSERT INTO public.tools_new (
  name, 
  type, 
  description, 
  configuration, 
  is_active, 
  created_at, 
  updated_at, 
  is_public, 
  company_id, 
  user_id, 
  display_name, 
  category
)
SELECT 
  COALESCE(name, tool_id) as name,  -- используем name или tool_id как name
  COALESCE(type, 'custom') as type,
  COALESCE(description, '') as description,
  COALESCE(tool_config, configuration, '{}'::jsonb) as configuration,
  COALESCE(is_active, true) as is_active,
  COALESCE(created_at, now()) as created_at,
  COALESCE(updated_at, now()) as updated_at,
  COALESCE(is_public, false) as is_public,
  company_id,
  user_id,
  display_name,
  category
FROM public.tools
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tools' AND table_schema = 'public')
ON CONFLICT (name) DO NOTHING;  -- Игнорируем дубликаты по name

-- 4. Удаляем старую таблицу и переименовываем новую
DROP TABLE IF EXISTS public.tools CASCADE;
ALTER TABLE public.tools_new RENAME TO tools;

-- 5. Переименовываем индексы
ALTER INDEX idx_tools_new_type_active RENAME TO idx_tools_type_active;
ALTER INDEX idx_tools_new_is_public RENAME TO idx_tools_is_public;
ALTER INDEX idx_tools_new_company_id RENAME TO idx_tools_company_id;
ALTER INDEX idx_tools_new_user_id RENAME TO idx_tools_user_id;
ALTER INDEX idx_tools_new_category RENAME TO idx_tools_category;

-- 6. Переименовываем ограничения
ALTER TABLE public.tools RENAME CONSTRAINT tools_new_pkey TO tools_pkey;
ALTER TABLE public.tools RENAME CONSTRAINT tools_new_name_key TO tools_name_key;

-- 7. Создаем триггеры для кэша и обновления updated_at
-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Функция для уведомления об инвалидации кэша
CREATE OR REPLACE FUNCTION notify_cache_invalidation()
RETURNS TRIGGER AS $$
BEGIN
    -- Уведомляем о необходимости очистки кэша
    PERFORM pg_notify('cache_invalidation', 'tools');
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Триггер для обновления updated_at
CREATE TRIGGER update_tools_updated_at 
    BEFORE UPDATE ON public.tools 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Триггер для инвалидации кэша
CREATE TRIGGER tools_cache_invalidation_trigger
    AFTER INSERT OR DELETE OR UPDATE ON public.tools 
    FOR EACH ROW 
    EXECUTE FUNCTION notify_cache_invalidation();

-- 8. Добавляем комментарии к таблице и колонкам
COMMENT ON TABLE public.tools IS 'Таблица инструментов для агентов';
COMMENT ON COLUMN public.tools.id IS 'Уникальный идентификатор инструмента';
COMMENT ON COLUMN public.tools.name IS 'Уникальное имя инструмента';
COMMENT ON COLUMN public.tools.type IS 'Тип инструмента: dynamic, custom, mcp';
COMMENT ON COLUMN public.tools.description IS 'Описание функциональности инструмента';
COMMENT ON COLUMN public.tools.configuration IS 'JSON конфигурация инструмента';
COMMENT ON COLUMN public.tools.is_active IS 'Активен ли инструмент';
COMMENT ON COLUMN public.tools.is_public IS 'Доступен ли инструмент публично';
COMMENT ON COLUMN public.tools.company_id IS 'ID компании-владельца инструмента';
COMMENT ON COLUMN public.tools.user_id IS 'ID пользователя-создателя инструмента';
COMMENT ON COLUMN public.tools.display_name IS 'Отображаемое имя инструмента';
COMMENT ON COLUMN public.tools.category IS 'Категория инструмента';

-- 9. Настройка RLS (Row Level Security) если нужно
-- ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- 10. Создание политик доступа (раскомментируйте если нужно)
-- CREATE POLICY "Users can view public tools" ON public.tools
--     FOR SELECT USING (is_public = true);

-- CREATE POLICY "Users can view their company tools" ON public.tools
--     FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

-- CREATE POLICY "Users can create tools for their company" ON public.tools
--     FOR INSERT WITH CHECK (company_id = auth.jwt() ->> 'company_id');

-- CREATE POLICY "Users can update their company tools" ON public.tools
--     FOR UPDATE USING (company_id = auth.jwt() ->> 'company_id');

-- CREATE POLICY "Users can delete their company tools" ON public.tools
--     FOR DELETE USING (company_id = auth.jwt() ->> 'company_id');

COMMENT ON TABLE public.tools IS 'Обновлено до новой схемы с поддержкой name как уникального ключа'; 