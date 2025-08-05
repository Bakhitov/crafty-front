import type { PlaygroundChatMessage } from '@/types/playground'

import MessageItem from './MessageItem'
import ChatBlankState from './ChatBlankState'
import ReasoningStepsComponent, {
  hasDetailedReasoningInfo
} from './ReasoningSteps'
import ToolCallsSection from './ToolCalls'
import ReferencesSection from './References'
import React from 'react'
import { usePlaygroundStore } from '@/store'
import { useQueryState } from 'nuqs'
import Icon from '@/components/ui/icon'
import Tooltip from '@/components/ui/tooltip'
import { ChevronDown } from 'lucide-react'

interface MessageListProps {
  messages: PlaygroundChatMessage[]
}

interface MessageWrapperProps {
  message: PlaygroundChatMessage
  isLastMessage?: boolean
}

// Обновленный компонент для отображения сообщений агента с полным функционалом
const AgentMessageWrapper = ({
  message,
  isLastMessage
}: MessageWrapperProps) => {
  const [showDetailedReasoning, setShowDetailedReasoning] =
    React.useState(false)
  // Не показываем пустые сообщения агента (только tool calls без контента)
  const hasContent =
    message.content?.trim() ||
    message.response_audio ||
    message.videos?.length ||
    message.images?.length ||
    message.audio?.length ||
    (message.extra_data?.reasoning_steps &&
      (Array.isArray(message.extra_data.reasoning_steps)
        ? message.extra_data.reasoning_steps.length > 0
        : true)) ||
    message.extra_data?.references?.length

  const hasToolCalls = message.tool_calls && message.tool_calls.length > 0

  // Если нет контента и нет tool calls, не показываем сообщение (кроме последнего при стриминге)
  if (!hasContent && !hasToolCalls && !isLastMessage) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-6">
      {/* Reasoning Steps Section - ДО сообщения */}
      {message.extra_data?.reasoning_steps &&
        (Array.isArray(message.extra_data.reasoning_steps)
          ? message.extra_data.reasoning_steps.length > 0
          : true) && (
          <div className="flex items-start gap-4">
            <Tooltip
              delayDuration={0}
              content={<p className="text-accent">Reasoning</p>}
              side="top"
            >
              <Icon
                type="brain"
                className="bg-background-secondary rounded-lg p-1"
                size="sm"
                color="secondary"
              />
            </Tooltip>
            <div className="flex flex-1 flex-col gap-3">
              <div className="justify-сenter flex items-start">
                <p className="text-xs uppercase">Reasoning</p>
                {hasDetailedReasoningInfo(
                  message.extra_data.reasoning_steps
                ) && (
                  <button
                    onClick={() =>
                      setShowDetailedReasoning(!showDetailedReasoning)
                    }
                    className="text-primary/60 hover:text-primary flex items-start justify-center transition-transform duration-200"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        showDetailedReasoning ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                )}
              </div>
              <ReasoningStepsComponent
                reasoning={message.extra_data.reasoning_steps}
                showDetailed={showDetailedReasoning}
              />
            </div>
          </div>
        )}

      {/* References Section */}
      {message.extra_data?.references &&
        message.extra_data.references.length > 0 && (
          <div className="flex items-start gap-4">
            <Tooltip
              delayDuration={0}
              content={<p className="text-accent">References</p>}
              side="top"
            >
              <Icon
                type="book-open"
                className="bg-background-secondary rounded-lg p-1"
                size="sm"
                color="secondary"
              />
            </Tooltip>
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase">References</p>
              <ReferencesSection references={message.extra_data.references} />
            </div>
          </div>
        )}

      {/* Tool Calls Section */}
      {message.tool_calls && message.tool_calls.length > 0 && (
        <div className="flex items-start gap-3">
          <Tooltip
            delayDuration={0}
            content={<p className="text-accent">Tool Calls</p>}
            side="top"
          >
            <Icon
              type="hammer"
              className="bg-background-secondary rounded-lg p-1"
              size="sm"
              color="secondary"
            />
          </Tooltip>

          <div className="flex flex-wrap gap-2">
            {message.tool_calls.map((toolCall, index) => (
              <ToolCallsSection
                key={`${toolCall.tool_call_id || toolCall.tool_name}-${toolCall.created_at}-${index}`}
                toolCalls={[toolCall]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Agent Message Content - ПОСЛЕ всех дополнительных блоков */}
      {/* Показываем только если есть реальный контент, медиа, или это последнее сообщение и идет стриминг */}
      {(message.content?.trim() ||
        message.response_audio ||
        message.videos?.length ||
        message.images?.length ||
        message.audio?.length ||
        (isLastMessage && message.role === 'agent')) && (
        <div className="flex items-start gap-4">
          <Tooltip
            delayDuration={0}
            content={<p className="text-accent">Agent Response</p>}
            side="top"
          >
            <div className="bg-background flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow">
              <Icon type="agent" size="sm" />
            </div>
          </Tooltip>
          <div className="flex-1">
            <MessageItem message={message} isLastMessage={isLastMessage} />
          </div>
        </div>
      )}
    </div>
  )
}

// User message wrapper для консистентности
const UserMessageWrapper = ({
  message,
  isLastMessage
}: MessageWrapperProps) => {
  return (
    <div className="flex items-start justify-end gap-4">
      <div className="flex flex-1 justify-end">
        <MessageItem message={message} isLastMessage={isLastMessage} />
      </div>
      <Tooltip
        delayDuration={0}
        content={<p className="text-accent">Your Message</p>}
        side="top"
      >
        <div className="bg-background text-primary-foreground flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow">
          <Icon type="user" size="sm" />
        </div>
      </Tooltip>
    </div>
  )
}

// Скелетон для загрузки сессии (только при клике пользователя на сессию)
const SessionLoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    {/* User message skeleton */}
    <div className="flex items-start justify-end gap-3">
      <div className="max-w-lg flex-1">
        <div className="bg-background-secondary space-y-2 rounded-lg p-3">
          <div className="bg-primary/20 ml-auto h-4 w-3/4 rounded"></div>
          <div className="bg-primary/20 ml-auto h-4 w-1/2 rounded"></div>
        </div>
      </div>
      <div className="bg-primary/20 h-8 w-8 rounded-full"></div>
    </div>

    {/* Agent message skeleton */}
    <div className="flex items-start gap-3">
      <div className="bg-primary/20 h-8 w-8 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="bg-background-secondary space-y-2 rounded-lg p-3">
          <div className="bg-primary/20 h-4 w-2/3 rounded"></div>
          <div className="bg-primary/20 h-4 w-4/5 rounded"></div>
          <div className="bg-primary/20 h-4 w-1/3 rounded"></div>
        </div>
      </div>
    </div>
  </div>
)

const Messages = ({ messages }: MessageListProps) => {
  const [agentId] = useQueryState('agent')
  const { agents, isSessionLoading } = usePlaygroundStore()

  // Если пользователь кликнул на сессию и она загружается, показываем скелетон
  if (isSessionLoading) {
    return <SessionLoadingSkeleton />
  }

  // Если нет сообщений, показываем заглушку "начать новый чат"
  if (messages.length === 0) {
    const selectedAgent = agents.find((agent) => agent.value === agentId)
    return <ChatBlankState agentName={selectedAgent?.label} />
  }

  return (
    <div className="space-y-6">
      {messages.map((message, index) => {
        const key =
          message.run_id || `${message.role}-${index}-${message.created_at}`
        const isLastMessage = index === messages.length - 1

        if (message.role === 'agent') {
          return (
            <AgentMessageWrapper
              key={key}
              message={message}
              isLastMessage={isLastMessage}
            />
          )
        }

        return (
          <UserMessageWrapper
            key={key}
            message={message}
            isLastMessage={isLastMessage}
          />
        )
      })}
    </div>
  )
}

export default Messages
