-- Функция для получения последних чатов с оптимизацией и фильтрацией
-- Использует window function для получения последнего сообщения для каждого чата
-- Поддерживает фильтрацию по company_id и другим параметрам

CREATE OR REPLACE FUNCTION get_latest_chats(
    p_company_id text DEFAULT NULL,
    p_instance_id uuid DEFAULT NULL,
    p_limit integer DEFAULT 100
)
RETURNS TABLE (
    chat_id text,
    instance_id uuid,
    contact_name character varying(255),
    from_number character varying(50),
    is_group boolean,
    group_id character varying(255),
    last_message text,
    last_message_timestamp bigint,
    updated_at timestamp without time zone,
    session_id uuid
) 
LANGUAGE SQL
STABLE
AS $$
    WITH latest_messages AS (
        SELECT 
            m.chat_id,
            m.instance_id,
            m.contact_name,
            m.from_number,
            m.is_group,
            m.group_id,
            m.message_body as last_message,
            m.timestamp as last_message_timestamp,
            m.updated_at,
            m.session_id,
            ROW_NUMBER() OVER (
                PARTITION BY m.instance_id, m.chat_id 
                ORDER BY m.timestamp DESC NULLS LAST, m.updated_at DESC
            ) as rn
        FROM public.messages m
        INNER JOIN public.message_instances mi ON m.instance_id = mi.id
        WHERE m.chat_id IS NOT NULL
          AND (p_company_id IS NULL OR mi.company_id = p_company_id)
          AND (p_instance_id IS NULL OR m.instance_id = p_instance_id)
    )
    SELECT 
        lm.chat_id,
        lm.instance_id,
        lm.contact_name,
        lm.from_number,
        lm.is_group,
        lm.group_id,
        lm.last_message,
        lm.last_message_timestamp,
        lm.updated_at,
        lm.session_id
    FROM latest_messages lm
    WHERE lm.rn = 1
    ORDER BY lm.last_message_timestamp DESC NULLS LAST, lm.updated_at DESC
    LIMIT p_limit;
$$;

-- Создаем индексы для оптимизации функции (если еще не созданы)
CREATE INDEX IF NOT EXISTS idx_messages_instance_chat_timestamp_composite 
ON public.messages (instance_id, chat_id, timestamp DESC, updated_at DESC) 
WHERE chat_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_message_instances_company_id 
ON public.message_instances (company_id) 
WHERE company_id IS NOT NULL;

-- Комментарий к функции
COMMENT ON FUNCTION get_latest_chats(text, uuid, integer) IS 'Возвращает последние чаты с фильтрацией по company_id и instance_id, сгруппированные по instance_id и chat_id, отсортированные по времени последнего сообщения'; 