'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePlaygroundStore } from '@/store'
import { constructEndpointUrl } from '@/lib/constructEndpointUrl'
import { useAuthContext } from '@/components/AuthProvider'

export const StreamDebugger = () => {
  const [logs, setLogs] = useState<string[]>([])
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [agentId, setAgentId] = useState('test_dynamic_agent')
  const [userId, setUserId] = useState('')
  const selectedEndpoint = usePlaygroundStore((state) => state.selectedEndpoint)
  const { user } = useAuthContext()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`])
    console.log(`[StreamDebugger] ${message}`)
  }

  const testAgnoStream = async () => {
    const currentUserId = userId || user?.id || 'test-user'

    setIsTestRunning(true)
    setLogs([])

    try {
      const endpointUrl = constructEndpointUrl(selectedEndpoint)
      const agnoApiUrl = `${endpointUrl}/v1/agents/${agentId}/runs`

      addLog(`🚀 Начинаем тест стриминга`)
      addLog(`📡 URL: ${agnoApiUrl}`)
      addLog(`🤖 Agent ID: ${agentId}`)
      addLog(`👤 User ID: ${currentUserId}`)

      const formData = new FormData()
      formData.append('message', 'Привет! Это тест стриминга.')
      formData.append('user_id', currentUserId)
      formData.append('stream', 'true')
      formData.append('session_id', `test-${Date.now()}`)

      addLog(`📤 Отправляем запрос...`)

      const response = await fetch(agnoApiUrl, {
        method: 'POST',
        body: formData
      })

      addLog(`📥 Получен ответ: ${response.status} ${response.statusText}`)
      addLog(
        `📋 Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`
      )

      if (!response.ok) {
        const errorText = await response.text()
        addLog(`❌ Ошибка HTTP: ${errorText}`)
        return
      }

      if (!response.body) {
        addLog(`❌ Нет тела ответа`)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let chunkCount = 0
      let buffer = ''

      addLog(`🌊 Начинаем чтение стрима...`)

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          if (buffer.trim()) {
            addLog(
              `⚠️ Остался необработанный буфер: ${buffer.substring(0, 100)}...`
            )
          }
          addLog(`✅ Стрим завершен. Всего чанков: ${chunkCount}`)
          break
        }

        chunkCount++
        buffer += decoder.decode(value, { stream: true })
        addLog(
          `📦 Чанк ${chunkCount}: ${value.length} байт, буфер: ${buffer.length} символов`
        )

        // Ищем полные JSON объекты в буфере
        let startIndex = 0

        while (startIndex < buffer.length) {
          const jsonStart = buffer.indexOf('{', startIndex)
          if (jsonStart === -1) break

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

            if (char === '"') {
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
            // JSON неполный
            break
          }

          const jsonStr = buffer.substring(jsonStart, jsonEnd + 1)

          try {
            const event = JSON.parse(jsonStr)
            addLog(
              `📨 Событие: ${event.event} ${event.content ? '(content: ' + event.content.substring(0, 50) + '...)' : ''}`
            )
          } catch {
            addLog(`⚠️ Не удалось распарсить: ${jsonStr.substring(0, 100)}...`)
          }

          startIndex = jsonEnd + 1
        }

        buffer = buffer.substring(startIndex)
      }
    } catch (error) {
      addLog(
        `💥 Ошибка: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      setIsTestRunning(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium">Agent ID:</label>
            <Input
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="test_dynamic_agent"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              User ID (опционально):
            </label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Автоматически из контекста"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={testAgnoStream}
            disabled={isTestRunning}
            variant="outline"
          >
            {isTestRunning ? 'Тестируем...' : 'Тест стриминга'}
          </Button>
          <Button onClick={clearLogs} variant="outline">
            Очистить логи
          </Button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto rounded bg-gray-100 p-3 dark:bg-gray-800">
        <div className="space-y-1 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500">Логи появятся здесь...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap break-words">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
