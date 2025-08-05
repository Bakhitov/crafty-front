import { toast } from 'sonner'
import { usePlaygroundStore } from '@/store'
import useAgnoResponseStream from './useAgnoResponseStream'
import { useQueryState } from 'nuqs'
import { useCallback, useRef } from 'react'
import { generateSessionId } from '@/lib/utils'
import { SupabaseAgentsAPI } from '@/lib/supabaseAgents'
import { useAuthContext } from '@/components/AuthProvider'
import useSessionLoader from './useSessionLoader'
import { AgnoProxyRoutes } from '@/api/routes'
import type { PlaygroundChatMessage } from '@/types/playground'
import type { AgnoStreamEvent } from '@/types/playground'

// Убран локальный интерфейс AgnoStreamEvent - используем глобальный из types/playground

const useAgnoStreamHandler = () => {
  const {
    setMessages,
    selectedEndpoint,
    setIsStreaming,
    hasStorage,
    setSessionsData
  } = usePlaygroundStore()
  const { user } = useAuthContext()
  const [sessionId, setSessionId] = useQueryState('session_id')
  const [agentId] = useQueryState('agent')
  const { autoRenameSession } = useSessionLoader()
  const { streamResponse } = useAgnoResponseStream()

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
              // Обновляем сообщение агента с run_id
              if (chunk.run_id) {
                setMessages((prev) =>
                  prev.map((msg, index) =>
                    index === prev.length - 1 && msg.role === 'agent'
                      ? { ...msg, run_id: chunk.run_id }
                      : msg
                  )
                )
              }

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
                      ? {
                          ...msg,
                          content: msg.content + chunk.content,
                          // Добавляем extra_data если есть
                          extra_data: chunk.extra_data
                            ? {
                                ...msg.extra_data,
                                ...chunk.extra_data
                              }
                            : msg.extra_data
                        }
                      : msg
                  )
                )
              }
            } else if (chunk.event === 'ToolCallStarted') {
              console.log(
                '🔧 Tool started:',
                chunk.tool?.tool_name || 'unknown tool'
              )

              // Проверяем разные возможные поля для tool name
              const toolName =
                chunk.tool_name ||
                chunk.tool?.tool_name || // ✅ Здесь находится имя!
                chunk.tool?.name ||
                chunk.tool?.function?.name
              const toolCallId =
                chunk.tool_call_id ||
                chunk.tool?.tool_call_id || // ✅ Здесь находится ID!
                chunk.tool?.id ||
                `tool-${Date.now()}`

              // Добавляем tool call в сообщение с начальным статусом
              if (toolName) {
                setMessages((prev) =>
                  prev.map((msg, index) =>
                    index === prev.length - 1 && msg.role === 'agent'
                      ? {
                          ...msg,
                          tool_calls: [
                            ...(msg.tool_calls || []),
                            {
                              tool_name: toolName,
                              tool_call_id: toolCallId,
                              status: 'running' as const,
                              created_at:
                                chunk.created_at ||
                                Math.floor(Date.now() / 1000),
                              role: 'tool' as const,
                              content: null,
                              tool_args: (chunk.tool_args ||
                                chunk.tool?.input ||
                                {}) as Record<string, string>,
                              tool_call_error: false,
                              metrics: { time: 0 }
                            }
                          ]
                        }
                      : msg
                  )
                )
              } else {
                console.warn('⚠️ No tool name found in ToolCallStarted event')
                // Fallback: создаем tool call с базовой информацией
                setMessages((prev) =>
                  prev.map((msg, index) =>
                    index === prev.length - 1 && msg.role === 'agent'
                      ? {
                          ...msg,
                          tool_calls: [
                            ...(msg.tool_calls || []),
                            {
                              tool_name: 'Unknown Tool',
                              tool_call_id: `tool-${Date.now()}`,
                              status: 'running' as const,
                              created_at:
                                chunk.created_at ||
                                Math.floor(Date.now() / 1000),
                              role: 'tool' as const,
                              content: null,
                              tool_args: {},
                              tool_call_error: false,
                              metrics: { time: 0 }
                            }
                          ]
                        }
                      : msg
                  )
                )
              }
            } else if (chunk.event === 'ToolCallCompleted') {
              console.log(
                '✅ Tool completed:',
                chunk.tool?.tool_name || 'unknown tool'
              )

              // Проверяем разные возможные поля
              const toolName =
                chunk.tool_name ||
                chunk.tool?.tool_name || // ✅ Здесь находится имя!
                chunk.tool?.name ||
                chunk.tool?.function?.name
              const toolCallId =
                chunk.tool_call_id ||
                chunk.tool?.tool_call_id || // ✅ Здесь находится ID!
                chunk.tool?.id

              // Обновляем статус tool call
              if (toolName && toolCallId) {
                setMessages((prev) =>
                  prev.map((msg, index) =>
                    index === prev.length - 1 && msg.role === 'agent'
                      ? {
                          ...msg,
                          tool_calls: msg.tool_calls?.map((tool) =>
                            tool.tool_call_id === toolCallId
                              ? {
                                  ...tool,
                                  status: 'completed',
                                  content:
                                    chunk.result ||
                                    chunk.content ||
                                    tool.content,
                                  tool_output: chunk.result || chunk.content,
                                  metrics: chunk.metrics || tool.metrics
                                }
                              : tool
                          )
                        }
                      : msg
                  )
                )
              } else {
                console.warn(
                  '⚠️ Missing tool name or tool_call_id in ToolCallCompleted event',
                  {
                    toolName,
                    toolCallId,
                    chunk
                  }
                )
                // Fallback: обновляем последний running tool call
                setMessages((prev) =>
                  prev.map((msg, index) =>
                    index === prev.length - 1 && msg.role === 'agent'
                      ? {
                          ...msg,
                          tool_calls: msg.tool_calls?.map((tool, toolIndex) =>
                            tool.status === 'running' &&
                            toolIndex ===
                              (msg.tool_calls || []).findIndex(
                                (t) => t.status === 'running'
                              )
                              ? {
                                  ...tool,
                                  status: 'completed' as const,
                                  content:
                                    chunk.result ||
                                    chunk.content ||
                                    'Tool completed',
                                  tool_output: chunk.result || chunk.content,
                                  metrics: chunk.metrics || tool.metrics
                                }
                              : tool
                          )
                        }
                      : msg
                  )
                )
              }
            } else if (chunk.event === 'ReasoningStarted') {
              console.log('🧠 Reasoning started')
            } else if (chunk.event === 'ReasoningStep') {
              console.log(
                '🧠 Reasoning step:',
                chunk.step_title || 'processing'
              )
              // Обновляем reasoning steps в сообщении
              if (chunk.extra_data?.reasoning_steps) {
                setMessages((prev) =>
                  prev.map((msg, index) =>
                    index === prev.length - 1 && msg.role === 'agent'
                      ? {
                          ...msg,
                          extra_data: {
                            ...msg.extra_data,
                            reasoning_steps: chunk.extra_data!.reasoning_steps
                          }
                        }
                      : msg
                  )
                )
              }
            } else if (chunk.event === 'RunCompleted') {
              setMessages((prev) =>
                prev.map((msg, index) =>
                  index === prev.length - 1 && msg.role === 'agent'
                    ? { ...msg }
                    : msg
                )
              )
            } else if (chunk.event === 'RunPaused') {
              console.log('⏸️ Run paused - waiting for confirmation')
              // Обрабатываем паузу run'а (обычно для подтверждения tool calls)
              setMessages((prev) =>
                prev.map((msg, index) =>
                  index === prev.length - 1 && msg.role === 'agent'
                    ? {
                        ...msg,
                        content:
                          msg.content + '\n\n_⏸️ Waiting for confirmation..._'
                      }
                    : msg
                )
              )
            } else if (chunk.event === 'RunContinued') {
              console.log('▶️ Run continued after confirmation')
              // Убираем сообщение о паузе и продолжаем
              setMessages((prev) =>
                prev.map((msg, index) =>
                  index === prev.length - 1 && msg.role === 'agent'
                    ? {
                        ...msg,
                        content: msg.content.replace(
                          /\n\n_⏸️ Waiting for confirmation\.\.\._/,
                          ''
                        )
                      }
                    : msg
                )
              )
            } else if (chunk.event === 'RunCancelled') {
              console.log(
                '🛑 Run cancelled:',
                chunk.reason || 'No reason provided'
              )
              setMessages((prev) =>
                prev.map((msg, index) =>
                  index === prev.length - 1 && msg.role === 'agent'
                    ? {
                        ...msg,
                        content: `🛑 Run cancelled: ${chunk.reason || 'No reason provided'}`,
                        streamingError: true
                      }
                    : msg
                )
              )
            } else if (chunk.event === 'ReasoningCompleted') {
              console.log('🧠 Reasoning completed')
              // Финализируем reasoning - обычно просто логируем
              // Все reasoning steps уже добавлены через ReasoningStep события
            } else if (chunk.event === 'MemoryUpdateStarted') {
              console.log('💾 Memory update started')
              // Показываем что агент обновляет память
              setMessages((prev) =>
                prev.map((msg, index) =>
                  index === prev.length - 1 && msg.role === 'agent'
                    ? {
                        ...msg,
                        content: msg.content + '\n\n_💾 Updating memory..._'
                      }
                    : msg
                )
              )
            } else if (chunk.event === 'MemoryUpdateCompleted') {
              console.log('💾 Memory update completed')
              // Убираем сообщение об обновлении памяти
              setMessages((prev) =>
                prev.map((msg, index) =>
                  index === prev.length - 1 && msg.role === 'agent'
                    ? {
                        ...msg,
                        content: msg.content.replace(
                          /\n\n_💾 Updating memory\.\.\._/,
                          ''
                        )
                      }
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
