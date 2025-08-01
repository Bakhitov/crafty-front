-- Fix company access check function
-- Execute this file in Supabase Dashboard -> SQL Editor

-- 1. Drop existing functions
DROP FUNCTION IF EXISTS public.get_user_company(UUID);
DROP FUNCTION IF EXISTS public.create_user_company(UUID, TEXT);

-- 2. Create function to get user company with correct fields
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

-- 3. Create function to create user company
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
    -- Check if user already has a company
    IF EXISTS (
        SELECT 1 FROM public.companies c 
        WHERE p_user_id::TEXT = ANY(c.user_ids)
    ) THEN
        -- Return existing company
        RETURN QUERY 
        SELECT c.id, c.created_at, c.updated_at, c.user_ids, c.name, c.type, c.restricted_at, c.is_active
        FROM public.companies c
        WHERE p_user_id::TEXT = ANY(c.user_ids)
        LIMIT 1;
        RETURN;
    END IF;

    -- Generate company name
    IF p_user_email IS NOT NULL THEN
        company_name := split_part(p_user_email, '@', 1) || ' Company';
    ELSE
        company_name := 'My Company';
    END IF;

    -- Create new company (is_active = false by default for approval)
    INSERT INTO public.companies (name, type, user_ids, is_active)
    VALUES (company_name, 'default', ARRAY[p_user_id::TEXT], false)
    RETURNING * INTO new_company;

    -- Return created company
    RETURN QUERY 
    SELECT new_company.id, new_company.created_at, new_company.updated_at, 
           new_company.user_ids, new_company.name, new_company.type, 
           new_company.restricted_at, new_company.is_active;
END;
$$;

-- 4. Ensure companies table has correct structure
-- Check if is_active column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'companies' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.companies ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Check if restricted_at column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'companies' 
        AND column_name = 'restricted_at'
    ) THEN
        ALTER TABLE public.companies ADD COLUMN restricted_at TIMESTAMP WITH TIME ZONE NULL;
    END IF;
END $$;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_company(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_company(UUID, TEXT) TO anon, authenticated;

-- 6. For testing - you can manually activate a company like this:
-- UPDATE public.companies SET is_active = true WHERE user_ids @> ARRAY['your-user-id'];

SELECT 'Company access check functions updated successfully' as result; 