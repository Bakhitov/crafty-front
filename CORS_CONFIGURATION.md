# CORS Configuration Guide

## Проблема с OPTIONS запросами для health endpoint

### Текущая ситуация:

- Браузер отправляет `OPTIONS /v1/health HTTP/1.1` вместо `GET /v1/health HTTP/1.1`
- Получаем `400 Bad Request` вместо `200 OK`

### Причина:

Браузер автоматически отправляет **preflight OPTIONS запросы** перед кросс-доменными запросами (CORS). Это происходит когда:

1. Запрос идет на другой домен/порт
2. Используются нестандартные заголовки
3. Метод отличается от GET/POST/HEAD

### Решение:

1. ✅ **Обновлен health check** в `src/lib/requestCache.ts` - добавлена обработка ошибок CORS
2. ✅ **Создана CORS утилита** в `src/lib/cors.ts` для всех API роутов
3. ✅ **Добавлены OPTIONS обработчики** в API роуты

## CORS Configuration для разных платформ

### 1. Vercel

#### Метод 1: vercel.json (рекомендуется)

Создайте файл `vercel.json` в корне проекта:

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
  ]
}
```

#### Метод 2: Next.js middleware (уже реализован)

В `src/middleware.ts` добавлены CORS заголовки для API роутов.

### 2. Render.com

#### Метод 1: Environment Variables

В настройках Render добавьте переменные окружения:

```
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization,X-Requested-With
```

#### Метод 2: render.yaml

Создайте файл `render.yaml`:

```yaml
services:
  - type: web
    name: agent-ui
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
    headers:
      - path: /api/*
        name: Access-Control-Allow-Origin
        value: '*'
      - path: /api/*
        name: Access-Control-Allow-Methods
        value: 'GET, POST, PUT, DELETE, OPTIONS'
      - path: /api/*
        name: Access-Control-Allow-Headers
        value: 'Content-Type, Authorization, X-Requested-With'
```

### 3. Agno Server Configuration

Agno сервер должен поддерживать OPTIONS запросы для health endpoint:

```javascript
// Пример для Express.js
app.options('/v1/health', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.sendStatus(200)
})

app.get('/v1/health', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})
```

## Тестирование CORS

### 1. Проверка health endpoint:

```bash
# Проверка OPTIONS запроса
curl -X OPTIONS http://localhost:8000/v1/health \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -v

# Проверка GET запроса
curl -X GET http://localhost:8000/v1/health \
  -H "Origin: http://localhost:3000" \
  -v
```

### 2. Проверка из браузера:

```javascript
// В консоли браузера
fetch('http://localhost:8000/v1/health')
  .then((response) => response.json())
  .then((data) => console.log('Success:', data))
  .catch((error) => console.error('Error:', error))
```

## Рекомендации

### Для разработки:

- Используйте `*` для Access-Control-Allow-Origin
- Включите все необходимые методы и заголовки

### Для продакшена:

- Ограничьте Access-Control-Allow-Origin конкретными доменами
- Используйте HTTPS
- Настройте правильные credentials policy

### Пример продакшен конфигурации:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://yourdomain.com"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        },
        { "key": "Access-Control-Allow-Credentials", "value": "true" }
      ]
    }
  ]
}
```

## Отладка CORS проблем

### 1. Проверьте Network tab в DevTools:

- Ищите OPTIONS запросы перед основными запросами
- Проверьте заголовки ответа на наличие Access-Control-\*

### 2. Типичные ошибки:

- `CORS policy: No 'Access-Control-Allow-Origin' header`
- `CORS policy: Method GET is not allowed`
- `CORS policy: Request header is not allowed`

### 3. Решения:

- Убедитесь что сервер отвечает на OPTIONS запросы
- Проверьте что все заголовки разрешены
- Убедитесь что домен включен в Access-Control-Allow-Origin
