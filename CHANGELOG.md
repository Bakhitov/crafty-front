# CHANGELOG

## [Неопубликованные изменения]

### Added

- **src/components/playground/AgentCreator/AgentCreator.tsx**: Добавлены главные тумблеры для секций конфигурации:
  - Тумблер "Enable Tools" в заголовке секции Tools (по умолчанию выключен)
  - Тумблер "Enable Memory" в заголовке вкладки Memory (по умолчанию выключен)
  - Тумблер "Enable Storage" в заголовке вкладки Storage (по умолчанию выключен)
  - Тумблер "Enable Knowledge Base" в заголовке вкладки Knowledge Base (по умолчанию выключен)
  - При выключенных тумблерах соответствующие конфигурации передаются как пустые объекты `{}`
  - Функция `loadAgentData()` обновлена для правильной загрузки состояний тумблеров при редактировании
  - Реструктурированы заголовки во вкладке Memory: убран общий заголовок, добавлены индивидуальные заголовки для каждой вкладки (Memory, Storage, Knowledge Base) с тумблерами на той же строке
  - Возвращен общий заголовок "Memory & Knowledge & Storage" над внутренними табами
  - Установлены дефолтные значения модели: OpenAI GPT-4.1 выбран по умолчанию
  - Уменьшены размеры внутренних заголовков (с `text-sm` на `text-xs`) чтобы они были меньше общего заголовка
- **src/components/playground/AgentCreator/AgentCreator.tsx**: Добавлена полноценная функция удаления агентов:
  - Реализована функция `handleDelete()` с подтверждением удаления
  - Добавлена кнопка удаления в превью агента (только в режиме редактирования)
  - Кнопка удаления расположена в правом верхнем углу карточки превью
  - После удаления происходит обновление списка агентов и возврат к главному экрану
  - Использует API маршрут `DELETE /v1/agents/{agent_id}`
- **Интеграция динамических инструментов из API**:
  - Заменены статичные массивы инструментов на динамическую загрузку из эндпоинтов
  - Добавлена функция `fetchToolsFromAPI()` для загрузки:
    - Dynamic tools: `/v1/tools/`
    - Custom tools: `/v1/tools/custom`
    - MCP servers: `/v1/tools/mcp`
  - Добавлен индикатор загрузки инструментов в интерфейсе
  - Инструменты теперь соответствуют реальным данным из системы

### Fixed

- **src/components/playground/AgentCreator/AgentCreator.tsx**: Исправлены проблемы с инпутами и навигацией:
  - Исправлена проблема с фокусом инпутов (фокус слетал после первого символа)
  - Компонент `FormField` вынесен за пределы основного компонента для предотвращения перерендеринга
  - Добавлена функция `navigateToAgentChat()` для автоматического перехода к чату с агентом
  - После сохранения/редактирования агент автоматически выбирается и открывается в playground
  - После удаления происходит возврат к главному экрану playground
- **src/components/playground/AgentCreator/AgentCreator.tsx**: Оптимизировано обновление превью агента:
  - Добавлены отдельные состояния `previewAgentName` и `previewAgentDescription` для сайдбара
  - Превью обновляется с задержкой 300ms (debounce) вместо обновления на каждый символ
  - Устранены лаги при вводе текста в поля имени и описания агента
- **src/components/playground/AgentCreator/AgentCreator.tsx**: Добавлены значения по умолчанию для конфигурации:
  - `memory_config.db_url`: добавлено значение по умолчанию для предотвращения ошибок валидации
  - `storage_config.db_url`: добавлено значение по умолчанию PostgreSQL URL
  - `memory_config.db_schema` и `storage_config` получили значения по умолчанию

### Fixed

- **src/components/playground/Sidebar/ToolsList.tsx**: Исправлена ESLint ошибка react-hooks/exhaustive-deps:
  - Добавлены недостающие зависимости в useCallback: `toolsCache.dynamicTools.length`, `toolsCache.customTools.length`, `toolsCache.mcpServers.length`, `CACHE_LIFETIME`
- **src/components/playground/Sidebar/ToolsList.tsx**: Исправлена проблема со скроллингом списка инструментов:
  - Добавлены правильные классы для TabsContent: `data-[state=active]:flex data-[state=active]:flex-col`
  - Изменена структура контейнеров для корректной работы overflow-y-auto
  - Теперь списки инструментов правильно скроллятся во всех вкладках
- **src/components/playground/Sidebar/Sidebar.tsx**: Исправлена проблема со скроллингом в основном сайдбаре:
  - Заменен неправильный расчет высоты `h-[calc(100%-80px)]` на правильную flex структуру
  - Добавлены классы `h-full data-[state=active]:flex data-[state=active]:flex-col` для всех TabsContent
  - Теперь списки агентов и инструментов корректно скроллятся в левом сайдбаре
- **src/components/playground/Sidebar/ToolsList.tsx**: Финальное исправление структуры для скроллинга:
  - Убран промежуточный `div` с `overflow-hidden` который блокировал скроллинг
  - Изменена структура: `Tabs` теперь имеет `flex-1 flex-col overflow-hidden`
  - `TabsContent` теперь имеет `flex-1 overflow-hidden` для правильной работы скролла
  - Добавлен класс `shrink-0` к `TabsList` для предотвращения сжатия
- **src/components/playground/Sidebar/ToolsList.tsx**: Исправлена проблема повторной загрузки списка инструментов:
  - Добавлено кеширование инструментов в глобальном store с временем жизни 5 минут
  - Инструменты больше не загружаются заново при каждом переключении на таб "Tools"
  - Кеш автоматически очищается при смене эндпоинта или отключении
  - Добавлены типы `DynamicTool`, `CustomTool`, `McpServer` в store для кеширования
  - Реализованы методы `setToolsCache`, `setToolsLoading`, `clearToolsCache` в store
- **src/store.ts**: Добавлена система кеширования инструментов:
  - Добавлено состояние `toolsCache` с массивами всех типов инструментов
  - Добавлено отслеживание времени последней загрузки (`lastFetchTime`)
  - Добавлен флаг загрузки для состояния UI
- **src/components/playground/Sidebar/ToolsList.tsx**: Исправлена консистентность стилей списка инструментов:
  - Возвращены оригинальные стили фона `bg-background-secondary` и `hover:bg-background-secondary/80` как в списке агентов
  - Обновлены стили скелетонов загрузки и пустых состояний для соответствия дизайн-системе
  - Обеспечена визуальная консистентность между списками агентов и инструментов
- **src/components/playground/AgentCreator/AgentCreator.tsx**: Исправлена навигация при закрытии AgentCreator:
  - Теперь при клике на крестик (X) правильно возвращается в playground
  - Исправлены функции `handleClose()`, `handleSave()` и `handleDelete()` - добавлен сброс `editingAgentId`
  - Добавлено извлечение `setEditingAgentId` из store для корректной очистки состояния
- **src/components/playground/AgentCreator/AgentCreator.tsx**: Изменена иконка удаления агента:
  - Заменена иконка `X` на иконку корзины (`trash`) для лучшей UX
  - Использует компонент `Icon` вместо прямого импорта из `lucide-react`
- **Переименование табов инструментов для консистентности**:
  - **src/components/playground/AgentCreator/AgentCreator.tsx**: Упрощены названия табов в секции Tools:
    - "Native Tools" → "Native"
    - "MCP Servers" → "MCP"
    - "Custom Tools" → "Custom"
  - **src/components/playground/Sidebar/ToolsList.tsx**: Добавлен маппинг для отображения типов инструментов:
    - `dynamic` → "Native"
    - `mcp` → "MCP"
    - `custom` → "Custom"
  - **src/components/playground/Sidebar/ToolsList.tsx**: Добавлены табы для фильтрации инструментов:
    - Таб "All" - показывает все инструменты
    - Таб "Native" - показывает только динамические инструменты
    - Таб "MCP" - показывает только MCP серверы
    - Таб "Custom" - показывает только кастомные инструменты
    - Добавлены пустые состояния для каждого типа инструментов
- **Завершен полный CRUD функционал для агентов**:
  - ✅ CREATE: реализовано через `POST /v1/agents`
  - ✅ READ: реализовано через `GET /v1/agents/detailed`
  - ✅ UPDATE: реализовано через `PUT /v1/agents/{agent_id}`
  - ✅ DELETE: теперь полностью реализовано через `DELETE /v1/agents/{agent_id}`
- **Структура агентов полностью соответствует требованиям бэкенда**:
  - Все основные поля (`id`, `name`, `agent_id`, `description`, `instructions`, `is_active`, `is_active_api`, `is_public`, `company_id`, `created_at`, `updated_at`)
  - Все конфигурационные блоки (`model_configuration`, `tools_config`, `memory_config`, `knowledge_config`, `storage_config`, `reasoning_config`, `team_config`, `settings`)
  - Незначительные различия: `tools_config.tools` заполняется пустым массивом (можно дополнить статическими инструментами при необходимости)
- **src/hooks/useChatActions.ts**: Исправлена проблема с исчезающим списком агентов при создании нового агента:
  - При переходе на `?agent=new` список агентов в левом сайдбаре теперь остается видимым
  - Убрана преждевременная остановка загрузки агентов в `initializePlayground()` при `agentId === 'new'`
  - Агенты загружаются независимо от режима создания/редактирования

### Added

- **src/components/playground/AgentInfoSidebar/AgentInfoSidebar.tsx**: Добавлена кнопка обновления кеша агента:

  - Кнопка с иконкой `refresh` расположена рядом с кнопкой сворачивания сайдбара
  - Функция `handleRefreshAgent` отправляет POST запрос на `/v1/agents/{agent_id}/cache/refresh`
  - После очистки кеша автоматически перезагружает данные агента
  - Добавлена анимация вращения иконки во время обновления
  - Кнопка отключается для нового агента (agent=new) и во время процесса обновления

- **src/components/playground/AgentCreator/AgentCreator.tsx**: Добавлены отсутствующие поля интерфейса для полного соответствия документации Agno:
  - **Tools Configuration**: Добавлена новая вкладка "Static Tools" с полями:
    - `Static Tools JSON` - для определения статических инструментов (массив JSON объектов)
    - `Function Declarations JSON` - для объявлений функций (массив JSON объектов)
  - **Advanced Settings**: Реструктуризирована секция на 3 логических таба:
    - **Behavior Tab**: Stream Response, Markdown Support, Add Datetime, Read Chat History, Debug Mode, JSON Mode, Exponential Backoff, Monitoring (все toggle/switch поля)
    - **System Tab**: History Runs Count, Retries, Retry Delay, Tags, Timezone (числовые параметры и метаданные)
    - **Context Tab**: Поля организованы в два столбика для компактности:
      - Левый столбик: Session Name, Additional Context, Context JSON
      - Правый столбик: User Message Template, Additional Messages JSON, Response Model JSON
  - Все новые поля корректно интегрированы в payload для отправки в Agno API
  - Добавлены соответствующие обработчики onChange для всех новых полей с правильной типизацией
  - JSON поля отображаются с моноширинным шрифтом для лучшей читаемости
  - TabsList в Tools секции расширен с 3 до 4 колонок для новой вкладки Static Tools

### Fixed

- **src/components/playground/AgentCreator/AgentCreator.tsx**: Добавлена валидация полей провайдера и модели перед сохранением агента для предотвращения ошибок валидации

- **src/components/playground/AgentCreator/AgentCreator.tsx**: Исправлено предупреждение "Error in memory/summary operation: You must provide either a message or a list of messages":

  - Изменено дефолтное значение `enableSessionSummaries` с `true` на `false` для новых агентов
  - Это предотвращает попытку создания резюме сессии когда еще нет сообщений в истории

- **src/components/playground/AgentCreator/AgentCreator.tsx**: Исправлены дефолтные значения для storage_config и memory_config:

  - Добавлен дефолтный db_url для PostgreSQL подключения вместо undefined process.env переменной
  - Изменено дефолтное значение table_name с 'agent_sessions' на 'sessions' для соответствия стандарту
  - Исправлена ошибка "db_url обязателен для типа хранилища: postgres" при создании агентов

- **src/components/playground/AgentCreator/AgentCreator.tsx**: Исправлена структура payload для соответствия документации Agno:

  - Убрано дублирование поля `is_active` - теперь используется только `is_active_api`
  - Исправлена структура `memory_config`: заменено `schema` на `db_schema`, улучшена структура `memory_filters`
  - Исправлена структура `storage_config`: заменено `schema` на `db_schema`
  - Исправлена структура `reasoning_config`: добавлены обязательные поля `goal`, `success_criteria`, `expected_output`
  - Переработана структура `settings`: перенесены соответствующие поля из других конфигураций согласно документации
  - Убран хардкод URL базы данных, заменен на `process.env.NEXT_PUBLIC_DATABASE_URL`
  - Исправлен provider name с `'open-ai'` на `'openai'` для соответствия стандарту
  - Переведены все русские строки и комментарии на английский язык
  - Обновлена версия конфигурации до `'2.0'` и добавлен `app_id: 'agent-ui'`

- **src/components/playground/AgentCreator/AgentCreator.tsx**: Исправлена проблема валидации model_configuration для OpenAI:

  - Теперь для OpenAI провайдера используется поле 'stop' вместо 'stop_sequences' при сохранении агента
  - Обновлена логика загрузки данных агента для корректной обработки как 'stop' (OpenAI), так и 'stop_sequences' (другие провайдеры)
  - Исправлена ошибка "Используйте 'stop' вместо 'stop_sequences' для OpenAI" при создании/редактировании агентов с OpenAI моделями

- **src/components/playground/AgentCreator/AgentCreator.tsx**: Исправлены проблемы с полями ввода и интерфейсом:
  - Исправлен импорт `TextArea` вместо `Textarea` - исправлена проблема с вводом только одного символа в полях textarea
  - Добавлена правильная типизация для всех обработчиков событий `onChange` с типом `React.ChangeEvent<HTMLTextAreaElement>`
  - Убран тумблер "Active" из интерфейса во вкладке Basic (дублировался с "API Enabled")
  - Переименован "API Enabled" в "Active" с обновленным описанием "Enable or disable agent"
  - Обновлена логика активности агента - теперь используется единое поле `isActiveAPI`
  - Исправлен сайдбар предварительного просмотра агента - убрано дублирование статусов "Status" и "API Access"
  - Уменьшено количество переключателей в базовой настройке с 3 до 2 (убран дублирующий тумблер)

### Added

- **src/components/playground/AgentCreator/AgentCreator.tsx**: Добавлена поддержка режима редактирования агентов:
  - Добавлена загрузка существующих данных агента при редактировании
  - Динамическое изменение заголовка (Create New Agent / Edit Agent)
  - Поддержка обновления агентов через PUT запрос
  - Корректная загрузка всех конфигураций агента (модель, инструменты, память, знания, хранилище, рассуждения, настройки)
  - Добавлена кнопка Cancel для отмены операции
  - Добавлены индикаторы загрузки для режима редактирования
- **src/store.ts**: Добавлены поля для поддержки режима редактирования:
  - `editingAgentId` - ID редактируемого агента
  - `setEditingAgentId` - функция для установки режима редактирования
- **src/components/playground/Sidebar/AgentsList.tsx**: Обновлена логика кнопок создания и редактирования:
  - Кнопка "Create Agent" переключает в режим создания нового агента
  - Кнопка редактирования агента переключает в режим редактирования существующего агента
  - Правильная установка состояния для режимов создания/редактирования
- **src/hooks/useChatActions.ts**: Исправлена установка `hasStorage` в функции `initializePlayground`:
  - Добавлена установка `hasStorage` для выбранного агента при первой загрузке
  - Исправлена проблема с отсутствием сессий при первой загрузке страницы
- **src/components/playground/AgentCreator/AgentCreator.tsx**: Реализована полная функциональность создания агентов:
  - Добавлена полная логика сохранения агентов через API endpoint `/v1/agents`
  - Добавлено автоматическое генерирование `agent_id` с транслитерацией и временной меткой
  - Добавлены поля статуса агента: `is_active`, `is_active_api`, `is_public`
  - Интегрированы все конфигурации: модель, инструменты, память, знания, хранилище, рассуждения, настройки
  - Добавлена навигация в playground после успешного создания агента
  - Добавлены состояния загрузки для кнопки сохранения
  - Добавлено отображение статуса агента в превью сайдбара
- **src/app/agent-editor/page.tsx**: Создан полнофункциональный компонент для создания и редактирования агентов с дизайном в стиле AgentInfoSidebar. Включает:
  - 7 вкладок: Basic, Model, Tools, Memory, Knowledge, Team, Advanced
  - Полную конфигурацию модели (temperature, top_p, penalties, stop sequences, seed)
  - Расширенные настройки инструментов (dynamic_tools, custom_tools, mcp_servers, tool_choice)
  - Конфигурацию памяти (agentic memory, user memories, database settings)
  - Настройки знаний (RAG, references, similarity threshold)
  - Конфигурацию рассуждений (reasoning mode, goals, max steps)
  - Командные настройки (team mode, role, storage configuration)
  - Продвинутые параметры (debug mode, stream, JSON mode, retries, timezone)
  - Анимации Framer Motion, адаптивный дизайн, превью агента в сайдбаре
- **src/components/ui/input.tsx**: Создан UI компонент Input для форм ввода
- **src/components/ui/tabs.tsx**: Создан UI компонент Tabs для переключения между вкладками без зависимости от radix-ui
- **src/components/ui/separator.tsx**: Создан UI компонент Separator для визуального разделения контента
- **src/components/playground/AgentCreator/**: Создан компонент AgentCreator для создания агентов в режиме замещения ChatArea и AgentInfoSidebar

### Changed

- **src/components/playground/AgentInfoSidebar/AgentInfoSidebar.tsx**: Исправлены проблемы с прокруткой и отображением контента:
  - Исправлена прокрутка списка чатов (сессий) - теперь можно прокрутить до самого конца
  - Добавлены тултипы для description и instructions с полным контентом при наведении
  - Улучшена структура layout с правильным использованием flexbox и overflow
  - Добавлено сокращение длинного текста с помощью line-clamp-3
- **src/components/playground/Sidebar/Sessions/Sessions.tsx**: Обновлена высота контейнера для правильной работы в новом layout AgentInfoSidebar
- **src/app/globals.css**: Добавлены CSS стили для line-clamp-3 utility класса

### Fixed

- **src/components/playground/ChatArea/Messages/Messages.tsx**: Исправлена ошибка `TypeError: reasoning.map is not a function` в компоненте Reasonings. Добавлена проверка типа данных и преобразование одиночного объекта reasoning в массив
- **src/types/playground.ts**: Обновлены типы для поддержки reasoning_steps как массива или одиночного объекта (ReasoningSteps[] | ReasoningSteps)
- **src/hooks/useAIStreamHandler.tsx**: Обновлена проверка длины reasoning_steps для поддержки как массивов, так и одиночных объектов
- **src/components/playground/Sidebar/Sessions/SessionBlankState.tsx**: Удален неиспользуемый импорт `Link` из `next/link` для исправления ошибки ESLint
- **src/hooks/useAIResponseStream.tsx**: Заменены флаги регулярных выражений `/s` на `[\s\S]` для совместимости с ES2017 и устранения ошибок компиляции TypeScript

### Added

- **src/components/magicui/bento-grid.tsx**: Создан компонент bento-grid на основе Magic UI для красивого отображения возможностей продукта
- **src/components/BusinessFeaturesBento.tsx**: Создан новый компонент с bento-grid макетом для блока "Мощные возможности для вашего бизнеса", адаптированный для МСБ и платформы цифровых сотрудников. Включает уникальный контент без повторений с остальным лендингом, правильную поддержку темной темы и корректные z-index для анимаций. Использует правильные стили проекта и уникальный контент без повторений с другими секциями

- **src/components/magicui/rainbow-button.tsx**: Добавлен компонент RainbowButton из MagicUI с анимированным радужным эффектом
- **src/app/api/v1/agents/route.ts**: Создан API endpoint для получения агентов с фильтрацией по user_id (гибридный подход: запрос к Agno API + фильтрация по БД)
- **db/create_function.sql**: Создана SQL функция get_user_agent_ids для получения ID агентов пользователя из схемы ai через Supabase API
- **db/apply_to_supabase.sql**: Создан объединенный SQL файл для применения всех изменений в Supabase Dashboard (функции и view для фильтрации агентов по user_id)
- **src/api/routes.ts**: Добавлен новый route GetUserAgents для получения пользовательских агентов
- **src/api/playground.ts**: Добавлена функция getUserAgentsAPI для работы с пользовательскими агентами
- **src/hooks/useChatActions.ts**: Обновлена логика получения агентов - теперь авторизованные пользователи видят только свои агенты из БД
- **src/hooks/useAIStreamHandler.tsx**: Добавлена передача user_id в запросы к Agno API при наличии аутентифицированного пользователя
- **src/components/LandingPage.tsx**: Создана страница лендинга с информацией о проекте и кнопкой входа
- **src/app/playground/page.tsx**: Создана отдельная страница для интерфейса чата (перенесена с главной страницы)
- **package.json**: Добавлены зависимости @supabase/supabase-js и @supabase/ssr для авторизации
- **src/lib/supabase.ts**: Создана конфигурация Supabase client для работы с авторизацией и SSR
- **src/hooks/useAuth.ts**: Создан хук для управления авторизацией через Supabase (вход, регистрация, выход, сброс пароля)
- **src/components/AuthProvider.tsx**: Создан провайдер контекста для управления состоянием авторизации
- **src/components/UserMenu.tsx**: Создан компонент меню пользователя с возможностью выхода
- **src/middleware.ts**: Создан middleware для защиты приватных роутов и редиректов
- **src/app/auth/reset-password/page.tsx**: Создана страница для сброса пароля
- **src/components/ui/icon/types.ts**: Добавлен тип 'log-out' для иконки выхода
- **src/components/ui/icon/constants.tsx**: Добавлена иконка LogOut из lucide-react
- **.vscode/settings.json**: Добавлена конфигурация VS Code для корректной работы с Tailwind CSS
- **.vscode/css_custom_data.json**: Создан файл с кастомными CSS данными для поддержки Tailwind директив
- **.vscode/extensions.json**: Добавлены рекомендации расширений VS Code для проекта
- **src/components/playground/ChatArea/Messages/MessageItem.tsx**: Добавлена обработка markdown для пользовательских сообщений
- **src/components/ui/typography/MarkdownRenderer/styles.tsx**: Добавлен компонент CodeBlock для блоков кода с подсветкой синтаксиса
- **src/components/ui/typography/MarkdownRenderer/inlineStyles.tsx**: Добавлен компонент InlineCode для инлайн кода
- **package.json**: Добавлены зависимости react-syntax-highlighter и @types/react-syntax-highlighter
- **src/app/auth/page.tsx**: Создана единая страница аутентификации с переключением между входом и регистрацией
- **src/components/ui/icon/types.ts**: Добавлен тип 'arrow-left' для навигации
- **src/components/playground/Sidebar/Sidebar.tsx**: Добавлена кнопка входа в заголовок сайдбара
- **src/components/magicui/rainbow-button.tsx**: Изменены цвета фона на светло-серый и текста на черный
- **src/components/LandingPage.tsx**: Заменены обычные кнопки на RainbowButton, добавлена секция отзывов с Marquee
- **src/app/globals.css**: Добавлены CSS переменные для анимации радуги
- **src/components/magicui/rainbow-button.tsx**: Теперь имеет светло-серый фон (#f5f5f5) и черный текст для лучшей читаемости
- **src/components/LandingPage.tsx**: Marquee отзывов использует pauseOnHover и duration 60 секунд
- **src/components/LandingPage.tsx**: Добавлены отзывы от разных ролей: CEO, CTO, Marketing Director, Head of Operations, Product Manager, Data Scientist, HR Director, Founder, CFO, Tech Lead
- **src/components/LandingPage.tsx**: Добавлен компонент RainbowButton с радужным ободком для кнопок "Попробовать бесплатно"
- **src/components/LandingPage.tsx**: Добавлен компонент TestimonialCard для отображения отзывов клиентов
- **src/components/LandingPage.tsx**: Реализован Marquee компонент для отзывов с двумя рядами, движущимися в противоположных направлениях
- **src/components/LandingPage.tsx**: Добавлено 7 дополнительных псевдоотзывов от различных компаний и должностей
- **src/components/LandingPage.tsx**: Добавлена новая секция "Интеграции" с популярными мессенджерами
- **src/components/LandingPage.tsx**: Добавлен компонент MessageItem для отображения сообщений из разных платформ
- **src/components/LandingPage.tsx**: Реализован AnimatedList для живой ленты входящих сообщений
- **src/components/LandingPage.tsx**: Добавлены лого и интеграции для 8 популярных мессенджеров: Telegram, WhatsApp, Discord, Slack, Viber, VKontakte, Facebook Messenger, Instagram
- **src/components/LandingPage.tsx**: Добавлен NumberTicker для анимации цифр 85% и 70% в статистике
- **src/components/LandingPage.tsx**: Применен AuroraText к слову "CRAFTY" в главном заголовке с радужными цветами
- **src/components/magicui/icon-cloud.tsx**: Добавлены пропсы width и height для настройки размера

### Modified

- **src/components/BusinessFeaturesBento.tsx**: Убран отступ снизу у заголовка "Передовые AI-технологии под капотом" (удален класс mb-2)
- **src/app/api/v1/agents/route.ts**: Добавлено исключение для demo_agent - агент с agent_id = "demo_agent" теперь доступен всем пользователям без проверки принадлежности
- **src/components/LandingPage.tsx**: Заменен блок "Мощные возможности для вашего бизнеса" с обычной сетки карточек на современный bento-grid макет с анимированными компонентами
- **src/components/magicui/bento-grid.tsx**: Обновлены стили для правильной поддержки темной темы проекта (bg-background вместо bg-white/bg-black) и исправлены z-index для корректного отображения анимаций поверх статичного текста

- **src/components/LandingPage.tsx**: Заменена секция "Для кого это решение" на "Какие специальности можно заменить" с 10 профессиями. Заменен IconCloud компонент на статичное облако с абсолютным позиционированием элементов для лучшей производительности и избежания ошибок с кодировкой. Изменены названия специальностей на английский язык.
- **src/components/LandingPage.tsx**: Удалены блоки преимуществ ("Работают 24/7", "Экономия до 90%", "Мгновенное масштабирование") из секции специальностей
- **src/components/LandingPage.tsx**: Добавлены 4 новые специальности: Фин. брокер, Риелтор, Юрист, Контент-менеджер к существующим 6
- **src/components/LandingPage.tsx**: Специальности теперь отображаются в 3D облаке с автоматическим вращением и интерактивностью через IconCloud компонент
- **src/components/LandingPage.tsx**: Добавлены анимации для секции специальностей: пульсация центрального AI-агента, последовательное появление специальностей с задержкой, hover-эффекты масштабирования и анимированные соединительные линии с пульсирующим градиентом
- **src/components/LandingPage.tsx**: Убран неиспользуемый импорт IconCloud
- **src/components/LandingPage.tsx**: Заменены обычные кнопки "Попробовать бесплатно" на RainbowButton с анимированным радужным эффектом
- **src/components/magicui/rainbow-button.tsx**: Улучшена анимация - теперь радужный эффект отображается по всему бордеру, а не только снизу
- **src/app/globals.css**: Исправлены CSS переменные и анимации для корректной работы rainbow-button
- **tailwind.config.ts**: Добавлена анимация rainbow в конфигурацию Tailwind CSS
- **src/components/LandingPage.tsx**: Исправлены стили компонентов согласно дизайн-системе playground:
  - Заменены все шрифты с неправильных размеров на правильные компоненты Heading и Paragraph
  - Исправлены стили кнопок: используется правильный размер (size="lg"), текст xs uppercase, rounded-xl
  - Обновлены размеры иконок с h-6 w-6 на h-4/h-5 w-4/w-5 согласно playground
  - Добавлен text-center ко всем заголовкам (Heading) для центрирования текста
  - Используются правильные цвета: border-primary/15, bg-accent, hover:bg-accent/80
- **src/components/ui/typography/Heading/Heading.tsx**: Исправлена логика компонента для поддержки центрирования текста:
  - Добавлена проверка className на наличие text-center
  - При использовании text-center убирается flex-layout, который конфликтовал с центрированием
- **src/app/page.tsx**: Главная страница теперь показывает лендинг вместо интерфейса чата
- **src/middleware.ts**: Убрана главная страница (/) из защищенных роутов, теперь авторизованные пользователи перенаправляются на /playground
- **src/app/globals.css**: Улучшена видимость скроллбара - изменен цвет с светлого #f5f5f5 на темно-серый #A1A1AA с эффектом hover
- **src/components/ui/sonner.tsx**: Исправлена видимость текста и иконок в уведомлениях - используются правильные цвета из кастомной цветовой схемы проекта (#FAFAFA для текста, #27272A для фона)
- **src/app/auth/page.tsx**: Переведен интерфейс авторизации на английский язык для соответствия остальному интерфейсу
- **src/middleware.ts**: Добавлена главная страница (/) в список защищенных роутов, требующих авторизации
- **src/components/playground/Sidebar/Sidebar.tsx**: Заменена кнопка "Login" на "Logout" с функцией выхода из системы
- **src/app/auth/page.tsx**: Исправлена логика перенаправления после успешного входа - убран ручной редирект для предотвращения перезагрузки страницы
- **src/app/auth/page.tsx**: Унифицированы стили кнопок входа/регистрации с кнопкой "New Chat" на главной странице
- **src/app/layout.tsx**: Добавлен AuthProvider для управления состоянием авторизации во всем приложении
- **src/app/auth/page.tsx**: Обновлена страница авторизации для работы с Supabase Auth (вход, регистрация, сброс пароля)
- **src/app/auth/page.tsx**: Удалены анимации загрузки и появления элементов для более быстрого отображения
- **package.json**: Добавлен флаг `--turbopack` в скрипт `dev` для ускорения разработки
- **src/components/ui/typography/MarkdownRenderer/styles.tsx**: Исправлена типизация компонента Img
- **src/components/ui/typography/MarkdownRenderer/inlineStyles.tsx**: Исправлена типизация компонента Img
- **src/components/ui/typography/MarkdownRenderer/styles.tsx**: Улучшены стили markdown компонентов:
  - Заменена светлая тема на темную (vscDarkPlus) для блоков кода
  - Добавлены заголовки с языком программирования и декоративные элементы
  - Улучшены отступы между элементами для лучшей читаемости
  - Сделаны рамки менее яркими (border-border/10 вместо border-border/30)
  - Уменьшены отступы заголовков для лучшей связи с последующими элементами
- **src/components/playground/ChatArea/ChatInput/ChatInput.tsx**: Исправлена проблема с контролируемым/неконтролируемым input
- **src/components/ui/textarea.tsx**: Добавлена защита от переключения между контролируемым и неконтролируемым состоянием
- **src/components/playground/Sidebar/Sidebar.tsx**: Улучшено позиционирование кнопки сворачивания сайдбара (top-4 вместо top-2)
- **src/components/playground/Sidebar/Sidebar.tsx**: Обновлена ссылка входа с /auth/login на /auth
- **src/app/auth/page.tsx**: Убраны анимации переключения между режимами входа и регистрации
- **src/components/magicui/rainbow-button.tsx**: Изменены цвета фона на светло-серый и текста на черный
- **src/components/LandingPage.tsx**: Заменены обычные кнопки на RainbowButton, добавлена секция отзывов с Marquee
- **src/components/LandingPage.tsx**: Сделан блок мессенджеров статичным (убраны hover эффекты)
- **src/components/LandingPage.tsx**: Зафиксирован размер блока сообщений для отображения ровно 3 элементов
- **src/components/magicui/animated-list.tsx**: Реализована циклическая анимация с появлением новых сообщений сверху
- **src/components/magicui/animated-list.tsx**: Ускорена анимация (delay уменьшен до 1500ms)
- **src/components/magicui/animated-beam.tsx**: Исправлены ESLint ошибки
- **src/app/globals.css**: Добавлены CSS переменные для анимации радуги
- **src/components/magicui/icon-cloud.tsx**: Добавлены пропсы width и height для настройки размера
- **tailwind.config.ts**: Добавлены анимации rainbow, marquee и aurora
- **src/app/globals.css**: Добавлены CSS переменные для анимаций
- **src/app/globals.css**: Добавлена CSS анимация float для плавающего движения элементов по осям X и Y
- **src/components/LandingPage.tsx**: Специальности теперь плавно движутся в разных направлениях с индивидуальными задержками (6-секундный цикл)
- **src/components/LandingPage.tsx**: Соединительные линии сделаны тоньше (strokeWidth="1") и светлее (opacity 0.05-0.3) для лучшей видимости
- **src/app/globals.css**: Добавлена анимация float для плавающих элементов
- **package.json**: Добавлены зависимости для MagicUI компонентов
- **tailwind.config.ts**: Обновлена конфигурация для поддержки новых анимаций

### Configuration

- **Supabase URL**: https://wyehpfzafbjfvyjzgjss.supabase.co
- **База данных**: PostgreSQL с указанными в user_rules параметрами подключения
- **Схема безопасности**: Middleware защищает роуты /, /playground и /api от неавторизованных пользователей

### Fixed

- **src/app/api/v1/agents/route.ts**: Исправлен запрос к базе данных - добавлен правильный указатель схемы .schema('ai') для доступа к таблице agents
- **src/components/UserMenu.tsx**: Исправлена проблема с кнопкой logout - теперь использует router.replace('/auth') для корректного перенаправления
- **src/app/auth/page.tsx**: Исправлена проблема с перенаправлением после успешного входа - добавлен принудительный редирект на /playground
- **src/hooks/useAuth.ts**: Улучшена логика signOut - пользователь сразу очищается для мгновенного обновления UI
- **src/middleware.ts**: Добавлено автоматическое перенаправление с главной страницы на /playground для авторизованных пользователей
- **src/app/auth/page.tsx**: Упрощена логика useEffect для перенаправления авторизованных пользователей
- **src/components/ui/typography/MarkdownRenderer/styles.tsx**: Исправлена типизация компонента InlineCode - children теперь необязательное свойство
- **src/components/ui/typography/MarkdownRenderer/inlineStyles.tsx**: Исправлена типизация компонента InlineCode - children теперь необязательное свойство
- **src/components/magicui/icon-cloud.tsx**: Удален неиспользуемый state
- **src/api/playground.ts**: Исправлена фильтрация сессий по user_id - теперь getAllPlaygroundSessionsAPI, getPlaygroundSessionAPI и deletePlaygroundSessionAPI принимают параметр userId для корректной фильтрации по пользователю
- **src/hooks/useSessionLoader.tsx**: Добавлена передача user_id при загрузке сессий для фильтрации по авторизованному пользователю
- **src/components/playground/Sidebar/Sessions/SessionItem.tsx**: Добавлена передача user_id при удалении сессии для проверки прав доступа

### Removed

- **src/app/auth/login/page.tsx**: Удалена отдельная страница входа (заменена единой страницей аутентификации)
- **src/app/auth/register/page.tsx**: Удалена отдельная страница регистрации (заменена единой страницей аутентификации)

## [Unreleased]

### Added

- **src/components/playground/Sidebar/ToolsList.tsx**: Создан компонент для отображения списка инструментов в левом сайдбаре в стиле проекта:
  - Поддержка трех типов инструментов: dynamic, custom и MCP серверы
  - Простой интерфейс в стиле AgentsList с минимальными действиями
  - Отображение статуса активности инструментов
  - Кнопка "Create Tool" в стиле проекта
  - Состояния загрузки с skeleton placeholder'ами
  - Обработка ошибок и пустых состояний (blank state)
  - Английский интерфейс
  - Высота контейнера адаптирована под новую структуру
  - Интеграция с API endpoints: `/v1/tools/`, `/v1/tools/custom`, `/v1/tools/mcp`
- **src/components/playground/Sidebar/Sidebar.tsx**: Интегрирован ToolsList компонент в таб "Tools"

- Создан компонент для создания агентов `src/components/playground/AgentCreator/AgentCreator.tsx` с полной функциональностью
- Добавлены недостающие UI компоненты: `src/components/ui/input.tsx`, `src/components/ui/tabs.tsx`, `src/components/ui/separator.tsx`
- Реализованы все 7 табов в AgentCreator: Basic, Model, Tools, Memory, Knowledge, Team, Advanced
- Добавлено состояние `isAgentCreationMode` в store для переключения режимов в playground
- Интегрирован AgentCreator в playground с кнопкой "Create Agent" в левом сайдбаре
- Добавлен индексный файл `src/components/playground/AgentCreator/index.ts`
- Обновлена страница playground для условного рендеринга AgentCreator вместо ChatArea и AgentInfoSidebar

### Modified

- Обновлен `src/store.ts` - добавлено состояние для режима создания агента
- Обновлен `src/components/playground/Sidebar/Sidebar.tsx` - добавлена кнопка "Create Agent"
- Обновлен `src/app/playground/page.tsx` - добавлен условный рендеринг для режима создания агента

### Changed

- src/components/playground/Sidebar/Sidebar.tsx: Заменил текст на иконки в табах левого сайдбара (Agents, Tools, Workflows, Connections), добавил title атрибуты для подсказок при наведении
- src/components/playground/Sidebar/Sidebar.tsx: Заменил иконки workflows (settings -> workflow) и connections (paperclip -> link) на более подходящие
- src/components/ui/icon/constants.tsx: Добавил новые иконки workflow и link из lucide-react
- src/components/ui/icon/types.ts: Добавил типы для новых иконок workflow и link
- src/app/layout.tsx: Заменил Google Fonts Geist на локальный пакет geist/font/sans для решения проблем с подключением к fonts.googleapis.com, сохранил DM_Mono для заголовков и интерфейса
- src/components/playground/ChatArea/Messages/MessageItem.tsx: Добавил font-light для сообщений пользователя, чтобы сделать шрифт тоньше

### Fixed

- Исправлены иконки провайдеров (openai → open-ai, google → gemini) в AgentCreator
- Устранены проблемы с линтером в коде форматирования
- Убран фоновый цвет и граница в шапке AgentCreator для более чистого вида
- **src/components/playground/AgentCreator/AgentCreator.tsx**: Исправлена ESLint ошибка "@next/next/no-img-element" - заменен `<img>` тег на `<Image />` компонент из next/image для оптимизации загрузки изображений
- **src/components/playground/AgentInfoSidebar/AgentInfoSidebar.tsx**: Улучшена структура сайдбара агента:
  - Убрана возможность редактирования и создания агентов (только просмотр)
  - Удалены все табы (Settings, Tools, Configs)
  - Убраны кнопки редактирования, сохранения и удаления
  - Оставлена только базовая информация об агенте (название, описание, инструкции, статусы)
  - Кнопка "New Chat" и список сессий перенесены под описание агента (туда где раньше были табы)
  - Добавлена секция "Чаты" с заголовком для лучшей организации
  - Удалены неиспользуемые функции, типы и импорты
  - Новая структура: AgentSelector → Информация об агенте → Секция "Чаты" (New Chat + Sessions)
- **src/components/playground/Sidebar/AgentsList.tsx**: Создан новый компонент для отображения полноценного списка агентов в левом сайдбаре:
  - Отображение агентов в виде списка с названием, ID и иконкой провайдера модели
  - Визуальное выделение активного агента
  - Полноценная кнопка "Create Agent" внизу списка агентов (заменила маленькую иконку)
  - Состояния загрузки и пустого списка
  - Скролл для большого количества агентов
  - Интеграция с существующей логикой переключения агентов
- **src/components/playground/Sidebar/Sidebar.tsx**: Упрощен левый сайдбар:

  - Добавлен компонент AgentsList с встроенной кнопкой создания агента
  - Удален отдельный компонент CreateAgentButton (встроен в AgentsList)
  - Убраны неиспользуемые функции и компоненты

- **Исправлена проблема исчезновения списка агентов при создании нового агента**:

  - **src/hooks/useChatActions.ts**: Убрано `setAgents([])` из условия `agentId === 'new'` в функции `initializePlayground`
  - **src/components/playground/Sidebar/AgentsList.tsx**: Изменено условие отображения `AgentBlankState` чтобы не показывать его при создании агента (`agentId !== 'new'`)
  - Теперь список агентов остается видимым при нажатии на "Create Agent"

- **Улучшения UI в AgentCreator**:

  - **src/components/playground/AgentCreator/AgentCreator.tsx**: Исправлены иконки и добавлена функция удаления:
    - Увеличен размер заголовка "Edit Agent:" и "Create New Agent" с `text-xs` до `text-lg` для лучшей видимости
    - Кнопка удаления перенесена в правый верхний угол карточки превью агента
    - Исправлены иконки табов на более подходящие по смыслу:
      - Avatar: `user` (пользователь)
      - Model: `cpu` (процессор)
      - Tools: `hammer` (молоток) - уже был правильным
      - Memory: `brain` (мозг)
      - Advanced: `settings` (настройки)
    - Все иконки в табах остаются светлыми (`text-zinc-300`) на темном фоне
    - Иконка Save/Update теперь темная (`text-zinc-900`) для лучшей видимости на светлой кнопке
    - Добавлена кнопка удаления агента в виде маленькой иконки корзинки в превью агента
    - Кнопка удаления малозаметная (`text-zinc-500`) с красным hover эффектом
    - Реализована функция `handleDelete()` с подтверждением удаления и обновлением списка агентов
    - Кнопка удаления показывается только в режиме редактирования существующего агента
  - **src/components/ui/icon/**: Добавлены новые иконки `brain`, `settings`, `image`, `cpu`

- **Исправлены проблемы с левым сайдбаром и URL параметром agent=new**:
  - **src/components/playground/Sidebar/Sidebar.tsx**: Добавлены иконки в табы левого сайдбара:
    - Agents: `agent` (иконка агента)
    - Tools: `hammer` (молоток)
    - Workflows: `settings` (настройки)
    - Connections: `paperclip` (скрепка)
    - Все иконки светлые (`text-zinc-300`) на темном фоне табов
  - **src/app/playground/page.tsx**: Исправлена проблема с URL `/playground?agent=new`:
    - Добавлен useEffect для синхронизации `isAgentCreationMode` с URL параметром `agent`
    - Теперь при переходе по URL с `agent=new` корректно устанавливается режим создания агента
    - Левый сайдбар остается видимым с табами и списком агентов

### Changed

- **src/components/playground/AgentCreator/AgentCreator.tsx**: Заменен Supabase на Backend API для загрузки данных агента при редактировании:

  - Функция `loadAgentData` теперь использует эндпоинт `/v1/agents/detailed` вместо прямого обращения к Supabase
  - Добавлен интерфейс `AgentData` для типизации данных агента
  - Удален неиспользуемый импорт `supabase`
  - Улучшена обработка различных конфигураций агента (response_config, debug_config, streaming_config, etc.)

- **src/components/playground/AgentInfoSidebar/AgentInfoSidebar.tsx**: Заменен Supabase на Backend API для получения деталей агента:
  - Функция `fetchAgentDetails` теперь использует эндпоинт `/v1/agents/detailed` вместо прямого обращения к Supabase
  - Обновлен интерфейс `AgentDetails` для соответствия структуре API
  - Удален неиспользуемый импорт `supabase`

### Removed

- Устранена зависимость от Supabase для операций чтения данных агентов (за исключением авторизации и получения списка агентов с фильтрацией)

### Fixed

- **src/components/playground/AgentCreator/AgentCreator.tsx**: Исправлен URL для PUT запроса при обновлении агента:

  - Изменено с `PUT /v1/agents` на `PUT /v1/agents/{agent_id}` для корректной передачи ID агента в URL
  - Заменен `initializePlayground` на `refreshAgentsList` для более быстрого обновления списка агентов без полной перезагрузки

- **src/hooks/useChatActions.ts**: Добавлена функция `refreshAgentsList` для оптимизированного обновления только списка агентов без полной инициализации playground

### Added

- **src/components/playground/Sidebar/ToolsList.tsx**: Создан компонент для отображения списка инструментов в левом сайдбаре в стиле проекта:
  - Поддержка трех типов инструментов: dynamic, custom и MCP серверы
  - Простой интерфейс в стиле AgentsList с минимальными действиями
  - Отображение статуса активности инструментов
  - Кнопка "Create Tool" в стиле проекта
  - Состояния загрузки с skeleton placeholder'ами
  - Обработка ошибок и пустых состояний (blank state)
  - Английский интерфейс
  - Высота контейнера адаптирована под новую структуру
  - Интеграция с API endpoints: `/v1/tools/`, `/v1/tools/custom`, `/v1/tools/mcp`
- **src/components/playground/Sidebar/Sidebar.tsx**: Интегрирован ToolsList компонент в таб "Tools"

### Updated

- **src/types/playground.ts** - Обновлена структура Agent интерфейса под новую схему данных:
  - Добавлены новые интерфейсы: ModelConfiguration, ToolsConfiguration, MemoryConfiguration, KnowledgeConfiguration, StorageConfiguration, ReasoningConfiguration, TeamConfiguration, AgentSettings
  - Обновлен интерфейс Agent с полной поддержкой новой структуры данных
  - Добавлены поля: id, is_active, is_active_api, is_public, company_id, created_at, updated_at
  - Сохранена обратная совместимость со старыми полями model и storage
- **src/api/routes.ts** - Добавлены новые API маршруты для CRUD операций с агентами:
  - CreateAgent, UpdateAgent, DeleteAgent, GetAgent для работы напрямую с Agno API
- **src/components/playground/AgentCreator/AgentCreator.tsx** - Полностью обновлен компонент под новую структуру агентов:
  - Реализована загрузка данных агента при редактировании с новой структурой
  - Обновлена функция buildAgentPayload для создания объекта агента в новом формате
  - Добавлены поля статуса агента: is_active, is_active_api, is_public в основную форму
  - Обновлена логика сохранения агентов с отправкой данных напрямую в Agno API
  - Добавлено отображение статуса агента в превью сайдбаре
  - Добавлен индикатор загрузки в заголовке при редактировании агента
  - Исправлены типы и удалены неиспользуемые импорты для соответствия линтеру

### Fixed

- Исправлены все предупреждения линтера в AgentCreator компоненте
- В файлах src/components/playground/Sidebar/Sidebar.tsx и src/components/playground/AgentInfoSidebar/AgentInfoSidebar.tsx для иконки sheet (кнопка коллапса) добавлен класс text-primary для корректного отображения в светлой теме.
