# Vercel Deployment Guide

## Проблемы на продакшене и их решения

### 1. Mixed Content Errors (HTTPS → HTTP)

**Проблема**: HTTPS сайт не может делать запросы к HTTP API
**Решение**: ✅ Обновлены все API клиенты для использования HTTPS в продакшене

### 2. CORS Errors

**Проблема**: Render.com сервер не поддерживает CORS preflight запросы
**Решение**: ✅ Добавлены CORS заголовки и OPTIONS обработчики

### 3. Cookie Parsing Errors

**Проблема**: Supabase cookies с base64 содержимым не парсятся корректно
**Решение**: ✅ Добавлена безопасная обработка cookies и автоочистка

## Environment Variables для Vercel

Добавьте следующие переменные окружения в настройках Vercel:

### Обязательные переменные:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API Endpoints
NEXT_PUBLIC_INSTANCES_API_URL=https://13.61.141.6

# Node Environment
NODE_ENV=production
```

### Опциональные переменные:

```bash
# Custom messenger server (если используете другой сервер)
MESSENGER_SERVER_URL=https://your-messenger-server.com

# CORS настройки
CORS_ORIGIN=https://your-domain.vercel.app
```

## Настройка в Vercel Dashboard

1. Перейдите в ваш проект на Vercel
2. Откройте Settings → Environment Variables
3. Добавьте каждую переменную:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://your-project.supabase.co`
   - **Environments**: Production, Preview, Development

## Файлы конфигурации

### vercel.json (уже создан)

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, X-Requested-With"
        },
        { "key": "Access-Control-Max-Age", "value": "86400" }
      ]
    }
  ],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## Проверка после деплоя

### 1. Проверьте HTTPS endpoints:

```bash
# Health check должен работать через HTTPS
curl https://your-app.vercel.app/api/v1/agents/public

# Messenger API через прокси
curl https://your-app.vercel.app/api/v1/instances
```

### 2. Проверьте CORS:

```javascript
// В консоли браузера
fetch('https://your-app.vercel.app/api/v1/agents/public')
  .then((response) => response.json())
  .then((data) => console.log('CORS работает:', data))
  .catch((error) => console.error('CORS ошибка:', error))
```

### 3. Проверьте cookies:

- Откройте DevTools → Application → Cookies
- Убедитесь что Supabase cookies не содержат ошибок
- При ошибках cookies автоматически очистятся

## Troubleshooting

### Mixed Content Errors

Если видите ошибки "Mixed Content", проверьте:

- Все API URLs используют HTTPS в продакшене
- Environment variables правильно настроены
- `NODE_ENV=production` установлена

### CORS Errors

Если CORS блокирует запросы:

- Проверьте что `vercel.json` правильно настроен
- Убедитесь что API routes возвращают CORS заголовки
- Проверьте что OPTIONS requests обрабатываются

### Cookie Errors

Если видите "Failed to parse cookie string":

- Очистите cookies браузера
- Перезагрузите страницу
- Компонент `CookieErrorHandler` автоматически очистит поврежденные cookies

## Оптимизация для продакшена

### 1. Кеширование

```javascript
// API responses кешируются на 5 минут
headers: {
  'Cache-Control': 'public, max-age=300, s-maxage=300'
}
```

### 2. Error Handling

- Все API errors логируются
- Fallback для недоступных сервисов
- Graceful degradation для CORS ошибок

### 3. Performance

- Prefetch критических данных
- Оптимизированные bundle размеры
- CDN для статических ресурсов

## Мониторинг

### Vercel Analytics

Включите Vercel Analytics для мониторинга:

- Core Web Vitals
- API response times
- Error rates

### Error Tracking

Ошибки автоматически логируются в:

- Vercel Function Logs
- Browser Console (для клиентских ошибок)
- Supabase Dashboard (для auth ошибок)

## Дальнейшие шаги

1. **SSL Certificate**: Автоматически предоставляется Vercel
2. **Custom Domain**: Настройте в Vercel Dashboard
3. **CDN**: Автоматически включен для всех статических ресурсов
4. **Monitoring**: Настройте алерты для критических ошибок

## Контрольный список деплоя

- ✅ Environment variables настроены
- ✅ vercel.json создан
- ✅ HTTPS endpoints настроены
- ✅ CORS заголовки добавлены
- ✅ Cookie error handling добавлен
- ✅ Mixed Content issues исправлены
- ✅ Error monitoring настроен

После выполнения всех шагов ваше приложение должно работать стабильно на Vercel без CORS, Mixed Content и Cookie ошибок!
