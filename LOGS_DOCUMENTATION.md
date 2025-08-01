# Документация по логам системы

В системе Instance Manager существует два типа логов:

## 📊 System Logs (Instance Manager)

**Что это:** Общие системные логи самого Instance Manager - сервиса, который управляет всеми мессенджер инстансами.

**Где находятся:**

- API: `/api/v1/logs` и `/api/v1/logs/latest`
- UI: Кнопка "System Logs" в разделе Resource Management

**Что содержат:**

- Логи запуска/остановки Instance Manager
- Системные события (подключения к базе данных, ошибки сервера)
- Общая статистика и мониторинг
- HTTP запросы к API Instance Manager
- Ошибки управления инстансами

**Примеры логов:**

```
[2024-01-15T10:30:25.123Z] [INFO] Instance Manager started successfully
[2024-01-15T10:30:26.456Z] [HTTP] GET /api/v1/instances - 200
[2024-01-15T10:30:27.789Z] [ERROR] Failed to connect to instance abc123
[2024-01-15T10:30:28.012Z] [WARN] High memory usage detected on server
```

**Функции:**

- ✅ Фильтрация по уровню (error, warn, info, http, debug)
- ✅ Поиск по содержимому
- ✅ Автообновление в реальном времени
- ✅ Экспорт в файл
- ✅ Цветовая индикация

---

## 📱 Instance Logs (Container)

**Что это:** Логи отдельных мессенджер инстансов (контейнеров) - каждого конкретного бота или подключения.

**Где находятся:**

- API: `/api/v1/instances/{instanceId}/logs` (через messengerAPI.getInstanceLogs)
- UI: Кнопка "Instance Logs" на каждом инстансе

**Что содержат:**

- Логи работы конкретного мессенджер бота
- Сообщения отправки/получения
- Ошибки подключения к мессенджеру (WhatsApp, Telegram и т.д.)
- QR коды для авторизации
- Статус подключения к мессенджер сервисам

**Примеры логов:**

```
[2024-01-15T10:30:25.123Z] WhatsApp Web client connected
[2024-01-15T10:30:26.456Z] QR code generated for authentication
[2024-01-15T10:30:27.789Z] Message sent to +1234567890
[2024-01-15T10:30:28.012Z] ERROR: Connection to WhatsApp lost
```

**Функции:**

- ✅ Просмотр логов контейнера
- ✅ ANSI цветовая поддержка
- ✅ Автоскролл к новым записям
- ✅ Обновление логов

---

## 🔍 Как выбрать нужный тип логов

| Ситуация                        | Тип логов     | Где искать                         |
| ------------------------------- | ------------- | ---------------------------------- |
| Система не запускается          | System Logs   | Resource Management → System Logs  |
| Проблемы с API Instance Manager | System Logs   | Resource Management → System Logs  |
| Высокая нагрузка на сервер      | System Logs   | Resource Management → System Logs  |
| Конкретный бот не работает      | Instance Logs | Конкретный инстанс → Instance Logs |
| Проблемы с отправкой сообщений  | Instance Logs | Конкретный инстанс → Instance Logs |
| QR код не генерируется          | Instance Logs | WhatsApp инстанс → Instance Logs   |

---

## 🛠 Технические детали

### System Logs API

```typescript
// Получить системные логи с фильтрацией
GET /api/v1/logs?tail=500&level=error

// Получить последние логи для polling
GET /api/v1/logs/latest?lines=100
```

### Instance Logs API

```typescript
// Получить логи конкретного инстанса
GET /api/v1/instances/{instanceId}/logs?tail=500
```

### Методы messengerAPI

```typescript
// Системные логи
messengerAPI.getInstanceManagerLogs(tail, level)
messengerAPI.getLatestInstanceManagerLogs(lines)

// Логи инстанса
messengerAPI.getInstanceLogs(instanceId, options)
```
