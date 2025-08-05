import { useCallback } from 'react'
import { useQueryState } from 'nuqs'
import { toast } from 'sonner'

import { usePlaygroundStore } from '@/store'
import { useAuthContext } from '@/components/AuthProvider'
import { APIRoutes } from '@/api/routes'
import useAIResponseStream from './useAIResponseStream'
import useSessionLoader from './useSessionLoader'
import { type PlaygroundChatMessage } from '@/types/playground'
import { generateSessionId } from '@/lib/utils'

const useAIChatStreamHandler = () => {
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
  const { streamResponse } = useAIResponseStream()

  const handleStreamResponse = useCallback(
    async (input: string | FormData) => {
      setIsStreaming(true)

      const formData = input instanceof FormData ? input : new FormData()
      if (typeof input === 'string') {
        formData.append('message', input)
      }

      if (!sessionId && agentId && user?.id) {
        const newSessionId = generateSessionId()
        await setSessionId(newSessionId, {
          history: 'push',
          scroll: false,
          shallow: true
        })

        if (hasStorage) {
          const userMessage = formData.get('message') as string
          const sessionEntry = {
            session_id: newSessionId,
            title: userMessage,
            created_at: Math.floor(Date.now() / 1000),
            session_data: {
              session_name: userMessage
            }
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

      // Add user_id to FormData for session creation
      if (user?.id) {
        formData.append('user_id', user.id)
      }

      // Remove any previous error messages
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

      if (!selectedEndpoint || !agentId) {
        toast.error('Missing endpoint or agent')
        setIsStreaming(false)
        return
      }

      const playgroundRunUrl = APIRoutes.AgentRun(selectedEndpoint).replace(
        '{agent_id}',
        agentId
      )

      try {
        await streamResponse({
          apiUrl: playgroundRunUrl,
          requestBody: formData,
          onChunk: (chunk) => {
            // Simple chunk processing - just add messages as they come
            const userMessage: PlaygroundChatMessage = {
              role: 'user',
              content: formData.get('message') as string,
              created_at: Math.floor(Date.now() / 1000)
            }

            const agentMessage: PlaygroundChatMessage = {
              role: 'agent',
              content: typeof chunk.content === 'string' ? chunk.content : '',
              created_at: Math.floor(Date.now() / 1000)
            }

            setMessages((prevMessages) => [
              ...prevMessages,
              userMessage,
              agentMessage
            ])

            // Handle session creation
            if (chunk.session_id && chunk.session_id !== sessionId) {
              setSessionId(chunk.session_id as string)

              if (
                hasStorage &&
                (!sessionId || sessionId !== chunk.session_id)
              ) {
                const userMessage = formData.get('message') as string
                const sessionData = {
                  session_id: chunk.session_id as string,
                  title: userMessage,
                  created_at: Math.floor(Date.now() / 1000),
                  session_data: {
                    session_name: userMessage
                  }
                }

                setSessionsData((prevSessionsData) => {
                  const sessionExists = prevSessionsData?.some(
                    (session) => session.session_id === chunk.session_id
                  )
                  if (sessionExists) return prevSessionsData

                  return [sessionData, ...(prevSessionsData ?? [])]
                })

                if (agentId && userMessage && chunk.session_id) {
                  setTimeout(() => {
                    autoRenameSession(
                      agentId,
                      chunk.session_id as string,
                      userMessage
                    )
                  }, 1000)
                }
              }
            }
          },
          onError: (error) => {
            const errorMessage: PlaygroundChatMessage = {
              role: 'agent',
              content: `Error: ${error.message}`,
              created_at: Math.floor(Date.now() / 1000),
              streamingError: true
            }
            setMessages((prevMessages) => [...prevMessages, errorMessage])
            toast.error(error.message || 'Streaming error occurred')
          },
          onComplete: () => {
            setIsStreaming(false)
          }
        })
      } catch {
        const errorMessage: PlaygroundChatMessage = {
          role: 'agent',
          content: 'Request failed',
          created_at: Math.floor(Date.now() / 1000),
          streamingError: true
        }
        setMessages((prevMessages) => [...prevMessages, errorMessage])
        toast.error('Request failed')
        setIsStreaming(false)
      }
    },
    [
      agentId,
      sessionId,
      setSessionId,
      selectedEndpoint,
      setIsStreaming,
      setMessages,
      hasStorage,
      setSessionsData,
      user?.id,
      autoRenameSession,
      streamResponse
    ]
  )

  return {
    handleStreamResponse
  }
}

export default useAIChatStreamHandler
