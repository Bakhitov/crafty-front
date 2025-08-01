'use client'

import type { Message } from '@/types/messenger'
import { memo } from 'react'
import React, { type FC } from 'react'
import Icon from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { BsPhone } from 'react-icons/bs'
import { LuUsers } from 'react-icons/lu'

interface MessengerMessagesProps {
  messages: Message[]
  isLoading: boolean
}

interface MessageItemProps {
  message: Message
}

const MessageItem: FC<MessageItemProps> = ({ message }) => {
  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return ''

    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'device':
        return <BsPhone className="text-muted-foreground h-3 w-3" />
      case 'user':
        return <Icon type="user" size="xs" className="text-muted-foreground" />
      case 'agno':
        return <Icon type="agent" size="xs" className="text-muted-foreground" />
      case 'api':
        return <LuUsers className="text-muted-foreground h-3 w-3" />
      default:
        return (
          <Icon
            type="message-circle"
            size="xs"
            className="text-muted-foreground"
          />
        )
    }
  }

  const isFromMe = message.is_from_me

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3',
        isFromMe ? 'justify-end' : 'justify-start'
      )}
    >
      {!isFromMe && (
        /* Аватарка слева для входящих сообщений */
        <div className="flex-shrink-0">
          <div className="bg-background flex h-8 w-8 items-center justify-center rounded-full">
            {getSourceIcon(message.message_source)}
          </div>
        </div>
      )}

      {/* Сообщение */}
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2',
          isFromMe ? 'bg-background-secondary' : 'bg-background'
        )}
      >
        {!isFromMe && message.contact_name && (
          <p className="text-primary/70 mb-1 text-xs font-medium">
            {message.contact_name}
          </p>
        )}

        <p className="break-words text-sm">
          {message.message_body || '[Медиафайл]'}
        </p>

        <div
          className={cn(
            'mt-1 flex items-center justify-end gap-1 text-xs',
            isFromMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          <span>{formatTimestamp(message.timestamp)}</span>
          {isFromMe && (
            <Icon
              type="check"
              size="xxs"
              className="text-primary-foreground/70"
            />
          )}
        </div>
      </div>

      {isFromMe && (
        /* Аватарка справа для исходящих сообщений */
        <div className="flex-shrink-0">
          <div className="bg-background flex h-8 w-8 items-center justify-center rounded-full">
            {getSourceIcon(message.message_source)}
          </div>
        </div>
      )}
    </div>
  )
}

const MessengerBlankState = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <Icon
      type="message-circle"
      size="lg"
      className="text-muted-foreground mb-4"
    />
    <p className="text-muted-foreground text-lg">Нет сообщений</p>
    <p className="text-muted-foreground mt-2 text-sm">
      Сообщения будут отображаться здесь когда они появятся
    </p>
  </div>
)

const MessengerSkeletonList = ({ count = 8 }: { count?: number }) => (
  <div className="flex flex-col gap-y-4">
    {Array.from({ length: count }).map((_, index) => {
      const isFromMe = Math.random() > 0.5
      return (
        <div
          key={index}
          className={cn(
            'flex w-full',
            isFromMe ? 'justify-end' : 'justify-start'
          )}
        >
          <div className="max-w-[70%] space-y-2">
            <Skeleton
              className={cn(
                'h-12 rounded-2xl',
                isFromMe ? 'bg-blue-200' : 'bg-background-secondary'
              )}
              style={{ width: `${Math.random() * 200 + 100}px` }}
            />
          </div>
        </div>
      )
    })}
  </div>
)

const MessengerMessages: FC<MessengerMessagesProps> = ({
  messages,
  isLoading
}) => {
  if (isLoading) {
    return <MessengerSkeletonList />
  }

  if (messages.length === 0) {
    return <MessengerBlankState />
  }

  return (
    <div className="flex flex-col gap-y-3">
      {messages.map((message, index) => (
        <MessageItem key={`${message.id}-${index}`} message={message} />
      ))}
    </div>
  )
}

export default memo(MessengerMessages)
