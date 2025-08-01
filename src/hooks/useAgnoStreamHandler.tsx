import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useQueryState } from 'nuqs'
import { v4 as uuidv4 } from 'uuid'

import { usePlaygroundStore } from '../store'
import useChatActions from '@/hooks/useChatActions'
import useSessionLoader from '@/hooks/useSessionLoader'
import { useAuthContext } from '@/components/AuthProvider'
import useAgnoResponseStream from './useAgnoResponseStream'
import { useAgents } from './useAgents'
import type { AgnoStreamEvent } from '@/types/playground'
import { constructEndpointUrl } from '@/lib/constructEndpointUrl'

/**
 * Генерирует UUID для новой сессии
 * Использует библиотеку uuid для генерации уникального идентификатора
 */
const generateSessionId = (): string => {
  return uuidv4()
}

/**
 * Хук для обработки чата с Agno API
 * Интегрирует стриминг Agno API с состоянием приложения
 */
const useAgnoStreamHandler = () => {
  const setMessages = usePlaygroundStore((state) => state.setMessages)
  const { addMessage, focusChatInput } = useChatActions()
  const { autoRenameSession } = useSessionLoader()
  const { getAgent } = useAgents()
  const [agentId] = useQueryState('agent')
  const [sessionId, setSessionId] = useQueryState('session')
  const selectedEndpoint = usePlaygroundStore((state) => state.selectedEndpoint)
  const setStreamingErrorMessage = usePlaygroundStore(
    (state) => state.setStreamingErrorMessage
  )
  const setIsStreaming = usePlaygroundStore((state) => state.setIsStreaming)
  const setSessionsData = usePlaygroundStore((state) => state.setSessionsData)
  const hasStorage = usePlaygroundStore((state) => state.hasStorage)
  const { streamResponse } = useAgnoResponseStream()
  const { user } = useAuthContext()

  // Добавляем состояние для отслеживания run_id и отмены запросов
  const [currentRunId, setCurrentRunId] = useState<string | null>(null)
  const [abortController, setAbortController] =
    useState<AbortController | null>(null)

  /**
   * Получает настройку стриминга из конфигурации агента
   * Приоритет: agent_config.stream > по умолчанию true
   */
  const getStreamSetting = useCallback(async (): Promise<boolean> => {
    if (!agentId) return true // По умолчанию stream=true

    try {
      const agent = await getAgent(agentId)
      if (agent?.agent_config?.stream !== undefined) {
        console.log(
          '🔄 Using stream setting from agent config:',
          agent.agent_config.stream
        )
        return agent.agent_config.stream as boolean
      }
    } catch (error) {
      console.warn(
        '⚠️ Failed to get agent config, using default stream=true:',
        error
      )
    }

    // По умолчанию stream=true
    console.log('🔄 Using default stream setting: true')
    return true
  }, [agentId, getAgent])

  const updateMessagesWithErrorState = useCallback(() => {
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages]
      const lastMessageIndex = newMessages.length - 1
      const lastMessage = newMessages[lastMessageIndex]
      if (lastMessage && lastMessage.role === 'agent') {
        newMessages[lastMessageIndex] = {
          ...lastMessage,
          streamingError: true
        }
      }
      return newMessages
    })
  }, [setMessages])

  const handleNonStreamResponse = useCallback(
    async (input: string | FormData) => {
      if (!agentId) {
        toast.error('Агент не выбран')
        return
      }

      if (!user?.id) {
        toast.error('Пользователь не аутентифицирован')
        return
      }

      setIsStreaming(true)
      setStreamingErrorMessage('')
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages]
        const lastMessageIndex = newMessages.length - 1
        const lastMessage = newMessages[lastMessageIndex]
        if (lastMessage && lastMessage.role === 'agent') {
          newMessages[lastMessageIndex] = {
            ...lastMessage,
            streamingError: false
          }
        }
        return newMessages
      })

      const formData = input instanceof FormData ? input : new FormData()
      if (typeof input === 'string') {
        formData.append('message', input)
      }

      // ОБЯЗАТЕЛЬНО передаем user_id
      formData.append('user_id', user.id)

      // Обрабатываем session_id
      let currentSessionId = sessionId

      if (!sessionId) {
        currentSessionId = generateSessionId()

        await setSessionId(currentSessionId, {
          history: 'push',
          scroll: false,
          shallow: true
        })

        if (hasStorage) {
          const sessionEntry = {
            session_id: currentSessionId,
            title: (formData.get('message') as string) || 'Новый чат',
            created_at: Math.floor(Date.now() / 1000)
          }
          setSessionsData((prev) => {
            const exists = prev?.some((s) => s.session_id === currentSessionId)
            if (exists) return prev
            return [sessionEntry, ...(prev ?? [])]
          })
        }
      }

      formData.append('session_id', currentSessionId || '')
      formData.append('stream', 'false') // Отключаем стрим

      // Добавляем сообщение пользователя
      const messageContent = (formData.get('message') as string) || ''
      addMessage({
        role: 'user',
        content: messageContent,
        created_at: Math.floor(Date.now() / 1000)
      })

      try {
        const endpointUrl = constructEndpointUrl(selectedEndpoint)
        const agnoApiUrl = `${endpointUrl}/v1/agents/${agentId}/runs`

        const response = await fetch(agnoApiUrl, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        // Добавляем ответ агента
        addMessage({
          role: 'agent',
          content: result.content || '',
          created_at: result.created_at || Math.floor(Date.now() / 1000),
          images: result.images,
          videos: result.videos,
          audio: result.audio,
          response_audio: result.response_audio
        })
      } catch (error) {
        console.error('💥 Error in non-stream handler:', error)
        updateMessagesWithErrorState()
        setStreamingErrorMessage(
          error instanceof Error ? error.message : String(error)
        )
      } finally {
        focusChatInput()
        setIsStreaming(false)
      }
    },
    [
      setMessages,
      addMessage,
      updateMessagesWithErrorState,
      selectedEndpoint,
      agentId,
      setStreamingErrorMessage,
      setIsStreaming,
      focusChatInput,
      setSessionsData,
      sessionId,
      setSessionId,
      hasStorage,
      user?.id
    ]
  )

  const handleStreamResponse = useCallback(
    async (input: string | FormData) => {
      if (!agentId) {
        toast.error('Агент не выбран')
        return
      }

      if (!user?.id) {
        toast.error('Пользователь не аутентифицирован')
        return
      }

      setIsStreaming(true)
      setStreamingErrorMessage('')
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages]
        const lastMessageIndex = newMessages.length - 1
        const lastMessage = newMessages[lastMessageIndex]
        if (lastMessage && lastMessage.role === 'agent') {
          newMessages[lastMessageIndex] = {
            ...lastMessage,
            streamingError: false
          }
        }
        return newMessages
      })

      const formData = input instanceof FormData ? input : new FormData()
      if (typeof input === 'string') {
        formData.append('message', input)
      }

      // ОБЯЗАТЕЛЬНО передаем user_id
      formData.append('user_id', user.id)

      // Обрабатываем session_id
      let currentSessionId = sessionId
      let isNewSession = false

      if (!sessionId) {
        // Генерируем новый UUID для новой сессии
        currentSessionId = generateSessionId()
        isNewSession = true

        console.log('🆕 Создаем новую сессию:', {
          user_id: user.id,
          agent_id: agentId,
          new_session_id: currentSessionId
        })

        await setSessionId(currentSessionId, {
          history: 'push',
          scroll: false,
          shallow: true
        })

        // Обновляем список сессий для новой сессии
        if (hasStorage) {
          const sessionEntry = {
            session_id: currentSessionId,
            title: (formData.get('message') as string) || 'Новый чат',
            created_at: Math.floor(Date.now() / 1000)
          }
          setSessionsData((prev) => {
            const exists = prev?.some((s) => s.session_id === currentSessionId)
            if (exists) return prev
            return [sessionEntry, ...(prev ?? [])]
          })
        }
      } else {
        console.log('📝 Используем существующую сессию:', {
          user_id: user.id,
          agent_id: agentId,
          existing_session_id: currentSessionId
        })
      }

      // Передаем session_id (новый или существующий)
      formData.append('session_id', currentSessionId || '')

      // Добавляем обязательные параметры для Agno API
      formData.append('stream', 'true')

      // Очищаем предыдущие ошибки
      setMessages((prevMessages) => {
        if (prevMessages.length >= 2) {
          const lastMessage = prevMessages[prevMessages.length - 1]
          const secondLastMessage = prevMessages[prevMessages.length - 2]
          if (
            lastMessage.role === 'agent' &&
            lastMessage.streamingError &&
            secondLastMessage.role === 'user'
          ) {
            return prevMessages.slice(0, -2)
          }
        }
        return prevMessages
      })

      // Добавляем сообщение пользователя
      const messageContent = (formData.get('message') as string) || ''
      addMessage({
        role: 'user',
        content: messageContent,
        created_at: Math.floor(Date.now() / 1000)
      })

      // Добавляем пустое сообщение агента для стриминга
      addMessage({
        role: 'agent',
        content: '',
        tool_calls: [],
        streamingError: false,
        created_at: Math.floor(Date.now() / 1000) + 1
      })

      let currentContent = ''
      let responseSessionId = currentSessionId

      // Создаем AbortController для возможности отмены запроса
      const controller = new AbortController()
      setAbortController(controller)

      try {
        const endpointUrl = constructEndpointUrl(selectedEndpoint)
        const agnoApiUrl = `${endpointUrl}/v1/agents/${agentId}/runs`

        console.log('📡 Отправка запроса к Agno API:', {
          url: agnoApiUrl,
          user_id: user.id,
          session_id: currentSessionId,
          agent_id: agentId,
          message: formData.get('message') || '',
          is_new_session: isNewSession
        })

        await streamResponse({
          apiUrl: agnoApiUrl,
          requestBody: formData,
          abortController: controller,
          onChunk: (chunk: AgnoStreamEvent) => {
            console.log('📨 Agno event:', chunk.event, chunk)

            // Дополнительная диагностика
            if (!chunk.event) {
              console.warn('⚠️ Получено событие без поля event:', chunk)
              return
            }

            switch (chunk.event) {
              case 'RunStarted':
                // Сохраняем run_id для возможности продолжения диалога
                if (chunk.run_id) {
                  setCurrentRunId(chunk.run_id)
                  console.log('🚀 RunStarted - Run ID:', chunk.run_id)
                }

                if (chunk.session_id) {
                  responseSessionId = chunk.session_id
                  console.log('🚀 RunStarted - Session ID:', chunk.session_id)

                  // Обновляем session_id только если он отличается от отправленного
                  if (chunk.session_id !== currentSessionId) {
                    console.log('🔄 Обновляем session_id:', {
                      sent: currentSessionId,
                      received: chunk.session_id
                    })
                    setSessionId(chunk.session_id)
                  }

                  // Обновляем список сессий только для новых сессий
                  if (hasStorage && isNewSession) {
                    const userMessage =
                      (formData.get('message') as string) || 'Новый чат'
                    const sessionData = {
                      session_id: chunk.session_id,
                      title: userMessage,
                      created_at: chunk.created_at
                    }
                    setSessionsData((prevSessionsData) => {
                      const sessionExists = prevSessionsData?.some(
                        (session) => session.session_id === chunk.session_id
                      )
                      if (sessionExists) {
                        return prevSessionsData
                      }
                      return [sessionData, ...(prevSessionsData ?? [])]
                    })

                    // Автоматически переименовываем сессию на сообщение пользователя
                    if (
                      agentId &&
                      userMessage &&
                      userMessage !== 'Новый чат' &&
                      chunk.session_id
                    ) {
                      console.log(
                        '🏷️ Auto-renaming new session with user message'
                      )
                      setTimeout(() => {
                        if (agentId && chunk.session_id) {
                          // Дополнительная проверка для TypeScript
                          autoRenameSession(
                            agentId,
                            chunk.session_id,
                            userMessage
                          )
                        }
                      }, 1000) // Небольшая задержка для завершения создания сессии на сервере
                    }
                  }
                }
                break

              case 'RunResponseContent':
                if (chunk.content) {
                  currentContent += chunk.content
                  setMessages((prevMessages) => {
                    const newMessages = [...prevMessages]
                    const lastMessageIndex = newMessages.length - 1
                    const lastMessage = newMessages[lastMessageIndex]

                    if (lastMessage && lastMessage.role === 'agent') {
                      newMessages[lastMessageIndex] = {
                        ...lastMessage,
                        content: currentContent,
                        created_at: chunk.created_at ?? lastMessage.created_at,
                        // Поддержка медиа контента из Agno API
                        ...(chunk.images && { images: chunk.images }),
                        ...(chunk.videos && { videos: chunk.videos }),
                        ...(chunk.audio && { audio: chunk.audio }),
                        ...(chunk.response_audio && {
                          response_audio: chunk.response_audio
                        })
                      }
                    }
                    return newMessages
                  })
                }
                break

              case 'ToolCallStarted':
                if (chunk.tool_name) {
                  console.log('🔧 ToolCallStarted:', chunk.tool_name)
                  setMessages((prevMessages) => {
                    const newMessages = [...prevMessages]
                    const lastMessageIndex = newMessages.length - 1
                    const lastMessage = newMessages[lastMessageIndex]

                    if (lastMessage && lastMessage.role === 'agent') {
                      const newToolCall = {
                        tool_name: chunk.tool_name!,
                        tool_input: chunk.tool_input,
                        created_at: chunk.created_at,
                        status: 'running' as const
                      }

                      newMessages[lastMessageIndex] = {
                        ...lastMessage,
                        tool_calls: [
                          ...(lastMessage.tool_calls || []),
                          newToolCall
                        ]
                      }
                    }
                    return newMessages
                  })
                }
                break

              case 'ToolCallCompleted':
                if (chunk.tool_name) {
                  console.log('✅ ToolCallCompleted:', chunk.tool_name)
                  setMessages((prevMessages) => {
                    const newMessages = [...prevMessages]
                    const lastMessageIndex = newMessages.length - 1
                    const lastMessage = newMessages[lastMessageIndex]

                    if (
                      lastMessage &&
                      lastMessage.role === 'agent' &&
                      lastMessage.tool_calls
                    ) {
                      const updatedToolCalls = lastMessage.tool_calls.map(
                        (tc) =>
                          tc.tool_name === chunk.tool_name &&
                          tc.status === 'running'
                            ? {
                                ...tc,
                                tool_output: chunk.tool_output,
                                status: 'completed' as const
                              }
                            : tc
                      )

                      newMessages[lastMessageIndex] = {
                        ...lastMessage,
                        tool_calls: updatedToolCalls
                      }
                    }
                    return newMessages
                  })
                }
                break

              case 'RunCompleted':
                console.log('🏁 RunCompleted')
                setMessages((prevMessages) => {
                  const newMessages = [...prevMessages]
                  const lastMessageIndex = newMessages.length - 1
                  const lastMessage = newMessages[lastMessageIndex]

                  if (lastMessage && lastMessage.role === 'agent') {
                    newMessages[lastMessageIndex] = {
                      ...lastMessage,
                      content: currentContent || lastMessage.content,
                      created_at: chunk.created_at ?? lastMessage.created_at,
                      // Поддержка медиа контента из Agno API
                      ...(chunk.images && { images: chunk.images }),
                      ...(chunk.videos && { videos: chunk.videos }),
                      ...(chunk.audio && { audio: chunk.audio }),
                      ...(chunk.response_audio && {
                        response_audio: chunk.response_audio
                      })
                    }
                  }
                  return newMessages
                })
                break

              case 'RunError':
                console.error('❌ RunError:', chunk.content, chunk.error_type)
                updateMessagesWithErrorState()
                const errorContent =
                  chunk.content || 'Произошла ошибка при выполнении запроса'
                setStreamingErrorMessage(errorContent)

                // Удаляем сессию из списка при ошибке (только если это новая сессия)
                if (hasStorage && isNewSession && responseSessionId) {
                  setSessionsData(
                    (prevSessionsData) =>
                      prevSessionsData?.filter(
                        (session) => session.session_id !== responseSessionId
                      ) ?? null
                  )
                }
                break

              case 'ReasoningStarted':
                console.log('🤔 ReasoningStarted')
                break

              case 'ReasoningStep':
                console.log('💭 ReasoningStep')
                break

              default:
                console.log('❓ Unhandled Agno event:', chunk.event)
            }
          },
          onError: (error) => {
            console.error('💥 Agno stream error:', error)
            updateMessagesWithErrorState()
            setStreamingErrorMessage(error.message)

            // Удаляем сессию из списка при ошибке (только если это новая сессия)
            if (hasStorage && isNewSession && responseSessionId) {
              setSessionsData(
                (prevSessionsData) =>
                  prevSessionsData?.filter(
                    (session) => session.session_id !== responseSessionId
                  ) ?? null
              )
            }
          },
          onComplete: () => {
            console.log('✨ Agno stream completed')
          }
        })
      } catch (error) {
        console.error('💥 Error in Agno stream handler:', error)
        updateMessagesWithErrorState()
        setStreamingErrorMessage(
          error instanceof Error ? error.message : String(error)
        )

        // Удаляем сессию из списка при ошибке (только если это новая сессия)
        if (hasStorage && isNewSession && responseSessionId) {
          setSessionsData(
            (prevSessionsData) =>
              prevSessionsData?.filter(
                (session) => session.session_id !== responseSessionId
              ) ?? null
          )
        }
      } finally {
        focusChatInput()
        setIsStreaming(false)
        setAbortController(null)
      }
    },
    [
      setMessages,
      addMessage,
      updateMessagesWithErrorState,
      selectedEndpoint,
      streamResponse,
      agentId,
      setStreamingErrorMessage,
      setIsStreaming,
      focusChatInput,
      setSessionsData,
      sessionId,
      setSessionId,
      hasStorage,
      user?.id,
      setAbortController,
      setCurrentRunId,
      autoRenameSession
    ]
  )

  /**
   * Продолжение диалога с агентом используя нативный Agno API
   */
  const handleContinueDialog = useCallback(
    async (runId: string, tools: unknown[] = []) => {
      if (!agentId) {
        toast.error('Агент не выбран')
        return
      }

      if (!user?.id) {
        toast.error('Пользователь не аутентифицирован')
        return
      }

      if (!runId) {
        toast.error('Run ID не найден для продолжения диалога')
        return
      }

      setIsStreaming(true)
      setStreamingErrorMessage('')

      const formData = new FormData()
      formData.append('tools', JSON.stringify(tools))
      formData.append('user_id', user.id)
      formData.append('stream', 'true')

      if (sessionId) {
        formData.append('session_id', sessionId)
      }

      // Добавляем пустое сообщение агента для стриминга продолжения
      addMessage({
        role: 'agent',
        content: '',
        tool_calls: [],
        streamingError: false,
        created_at: Math.floor(Date.now() / 1000)
      })

      let currentContent = ''

      try {
        const endpointUrl = constructEndpointUrl(selectedEndpoint)
        const continueApiUrl = `${endpointUrl}/v1/agents/${agentId}/runs/${runId}/continue`

        console.log('🔄 Продолжение диалога с Agno API:', {
          url: continueApiUrl,
          user_id: user.id,
          session_id: sessionId,
          agent_id: agentId,
          run_id: runId,
          tools_count: tools.length
        })

        await streamResponse({
          apiUrl: continueApiUrl,
          requestBody: formData,
          onChunk: (chunk: AgnoStreamEvent) => {
            console.log('📨 Continue event:', chunk.event, chunk)

            switch (chunk.event) {
              case 'RunStarted':
                if (chunk.run_id) {
                  setCurrentRunId(chunk.run_id)
                  console.log('🚀 Continue RunStarted - Run ID:', chunk.run_id)
                }
                break

              case 'RunResponseContent':
                if (chunk.content) {
                  currentContent += chunk.content
                  setMessages((prevMessages) => {
                    const newMessages = [...prevMessages]
                    const lastMessageIndex = newMessages.length - 1
                    const lastMessage = newMessages[lastMessageIndex]

                    if (lastMessage && lastMessage.role === 'agent') {
                      newMessages[lastMessageIndex] = {
                        ...lastMessage,
                        content: currentContent,
                        created_at: chunk.created_at ?? lastMessage.created_at,
                        ...(chunk.images && { images: chunk.images }),
                        ...(chunk.videos && { videos: chunk.videos }),
                        ...(chunk.audio && { audio: chunk.audio }),
                        ...(chunk.response_audio && {
                          response_audio: chunk.response_audio
                        })
                      }
                    }
                    return newMessages
                  })
                }
                break

              case 'ToolCallStarted':
                if (chunk.tool_name) {
                  console.log('🔧 Continue ToolCallStarted:', chunk.tool_name)
                  setMessages((prevMessages) => {
                    const newMessages = [...prevMessages]
                    const lastMessageIndex = newMessages.length - 1
                    const lastMessage = newMessages[lastMessageIndex]

                    if (lastMessage && lastMessage.role === 'agent') {
                      const newToolCall = {
                        tool_name: chunk.tool_name!,
                        tool_input: chunk.tool_input,
                        created_at: chunk.created_at,
                        status: 'running' as const
                      }

                      newMessages[lastMessageIndex] = {
                        ...lastMessage,
                        tool_calls: [
                          ...(lastMessage.tool_calls || []),
                          newToolCall
                        ]
                      }
                    }
                    return newMessages
                  })
                }
                break

              case 'ToolCallCompleted':
                if (chunk.tool_name) {
                  console.log('✅ Continue ToolCallCompleted:', chunk.tool_name)
                  setMessages((prevMessages) => {
                    const newMessages = [...prevMessages]
                    const lastMessageIndex = newMessages.length - 1
                    const lastMessage = newMessages[lastMessageIndex]

                    if (
                      lastMessage &&
                      lastMessage.role === 'agent' &&
                      lastMessage.tool_calls
                    ) {
                      const updatedToolCalls = lastMessage.tool_calls.map(
                        (tc) =>
                          tc.tool_name === chunk.tool_name &&
                          tc.status === 'running'
                            ? {
                                ...tc,
                                tool_output: chunk.tool_output,
                                status: 'completed' as const
                              }
                            : tc
                      )

                      newMessages[lastMessageIndex] = {
                        ...lastMessage,
                        tool_calls: updatedToolCalls
                      }
                    }
                    return newMessages
                  })
                }
                break

              case 'RunCompleted':
                console.log('🏁 Continue RunCompleted')
                setMessages((prevMessages) => {
                  const newMessages = [...prevMessages]
                  const lastMessageIndex = newMessages.length - 1
                  const lastMessage = newMessages[lastMessageIndex]

                  if (lastMessage && lastMessage.role === 'agent') {
                    newMessages[lastMessageIndex] = {
                      ...lastMessage,
                      content: currentContent || lastMessage.content,
                      created_at: chunk.created_at ?? lastMessage.created_at,
                      ...(chunk.images && { images: chunk.images }),
                      ...(chunk.videos && { videos: chunk.videos }),
                      ...(chunk.audio && { audio: chunk.audio }),
                      ...(chunk.response_audio && {
                        response_audio: chunk.response_audio
                      })
                    }
                  }
                  return newMessages
                })
                break

              case 'RunError':
                console.error(
                  '❌ Continue RunError:',
                  chunk.content,
                  chunk.error_type
                )
                updateMessagesWithErrorState()
                const errorContent =
                  chunk.content || 'Произошла ошибка при продолжении диалога'
                setStreamingErrorMessage(errorContent)
                break

              default:
                console.log('❓ Unhandled continue event:', chunk.event)
            }
          },
          onError: (error) => {
            console.error('💥 Continue stream error:', error)
            updateMessagesWithErrorState()
            setStreamingErrorMessage(error.message)
          },
          onComplete: () => {
            console.log('✨ Continue stream completed')
          }
        })
      } catch (error) {
        console.error('💥 Error in continue handler:', error)
        updateMessagesWithErrorState()
        setStreamingErrorMessage(
          error instanceof Error ? error.message : String(error)
        )
      } finally {
        focusChatInput()
        setIsStreaming(false)
      }
    },
    [
      agentId,
      user?.id,
      sessionId,
      selectedEndpoint,
      streamResponse,
      setIsStreaming,
      setStreamingErrorMessage,
      addMessage,
      setMessages,
      updateMessagesWithErrorState,
      focusChatInput
    ]
  )

  /**
   * Отмена текущего запроса к агенту
   */
  const cancelCurrentRequest = useCallback(() => {
    if (abortController) {
      console.log('🛑 Отмена текущего запроса')
      abortController.abort()
      setAbortController(null)
      setIsStreaming(false)
      setCurrentRunId(null)

      // Обновляем последнее сообщение агента как отмененное
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages]
        const lastMessageIndex = newMessages.length - 1
        const lastMessage = newMessages[lastMessageIndex]
        if (
          lastMessage &&
          lastMessage.role === 'agent' &&
          lastMessage.content === ''
        ) {
          // Удаляем пустое сообщение агента если запрос был отменен до получения ответа
          return newMessages.slice(0, -1)
        }
        return newMessages
      })

      toast.info('Запрос отменен')
    }
  }, [
    abortController,
    setIsStreaming,
    setMessages,
    setCurrentRunId,
    setAbortController
  ])

  /**
   * Обработчик для запросов (определяет stream/non-stream автоматически)
   */
  const handleRequest = useCallback(
    async (input: string | FormData) => {
      if (!agentId) {
        toast.error('Агент не выбран')
        return
      }

      if (!user?.id) {
        toast.error('Пользователь не аутентифицирован')
        return
      }

      // Получаем настройку стриминга из конфигурации агента
      const shouldStream = await getStreamSetting()

      console.log('🔄 handleRequest: Using stream mode:', shouldStream)

      if (shouldStream) {
        return handleStreamResponse(input)
      } else {
        return handleNonStreamResponse(input)
      }
    },
    [
      agentId,
      user?.id,
      getStreamSetting,
      handleStreamResponse,
      handleNonStreamResponse
    ]
  )

  return {
    handleRequest, // Новый основной метод
    handleStreamResponse,
    handleNonStreamResponse,
    handleContinueDialog,
    cancelCurrentRequest,
    currentRunId,
    isRequestActive: !!abortController
  }
}

export default useAgnoStreamHandler
