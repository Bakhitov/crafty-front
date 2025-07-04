# CHANGELOG

## [Неопубликованные изменения]

### Добавлено
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

### Изменено
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

### Конфигурация
- **Supabase URL**: https://wyehpfzafbjfvyjzgjss.supabase.co
- **База данных**: PostgreSQL с указанными в user_rules параметрами подключения
- **Схема безопасности**: Middleware защищает роуты /, /playground и /api от неавторизованных пользователей

### Исправлено
- **src/app/api/v1/agents/route.ts**: Исправлен запрос к базе данных - добавлен правильный указатель схемы .schema('ai') для доступа к таблице agents
- **src/components/UserMenu.tsx**: Исправлена проблема с кнопкой logout - теперь использует router.replace('/auth') для корректного перенаправления
- **src/app/auth/page.tsx**: Исправлена проблема с перенаправлением после успешного входа - добавлен принудительный редирект на /playground
- **src/hooks/useAuth.ts**: Улучшена логика signOut - пользователь сразу очищается для мгновенного обновления UI
- **src/middleware.ts**: Добавлено автоматическое перенаправление с главной страницы на /playground для авторизованных пользователей
- **src/app/auth/page.tsx**: Упрощена логика useEffect для перенаправления авторизованных пользователей
- **src/components/ui/typography/MarkdownRenderer/styles.tsx**: Исправлена типизация компонента InlineCode - children теперь необязательное свойство
- **src/components/ui/typography/MarkdownRenderer/inlineStyles.tsx**: Исправлена типизация компонента InlineCode - children теперь необязательное свойство

### Удалено
- **src/app/auth/login/page.tsx**: Удалена отдельная страница входа (заменена единой страницей аутентификации)
- **src/app/auth/register/page.tsx**: Удалена отдельная страница регистрации (заменена единой страницей аутентификации) 