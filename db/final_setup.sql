-- Итоговая настройка базы данных для системы компаний
-- Выполните этот файл в Supabase Dashboard -> SQL Editor

-- 1. Создаем схему ai если её нет
CREATE SCHEMA IF NOT EXISTS ai;

-- 2. Создаем таблицу companies в схеме ai с правильными полями
CREATE TABLE IF NOT EXISTS ai.companies (
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

-- 3. Удаляем существующие функции если они есть
DROP FUNCTION IF EXISTS public.get_user_company(UUID);
DROP FUNCTION IF EXISTS public.create_user_company(UUID, TEXT);

-- 4. Создаем функцию для получения компании пользователя
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
    FROM ai.companies c
    WHERE p_user_id::TEXT = ANY(c.user_ids)
    LIMIT 1;
$$;

-- 5. Создаем функцию для создания компании
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
    new_company ai.companies%ROWTYPE;
BEGIN
    -- Проверяем, есть ли уже компания у пользователя
    IF EXISTS (
        SELECT 1 FROM ai.companies c 
        WHERE p_user_id::TEXT = ANY(c.user_ids)
    ) THEN
        -- Возвращаем существующую компанию
        RETURN QUERY 
        SELECT c.id, c.created_at, c.updated_at, c.user_ids, c.name, c.type, c.restricted_at, c.is_active
        FROM ai.companies c
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
    INSERT INTO ai.companies (name, type, user_ids, is_active)
    VALUES (company_name, 'default', ARRAY[p_user_id::TEXT], false)
    RETURNING * INTO new_company;

    -- Возвращаем созданную компанию
    RETURN QUERY 
    SELECT new_company.id, new_company.created_at, new_company.updated_at, 
           new_company.user_ids, new_company.name, new_company.type, 
           new_company.restricted_at, new_company.is_active;
END;
$$;

-- 6. Предоставляем права на выполнение функций
GRANT EXECUTE ON FUNCTION public.get_user_company(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_company(UUID, TEXT) TO anon, authenticated;

-- 7. Предоставляем права на схему и таблицу
GRANT USAGE ON SCHEMA ai TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai.companies TO anon, authenticated;

-- 8. Создаем индекс для быстрого поиска по user_ids
CREATE INDEX IF NOT EXISTS idx_companies_user_ids ON ai.companies USING GIN (user_ids);

-- 9. Проверяем, что функции работают (это можно закомментировать после проверки)
-- SELECT * FROM public.get_user_company('00000000-0000-0000-0000-000000000000'::UUID); 