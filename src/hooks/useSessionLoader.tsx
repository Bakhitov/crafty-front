import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { usePlaygroundStore } from '@/store'
import {
  getPlaygroundSessionAPI,
  getAllPlaygroundSessionsAPI,
  renamePlaygroundSessionAPI
} from '@/api/playground'
import { type PlaygroundChatMessage, type ChatEntry } from '@/types/playground'
import { useAuthContext } from '@/components/AuthProvider'

interface SessionResponse {
  session_id: string
  agent_id: string
  user_id: string | null
  runs?: ChatEntry[]
  memory: {
    runs?: (ChatEntry | AgnoRun)[]
    chats?: ChatEntry[]
  }
  agent_data: Record<string, unknown>
}

interface AgnoRun {
  messages?: AgnoMessage[]
  content?: string
  created_at?: number
  run_id?: string
}

interface AgnoMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: number
  from_history?: boolean // Поле для определения сообщений из истории
  tool_calls?: Array<{
    id: string
    type: string
    function: {
      name: string
      arguments: string
    }
    result?: string
  }>
}

const useSessionLoader = () => {
  const {
    setMessages,
    selectedEndpoint,
    setIsSessionsLoading,
    setIsSessionLoading,
    setSessionsData,
    isAgentSwitching
  } = usePlaygroundStore()
  const { user } = useAuthContext()
  const loadingSessionRef = useRef<string | null>(null)

  const getSessions = useCallback(
    async (agentId: string) => {
      if (
        !agentId ||
        !selectedEndpoint ||
        loadingSessionRef.current === agentId
      )
        return

      try {
        loadingSessionRef.current = agentId
        setIsSessionsLoading(true)

        const sessions = await getAllPlaygroundSessionsAPI(
          selectedEndpoint,
          agentId,
          user?.id
        )

        setSessionsData(sessions)
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          setSessionsData([])
        } else {
          toast.error('Error loading sessions')
          setSessionsData([])
        }
      } finally {
        loadingSessionRef.current = null
        setIsSessionsLoading(false)
      }
    },
    [selectedEndpoint, setSessionsData, setIsSessionsLoading, user?.id]
  )

  const getSession = useCallback(
    async (sessionId: string, agentId: string) => {
      if (
        isAgentSwitching ||
        !sessionId ||
        !agentId ||
        !selectedEndpoint ||
        loadingSessionRef.current === sessionId
      ) {
        return null
      }

      loadingSessionRef.current = sessionId
      setIsSessionLoading(true)
      usePlaygroundStore.setState({ messages: [] })

      try {
        const response = (await getPlaygroundSessionAPI(
          selectedEndpoint,
          agentId,
          sessionId,
          user?.id
        )) as SessionResponse

        if (response?.memory?.runs) {
          const messages = processSessionHistory(response.memory.runs)
          setMessages(messages)
        }

        return response
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)

        if (errorMessage.includes('404')) {
          setSessionsData((prevSessions) => {
            if (!prevSessions) return prevSessions
            return prevSessions.filter((s) => s.session_id !== sessionId)
          })
          toast.error('Session not found')
        } else {
          toast.error('Error loading session')
        }

        return null
      } finally {
        setIsSessionLoading(false)
        loadingSessionRef.current = null
      }
    },
    [
      selectedEndpoint,
      setMessages,
      setSessionsData,
      user?.id,
      setIsSessionLoading,
      isAgentSwitching
    ]
  )

  const refreshSessions = useCallback(
    async (agentId: string) => {
      loadingSessionRef.current = null
      await getSessions(agentId)
    },
    [getSessions]
  )

  const autoRenameSession = useCallback(
    async (agentId: string, sessionId: string, userMessage: string) => {
      if (!agentId || !sessionId || !userMessage || !selectedEndpoint) return

      try {
        const truncatedMessage =
          userMessage.length > 40
            ? userMessage.substring(0, 40).trim() + '...'
            : userMessage.trim()

        const response = await renamePlaygroundSessionAPI(
          selectedEndpoint,
          agentId,
          sessionId,
          truncatedMessage,
          user?.id
        )

        if (response.ok) {
          setSessionsData(
            (prevSessions) =>
              prevSessions?.map((session) =>
                session.session_id === sessionId
                  ? {
                      ...session,
                      title: truncatedMessage,
                      session_data: {
                        ...session.session_data,
                        session_name: truncatedMessage
                      }
                    }
                  : session
              ) ?? null
          )
        }
      } catch {
        // Silent fail for auto-rename
      }
    },
    [selectedEndpoint, user?.id, setSessionsData]
  )

  return { getSession, getSessions, refreshSessions, autoRenameSession }
}

// Отдельная функция для обработки истории сессий
function processSessionHistory(
  sessionHistory: (ChatEntry | AgnoRun)[]
): PlaygroundChatMessage[] {
  const messages: PlaygroundChatMessage[] = []
  const seenMessages = new Set<string>()

  sessionHistory.forEach((run) => {
    // Новая структура AGNO API: run.messages содержит полную историю
    if ('messages' in run && run.messages && Array.isArray(run.messages)) {
      run.messages.forEach((message: AgnoMessage) => {
        // Пропускаем системные сообщения и дубликаты
        if (message.role === 'system') return

        // Используем from_history чтобы избежать дубликатов
        if (message.from_history === true) return

        const messageKey = `${message.role}-${message.content}-${message.created_at}`
        if (seenMessages.has(messageKey)) return
        seenMessages.add(messageKey)

        if (message.role === 'user') {
          messages.push({
            role: 'user',
            content: message.content,
            created_at: message.created_at
          })
        } else if (message.role === 'assistant') {
          const hasToolCalls =
            message.tool_calls && message.tool_calls.length > 0

          if (hasToolCalls) {
            // Создаем сообщение агента с tool calls (независимо от наличия контента)
            const agentMessage: PlaygroundChatMessage = {
              role: 'agent',
              content:
                message.content && message.content.trim()
                  ? message.content
                  : '', // Контент или пустая строка
              created_at: message.created_at,
              tool_calls: message.tool_calls?.map((tc) => ({
                id: tc.id,
                type: tc.type,
                function: tc.function,
                tool_name: tc.function?.name || '',
                created_at: message.created_at
              }))
            }

            messages.push(agentMessage)

            // НЕ добавляем tool results как отдельные сообщения - они будут в tool_calls
          } else {
            // Обычное сообщение агента без tool calls
            if (message.content && message.content.trim()) {
              messages.push({
                role: 'agent',
                content: message.content,
                created_at: message.created_at
              })
            }
          }
        }
      })
    }
    // Fallback для старой структуры или простых runs
    else if ('content' in run && run.content) {
      const messageKey = `agent-${run.content}-${run.created_at}`
      if (!seenMessages.has(messageKey)) {
        seenMessages.add(messageKey)
        messages.push({
          role: 'agent',
          content: run.content,
          created_at: run.created_at || Date.now()
        })
      }
    }
  })

  return messages.sort((a, b) => a.created_at - b.created_at)
}

export default useSessionLoader
