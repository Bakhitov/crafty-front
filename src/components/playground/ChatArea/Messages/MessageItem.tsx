import Icon from '@/components/ui/icon'
import MarkdownRenderer from '@/components/ui/typography/MarkdownRenderer'
import { usePlaygroundStore } from '@/store'
import type { PlaygroundChatMessage } from '@/types/playground'
import Videos from './Multimedia/Videos'
import Images from './Multimedia/Images'
import Audios from './Multimedia/Audios'
import { memo } from 'react'
import AgentThinkingLoader from './AgentThinkingLoader'

interface MessageProps {
  message: PlaygroundChatMessage
}

const AgentMessage = ({ message }: MessageProps) => {
  const { streamingErrorMessage } = usePlaygroundStore()

  let messageContent
  if (message.streamingError) {
    messageContent = (
      <p className="text-destructive">
        Oops! Something went wrong while streaming.{' '}
        {streamingErrorMessage ? (
          <>{streamingErrorMessage}</>
        ) : (
          'Please try refreshing the page or try again later.'
        )}
      </p>
    )
  } else if (message.content) {
    messageContent = (
      <div className="flex w-full flex-col gap-4">
        <MarkdownRenderer>{message.content}</MarkdownRenderer>
        {message.videos && message.videos.length > 0 && (
          <Videos videos={message.videos} />
        )}
        {message.images && message.images.length > 0 && (
          <Images images={message.images} />
        )}
        {message.audio && message.audio.length > 0 && (
          <Audios audio={message.audio} />
        )}
      </div>
    )
  } else if (message.response_audio) {
    // Обработка как старого формата (ResponseAudio), так и нового (string)
    if (typeof message.response_audio === 'string') {
      messageContent = (
        <div className="flex w-full flex-col gap-4">
          <MarkdownRenderer>{message.response_audio}</MarkdownRenderer>
        </div>
      )
    } else {
      messageContent = (
        <div className="flex w-full flex-col gap-4">
          <MarkdownRenderer>
            {message.response_audio.content || ''}
          </MarkdownRenderer>
        </div>
      )
    }
  } else {
    messageContent = <AgentThinkingLoader />
  }

  return (
    <div className="flex gap-4 py-4 first:pt-6">
      <div className="bg-background flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow">
        <Icon type="agent" size="sm" />
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">{messageContent}</div>
    </div>
  )
}

const UserMessage = ({ message }: MessageProps) => {
  return (
    <div className="flex flex-row-reverse gap-4 py-4 first:pt-6">
      <div className="bg-background text-primary-foreground flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow">
        <Icon type="user" size="sm" />
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex w-full flex-col gap-4">
          <div className="ml-auto max-w-[80%]">
            <div className="bg-primary text-primary-foreground rounded-lg">
              <MarkdownRenderer>{message.content}</MarkdownRenderer>
            </div>
          </div>
          {message.videos && message.videos.length > 0 && (
            <div className="ml-auto max-w-[80%]">
              <Videos videos={message.videos} />
            </div>
          )}
          {message.images && message.images.length > 0 && (
            <div className="ml-auto max-w-[80%]">
              <Images images={message.images} />
            </div>
          )}
          {message.audio && message.audio.length > 0 && (
            <div className="ml-auto max-w-[80%]">
              <Audios audio={message.audio} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const MessageItem = memo(({ message }: MessageProps) => {
  if (message.role === 'user') {
    return <UserMessage message={message} />
  }

  return <AgentMessage message={message} />
})

MessageItem.displayName = 'MessageItem'

export default MessageItem
export { AgentMessage, UserMessage }
