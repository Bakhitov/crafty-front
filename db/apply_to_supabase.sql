-- Применяем все изменения для системы фильтрации агентов по user_id
-- Выполните этот файл в Supabase Dashboard -> SQL Editor

-- 1. Создаем функцию для получения ID агентов пользователя из схемы ai
-- Это позволит обойти ограничения Supabase API по схемам
CREATE OR REPLACE FUNCTION public.get_user_agent_ids(p_user_id UUID)
RETURNS TABLE(id TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT ai.agents.id
  FROM ai.agents 
  WHERE ai.agents.user_id = p_user_id;
$$;

-- 2. Предоставляем права на выполнение функции
GRANT EXECUTE ON FUNCTION public.get_user_agent_ids(UUID) TO anon, authenticated;

-- 3. Создаем view в схеме public для доступа к таблице ai.agents (опционально)
-- Это позволит Supabase API обращаться к данным через public схему
CREATE OR REPLACE VIEW public.agents AS 
SELECT id, name, created_at, updated_at, user_id
FROM ai.agents;

-- 4. Предоставляем права на view
GRANT SELECT ON public.agents TO anon, authenticated;

-- 5. Проверяем, что функция работает (для тестирования)
-- SELECT * FROM public.get_user_agent_ids('00000000-0000-0000-0000-000000000000'::UUID); 