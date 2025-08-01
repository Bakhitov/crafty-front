import { useCallback } from 'react'
import { toast } from 'sonner'
import { usePlaygroundStore } from '@/store'
import {
  getPlaygroundSessionAPI,
  getAllPlaygroundSessionsAPI,
  renamePlaygroundSessionAPI
} from '@/api/playground'
import { type PlaygroundChatMessage, type ChatEntry } from '@/types/playground'
import { useAuthContext } from '@/components/AuthProvider'
import { getSessionDisplayName } from '@/lib/utils'

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
}

interface AgnoMessage {
  role: 'user' | 'assistant'
  content: string
  created_at: number
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
  const setMessages = usePlaygroundStore((state) => state.setMessages)
  const selectedEndpoint = usePlaygroundStore((state) => state.selectedEndpoint)
  const setIsSessionsLoading = usePlaygroundStore(
    (state) => state.setIsSessionsLoading
  )
  const setIsSessionLoading = usePlaygroundStore(
    (state) => state.setIsSessionLoading
  )
  const setSessionsData = usePlaygroundStore((state) => state.setSessionsData)
  const isAgentSwitching = usePlaygroundStore((state) => state.isAgentSwitching)
  const { user } = useAuthContext()

  const getSessions = useCallback(
    async (agentId: string) => {
      if (!agentId || !selectedEndpoint) return

      console.log('📋 useSessionLoader: Getting sessions for:', {
        agentId,
        userId: user?.id,
        endpoint: selectedEndpoint,
        hasUserId: !!user?.id,
        userEmail: user?.email
      })

      try {
        setIsSessionsLoading(true)
        const sessions = await getAllPlaygroundSessionsAPI(
          selectedEndpoint,
          agentId,
          user?.id
        )

        console.log('✅ useSessionLoader: Loaded sessions:', {
          count: sessions.length,
          agentId,
          userId: user?.id,
          sessions: sessions.map((s) => ({
            id: s.session_id,
            title: s.title,
            displayName: getSessionDisplayName(s),
            hasSessionData: !!s.session_data,
            sessionName: s.session_data?.session_name
          }))
        })

        setSessionsData(sessions)
      } catch (error) {
        console.error('❌ useSessionLoader: Error loading sessions:', error)
        toast.error('Error loading sessions')
      } finally {
        setIsSessionsLoading(false)
      }
    },
    [
      selectedEndpoint,
      setSessionsData,
      setIsSessionsLoading,
      user?.id,
      user?.email
    ]
  )

  const getSession = useCallback(
    async (sessionId: string, agentId: string) => {
      // Блокируем загрузку сессии во время переключения агента
      if (isAgentSwitching) {
        console.log(
          '🔄 getSession: Skipping session loading - agent is switching'
        )
        return null
      }

      if (!sessionId || !agentId || !selectedEndpoint) {
        console.log('❌ getSession: Missing parameters:', {
          hasSessionId: !!sessionId,
          hasAgentId: !!agentId,
          hasEndpoint: !!selectedEndpoint
        })
        return null
      }

      console.log('📋 getSession: Loading session:', {
        sessionId,
        agentId,
        endpoint: selectedEndpoint,
        userId: user?.id
      })

      // Устанавливаем состояние загрузки сессии
      setIsSessionLoading(true)

      // Синхронно очищаем текущие сообщения перед загрузкой новой сессии
      console.log('🧹 getSession: Clearing messages before loading session')
      usePlaygroundStore.setState({ messages: [] })

      try {
        const response = (await getPlaygroundSessionAPI(
          selectedEndpoint,
          agentId,
          sessionId,
          user?.id // Передаем user_id для фильтрации
        )) as SessionResponse

        console.log('✅ getSession: Session loaded:', {
          sessionId: response?.session_id,
          hasMemory: !!response?.memory,
          runsCount: response?.memory?.runs?.length || 0
        })

        if (response && response.memory) {
          const sessionHistory = response.runs
            ? response.runs
            : response.memory.runs

          if (sessionHistory && Array.isArray(sessionHistory)) {
            console.log('📋 useSessionLoader: Processing session history:', {
              runsCount: sessionHistory.length,
              firstRun: sessionHistory[0]
                ? {
                    hasMessages: !!(sessionHistory[0] as AgnoRun).messages,
                    messagesCount: (sessionHistory[0] as AgnoRun).messages
                      ?.length,
                    hasContent: !!(sessionHistory[0] as AgnoRun).content,
                    content: (sessionHistory[0] as AgnoRun).content
                  }
                : null
            })

            const messagesForPlayground = sessionHistory.flatMap(
              (run: ChatEntry | AgnoRun) => {
                const filteredMessages: PlaygroundChatMessage[] = []

                if ('messages' in run && run.messages) {
                  // Обрабатываем новый формат с messages
                  run.messages.forEach((message: AgnoMessage) => {
                    if (message.role === 'user') {
                      filteredMessages.push({
                        role: 'user',
                        content: message.content,
                        created_at: message.created_at
                      })
                    } else if (message.role === 'assistant') {
                      // Проверяем наличие tool_calls в сообщении
                      const hasToolCalls =
                        message.tool_calls && message.tool_calls.length > 0

                      if (hasToolCalls) {
                        // Добавляем сообщение с tool_calls
                        filteredMessages.push({
                          role: 'agent',
                          content: message.content || '',
                          created_at: message.created_at,
                          tool_calls: message.tool_calls?.map((tc) => ({
                            id: tc.id,
                            type: tc.type,
                            function: tc.function,
                            tool_name: tc.function?.name || '',
                            created_at: message.created_at
                          }))
                        })

                        // Добавляем результаты tool_calls если есть
                        message.tool_calls?.forEach((toolCall) => {
                          if (toolCall.result) {
                            filteredMessages.push({
                              role: 'tool',
                              content: toolCall.result,
                              created_at: message.created_at
                            })
                          }
                        })
                      } else {
                        // Обычное сообщение ассистента
                        filteredMessages.push({
                          role: 'agent',
                          content: message.content,
                          created_at: message.created_at
                        })
                      }
                    }
                  })
                } else if ('content' in run && run.content) {
                  // Обрабатываем старый формат с content
                  filteredMessages.push({
                    role: 'agent',
                    content: run.content,
                    created_at: run.created_at || Date.now()
                  })
                }

                return filteredMessages
              }
            )

            console.log('📋 useSessionLoader: Converted messages:', {
              totalMessages: messagesForPlayground.length,
              messageTypes: messagesForPlayground.reduce(
                (acc: Record<string, number>, msg) => {
                  acc[msg.role] = (acc[msg.role] || 0) + 1
                  return acc
                },
                {}
              )
            })

            // Устанавливаем сообщения с дополнительной проверкой
            console.log(
              '📋 useSessionLoader: Setting messages for session:',
              sessionId
            )
            setMessages(messagesForPlayground)

            // Дополнительная проверка через микротаск
            Promise.resolve().then(() => {
              const currentMessages = usePlaygroundStore.getState().messages
              if (currentMessages.length !== messagesForPlayground.length) {
                console.log(
                  '🔄 useSessionLoader: Re-setting messages due to mismatch:',
                  {
                    expected: messagesForPlayground.length,
                    actual: currentMessages.length
                  }
                )
                setMessages(messagesForPlayground)
              }
            })
          }
        }

        return response
      } catch (error: unknown) {
        console.error('❌ getSession: Error loading session:', error)

        // Специальная обработка для 404 ошибок
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        if (
          errorMessage.includes('404') ||
          errorMessage.includes('Failed to fetch session')
        ) {
          console.warn(
            '⚠️ getSession: Session not found, cleaning up session list:',
            {
              sessionId,
              agentId,
              userId: user?.id
            }
          )

          // Удаляем несуществующую сессию из списка
          setSessionsData((prevSessions) => {
            if (!prevSessions) return prevSessions
            const updatedSessions = prevSessions.filter(
              (s) => s.session_id !== sessionId
            )
            console.log('🧹 Cleaned up session list:', {
              removedSessionId: sessionId,
              remainingSessions: updatedSessions.length
            })
            return updatedSessions
          })

          toast.error('Сессия не найдена или была удалена')
        } else {
          toast.error('Ошибка загрузки сессии')
        }

        return null
      } finally {
        setIsSessionLoading(false)
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
      console.log(
        '🔄 useSessionLoader: Refreshing sessions for agent:',
        agentId
      )
      await getSessions(agentId)
    },
    [getSessions]
  )

  const autoRenameSession = useCallback(
    async (agentId: string, sessionId: string, userMessage: string) => {
      if (!agentId || !sessionId || !userMessage || !selectedEndpoint) {
        return
      }

      try {
        // Обрезаем сообщение до 40 символов
        const truncatedMessage =
          userMessage.length > 40
            ? userMessage.substring(0, 40).trim() + '...'
            : userMessage.trim()

        console.log('🏷️ useSessionLoader: Auto-renaming session:', {
          sessionId,
          agentId,
          originalMessage: userMessage,
          newTitle: truncatedMessage
        })

        const response = await renamePlaygroundSessionAPI(
          selectedEndpoint,
          agentId,
          sessionId,
          truncatedMessage,
          user?.id
        )

        if (response.ok) {
          // Обновляем локальное состояние
          setSessionsData(
            (prevSessions) =>
              prevSessions?.map((session) =>
                session.session_id === sessionId
                  ? { ...session, title: truncatedMessage }
                  : session
              ) ?? null
          )
          console.log('✅ useSessionLoader: Session auto-renamed successfully')
        } else {
          console.warn('⚠️ useSessionLoader: Failed to auto-rename session')
        }
      } catch (error) {
        console.error(
          '❌ useSessionLoader: Error auto-renaming session:',
          error
        )
      }
    },
    [selectedEndpoint, user?.id, setSessionsData]
  )

  return { getSession, getSessions, refreshSessions, autoRenameSession }
}

export default useSessionLoader
