-- Создание таблиц agents и tools в схеме public
-- Выполните этот файл в Supabase Dashboard -> SQL Editor

-- 1. Создаем таблицу agents в схеме public
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  model_config JSONB NOT NULL DEFAULT '{"id": "gpt-4o", "provider": "openai"}',
  system_instructions TEXT[] NOT NULL DEFAULT '{}',
  tool_ids TEXT[] NOT NULL DEFAULT '{}',
  user_id UUID NOT NULL,
  company_id UUID,
  agent_config JSONB NOT NULL DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  photo TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT agents_pkey PRIMARY KEY (id),
  CONSTRAINT agents_agent_id_unique UNIQUE (agent_id)
);

-- 2. Создаем таблицу tools в схеме public (новая структура)
CREATE TABLE IF NOT EXISTS public.tools (
  id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  type character varying(50) not null,
  description text not null,
  configuration jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  is_public boolean not null default false,
  company_id uuid null,
  user_id uuid null,
  display_name text null,
  category text null,
  constraint tools_pkey primary key (id),
  constraint tools_name_key unique (name)
);

-- 3. Создаем индексы для оптимизации запросов

-- Индексы для таблицы agents
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents (user_id);
CREATE INDEX IF NOT EXISTS idx_agents_company_id ON public.agents (company_id);
CREATE INDEX IF NOT EXISTS idx_agents_is_public ON public.agents (is_public);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON public.agents (is_active);
CREATE INDEX IF NOT EXISTS idx_agents_category ON public.agents (category);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON public.agents (created_at);
CREATE INDEX IF NOT EXISTS idx_agents_name_text_search ON public.agents USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_agents_description_text_search ON public.agents USING gin(to_tsvector('english', description));

-- Индексы для таблицы tools
CREATE INDEX IF NOT EXISTS idx_tools_type_active ON public.tools (type, is_active);
CREATE INDEX IF NOT EXISTS idx_tools_user_id ON public.tools (user_id);
CREATE INDEX IF NOT EXISTS idx_tools_company_id ON public.tools (company_id);
CREATE INDEX IF NOT EXISTS idx_tools_is_public ON public.tools (is_public);
CREATE INDEX IF NOT EXISTS idx_tools_is_active ON public.tools (is_active);
CREATE INDEX IF NOT EXISTS idx_tools_category ON public.tools (category);
CREATE INDEX IF NOT EXISTS idx_tools_created_at ON public.tools (created_at);
CREATE INDEX IF NOT EXISTS idx_tools_name_text_search ON public.tools USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_tools_description_text_search ON public.tools USING gin(to_tsvector('english', description));

-- 4. Настройка RLS (Row Level Security)

-- Включаем RLS для таблицы agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы agents
-- Пользователи могут видеть свои агенты + публичные + агенты своей компании
CREATE POLICY "Users can view their own agents, public agents, and company agents" ON public.agents
  FOR SELECT USING (
    user_id = auth.uid() OR 
    is_public = true OR 
    (company_id IS NOT NULL AND company_id IN (
      SELECT c.id FROM public.companies c WHERE auth.uid()::TEXT = ANY(c.user_ids)
    ))
  );

-- Пользователи могут создавать агенты
CREATE POLICY "Users can create agents" ON public.agents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Пользователи могут обновлять только свои агенты
CREATE POLICY "Users can update their own agents" ON public.agents
  FOR UPDATE USING (user_id = auth.uid());

-- Пользователи могут удалять только свои агенты
CREATE POLICY "Users can delete their own agents" ON public.agents
  FOR DELETE USING (user_id = auth.uid());

-- Включаем RLS для таблицы tools
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы tools
-- Пользователи могут видеть свои инструменты + публичные + инструменты своей компании
CREATE POLICY "Users can view their own tools, public tools, and company tools" ON public.tools
  FOR SELECT USING (
    user_id = auth.uid() OR 
    is_public = true OR 
    (company_id IS NOT NULL AND company_id IN (
      SELECT c.id FROM public.companies c WHERE auth.uid()::TEXT = ANY(c.user_ids)
    ))
  );

-- Пользователи могут создавать инструменты
CREATE POLICY "Users can create tools" ON public.tools
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Пользователи могут обновлять только свои инструменты
CREATE POLICY "Users can update their own tools" ON public.tools
  FOR UPDATE USING (user_id = auth.uid());

-- Пользователи могут удалять только свои инструменты
CREATE POLICY "Users can delete their own tools" ON public.tools
  FOR DELETE USING (user_id = auth.uid());

-- 5. Создаем триггеры для автоматического обновления updated_at

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для таблицы agents
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Триггер для таблицы tools
CREATE TRIGGER update_tools_updated_at BEFORE UPDATE ON public.tools
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Предоставляем права доступа
GRANT ALL ON public.agents TO anon, authenticated;
GRANT ALL ON public.tools TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated; 