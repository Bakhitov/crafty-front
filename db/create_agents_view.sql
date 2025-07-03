-- Создаем view в схеме public для доступа к таблице ai.agents
-- Это позволит Supabase API обращаться к данным через public схему

CREATE OR REPLACE VIEW public.agents AS 
SELECT id, name, created_at, updated_at, user_id
FROM ai.agents;

-- Предоставляем права на view
GRANT SELECT ON public.agents TO anon, authenticated;

-- Дополнительно можно создать политики RLS если нужно
-- ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own agents" ON public.agents FOR SELECT USING (auth.uid() = user_id); 