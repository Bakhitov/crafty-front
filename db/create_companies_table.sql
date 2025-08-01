-- Создание таблицы companies и функции для работы с компаниями
-- Выполните этот файл в Supabase Dashboard -> SQL Editor

-- 1. Создаем схему ai если её нет
CREATE SCHEMA IF NOT EXISTS ai;

-- 2. Создаем таблицу companies в схеме ai
CREATE TABLE IF NOT EXISTS ai.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  user_ids TEXT[] NULL,
  name TEXT NULL,
  type TEXT NULL,
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);

-- 3. Создаем функцию для получения компании пользователя
CREATE OR REPLACE FUNCTION public.get_user_company(p_user_id UUID)
RETURNS TABLE(
    id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_ids TEXT[],
    name TEXT,
    type TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT c.id, c.created_at, c.updated_at, c.user_ids, c.name, c.type
    FROM ai.companies c
    WHERE p_user_id = ANY(c.user_ids)
    LIMIT 1;
$$;

-- 4. Создаем функцию для автоматического создания компании при регистрации
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
    type TEXT
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
        WHERE p_user_id = ANY(c.user_ids)
    ) THEN
        -- Возвращаем существующую компанию
        RETURN QUERY 
        SELECT c.id, c.created_at, c.updated_at, c.user_ids, c.name, c.type
        FROM ai.companies c
        WHERE p_user_id = ANY(c.user_ids)
        LIMIT 1;
        RETURN;
    END IF;

    -- Генерируем имя компании
    IF p_user_email IS NOT NULL THEN
        company_name := split_part(p_user_email, '@', 1) || ' Company';
    ELSE
        company_name := 'My Company';
    END IF;

    -- Создаем новую компанию
    INSERT INTO ai.companies (name, type, user_ids)
    VALUES (company_name, 'default', ARRAY[p_user_id]::TEXT[])
    RETURNING * INTO new_company;

    -- Возвращаем созданную компанию
    RETURN QUERY 
    SELECT new_company.id, new_company.created_at, new_company.updated_at, 
           new_company.user_ids, new_company.name, new_company.type;
END;
$$;

-- 5. Предоставляем права на выполнение функций
GRANT EXECUTE ON FUNCTION public.get_user_company(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_company(UUID, TEXT) TO anon, authenticated;

-- 6. Пример вставки тестовой компании (опционально)
-- INSERT INTO ai.companies (name, type, user_ids) 
-- VALUES ('Test Company', 'startup', ARRAY['00000000-0000-0000-0000-000000000000']);

-- 7. Проверяем что функция работает (для тестирования)
-- SELECT * FROM public.get_user_company('00000000-0000-0000-0000-000000000000'::UUID); 