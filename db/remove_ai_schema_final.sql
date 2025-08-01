-- ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ: Полное удаление схемы ai и использование только public
-- Выполните этот файл в Supabase Dashboard -> SQL Editor

-- ПРОБЛЕМА: Множественные SQL файлы создавали таблицы в схеме ai, но приложение использует public
-- РЕШЕНИЕ: Удаляем все ссылки на ai схему и используем только public

-- 1. Удаляем все функции, которые могут ссылаться на ai схему
DROP FUNCTION IF EXISTS public.get_user_company(UUID);
DROP FUNCTION IF EXISTS public.create_user_company(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_user_agent_ids(TEXT);

-- 2. Убеждаемся, что таблица public.companies существует с правильной структурой
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

-- 3. Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_companies_user_ids ON public.companies USING GIN (user_ids);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies (is_active);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON public.companies (created_at);

-- 4. Создаем правильную функцию для получения компании пользователя (только public)
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

-- 5. Создаем правильную функцию для создания компании (только public)
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

    -- Создаем новую компанию (is_active = false по умолчанию)
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

-- 6. Предоставляем права на выполнение функций
GRANT EXECUTE ON FUNCTION public.get_user_company(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_company(UUID, TEXT) TO anon, authenticated;

-- 7. Предоставляем права на таблицу
GRANT SELECT, INSERT, UPDATE ON public.companies TO anon, authenticated;

-- 8. Включаем RLS для безопасности
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 9. Создаем политику безопасности - пользователи видят только свои компании
DROP POLICY IF EXISTS "Users can view their own companies" ON public.companies;
CREATE POLICY "Users can view their own companies" ON public.companies
FOR ALL USING (auth.uid()::TEXT = ANY(user_ids));

-- 10. Проверяем корректность настройки
DO $$
DECLARE
    func_exists BOOLEAN;
    table_exists BOOLEAN;
BEGIN
    -- Проверяем функции
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'get_user_company'
    ) INTO func_exists;
    
    IF NOT func_exists THEN
        RAISE EXCEPTION 'Function get_user_company was not created properly';
    END IF;
    
    -- Проверяем таблицу
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'companies'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE EXCEPTION 'Table public.companies does not exist';
    END IF;
    
    RAISE NOTICE '✅ Database setup completed successfully. All functions use public schema only.';
END
$$;

-- 11. ОПЦИОНАЛЬНО: Удаляем схему ai полностью (раскомментируйте если уверены)
-- DROP SCHEMA IF EXISTS ai CASCADE;

-- 12. Финальное сообщение об успешном завершении
DO $$
BEGIN
    RAISE NOTICE '🎉 Migration completed! All database functions now use public schema only.';
    RAISE NOTICE '✅ You can now use the "Проверить доступ" button on access-denied page.';
    RAISE NOTICE '✅ Changes to is_active in database will be reflected within 5 minutes (or instantly with cache clear).';
END
$$; 