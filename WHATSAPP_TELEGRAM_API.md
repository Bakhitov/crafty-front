# Формат отправки сообщений через WhatsApp и Telegram

## 🟢 WhatsApp API

### Base URL

```
http://localhost:PORT/api/v1/
```

### Авторизация

```
Authorization: Bearer INSTANCE_ID
```

---

## 📤 Отправка текстового сообщения WhatsApp

**Endpoint:** `POST /api/v1/send`

### Формат запроса:

```json
{
  "number": "77475318623",
  "message": "Привет! Это текстовое сообщение.",
  "mediaType": "text"
}
```

### Поля:

- **number** (обязательное) - номер телефона получателя
- **message** (обязательное) - текст сообщения
- **mediaType** (обязательное) - должно быть `"text"` для текстовых сообщений

### Пример cURL:

```bash
curl -X POST "http://13.61.141.6:6609/api/v1/send" \
  -H "Authorization: Bearer 60e48460-8954-4dd2-a477-5d6e6bf142c0" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "77475318623",
    "message": "Привет! Это тестовое сообщение.",
    "mediaType": "text"
  }'
```

### Ответ:

```json
{
  "messageId": "false_77475318623@c.us_ABC123",
  "messageType": "text"
}
```

---

## 🖼️ Отправка изображения WhatsApp

**Endpoint:** `POST /api/v1/send`

### Формат запроса:

```json
{
  "number": "77475318623",
  "source": "https://picsum.photos/800/600",
  "caption": "Описание изображения",
  "mediaType": "image"
}
```

### Поля:

- **number** (обязательное) - номер телефона получателя
- **source** (обязательное) - URL изображения
- **caption** (опционально) - подпись к изображению
- **mediaType** (обязательное) - должно быть `"image"`

### Поддерживаемые форматы:

- JPG, JPEG
- PNG
- GIF
- WEBP

### Пример cURL:

```bash
curl -X POST "http://13.61.141.6:6609/api/v1/send" \
  -H "Authorization: Bearer 60e48460-8954-4dd2-a477-5d6e6bf142c0" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "77475318623",
    "source": "https://picsum.photos/800/600",
    "caption": "Красивое случайное изображение",
    "mediaType": "image"
  }'
```

---

## 📄 Отправка документа WhatsApp

**Endpoint:** `POST /api/v1/send`

### Формат запроса:

```json
{
  "number": "77475318623",
  "source": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  "caption": "PDF документ",
  "mediaType": "document"
}
```

### Поля:

- **number** (обязательное) - номер телефона получателя
- **source** (обязательное) - URL документа
- **caption** (опционально) - описание документа
- **mediaType** (обязательное) - должно быть `"document"`

### Поддерживаемые форматы:

- PDF
- DOC, DOCX
- XLS, XLSX
- PPT, PPTX
- TXT

### Пример cURL:

```bash
curl -X POST "http://13.61.141.6:6609/api/v1/send" \
  -H "Authorization: Bearer 60e48460-8954-4dd2-a477-5d6e6bf142c0" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "77475318623",
    "source": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "caption": "Пример PDF документа",
    "mediaType": "document"
  }'
```

---

## 🎵 Отправка аудио WhatsApp

**Endpoint:** `POST /api/v1/send`

### Формат запроса:

```json
{
  "number": "77475318623",
  "source": "https://example.com/audio.mp3",
  "caption": "Аудио файл",
  "mediaType": "audio"
}
```

### Поля:

- **number** (обязательное) - номер телефона получателя
- **source** (обязательное) - URL аудио файла
- **caption** (опционально) - описание аудио
- **mediaType** (обязательное) - должно быть `"audio"`

### Поддерживаемые форматы:

- MP3
- WAV
- OGG
- AAC

---

## 🎥 Отправка видео WhatsApp

**Endpoint:** `POST /api/v1/send`

### Формат запроса:

```json
{
  "number": "77475318623",
  "source": "https://example.com/video.mp4",
  "caption": "Видео файл",
  "mediaType": "video"
}
```

### Поля:

- **number** (обязательное) - номер телефона получателя
- **source** (обязательное) - URL видео файла
- **caption** (опционально) - описание видео
- **mediaType** (обязательное) - должно быть `"video"`

### Поддерживаемые форматы:

- MP4
- AVI
- MOV

---

## 🔵 Telegram API

### Base URL

```
http://localhost:PORT/api/v1/telegram/
```

### Авторизация

```
Authorization: Bearer BOT_TOKEN
```

---

## 📤 Отправка текстового сообщения Telegram

**Endpoint:** `POST /api/v1/telegram/send`

### Формат запроса:

```json
{
  "chatId": "134527512",
  "message": "Привет! Это текстовое сообщение."
}
```

### Поля:

- **chatId** (обязательное) - ID чата или пользователя
- **message** (обязательное) - текст сообщения

### Пример cURL:

```bash
curl -X POST "http://localhost:3002/api/v1/telegram/send" \
  -H "Authorization: Bearer YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "134527512",
    "message": "Привет из Telegram API!"
  }'
```

### Ответ:

```json
{
  "success": true,
  "messageId": "123",
  "provider": "telegram"
}
```

---

## 📝 Отправка сообщения с разметкой Telegram

**Endpoint:** `POST /api/v1/telegram/send-message`

### Формат запроса:

```json
{
  "chatId": "134527512",
  "message": "**Жирный текст** и _курсив_",
  "parseMode": "Markdown"
}
```

### Поля:

- **chatId** (обязательное) - ID чата или пользователя
- **message** (обязательное) - текст сообщения с разметкой
- **parseMode** (опционально) - формат разметки: `"Markdown"`, `"MarkdownV2"`, `"HTML"`

### Примеры разметки:

**Markdown:**

```
*курсив* или _курсив_
**жирный** или __жирный__
[ссылка](http://example.com)
`моноширинный`
```

**HTML:**

```
<i>курсив</i>
<b>жирный</b>
<a href="http://example.com">ссылка</a>
<code>моноширинный</code>
```

---

## 🖼️ Отправка изображения Telegram

**Endpoint:** `POST /api/v1/telegram/send-media`

### Формат запроса:

```json
{
  "chatId": "134527512",
  "source": "https://picsum.photos/800/600",
  "caption": "Описание изображения"
}
```

### Поля:

- **chatId** (обязательное) - ID чата или пользователя
- **source** (обязательное) - URL изображения
- **caption** (опционально) - подпись к изображению

### Пример cURL:

```bash
curl -X POST "http://localhost:3002/api/v1/telegram/send-media" \
  -H "Authorization: Bearer YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "134527512",
    "source": "https://picsum.photos/800/600",
    "caption": "Тестовое изображение"
  }'
```

---

## 🎥 Отправка видео Telegram

**Endpoint:** `POST /api/v1/telegram/send-media`

### Формат запроса:

```json
{
  "chatId": "134527512",
  "source": "https://example.com/video.mp4",
  "caption": "Видео файл"
}
```

### Поля:

- **chatId** (обязательное) - ID чата или пользователя
- **source** (обязательное) - URL видео файла
- **caption** (опционально) - описание видео

---

## 🎵 Отправка аудио Telegram

**Endpoint:** `POST /api/v1/telegram/send-media`

### Формат запроса:

```json
{
  "chatId": "134527512",
  "source": "https://example.com/audio.mp3",
  "caption": "Аудио файл"
}
```

### Поля:

- **chatId** (обязательное) - ID чата или пользователя
- **source** (обязательное) - URL аудио файла
- **caption** (опционально) - описание аудио

---

## 📄 Отправка документа Telegram

**Endpoint:** `POST /api/v1/telegram/send-media`

### Формат запроса:

```json
{
  "chatId": "134527512",
  "source": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  "caption": "PDF документ"
}
```

### Поля:

- **chatId** (обязательное) - ID чата или пользователя
- **source** (обязательное) - URL документа
- **caption** (опционально) - описание документа

---

## 📁 Способы передачи файлов

### ✅ Поддерживаемые форматы URL:

#### HTTP/HTTPS URL (рекомендуемый):

```json
{
  "source": "https://picsum.photos/800/600"
}
```

#### Локальный файл на сервере:

```json
{
  "source": "file:///path/to/image.jpg"
}
```

### ❌ НЕ поддерживаемые форматы:

- Base64 строки
- Multipart/form-data
- Бинарные данные в JSON

---

## ⚠️ Важные примечания

### WhatsApp:

- Используйте поле `mediaType` для всех сообщений
- Максимальный размер файла: 16 МБ
- Формат номера: международный без знака + (например: 77475318623)

### Telegram:

- Автоматическое определение типа файла по MIME-типу
- Максимальный размер файла: 50 МБ
- ChatId может быть числом или строкой

### Общие:

- URL файлов должны быть публично доступными
- Используйте HTTPS для безопасности
- Проверяйте доступность URL перед отправкой
