# CHANGELOG

## [Неопубликованные изменения]

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

### Removed

- **src/app/auth/login/page.tsx**: Удалена отдельная страница входа (заменена единой страницей аутентификации)
- **src/app/auth/register/page.tsx**: Удалена отдельная страница регистрации (заменена единой страницей аутентификации)

## [Unreleased]

### Добавлено

- Новые MagicUI компоненты: IconCloud, NumberTicker, AuroraText, Meteors
- Статичное облако специальностей с hover-эффектами
- 10 профессиональных специальностей: Support, Designer, Finance Broker, Analyst, Realtor, HR Manager, Lawyer, Archivist, Content Manager, Translator

### Changed

- src/components/BusinessFeaturesBento.tsx: Изменена компоновка блока "Передовые AI-технологии под капотом" - иконка и текст теперь располагаются в столбик вместо строки
