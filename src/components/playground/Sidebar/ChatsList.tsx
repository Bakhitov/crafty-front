'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Icon from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ProviderType, MessageInstance } from '@/types/messenger'
import { toast } from 'sonner'
import { usePlaygroundStore } from '@/store'
import { useCompanyContext } from '@/components/CompanyProvider'

// Интерфейс для чата, полученного из таблицы messages
interface ChatFromMessages {
  chat_id: string
  instance_id: string
  contact_name: string | null
  from_number: string | null
  is_group: boolean
  group_id: string | null
  last_message: string | null
  last_message_timestamp: number | null
  updated_at: string
  provider: ProviderType
  session_id: string | null
}

interface ChatItemProps {
  chat: ChatFromMessages
  instance: MessageInstance | null
  isSelected: boolean
  onClick: () => void
}

const ChatItem = ({ chat, instance, isSelected, onClick }: ChatItemProps) => {
  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return ''

    const date = new Date(timestamp * 1000) // timestamp в секундах
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    // Всегда показываем день и месяц, плюс время если сегодня
    if (diffInHours < 24) {
      // Если сегодня - показываем день.месяц + время
      return `${date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit'
      })} ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`
    } else {
      // Если не сегодня - показываем только день.месяц
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit'
      })
    }
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

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'whatsappweb':
      case 'whatsapp-official':
        return 'text-green-500'
      case 'telegram':
        return 'text-blue-500'
      case 'discord':
        return 'text-indigo-600'
      case 'slack':
        return 'text-purple-600'
      case 'messenger':
        return 'text-blue-600'
      default:
        return 'text-gray-500'
    }
  }

  const displayName = chat.is_group
    ? chat.contact_name || `Group ${chat.group_id?.slice(-6)}`
    : chat.contact_name || chat.from_number || 'Unknown'

  const hasAgentConfig =
    instance?.agno_config?.enabled && instance?.agno_config?.agent_id

  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex cursor-pointer items-start gap-2 rounded-lg p-2 transition-colors duration-200',
        isSelected
          ? 'bg-accent cursor-default'
          : 'bg-background-secondary hover:bg-background-secondary'
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center">
        <Icon
          type={getProviderIcon(chat.provider)}
          size="lg"
          className={getProviderColor(chat.provider)}
        />
      </div>

      <div className="min-w-0 flex-1">
        {/* Первая строчка - имя чата */}
        <div className="flex items-center">
          <h4
            className={cn(
              'font-geist truncate text-xs font-medium',
              isSelected ? 'text-primary' : 'text-foreground'
            )}
          >
            {displayName}
          </h4>
          {chat.is_group && (
            <Icon type="users" size="xxs" className="ml-1 text-blue-500" />
          )}
        </div>

        {/* Вторая строчка - последнее сообщение */}
        <div className="mt-0.5">
          <p className="font-geist text-muted-foreground text-micro truncate">
            {chat.last_message || 'No messages'}
          </p>
        </div>

        {/* Третья строчка - конфигурационные данные */}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {hasAgentConfig && (
              <div className="flex items-center gap-1" title="Agent configured">
                <Icon type="agent" size="xxs" className="text-muted" />
                <span className="text-xxs text-muted font-medium">
                  {instance?.agno_config?.agent_id}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted text-xxs">
              {formatTimestamp(chat.last_message_timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const ChatsSkeletonList = ({ count = 5 }: { count?: number }) => (
  <div className="flex flex-col gap-y-1">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="bg-background-secondary flex items-center gap-3 rounded-lg p-3"
      >
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
          <Skeleton className="h-3 w-32 rounded" />
        </div>
      </div>
    ))}
  </div>
)

const ChatsList = () => {
  const [chats, setChats] = useState<ChatFromMessages[]>([])
  const [instances, setInstances] = useState<MessageInstance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { company } = useCompanyContext()
  const {
    selectedChatId,
    setSelectedChatId,
    setSelectedInstanceId,
    setIsChatMode
  } = usePlaygroundStore()

  const fetchInstancesData = useCallback(async () => {
    try {
      const { data: instancesData, error } = await supabase
        .from('message_instances')
        .select('*')

      if (error) {
        console.error('Error fetching instances:', error)
        return []
      }

      return instancesData || []
    } catch (error) {
      console.error('Error in fetchInstancesData:', error)
      return []
    }
  }, [])

  const fetchChats = useCallback(async () => {
    try {
      setIsLoading(true)

      // Загружаем инстансы
      const instancesData = await fetchInstancesData()
      setInstances(instancesData)

      // Оптимизированный запрос для получения чатов из таблицы messages
      // Используем window function для получения последнего сообщения для каждого чата
      const { data: chatsData, error } = await supabase.rpc(
        'get_latest_chats',
        {
          p_company_id: company?.id || null,
          p_instance_id: null,
          p_limit: 100
        }
      )

      if (error) {
        console.error('Error fetching chats:', error)

        // Fallback: используем обычный запрос если RPC функция не доступна
        let fallbackQuery = supabase
          .from('messages')
          .select(
            `
            chat_id,
            instance_id,
            contact_name,
            from_number,
            is_group,
            group_id,
            message_body,
            timestamp,
            updated_at,
            session_id,
            message_instances!inner (
              company_id
            )
          `
          )
          .not('chat_id', 'is', null)
          .order('timestamp', { ascending: false })
          .limit(1000) // Ограничиваем для производительности

        // Добавляем фильтрацию по компании если есть company_id
        if (company?.id) {
          fallbackQuery = fallbackQuery.eq(
            'message_instances.company_id',
            company.id
          )
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery

        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError)
          toast.error(`Failed to load chats: ${fallbackError.message}`)
          return
        }

        // Группируем вручную по chat_id + instance_id
        const chatMap = new Map<string, ChatFromMessages>()

        if (fallbackData) {
          for (const message of fallbackData) {
            const chatKey = `${message.instance_id}-${message.chat_id}`

            if (!chatMap.has(chatKey)) {
              const instance = instancesData.find(
                (inst) => inst.id === message.instance_id
              )

              chatMap.set(chatKey, {
                chat_id: message.chat_id,
                instance_id: message.instance_id,
                contact_name: message.contact_name,
                from_number: message.from_number,
                is_group: message.is_group,
                group_id: message.group_id,
                last_message: message.message_body,
                last_message_timestamp: message.timestamp,
                updated_at: message.updated_at,
                provider: (instance?.provider as ProviderType) || 'whatsappweb',
                session_id: message.session_id
              })
            }
          }
        }

        const chatsList = Array.from(chatMap.values()).sort((a, b) => {
          const timeA = a.last_message_timestamp || 0
          const timeB = b.last_message_timestamp || 0
          return timeB - timeA
        })

        setChats(chatsList)
        return
      }

      // Если RPC функция работает, используем её результат
      if (chatsData) {
        const processedChats: ChatFromMessages[] = chatsData.map(
          (chat: {
            chat_id: string
            instance_id: string
            contact_name: string | null
            from_number: string | null
            is_group: boolean
            group_id: string | null
            last_message: string | null
            last_message_timestamp: number | null
            updated_at: string
            session_id: string | null
          }) => {
            const instance = instancesData.find(
              (inst) => inst.id === chat.instance_id
            )

            return {
              chat_id: chat.chat_id,
              instance_id: chat.instance_id,
              contact_name: chat.contact_name,
              from_number: chat.from_number,
              is_group: chat.is_group,
              group_id: chat.group_id,
              last_message: chat.last_message,
              last_message_timestamp: chat.last_message_timestamp,
              updated_at: chat.updated_at,
              provider: (instance?.provider as ProviderType) || 'whatsappweb',
              session_id: chat.session_id
            }
          }
        )

        setChats(processedChats)
      }
    } catch (error) {
      console.error('Error in fetchChats:', error)
      toast.error(
        `Failed to load chats: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsLoading(false)
    }
  }, [fetchInstancesData, company?.id])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  // Подписываемся на изменения в таблице messages
  useEffect(() => {
    const subscription = supabase
      .channel('chats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Обновляем список чатов при изменении сообщений
          fetchChats()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchChats])

  const handleChatClick = (chat: ChatFromMessages) => {
    setSelectedChatId(chat.chat_id)
    setSelectedInstanceId(chat.instance_id)
    setIsChatMode(true)
  }

  const getInstanceById = (instanceId: string) => {
    return instances.find((inst) => inst.id === instanceId) || null
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-primary text-xs font-medium uppercase">
            Chats
          </div>
          <Button
            variant="ghost"
            size="icon"
            disabled
            className="h-6 w-6 opacity-50"
          >
            <Icon type="refresh" size="xs" />
          </Button>
        </div>
        <div className="[&::-webkit-scrollbar-thumb]:bg-border flex-1 overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
          <ChatsSkeletonList />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-primary text-xs font-medium uppercase">Chats</div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchChats}
          className="h-6 w-6 hover:bg-transparent"
          title="Refresh chats"
        >
          <Icon
            type="refresh"
            size="xs"
            className="text-muted-foreground hover:text-primary"
          />
        </Button>
      </div>

      <div className="[&::-webkit-scrollbar-thumb]:bg-border flex-1 overflow-y-auto transition-all duration-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
        <div className="flex flex-col gap-y-1 pb-[10px] pr-1">
          {chats.map((chat) => (
            <ChatItem
              key={`${chat.instance_id}-${chat.chat_id}`}
              chat={chat}
              instance={getInstanceById(chat.instance_id)}
              isSelected={selectedChatId === chat.chat_id}
              onClick={() => handleChatClick(chat)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default ChatsList
