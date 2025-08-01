# 🔄 **ОБНОВЛЕНИЕ КОНФИГУРАЦИИ СТРИМИНГА**

## **Что изменилось:**

### **До изменений:**

- Настройка стриминга бралась только из глобального UI переключателя (`streamingEnabled`)
- Конфигурация агента (`agent_config.stream`) игнорировалась
- Всегда передавался `stream: 'true'` в стрим-режиме

### **После изменений:**

- **Приоритет:** `agent_config.stream` > по умолчанию `stream=true`
- Автоматическое определение режима на основе конфигурации агента
- Правильная передача параметра `stream` в API

## **Новая логика:**

### **1. Получение настройки стриминга:**

```typescript
const getStreamSetting = async (): Promise<boolean> => {
  if (!agentId) return true // По умолчанию stream=true

  try {
    const agent = await getAgent(agentId)
    if (agent?.agent_config?.stream !== undefined) {
      return agent.agent_config.stream as boolean
    }
  } catch (error) {
    console.warn('Failed to get agent config, using default stream=true')
  }

  return true // По умолчанию stream=true
}
```

### **2. Автоматический выбор обработчика:**

```typescript
const handleRequest = async (input: string | FormData) => {
  const shouldStream = await getStreamSetting()

  if (shouldStream) {
    return handleStreamResponse(input)
  } else {
    return handleNonStreamResponse(input)
  }
}
```

## **Обновленные файлы:**

### **`src/hooks/useAgnoStreamHandler.tsx`:**

- ✅ Добавлен импорт `useAgents`
- ✅ Добавлена функция `getStreamSetting()`
- ✅ Добавлен новый метод `handleRequest()`
- ✅ Экспортируется `handleRequest` как основной метод

### **`src/components/playground/ChatArea/ChatInput/ChatInput.tsx`:**

- ✅ Использует `handleRequest` вместо условной логики
- ✅ Убран неиспользуемый `streamingEnabled`
- ✅ Автоматическое определение режима стриминга

## **Преимущества:**

1. **Соответствие конфигурации агента** - стриминг настраивается на уровне агента
2. **По умолчанию stream=true** - как требовалось
3. **Обратная совместимость** - старые методы остались доступными
4. **Автоматическое определение** - не нужно вручную выбирать режим
5. **Правильная передача параметров** - корректный `stream` параметр в API

## **Как использовать:**

```typescript
// Старый способ (устарел):
if (streamingEnabled) {
  await handleStreamResponse(formData)
} else {
  await handleNonStreamResponse(formData)
}

// Новый способ (рекомендуется):
await handleRequest(formData) // Автоматически определяет режим
```

## **Тестирование:**

1. Создайте агента с `agent_config.stream = false`
2. Отправьте сообщение - должен использоваться non-stream режим
3. Создайте агента с `agent_config.stream = true`
4. Отправьте сообщение - должен использоваться stream режим
5. Для агентов без настройки - по умолчанию stream режим
