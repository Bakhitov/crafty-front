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

  // Подписываемся на изменения в сообщениях для этого чата
  useEffect(() => {
    const subscription = supabase
      .channel(`messages_${chatId}_${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        () => {
          fetchMessages()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [chatId, instanceId, fetchMessages])

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
