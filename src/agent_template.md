Создание агента

- name (обязательное поле )
- description (не обязательное)
- system_instructions (обязательное)
- tool_ids (не обязательное)
- user_id, company_id автоматически подставлять
- agent_id автоматически генерируется
- is_active (обязательно по умолчанию true)
- created_at, updated_at (now)
- is_public (обязательно по умолчанию false)
- photo, category, goal, expected_output, role ( не обязательное )
- model_config { ниже буду описаны все что в modal}
- agent_config { ниже буду описаны все что в agent кроме model }

# Базовые настройки storage=true(дефолтное)

agent = Agent(
model=OpenAIChat(id="gpt-4.1-mini-2025-04-14"),
add_history_to_messages=True,
num_history_runs=3,
add_datetime_to_instructions=True,
markdown=True
storage=enable (и все поля которе минимально нужны для этого)
)

# Базовые настройки storage=false

agent = Agent(
model=OpenAIChat(id="gpt-4.1-mini-2025-04-14"),
markdown=True
)
