-- Перенос таблицы companies из схемы ai в схему public
-- Выполните этот файл в Supabase Dashboard -> SQL Editor

-- ЭТАП 1: ПОДГОТОВКА
-- 1.1. Создаем резервную копию данных
CREATE TABLE IF NOT EXISTS ai.companies_backup AS 
SELECT * FROM ai.companies;

-- 1.2. Отключаем RLS на старой таблице для миграции
ALTER TABLE ai.companies DISABLE ROW LEVEL SECURITY;

-- ЭТАП 2: СОЗДАНИЕ НОВОЙ ТАБЛИЦЫ В PUBLIC СХЕМЕ
-- 2.1. Создаем таблицу companies в схеме public
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  user_ids TEXT[] NULL,
  name TEXT NULL,
  type TEXT NULL,
  restricted_at TIMESTAMP WITH TIME ZONE NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);

-- 2.2. Копируем данные из старой таблицы в новую
INSERT INTO public.companies (id, created_at, updated_at, user_ids, name, type, restricted_at, is_active)
SELECT id, created_at, updated_at, user_ids, name, type, restricted_at, is_active
FROM ai.companies
ON CONFLICT (id) DO NOTHING;

-- 2.3. Создаем индексы
CREATE INDEX IF NOT EXISTS idx_companies_user_ids ON public.companies USING GIN (user_ids);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies (is_active);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON public.companies (created_at);

-- ЭТАП 3: ОБНОВЛЕНИЕ ФУНКЦИЙ
-- 3.1. Удаляем старые функции
DROP FUNCTION IF EXISTS public.get_user_company(UUID);
DROP FUNCTION IF EXISTS public.create_user_company(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_user_agent_ids(TEXT);

-- 3.2. Создаем функцию для получения компании пользователя (обновленная для public.companies)
CREATE OR REPLACE FUNCTION public.get_user_company(p_user_id UUID)
RETURNS TABLE(
    id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_ids TEXT[],
    name TEXT,
    type TEXT,
    restricted_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT c.id, c.created_at, c.updated_at, c.user_ids, c.name, c.type, c.restricted_at, c.is_active
    FROM public.companies c
    WHERE p_user_id::TEXT = ANY(c.user_ids)
    LIMIT 1;
$$;

-- 3.3. Создаем функцию для создания компании (обновленная для public.companies)
CREATE OR REPLACE FUNCTION public.create_user_company(
    p_user_id UUID,
    p_user_email TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_ids TEXT[],
    name TEXT,
    type TEXT,
    restricted_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    company_name TEXT;
    new_company public.companies%ROWTYPE;
BEGIN
    -- Проверяем, есть ли уже компания у пользователя
    IF EXISTS (
        SELECT 1 FROM public.companies c 
        WHERE p_user_id::TEXT = ANY(c.user_ids)
    ) THEN
        -- Возвращаем существующую компанию
        RETURN QUERY 
        SELECT c.id, c.created_at, c.updated_at, c.user_ids, c.name, c.type, c.restricted_at, c.is_active
        FROM public.companies c
        WHERE p_user_id::TEXT = ANY(c.user_ids)
        LIMIT 1;
        RETURN;
    END IF;

    -- Генерируем имя компании
    IF p_user_email IS NOT NULL THEN
        company_name := split_part(p_user_email, '@', 1) || ' Company';
    ELSE
        company_name := 'My Company';
    END IF;

    -- Создаем новую компанию (is_active = false, требует активации)
    INSERT INTO public.companies (name, type, user_ids, is_active)
    VALUES (company_name, 'default', ARRAY[p_user_id::TEXT], false)
    RETURNING * INTO new_company;

    -- Возвращаем созданную компанию
    RETURN QUERY 
    SELECT new_company.id, new_company.created_at, new_company.updated_at, 
           new_company.user_ids, new_company.name, new_company.type, 
           new_company.restricted_at, new_company.is_active;
END;
$$;

-- 3.4. Обновляем функцию для получения агентов компании
CREATE OR REPLACE FUNCTION public.get_user_agent_ids(p_company_id TEXT)
RETURNS TABLE(agent_id TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT ai.dynamic_agents.agent_id
  FROM ai.dynamic_agents 
  WHERE ai.dynamic_agents.company_id = p_company_id
    AND ai.dynamic_agents.is_active = true;
$$;

-- ЭТАП 4: ОЧИСТКА НЕИСПОЛЬЗУЕМЫХ VIEWS
-- 4.1. Удаляем неиспользуемый view user_agents (мертвый код)
DROP VIEW IF EXISTS public.user_agents;

-- ЭТАП 5: НАСТРОЙКА RLS И ПРАВ ДОСТУПА
-- 5.1. Включаем RLS на новой таблице
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 5.2. Создаем RLS политики для public.companies
DROP POLICY IF EXISTS "Users can view their own companies" ON public.companies;
CREATE POLICY "Users can view their own companies" ON public.companies
    FOR SELECT USING (auth.uid()::TEXT = ANY(user_ids));

DROP POLICY IF EXISTS "Users can insert their own companies" ON public.companies;
CREATE POLICY "Users can insert their own companies" ON public.companies
    FOR INSERT WITH CHECK (auth.uid()::TEXT = ANY(user_ids));

DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies;  
CREATE POLICY "Users can update their own companies" ON public.companies
    FOR UPDATE USING (auth.uid()::TEXT = ANY(user_ids));

-- 5.3. Обновляем RLS политику для dynamic_agents (теперь ссылается на public.companies)
DROP POLICY IF EXISTS "Users can view public agents and their company agents" ON ai.dynamic_agents;
CREATE POLICY "Users can view public agents and their company agents" ON ai.dynamic_agents
    FOR SELECT USING (
        is_public = true OR 
        company_id IN (
            SELECT c.id::TEXT 
            FROM public.companies c 
            WHERE auth.uid()::TEXT = ANY(c.user_ids)
        )
    );

-- 5.4. Предоставляем права на новую таблицу и функции
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_company(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_company(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_agent_ids(TEXT) TO anon, authenticated;

-- ЭТАП 6: ПРОВЕРКА И ОЧИСТКА
-- 6.1. Проверяем что данные перенесены корректно
DO $$
DECLARE
    ai_count INTEGER;
    public_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ai_count FROM ai.companies;
    SELECT COUNT(*) INTO public_count FROM public.companies;
    
    IF ai_count != public_count THEN
        RAISE EXCEPTION 'Количество записей не совпадает: ai.companies = %, public.companies = %', ai_count, public_count;
    END IF;
    
    RAISE NOTICE 'Миграция успешна: перенесено % записей', public_count;
END $$;

-- 6.2. Тестируем функции
-- SELECT * FROM public.get_user_company('00000000-0000-0000-0000-000000000000'::UUID);

-- ЭТАП 7: УДАЛЕНИЕ СТАРЫХ ДАННЫХ (ОСТОРОЖНО!)
-- Раскомментируйте следующие строки только после полного тестирования:

-- -- 7.1. Удаляем старую таблицу (ОСТОРОЖНО!)
-- -- DROP TABLE IF EXISTS ai.companies CASCADE;

-- -- 7.2. Удаляем резервную копию (только после полного тестирования)
-- -- DROP TABLE IF EXISTS ai.companies_backup;

-- ЭТАП 8: КОММЕНТАРИИ К ТАБЛИЦЕ И ФУНКЦИЯМ
COMMENT ON TABLE public.companies IS 'Таблица компаний пользователей (перенесена из ai.companies)';
COMMENT ON FUNCTION public.get_user_company(UUID) IS 'Получение компании пользователя из public.companies';
COMMENT ON FUNCTION public.create_user_company(UUID, TEXT) IS 'Создание новой компании пользователя в public.companies';
COMMENT ON FUNCTION public.get_user_agent_ids(TEXT) IS 'Получение ID агентов компании';

-- Завершение миграции
SELECT 'Миграция таблицы companies в схему public завершена успешно!' as status; 