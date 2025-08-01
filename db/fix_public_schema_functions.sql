-- Исправление функций БД для использования правильной схемы public.companies
-- Выполните этот файл в Supabase Dashboard -> SQL Editor

-- ПРОБЛЕМА: Функции ссылались на неиспользуемую схему, но используется public.companies
-- РЕШЕНИЕ: Обновляем все функции для работы с public.companies

-- 1. Удаляем существующие функции
DROP FUNCTION IF EXISTS public.get_user_company(UUID);
DROP FUNCTION IF EXISTS public.create_user_company(UUID, TEXT);

-- 2. Создаем правильную функцию для получения компании пользователя
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

-- 3. Создаем правильную функцию для создания компании
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

    -- Создаем новую компанию (is_active = false по умолчанию, требует активации)
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

-- 4. Проверяем, что таблица public.companies существует и имеет нужные поля
DO $$
BEGIN
    -- Проверяем существование таблицы
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
        RAISE EXCEPTION 'Table public.companies does not exist. Please run migration first.';
    END IF;
    
    -- Проверяем наличие поля is_active
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'is_active') THEN
        RAISE EXCEPTION 'Column is_active does not exist in public.companies. Please run migration first.';
    END IF;
    
    RAISE NOTICE 'Database schema validation passed. Functions updated successfully.';
END
$$;

-- 5. Предоставляем права на выполнение функций
GRANT EXECUTE ON FUNCTION public.get_user_company(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_company(UUID, TEXT) TO anon, authenticated; 