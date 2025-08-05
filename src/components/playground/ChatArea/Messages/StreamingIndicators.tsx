import React, { type FC } from 'react'
import { Loader2, Brain, Hammer, Search, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreamingIndicatorProps {
  type?: 'thinking' | 'reasoning' | 'tool_call' | 'searching' | 'responding'
  message?: string
  className?: string
}

interface ThinkingLoaderProps {
  className?: string
}

const streamingStates = {
  thinking: {
    icon: MessageCircle,
    message: 'Agent is thinking...',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20'
  },
  reasoning: {
    icon: Brain,
    message: 'Analyzing and reasoning...',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20'
  },
  tool_call: {
    icon: Hammer,
    message: 'Using tools...',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20'
  },
  searching: {
    icon: Search,
    message: 'Searching knowledge base...',
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/20'
  },
  responding: {
    icon: MessageCircle,
    message: 'Generating response...',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
  }
}

const StreamingIndicator: FC<StreamingIndicatorProps> = ({
  type = 'thinking',
  message,
  className
}) => {
  const state = streamingStates[type]
  const IconComponent = state.icon

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg p-4',
        state.bgColor,
        className
      )}
    >
      <div className="relative">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-800'
          )}
        >
          <IconComponent className={cn('h-4 w-4', state.color)} />
        </div>
        <Loader2
          className={cn(
            'absolute -right-1 -top-1 h-4 w-4 animate-spin',
            state.color
          )}
        />
      </div>

      <div className="flex-1">
        <p className={cn('text-sm font-medium', state.color)}>
          {message || state.message}
        </p>
        <div className="mt-1 flex space-x-1">
          <div
            className={cn('h-1 w-1 animate-pulse rounded-full', state.color)}
            style={{ animationDelay: '0ms' }}
          />
          <div
            className={cn('h-1 w-1 animate-pulse rounded-full', state.color)}
            style={{ animationDelay: '200ms' }}
          />
          <div
            className={cn('h-1 w-1 animate-pulse rounded-full', state.color)}
            style={{ animationDelay: '400ms' }}
          />
        </div>
      </div>
    </div>
  )
}

const ThinkingLoader: FC<ThinkingLoaderProps> = ({ className }) => {
  return (
    <div className={cn('flex items-center gap-3 py-2', className)}>
      <div className="flex space-x-1">
        <div
          className="bg-muted-foreground/60 h-2 w-2 animate-bounce rounded-full"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="bg-muted-foreground/60 h-2 w-2 animate-bounce rounded-full"
          style={{ animationDelay: '150ms' }}
        />
        <div
          className="bg-muted-foreground/60 h-2 w-2 animate-bounce rounded-full"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span className="text-muted-foreground text-sm">
        Agent is thinking...
      </span>
    </div>
  )
}

// Progressive content indicator
interface ProgressiveContentProps {
  isStreaming: boolean
  content: string
  className?: string
}

const ProgressiveContent: FC<ProgressiveContentProps> = ({
  isStreaming,
  content,
  className
}) => {
  return (
    <div className={cn('relative', className)}>
      {content}
      {isStreaming && (
        <span className="bg-primary ml-1 inline-block h-4 w-2 animate-pulse" />
      )}
    </div>
  )
}

// Stream event indicator
interface StreamEventIndicatorProps {
  event: string
  isActive: boolean
  className?: string
}

const StreamEventIndicator: FC<StreamEventIndicatorProps> = ({
  event,
  isActive,
  className
}) => {
  const getEventInfo = (eventName: string) => {
    switch (eventName) {
      case 'RunStarted':
        return { label: 'Started', color: 'bg-blue-500' }
      case 'ReasoningStarted':
        return { label: 'Reasoning', color: 'bg-purple-500' }
      case 'ToolCallStarted':
        return { label: 'Tool Call', color: 'bg-orange-500' }
      case 'RunResponseContent':
        return { label: 'Responding', color: 'bg-green-500' }
      case 'RunCompleted':
        return { label: 'Completed', color: 'bg-gray-500' }
      default:
        return { label: event, color: 'bg-gray-400' }
    }
  }

  const eventInfo = getEventInfo(event)

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <div
        className={cn(
          'h-2 w-2 rounded-full transition-all duration-200',
          isActive ? eventInfo.color : 'bg-muted-foreground/30',
          isActive && 'animate-pulse'
        )}
      />
      <span
        className={cn(
          'transition-colors duration-200',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {eventInfo.label}
      </span>
    </div>
  )
}

export {
  StreamingIndicator,
  ThinkingLoader,
  ProgressiveContent,
  StreamEventIndicator
}
export default StreamingIndicator
