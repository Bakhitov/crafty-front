'use client'

import { useState, useEffect } from 'react'
import MessengerChatInput from './MessengerChatInput'
import MessengerMessageArea from './MessengerMessageArea'
import { usePlaygroundStore } from '@/store'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface MessengerChatAreaProps {
  chatId: string | null
  instanceId: string | null
}

interface ChatInfo {
  contact_name: string | null
  from_number: string | null
  is_group: boolean
  group_id: string | null
  provider: string
}

const MessengerChatArea = ({ chatId, instanceId }: MessengerChatAreaProps) => {
  const { setIsChatMode, setSelectedChatId, setSelectedInstanceId } =
    usePlaygroundStore()
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)
  const [isLoadingChatInfo, setIsLoadingChatInfo] = useState(true)

  const handleCloseChatMode = () => {
    setIsChatMode(false)
    setSelectedChatId(null)
    setSelectedInstanceId(null)
  }

  // Загружаем информацию о чате
  useEffect(() => {
    const fetchChatInfo = async () => {
      if (!chatId || !instanceId) {
        setIsLoadingChatInfo(false)
        return
      }

      try {
        setIsLoadingChatInfo(true)

        // Загружаем последнее сообщение чата для получения информации
        const { data: messageData, error } = await supabase
          .from('messages')
          .select('contact_name, from_number, is_group, group_id')
          .eq('chat_id', chatId)
          .eq('instance_id', instanceId)
          .limit(1)
          .single()

        if (error) {
          console.error('Error fetching chat info:', error)
          setChatInfo(null)
          return
        }

        // Загружаем информацию об инстансе для провайдера
        const { data: instanceData } = await supabase
          .from('message_instances')
          .select('provider')
          .eq('id', instanceId)
          .single()

        setChatInfo({
          contact_name: messageData.contact_name,
          from_number: messageData.from_number,
          is_group: messageData.is_group,
          group_id: messageData.group_id,
          provider: instanceData?.provider || 'unknown'
        })
      } catch (error) {
        console.error('Error in fetchChatInfo:', error)
        setChatInfo(null)
      } finally {
        setIsLoadingChatInfo(false)
      }
    }

    fetchChatInfo()
  }, [chatId, instanceId])

  if (!chatId || !instanceId) {
    return (
      <main className="bg-background-primary relative m-1.5 flex flex-grow flex-col items-center justify-center rounded-xl">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">Выберите чат</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Выберите чат из списка для просмотра сообщений
          </p>
        </div>
      </main>
    )
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'whatsappweb':
      case 'whatsapp-official':
        return 'whatsapp'
      case 'telegram':
        return 'telegram'
      case 'discord':
        return 'discord'
      case 'slack':
        return 'slack'
      case 'messenger':
        return 'messenger'
      default:
        return 'message-circle'
    }
  }

  const getChatDisplayName = () => {
    if (!chatInfo) return 'Загрузка...'

    if (chatInfo.is_group) {
      return chatInfo.contact_name || `Группа ${chatInfo.group_id?.slice(-6)}`
    } else {
      return (
        chatInfo.contact_name || chatInfo.from_number || 'Неизвестный контакт'
      )
    }
  }

  return (
    <main className="bg-background-primary relative m-1.5 flex flex-grow flex-col rounded-xl">
      {/* Заголовок с информацией о чате */}
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          {isLoadingChatInfo ? (
            <>
              <Skeleton className="h-8 w-8 rounded-full" />
              <div>
                <Skeleton className="mb-1 h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <div className="bg-accent flex h-8 w-8 items-center justify-center rounded-full">
                  <Icon
                    type={chatInfo?.is_group ? 'users' : 'user'}
                    size="sm"
                    className={
                      chatInfo?.is_group ? 'text-blue-500' : 'text-green-500'
                    }
                  />
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <Icon
                    type={getProviderIcon(chatInfo?.provider || 'whatsappweb')}
                    size="xs"
                    className="bg-background rounded-full p-0.5"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <h2 className="text-primary text-sm font-medium">
                  {getChatDisplayName()}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {chatInfo?.provider || 'unknown'}
                  </Badge>
                  {chatInfo?.is_group && (
                    <Badge variant="secondary" className="text-xs">
                      Группа
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCloseChatMode}
          className="h-8 w-8 p-0"
        >
          <Icon type="x" size="sm" />
        </Button>
      </div>

      <MessengerMessageArea chatId={chatId} instanceId={instanceId} />
      <div className="sticky bottom-0 ml-9 px-4 pb-2">
        <MessengerChatInput chatId={chatId} instanceId={instanceId} />
      </div>
    </main>
  )
}

export default MessengerChatArea
