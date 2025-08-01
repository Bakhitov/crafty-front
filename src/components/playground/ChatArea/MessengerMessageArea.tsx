'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Message } from '@/types/messenger'
import { StickToBottom } from 'use-stick-to-bottom'
import { toast } from 'sonner'
import MessengerMessages from './MessengerMessages'
import ScrollToBottom from '@/components/playground/ChatArea/ScrollToBottom'

interface MessengerMessageAreaProps {
  chatId: string
  instanceId: string
}

const MessengerMessageArea = ({
  chatId,
  instanceId
}: MessengerMessageAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Обработчики realtime событий
  const handleNewMessage = useCallback(
    (payload: { new: Message }) => {
      console.log('New message received:', payload.new)
      const newMessage = payload.new as Message

      // Проверяем, что сообщение для нашего инстанса
      if (newMessage.instance_id === instanceId) {
        setMessages((prevMessages) => {
          // Проверяем, не существует ли уже такое сообщение
          const messageExists = prevMessages.some(
            (msg) => msg.id === newMessage.id
          )
          if (messageExists) {
            return prevMessages
          }

          // Добавляем новое сообщение в правильном порядке по timestamp
          const updatedMessages = [...prevMessages, newMessage]
          return updatedMessages.sort(
            (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
          )
        })
      }
    },
    [instanceId]
  )

  const handleUpdateMessage = useCallback(
    (payload: { new: Message }) => {
      console.log('Message updated:', payload.new)
      const updatedMessage = payload.new as Message

      // Проверяем, что сообщение для нашего инстанса
      if (updatedMessage.instance_id === instanceId) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
        )
      }
    },
    [instanceId]
  )

  const handleDeleteMessage = useCallback(
    (payload: { old: Message }) => {
      console.log('Message deleted:', payload.old)
      const deletedMessage = payload.old as Message

      // Проверяем, что сообщение для нашего инстанса
      if (deletedMessage.instance_id === instanceId) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== deletedMessage.id)
        )
      }
    },
    [instanceId]
  )

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true)

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .eq('instance_id', instanceId)
        .order('timestamp', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        toast.error(`Failed to load messages: ${error.message}`)
        return
      }

      setMessages(messagesData || [])
    } catch (error) {
      console.error('Error in fetchMessages:', error)
      toast.error(
        `Failed to load messages: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsLoading(false)
    }
  }, [chatId, instanceId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Подписываемся на изменения в сообщениях для этого чата с бесшовными обновлениями
  useEffect(() => {
    const subscription = supabase
      .channel(`messages_${chatId}_${instanceId}`)
      .on(
        'postgres_changes' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        handleNewMessage
      )
      .on(
        'postgres_changes' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        handleUpdateMessage
      )
      .on(
        'postgres_changes' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        handleDeleteMessage
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [
    chatId,
    instanceId,
    handleNewMessage,
    handleUpdateMessage,
    handleDeleteMessage
  ])

  return (
    <StickToBottom
      className="relative mb-4 flex max-h-[calc(100vh-64px)] min-h-0 flex-grow flex-col"
      resize="smooth"
      initial="smooth"
    >
      <StickToBottom.Content className="flex min-h-full flex-col justify-center">
        <div className="mx-auto w-full max-w-2xl space-y-4 px-4 pb-4">
          <MessengerMessages messages={messages} isLoading={isLoading} />
        </div>
      </StickToBottom.Content>
      <ScrollToBottom />
    </StickToBottom>
  )
}

export default MessengerMessageArea
