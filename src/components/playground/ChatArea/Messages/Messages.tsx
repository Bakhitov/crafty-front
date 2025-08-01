import type { PlaygroundChatMessage } from '@/types/playground'

import MessageItem from './MessageItem'
import ChatBlankState from './ChatBlankState'
import Tooltip from '@/components/ui/tooltip'
import { memo } from 'react'
import {
  ToolCallProps,
  ReasoningProps,
  ReferenceData,
  Reference
} from '@/types/playground'
import React, { type FC } from 'react'
import Icon from '@/components/ui/icon'
import { usePlaygroundStore } from '@/store'
import Heading from '@/components/ui/typography/Heading'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import Paragraph from '@/components/ui/typography/Paragraph'
import { CheckCircle, AlertCircle, HelpCircle } from 'lucide-react'
import { useQueryState } from 'nuqs'

interface MessageListProps {
  messages: PlaygroundChatMessage[]
}

interface MessageWrapperProps {
  message: PlaygroundChatMessage
  isLastMessage: boolean
}

interface ReferenceProps {
  references: ReferenceData[]
}

interface ReferenceItemProps {
  reference: Reference
}

const ReferenceItem: FC<ReferenceItemProps> = ({ reference }) => (
  <div className="bg-background-secondary hover:bg-background-secondary/80 relative flex h-[63px] w-[190px] cursor-default flex-col justify-between overflow-hidden rounded-md p-3 transition-colors">
    <p className="text-primary text-sm font-medium">{reference.name}</p>
    <p className="text-primary/40 truncate text-xs">{reference.content}</p>
  </div>
)

const References: FC<ReferenceProps> = ({ references }) => (
  <div className="flex flex-col gap-4">
    {references.map((referenceData, index) => (
      <div
        key={`${referenceData.query}-${index}`}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap gap-3">
          {referenceData.references.map((reference, refIndex) => (
            <ReferenceItem
              key={`${reference.name}-${reference.meta_data.chunk}-${refIndex}`}
              reference={reference}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
)

const AgentMessageWrapper = ({ message }: MessageWrapperProps) => {
  return (
    <div className="flex flex-col gap-y-6">
      <MessageItem message={message} />
      {message.extra_data?.reasoning_steps &&
        (Array.isArray(message.extra_data.reasoning_steps)
          ? message.extra_data.reasoning_steps.length > 0
          : true) && (
          <Accordion
            type="single"
            collapsible
            className="border-accent w-full rounded-lg border"
          >
            <AccordionItem value="reasoning" className="border-b-0">
              <AccordionTrigger className="p-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Icon type="brain" size="sm" />
                  <p className="font-geist text-xs uppercase">Reasonings</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 pt-0">
                <Reasonings reasoning={message.extra_data.reasoning_steps} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      {message.extra_data?.references &&
        message.extra_data.references.length > 0 && (
          <div className="flex items-start gap-3">
            <Tooltip
              delayDuration={0}
              content={<p className="text-accent">References</p>}
              side="top"
            >
              <Icon type="link" size="sm" />
            </Tooltip>
            <div className="flex flex-col gap-3">
              <References references={message.extra_data.references} />
            </div>
          </div>
        )}
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
              <ToolComponent
                key={
                  toolCall.tool_call_id ||
                  `${toolCall.tool_name}-${toolCall.created_at}-${index}`
                }
                tools={toolCall}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const getNextActionIcon = (action: string) => {
  switch (action) {
    case 'final_answer':
      return <CheckCircle className="h-3 w-3 text-green-500" />
    case 'continue':
      return <HelpCircle className="h-3 w-3 text-yellow-500" />
    default:
      return <AlertCircle className="h-3 w-3 text-red-500" />
  }
}

const Reasonings: FC<ReasoningProps> = ({ reasoning }) => {
  if (!reasoning) {
    return null
  }

  // Ensure reasoning is an array
  const reasoningArray = Array.isArray(reasoning) ? reasoning : [reasoning]

  if (reasoningArray.length === 0) {
    return null
  }

  return (
    <Accordion type="multiple" className="w-full space-y-2">
      {reasoningArray.map((step, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          className="bg-background-secondary/40 rounded-lg border-none"
        >
          <AccordionTrigger className="p-2 hover:no-underline">
            <div className="text-secondary flex w-full items-center gap-3">
              <div className="border-accent flex h-[30px] w-[65px] items-center rounded-md border p-2">
                <p className="text-primary/60 text-xs uppercase">
                  step {index + 1}
                </p>
              </div>
              <p className="text-xs font-semibold">{step.title}</p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0">
            <div className="space-y-3 px-1 pb-4">
              <div>
                <Heading size={6} className="mb-1 font-mono text-xs uppercase">
                  Action
                </Heading>
                <Paragraph size="sm" className="text-muted">
                  {step.action}
                </Paragraph>
              </div>
              <div>
                <Heading size={6} className="mb-1 font-mono text-xs uppercase">
                  Result
                </Heading>
                <Paragraph size="sm" className="text-muted">
                  {step.result}
                </Paragraph>
              </div>
              <div>
                <Heading size={6} className="mb-1 font-mono text-xs uppercase">
                  Reasoning
                </Heading>
                <Paragraph size="sm" className="text-muted">
                  {step.reasoning}
                </Paragraph>
              </div>
              <div className="flex items-center justify-between pt-2">
                {step.next_action ? (
                  <div className="flex items-center space-x-2">
                    <Heading size={6} className="font-mono text-xs uppercase">
                      Next Action:
                    </Heading>
                    <Badge
                      variant="outline"
                      className="border-accent flex items-center space-x-1"
                    >
                      {getNextActionIcon(step.next_action)}
                      <span>{step.next_action}</span>
                    </Badge>
                  </div>
                ) : (
                  <div />
                )}
                {typeof step.confidence !== 'undefined' ? (
                  <div className="flex items-center space-x-2">
                    <Heading size={6} className="font-mono text-xs uppercase">
                      Confidence:
                    </Heading>
                    <Badge
                      variant={step.confidence > 0.8 ? 'outline' : 'default'}
                      className="border-accent flex items-center space-x-1"
                    >
                      {(step.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

const ToolComponent = memo(({ tools }: ToolCallProps) => (
  <div className="bg-accent cursor-default rounded-full px-2 py-1.5 text-xs">
    <p className="font-dmmono text-primary/80 uppercase">{tools.tool_name}</p>
  </div>
))
ToolComponent.displayName = 'ToolComponent'

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
    <>
      {messages.map((message, index) => {
        const key = `${message.role}-${index}-${message.created_at}`
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
        return <MessageItem key={key} message={message} />
      })}
    </>
  )
}

export default Messages
