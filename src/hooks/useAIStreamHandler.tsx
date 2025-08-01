import { useCallback } from 'react'

import { APIRoutes } from '@/api/routes'

import useChatActions from '@/hooks/useChatActions'
import useSessionLoader from '@/hooks/useSessionLoader'
import { usePlaygroundStore } from '../store'
import {
  RunEvent,
  RunResponseContent,
  type RunResponse
} from '@/types/playground'
import { constructEndpointUrl } from '@/lib/constructEndpointUrl'
import useAIResponseStream from './useAIResponseStream'
import { ToolCall } from '@/types/playground'
import { useQueryState } from 'nuqs'
import { getJsonMarkdown } from '@/lib/utils'
import { useAuthContext } from '@/components/AuthProvider'

/**
 * useAIChatStreamHandler is responsible for making API calls and handling the stream response.
 * For now, it only streams message content and updates the messages state.
 */
const useAIChatStreamHandler = () => {
  const setMessages = usePlaygroundStore((state) => state.setMessages)
  const { addMessage, focusChatInput } = useChatActions()
  const { autoRenameSession } = useSessionLoader()
  const [agentId] = useQueryState('agent')
  const [sessionId, setSessionId] = useQueryState('session')
  const selectedEndpoint = usePlaygroundStore((state) => state.selectedEndpoint)
  const setStreamingErrorMessage = usePlaygroundStore(
    (state) => state.setStreamingErrorMessage
  )
  const setIsStreaming = usePlaygroundStore((state) => state.setIsStreaming)
  const setSessionsData = usePlaygroundStore((state) => state.setSessionsData)
  const hasStorage = usePlaygroundStore((state) => state.hasStorage)
  const { streamResponse } = useAIResponseStream()
  const { user } = useAuthContext()

  const updateMessagesWithErrorState = useCallback(() => {
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages]
      const lastMessageIndex = newMessages.length - 1
      const lastMessage = newMessages[lastMessageIndex]
      if (lastMessage && lastMessage.role === 'agent') {
        // Создаем новый объект сообщения вместо мутации
        newMessages[lastMessageIndex] = {
          ...lastMessage,
          streamingError: true
        }
      }
      return newMessages
    })
  }, [setMessages])

  /**
   * Processes a new tool call and adds it to the message
   * @param toolCall - The tool call to add
   * @param prevToolCalls - The previous tool calls array
   * @returns Updated tool calls array
   */
  const processToolCall = useCallback(
    (toolCall: ToolCall, prevToolCalls: ToolCall[] = []) => {
      const toolCallId =
        toolCall.tool_call_id || `${toolCall.tool_name}-${toolCall.created_at}`

      const existingToolCallIndex = prevToolCalls.findIndex(
        (tc) =>
          (tc.tool_call_id && tc.tool_call_id === toolCall.tool_call_id) ||
          (!tc.tool_call_id &&
            toolCall.tool_name &&
            toolCall.created_at &&
            `${tc.tool_name}-${tc.created_at}` === toolCallId)
      )
      if (existingToolCallIndex >= 0) {
        const updatedToolCalls = [...prevToolCalls]
        updatedToolCalls[existingToolCallIndex] = {
          ...updatedToolCalls[existingToolCallIndex],
          ...toolCall
        }
        return updatedToolCalls
      } else {
        return [...prevToolCalls, toolCall]
      }
    },
    []
  )

  /**
   * Processes tool calls from a chunk, handling both single tool object and tools array formats
   * @param chunk - The chunk containing tool call data
   * @param existingToolCalls - The existing tool calls array
   * @returns Updated tool calls array
   */
  const processChunkToolCalls = useCallback(
    (
      chunk: RunResponseContent | RunResponse,
      existingToolCalls: ToolCall[] = []
    ) => {
      let updatedToolCalls = [...existingToolCalls]
      // Handle new single tool object format
      if (chunk.tool) {
        updatedToolCalls = processToolCall(chunk.tool, updatedToolCalls)
      }
      // Handle legacy tools array format
      if (chunk.tools && chunk.tools.length > 0) {
        for (const toolCall of chunk.tools) {
          updatedToolCalls = processToolCall(toolCall, updatedToolCalls)
        }
      }

      return updatedToolCalls
    },
    [processToolCall]
  )

  const handleStreamResponse = useCallback(
    async (input: string | FormData) => {
      setIsStreaming(true)

      const formData = input instanceof FormData ? input : new FormData()
      if (typeof input === 'string') {
        formData.append('message', input)
      }

      // Generate a new session_id if one doesn't exist (New Chat case)
      if (!sessionId && agentId && user?.id) {
        // Генерируем строку на основе user_id + agent_id + времени
        const newSessionId = `${user.id}-${agentId}-${Date.now()}`
        await setSessionId(newSessionId, {
          history: 'push',
          scroll: false,
          shallow: true
        })
        // Обновляем список сессий сразу после создания новой
        if (hasStorage) {
          const sessionEntry = {
            session_id: newSessionId,
            title: formData.get('message') as string,
            created_at: Math.floor(Date.now() / 1000)
          }
          setSessionsData((prev) => {
            const exists = prev?.some((s) => s.session_id === newSessionId)
            if (exists) return prev
            return [sessionEntry, ...(prev ?? [])]
          })
        }
        formData.append('session_id', newSessionId)
      } else {
        formData.append('session_id', sessionId ?? '')
      }

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

      addMessage({
        role: 'user',
        content: formData.get('message') as string,
        created_at: Math.floor(Date.now() / 1000)
      })

      addMessage({
        role: 'agent',
        content: '',
        tool_calls: [],
        streamingError: false,
        created_at: Math.floor(Date.now() / 1000) + 1
      })

      let lastContent = ''
      let newSessionId = sessionId
      try {
        const endpointUrl = constructEndpointUrl(selectedEndpoint)

        if (!agentId) return
        const playgroundRunUrl = APIRoutes.AgentRun(endpointUrl).replace(
          '{agent_id}',
          agentId
        )

        formData.append('stream', 'true')
        // Добавляем user_id если пользователь аутентифицирован
        if (user?.id) {
          formData.append('user_id', user.id)
        }

        await streamResponse({
          apiUrl: playgroundRunUrl,
          requestBody: formData,
          onChunk: (chunk: RunResponse) => {
            if (
              chunk.event === RunEvent.RunStarted ||
              chunk.event === RunEvent.ReasoningStarted
            ) {
              newSessionId = chunk.session_id as string
              setSessionId(chunk.session_id as string)
              if (
                hasStorage &&
                (!sessionId || sessionId !== chunk.session_id) &&
                chunk.session_id
              ) {
                const userMessage = formData.get('message') as string
                const sessionData = {
                  session_id: chunk.session_id as string,
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
                if (agentId && userMessage && userMessage !== 'Новый чат') {
                  console.log(
                    '🏷️ AI Handler: Auto-renaming new session with user message'
                  )
                  setTimeout(() => {
                    if (agentId && chunk.session_id) {
                      autoRenameSession(
                        agentId,
                        chunk.session_id as string,
                        userMessage
                      )
                    }
                  }, 1000)
                }
              }
            } else if (chunk.event === RunEvent.ToolCallStarted) {
              setMessages((prevMessages) => {
                const newMessages = [...prevMessages]
                const lastMessageIndex = newMessages.length - 1
                const lastMessage = newMessages[lastMessageIndex]
                if (lastMessage && lastMessage.role === 'agent') {
                  // Создаем новый объект сообщения вместо мутации
                  newMessages[lastMessageIndex] = {
                    ...lastMessage,
                    tool_calls: processChunkToolCalls(
                      chunk,
                      lastMessage.tool_calls
                    )
                  }
                }
                return newMessages
              })
            } else if (
              chunk.event === RunEvent.RunResponse ||
              chunk.event === RunEvent.RunResponseContent
            ) {
              // Проверяем, есть ли reasoning_steps в первом событии с пустым content
              const hasReasoningInChunk =
                chunk.extra_data?.reasoning_steps &&
                (Array.isArray(chunk.extra_data.reasoning_steps)
                  ? chunk.extra_data.reasoning_steps.length > 0
                  : true)

              if (typeof chunk.content === 'string') {
                lastContent += chunk.content
              } else if (chunk.content && typeof chunk.content === 'object') {
                // Не добавляем объект content в lastContent, если это может быть reasoning
                // Reasoning должен обрабатываться через extra_data
                // Только если это действительно нужно отобразить как JSON (например, structured output)
                if (!chunk.extra_data?.reasoning_steps) {
                  lastContent += getJsonMarkdown(chunk.content)
                }
              }
              setMessages((prevMessages) => {
                const newMessages = [...prevMessages]
                const lastMessageIndex = newMessages.length - 1
                const lastMessage = newMessages[lastMessageIndex]
                if (
                  lastMessage &&
                  lastMessage.role === 'agent' &&
                  (typeof chunk.content === 'string' || hasReasoningInChunk)
                ) {
                  // Создаем новый объект сообщения вместо мутации
                  newMessages[lastMessageIndex] = {
                    ...lastMessage,
                    content: lastContent,
                    tool_calls: processChunkToolCalls(
                      chunk,
                      lastMessage.tool_calls
                    ),
                    extra_data:
                      chunk.extra_data?.reasoning_steps ||
                      chunk.extra_data?.references
                        ? {
                            ...lastMessage.extra_data,
                            ...(chunk.extra_data.reasoning_steps && {
                              reasoning_steps: chunk.extra_data.reasoning_steps
                            }),
                            ...(chunk.extra_data.references && {
                              references: chunk.extra_data.references
                            })
                          }
                        : lastMessage.extra_data,
                    created_at: chunk.created_at ?? lastMessage.created_at,
                    ...(chunk.images && { images: chunk.images }),
                    ...(chunk.videos && { videos: chunk.videos }),
                    ...(chunk.audio && { audio: chunk.audio })
                  }
                } else if (
                  lastMessage &&
                  lastMessage.role === 'agent' &&
                  typeof chunk?.content !== 'string' &&
                  chunk.content !== null &&
                  !chunk.extra_data?.reasoning_steps // Не добавляем контент, если есть reasoning
                ) {
                  const jsonBlock = getJsonMarkdown(chunk?.content)
                  // Создаем новый объект сообщения вместо мутации
                  newMessages[lastMessageIndex] = {
                    ...lastMessage,
                    content: lastMessage.content + jsonBlock
                  }
                  lastContent = lastMessage.content + jsonBlock
                } else if (
                  lastMessage &&
                  lastMessage.role === 'agent' &&
                  chunk.extra_data?.reasoning_steps
                ) {
                  // Если есть reasoning_steps, просто обновляем extra_data без изменения content
                  newMessages[lastMessageIndex] = {
                    ...lastMessage,
                    extra_data: {
                      ...lastMessage.extra_data,
                      reasoning_steps: chunk.extra_data.reasoning_steps,
                      ...(chunk.extra_data.references && {
                        references: chunk.extra_data.references
                      })
                    }
                  }
                } else if (
                  chunk.response_audio?.transcript &&
                  typeof chunk.response_audio?.transcript === 'string'
                ) {
                  const transcript = chunk.response_audio.transcript
                  // Создаем новый объект сообщения вместо мутации
                  // Обрабатываем response_audio с учетом того, что он может быть string или ResponseAudio
                  const currentResponseAudio = lastMessage.response_audio
                  const existingTranscript =
                    typeof currentResponseAudio === 'object' &&
                    currentResponseAudio?.transcript
                      ? currentResponseAudio.transcript
                      : ''

                  newMessages[lastMessageIndex] = {
                    ...lastMessage,
                    response_audio: {
                      ...(typeof currentResponseAudio === 'object'
                        ? currentResponseAudio
                        : {}),
                      transcript: existingTranscript + transcript
                    }
                  }
                }
                return newMessages
              })
            } else if (chunk.event === RunEvent.ReasoningStep) {
              setMessages((prevMessages) => {
                const newMessages = [...prevMessages]
                const lastMessageIndex = newMessages.length - 1
                const lastMessage = newMessages[lastMessageIndex]
                if (lastMessage && lastMessage.role === 'agent') {
                  if (chunk.extra_data?.reasoning_steps) {
                    // Создаем новый объект сообщения вместо мутации
                    newMessages[lastMessageIndex] = {
                      ...lastMessage,
                      extra_data: {
                        ...lastMessage.extra_data,
                        reasoning_steps: chunk.extra_data.reasoning_steps
                      }
                    }
                  }
                }
                return newMessages
              })
            } else if (chunk.event === RunEvent.ReasoningCompleted) {
              setMessages((prevMessages) => {
                const newMessages = [...prevMessages]
                const lastMessageIndex = newMessages.length - 1
                const lastMessage = newMessages[lastMessageIndex]
                if (lastMessage && lastMessage.role === 'agent') {
                  if (chunk.extra_data?.reasoning_steps) {
                    // Создаем новый объект сообщения вместо мутации
                    newMessages[lastMessageIndex] = {
                      ...lastMessage,
                      extra_data: {
                        ...lastMessage.extra_data,
                        reasoning_steps: chunk.extra_data.reasoning_steps
                      }
                    }
                  }
                }
                return newMessages
              })
            } else if (chunk.event === RunEvent.RunError) {
              updateMessagesWithErrorState()
              const errorContent = chunk.content as string
              setStreamingErrorMessage(errorContent)
              if (hasStorage && newSessionId) {
                setSessionsData(
                  (prevSessionsData) =>
                    prevSessionsData?.filter(
                      (session) => session.session_id !== newSessionId
                    ) ?? null
                )
              }
            } else if (chunk.event === RunEvent.RunCompleted) {
              setMessages((prevMessages) => {
                const newMessages = prevMessages.map((message, index) => {
                  if (
                    index === prevMessages.length - 1 &&
                    message.role === 'agent'
                  ) {
                    let updatedContent: string
                    // Если content уже есть в сообщении, используем его
                    // Иначе проверяем chunk.content
                    if (message.content) {
                      updatedContent = message.content
                    } else if (typeof chunk.content === 'string') {
                      updatedContent = chunk.content
                    } else {
                      // Если content не строка, но сообщение уже имеет контент из стриминга,
                      // не перезаписываем его JSON представлением
                      updatedContent = message.content || ''
                    }
                    return {
                      ...message,
                      content: updatedContent,
                      tool_calls: processChunkToolCalls(
                        chunk,
                        message.tool_calls
                      ),
                      images: chunk.images ?? message.images,
                      videos: chunk.videos ?? message.videos,
                      response_audio: chunk.response_audio,
                      created_at: chunk.created_at ?? message.created_at,
                      extra_data: {
                        reasoning_steps:
                          chunk.extra_data?.reasoning_steps ??
                          message.extra_data?.reasoning_steps,
                        references:
                          chunk.extra_data?.references ??
                          message.extra_data?.references
                      }
                    }
                  }
                  return message
                })
                return newMessages
              })
            }
          },
          onError: (error) => {
            updateMessagesWithErrorState()
            setStreamingErrorMessage(error.message)
            if (hasStorage && newSessionId) {
              setSessionsData(
                (prevSessionsData) =>
                  prevSessionsData?.filter(
                    (session) => session.session_id !== newSessionId
                  ) ?? null
              )
            }
          },
          onComplete: () => {}
        })
      } catch (error) {
        updateMessagesWithErrorState()
        setStreamingErrorMessage(
          error instanceof Error ? error.message : String(error)
        )
        if (hasStorage && newSessionId) {
          setSessionsData(
            (prevSessionsData) =>
              prevSessionsData?.filter(
                (session) => session.session_id !== newSessionId
              ) ?? null
          )
        }
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
      streamResponse,
      agentId,
      setStreamingErrorMessage,
      setIsStreaming,
      focusChatInput,
      setSessionsData,
      sessionId,
      setSessionId,
      hasStorage,
      processChunkToolCalls,
      user?.id,
      autoRenameSession
    ]
  )

  return { handleStreamResponse }
}

export default useAIChatStreamHandler
