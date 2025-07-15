'use client'
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { TextArea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { usePlaygroundStore } from '@/store'
import useAIChatStreamHandler from '@/hooks/useAIStreamHandler'
import { useQueryState } from 'nuqs'
import Icon from '@/components/ui/icon'
import Paragraph from '@/components/ui/typography/Paragraph'

const ChatInput = () => {
  const { chatInputRef } = usePlaygroundStore()

  const { handleStreamResponse } = useAIChatStreamHandler()
  const [selectedAgent] = useQueryState('agent')
  const [inputMessage, setInputMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isStreaming = usePlaygroundStore((state) => state.isStreaming)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files))
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!inputMessage.trim() && files.length === 0) return

    const currentMessage = inputMessage
    const currentFiles = files
    setInputMessage('')
    setFiles([])

    try {
      const formData = new FormData()
      formData.append('message', currentMessage)
      currentFiles.forEach((file) => {
        formData.append('files', file)
      })
      await handleStreamResponse(formData)
    } catch (error) {
      toast.error(
        `Error in handleSubmit: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  return (
    <div className="font-geist relative mx-auto mb-1 flex w-full max-w-2xl flex-col justify-center gap-y-2">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-primary/10 text-primary flex items-center gap-2 rounded-lg px-2 py-1"
            >
              <Icon type="paperclip" size="xs" />
              <Paragraph size="xsmall" className="font-medium">
                {file.name}
              </Paragraph>
              <button onClick={() => handleRemoveFile(index)}>
                <Icon type="x" size="xs" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex w-full items-end justify-center gap-x-2">
        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={!selectedAgent}
          size="icon"
          variant="outline"
          className="border-accent bg-primaryAccent text-primary shrink-0 rounded-xl border p-5"
        >
          <Icon type="paperclip" color="primary" />
        </Button>
        <TextArea
          placeholder={'Ask anything'}
          value={inputMessage || ''}
          onChange={(e) => setInputMessage(e.target.value || '')}
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              !e.nativeEvent.isComposing &&
              !e.shiftKey &&
              !isStreaming
            ) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          className="border-accent bg-primaryAccent text-primary focus:border-accent w-full border px-4 text-sm"
          disabled={!selectedAgent}
          ref={chatInputRef}
        />
        <Button
          onClick={handleSubmit}
          disabled={
            !selectedAgent ||
            (!inputMessage.trim() && files.length === 0) ||
            isStreaming
          }
          size="icon"
          className="bg-primary text-primaryAccent rounded-xl p-5"
        >
          <Icon type="send" color="primaryAccent" />
        </Button>
      </div>
    </div>
  )
}

export default ChatInput
