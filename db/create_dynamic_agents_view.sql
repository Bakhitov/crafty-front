-- Удаляем старое представление, если существует
DROP VIEW IF EXISTS public.dynamic_agents;

-- Создаём новое представление с полями instructions и settings (добавлены в конец списка, чтобы не нарушать порядок существующих колонок)
CREATE VIEW public.dynamic_agents AS
SELECT agent_id,
       name,
       description,
       model_configuration,
       tools_config,
       knowledge_config,
       memory_config,
       storage_config,
       reasoning_config,
       team_config,
       is_active,
       is_active_api,
       created_at,
       updated_at,
       company_id,
       photo,
       is_public,
       instructions,
       settings
FROM ai.dynamic_agents;

GRANT SELECT ON public.dynamic_agents TO anon, authenticated; 