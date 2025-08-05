import { useCallback } from 'react'
import type { AgnoStreamEvent } from '@/types/playground'

/**
 * Хук для обработки стриминга ответов от Agno API
 * Поддерживает все события согласно документации
 */
export default function useAgnoResponseStream() {
  const streamResponse = useCallback(
    async (options: {
      apiUrl: string
      headers?: Record<string, string>
      requestBody: FormData
      onChunk: (chunk: AgnoStreamEvent) => void
      onError: (error: Error) => void
      onComplete: () => void
      abortController?: AbortController
    }): Promise<void> => {
      const {
        apiUrl,
        headers = {},
        requestBody,
        onChunk,
        onError,
        onComplete,
        abortController
      } = options

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            // Для FormData не устанавливаем Content-Type
            ...headers
          },
          body: requestBody,
          credentials: 'include', // Включаем cookies для аутентификации
          signal: abortController?.signal
        })

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`
          try {
            const errorData = await response.json()
            errorMessage = errorData.detail || errorMessage
          } catch {
            // Игнорируем ошибки парсинга JSON
          }
          throw new Error(errorMessage)
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = '' // Буфер для накопления частичных данных

        // Используем while loop вместо рекурсии для избежания переполнения стека
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            onComplete()
            break
          }

          // Декодируем полученные данные
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          let startIndex = 0

          while (startIndex < buffer.length) {
            // Ищем начало JSON объекта
            const jsonStart = buffer.indexOf('{', startIndex)

            if (jsonStart === -1) {
              // JSON объект не найден, выходим из цикла
              break
            }

            // Ищем конец JSON объекта, учитывая вложенность
            let braceCount = 0
            let jsonEnd = -1
            let inString = false
            let escapeNext = false

            for (let i = jsonStart; i < buffer.length; i++) {
              const char = buffer[i]

              if (escapeNext) {
                escapeNext = false
                continue
              }

              if (char === '\\') {
                escapeNext = true
                continue
              }

              if (char === '"' && !escapeNext) {
                inString = !inString
                continue
              }

              if (!inString) {
                if (char === '{') {
                  braceCount++
                } else if (char === '}') {
                  braceCount--
                  if (braceCount === 0) {
                    jsonEnd = i
                    break
                  }
                }
              }
            }

            if (jsonEnd === -1) {
              // JSON объект неполный, ждем больше данных
              break
            }

            // Извлекаем полный JSON объект
            const jsonStr = buffer.substring(jsonStart, jsonEnd + 1)

            try {
              const event: AgnoStreamEvent = JSON.parse(jsonStr)
              onChunk(event)
            } catch (parseError) {
              console.warn(
                'Failed to parse Agno stream event:',
                jsonStr.substring(0, 200),
                parseError
              )
            }

            // Переходим к поиску следующего JSON объекта
            startIndex = jsonEnd + 1
          }

          // Удаляем обработанную часть из буфера
          buffer = buffer.substring(startIndex)
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('🛑 Запрос был отменен')
          return
        }
        onError(error instanceof Error ? error : new Error(String(error)))
      }
    },
    []
  )

  return { streamResponse }
}
