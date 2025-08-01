-- Обновляем функции для работы с новыми полями is_active и restricted_at
-- Выполните этот файл в Supabase Dashboard -> SQL Editor

-- 0. Удаляем существующие функции
DROP FUNCTION IF EXISTS public.get_user_company(UUID);
DROP FUNCTION IF EXISTS public.create_user_company(UUID, TEXT);

-- 1. Создаем функцию для получения компании пользователя
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

-- 2. Создаем функцию для создания компании
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

    -- Создаем новую компанию (по умолчанию is_active = false)
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

-- 3. Изменяем значение по умолчанию для новых компаний с true на false
ALTER TABLE public.companies ALTER COLUMN is_active SET DEFAULT false;

-- 4. Предоставляем права на выполнение функций
GRANT EXECUTE ON FUNCTION public.get_user_company(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_company(UUID, TEXT) TO anon, authenticated; 