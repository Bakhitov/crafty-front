-- Создаем функцию для получения ID агентов пользователя из схемы ai
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

-- Предоставляем права на выполнение функции
GRANT EXECUTE ON FUNCTION public.get_user_agent_ids(UUID) TO anon, authenticated; 