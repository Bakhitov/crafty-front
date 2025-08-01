-- Исправление создания компаний - они должны быть активными по умолчанию
-- Выполните этот файл в Supabase Dashboard -> SQL Editor

-- 1. Обновляем функцию создания компании - делаем новые компании активными
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

    -- Создаем новую компанию (по умолчанию is_active = false, требует активации)
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

-- 2. Изменяем значение по умолчанию для новых компаний на false (требует активации)
ALTER TABLE ai.companies ALTER COLUMN is_active SET DEFAULT false;

-- 3. Предоставляем права на выполнение функции
GRANT EXECUTE ON FUNCTION public.create_user_company(UUID, TEXT) TO anon, authenticated; 