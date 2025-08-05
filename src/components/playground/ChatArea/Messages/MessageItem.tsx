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
  isLastMessage?: boolean
}

const AgentMessage = ({ message, isLastMessage }: MessageProps) => {
  const { streamingErrorMessage, isStreaming } = usePlaygroundStore()

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
    } else if (!message.response_audio.transcript) {
      // Показываем лоадер только если это последнее сообщение и идет стриминг
      messageContent =
        isLastMessage && isStreaming ? <AgentThinkingLoader /> : null
    } else {
      messageContent = (
        <div className="flex w-full flex-col gap-4">
          <MarkdownRenderer>
            {message.response_audio.transcript ||
              message.response_audio.content ||
              ''}
          </MarkdownRenderer>
          {message.response_audio.content && (
            <Audios audio={[message.response_audio]} />
          )}
        </div>
      )
    }
  } else {
    // Показываем лоадер только если это последнее сообщение, идет стриминг и контент пустой
    messageContent =
      isLastMessage && isStreaming && !message.content ? (
        <AgentThinkingLoader />
      ) : null
  }

  return (
    <div className="flex-1 space-y-2 overflow-hidden">{messageContent}</div>
  )
}

const UserMessage = ({ message }: MessageProps) => {
  return (
    <div className="flex justify-end">
      <div className="flex w-full max-w-[80%] flex-col items-end gap-4">
        <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2">
          <MarkdownRenderer>{message.content}</MarkdownRenderer>
        </div>
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
    </div>
  )
}

const MessageItem = memo(({ message, isLastMessage }: MessageProps) => {
  if (message.role === 'user') {
    return <UserMessage message={message} />
  }

  return <AgentMessage message={message} isLastMessage={isLastMessage} />
})

MessageItem.displayName = 'MessageItem'

export default MessageItem
export { AgentMessage, UserMessage }
