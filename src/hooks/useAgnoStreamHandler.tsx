import { useCallback, useRef } from 'react'
import { useQueryState } from 'nuqs'
import { toast } from 'sonner'

import { usePlaygroundStore } from '@/store'
import { useAuthContext } from '@/components/AuthProvider'
import useAgnoResponseStream from './useAgnoResponseStream'
import { AgnoProxyRoutes } from '@/api/routes'
import { type PlaygroundChatMessage } from '@/types/playground'
import useSessionLoader from './useSessionLoader'
import { generateSessionId } from '@/lib/utils'
import { SupabaseAgentsAPI } from '@/lib/supabaseAgents'

interface AgnoStreamEvent {
  event: string
  agent_id?: string
  session_id?: string
  content?: string
  created_at?: number
  delta?: string
  role?: string
  message?: PlaygroundChatMessage
  error?: string
  // Поля для событий инструментов
  tool_name?: string
  tool_input?: unknown
  tool_output?: unknown
  // Поля для ошибок
  error_type?: 'NotFound' | 'RuntimeError' | 'General'
}

const useAgnoStreamHandler = () => {
  const {
    setMessages,
    selectedEndpoint,
    setIsStreaming,
    hasStorage,
    setSessionsData
  } = usePlaygroundStore()
  const { user } = useAuthContext()
  const [agentId] = useQueryState('agent')
  const [sessionId, setSessionId] = useQueryState('session')
  const { autoRenameSession } = useSessionLoader()
  const { streamResponse } = useAgnoResponseStream() // правильное использование хука

  const createUserMessage = useCallback(
    (content: string): PlaygroundChatMessage => ({
      role: 'user',
      content,
      created_at: Math.floor(Date.now() / 1000)
    }),
    []
  )

  const handleNonStreamResponse = useCallback(
    (
      input: string,
      response: { content?: string; message?: { content?: string } }
    ) => {
      if (!response?.content && !response?.message?.content) {
        toast.error('No response from agent')
        return
      }

      const userMessage = createUserMessage(input)
      const agentContent = response.content || response.message?.content || ''
      const agentMessage: PlaygroundChatMessage = {
        role: 'agent',
        content: agentContent,
        created_at: Math.floor(Date.now() / 1000)
      }

      setMessages((prev) => [...prev, userMessage, agentMessage])
    },
    [createUserMessage, setMessages]
  )

  const handleStreamResponse = useCallback(
    async (input: string | FormData) => {
      if (!agentId || !user?.id || !selectedEndpoint) {
        toast.error('Missing required data for request')
        return
      }

      setIsStreaming(true)

      const formData = input instanceof FormData ? input : new FormData()
      if (typeof input === 'string') {
        formData.append('message', input)
      }

      let currentSessionId = sessionId
      let isNewSession = false

      if (!sessionId) {
        currentSessionId = generateSessionId()
        isNewSession = true

        await setSessionId(currentSessionId, {
          history: 'push',
          scroll: false,
          shallow: true
        })
      }

      formData.append('session_id', currentSessionId || '')
      formData.append('stream', 'true')

      // Add user_id to FormData for session creation
      if (user?.id) {
        formData.append('user_id', user.id)
      }

      try {
        const agent = await SupabaseAgentsAPI.getAgent(agentId)
        const modelId = agent?.model_config?.id || 'gpt-4.1-mini-2025-04-14'
        formData.append('model', modelId)
      } catch {
        formData.append('model', 'gpt-4.1-mini-2025-04-14')
      }

      setMessages((prev) => {
        const filtered = prev.filter(
          (msg) => !(msg.role === 'agent' && msg.streamingError)
        )
        return [
          ...filtered,
          createUserMessage((formData.get('message') as string) || '')
        ]
      })

      const agnoApiUrl = AgnoProxyRoutes.AgentRun(agentId, selectedEndpoint)

      const agentMessage: PlaygroundChatMessage = {
        role: 'agent',
        content: '',
        created_at: Math.floor(Date.now() / 1000)
      }

      setMessages((prev) => [...prev, agentMessage])

      try {
        await streamResponse({
          apiUrl: agnoApiUrl,
          requestBody: formData,
          abortController: cancelController.current || undefined,
          onChunk: (chunk: AgnoStreamEvent) => {
            if (chunk.event === 'RunStarted') {
              if (chunk.session_id) {
                if (chunk.session_id !== currentSessionId) {
                  setSessionId(chunk.session_id)
                }

                if (hasStorage && isNewSession) {
                  const userMessage =
                    (formData.get('message') as string) || 'New chat'
                  const sessionData = {
                    session_id: chunk.session_id,
                    title: userMessage,
                    created_at:
                      chunk.created_at || Math.floor(Date.now() / 1000),
                    session_data: {
                      session_name: userMessage
                    }
                  }

                  setSessionsData((prevSessions) => {
                    const sessionExists = prevSessions?.some(
                      (session) => session.session_id === chunk.session_id
                    )
                    if (sessionExists) return prevSessions

                    return [sessionData, ...(prevSessions ?? [])]
                  })

                  if (
                    agentId &&
                    userMessage !== 'New chat' &&
                    chunk.session_id
                  ) {
                    setTimeout(() => {
                      autoRenameSession(agentId, chunk.session_id!, userMessage)
                    }, 1000)
                  }
                }
              }
            } else if (chunk.event === 'RunResponseContent') {
              if (chunk.content) {
                setMessages((prev) =>
                  prev.map((msg, index) =>
                    index === prev.length - 1 && msg.role === 'agent'
                      ? { ...msg, content: msg.content + chunk.content }
                      : msg
                  )
                )
              }
            } else if (chunk.event === 'ToolCallStarted') {
              // Можно добавить индикатор работы инструмента
              console.log('🔧 Tool started:', chunk.tool_name || 'unknown tool')
            } else if (chunk.event === 'ToolCallCompleted') {
              // Можно добавить логирование завершения работы инструмента
              console.log(
                '✅ Tool completed:',
                chunk.tool_name || 'unknown tool'
              )
            } else if (chunk.event === 'ReasoningStarted') {
              // Можно добавить индикатор начала рассуждений
              console.log('🧠 Reasoning started')
            } else if (chunk.event === 'ReasoningStep') {
              // Можно добавить отображение шагов рассуждений
              console.log('🧠 Reasoning step')
            } else if (chunk.event === 'RunCompleted') {
              setMessages((prev) =>
                prev.map((msg, index) =>
                  index === prev.length - 1 && msg.role === 'agent'
                    ? { ...msg }
                    : msg
                )
              )
            } else if (chunk.event === 'RunError') {
              console.error(
                '❌ Run error:',
                chunk.error_type || 'Unknown error type'
              )
              setMessages((prev) =>
                prev.map((msg, index) =>
                  index === prev.length - 1 && msg.role === 'agent'
                    ? {
                        ...msg,
                        content: `Error: ${chunk.content || 'Unknown error'}`,
                        streamingError: true
                      }
                    : msg
                )
              )
            }
          },
          onError: (error) => {
            setMessages((prev) =>
              prev.map((msg, index) =>
                index === prev.length - 1 && msg.role === 'agent'
                  ? {
                      ...msg,
                      content: 'Error occurred during streaming',
                      streamingError: true
                    }
                  : msg
              )
            )
            toast.error(error.message || 'Error during streaming')
          },
          onComplete: () => {
            setIsStreaming(false)
          }
        })
      } catch {
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1 && msg.role === 'agent'
              ? {
                  ...msg,
                  content: 'Request failed',
                  streamingError: true
                }
              : msg
          )
        )
        toast.error('Request failed')
        setIsStreaming(false)
      }
    },
    [
      agentId,
      user?.id,
      selectedEndpoint,
      sessionId,
      setSessionId,
      setIsStreaming,
      setMessages,
      hasStorage,
      setSessionsData,
      autoRenameSession,
      createUserMessage,
      streamResponse
    ]
  )

  const cancelController = useRef<AbortController | null>(null)

  const handleRequest = useCallback(
    async (input: string | FormData) => {
      // Отменяем предыдущий запрос если есть
      if (cancelController.current) {
        cancelController.current.abort()
      }

      // Создаем новый контроллер
      cancelController.current = new AbortController()

      // Всегда используем стриминг для AGNO API
      await handleStreamResponse(input)
    },
    [handleStreamResponse]
  )

  const cancelCurrentRequest = useCallback(() => {
    if (cancelController.current) {
      cancelController.current.abort()
      cancelController.current = null
      setIsStreaming(false)
      toast.info('Request cancelled')
    }
  }, [setIsStreaming])

  return {
    handleRequest,
    handleStreamResponse,
    handleNonStreamResponse,
    cancelCurrentRequest
  }
}

export default useAgnoStreamHandler
