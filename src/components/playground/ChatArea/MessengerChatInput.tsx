'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { TextArea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import Paragraph from '@/components/ui/typography/Paragraph'
import { supabase } from '@/lib/supabase'
import { MessageInstance } from '@/types/messenger'
import MediaOptionsModal from './MediaOptionsModal'
interface MessengerChatInputProps {
  chatId: string
  instanceId: string
}

interface ChatInfo {
  contact_name: string | null
  from_number: string | null
  is_group: boolean
  group_id: string | null
}

interface ExtendedFile extends File {
  isUrl?: boolean
  url?: string
}

const MessengerChatInput = ({
  chatId,
  instanceId
}: MessengerChatInputProps) => {
  const [inputMessage, setInputMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [instance, setInstance] = useState<MessageInstance | null>(null)
  const [isLoadingInstance, setIsLoadingInstance] = useState(true)
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)
  const [isLoadingChatInfo, setIsLoadingChatInfo] = useState(true)
  const [showMediaOptions, setShowMediaOptions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Загружаем информацию об инстансе
  const fetchInstance = useCallback(async () => {
    if (!instanceId) {
      setIsLoadingInstance(false)
      return
    }

    try {
      setIsLoadingInstance(true)
      const { data: instanceData, error } = await supabase
        .from('message_instances')
        .select('*')
        .eq('id', instanceId)
        .single()

      if (error) {
        console.error('Error fetching instance:', error)
        toast.error('Error loading instance')
        return
      }

      setInstance(instanceData)
    } catch (error) {
      console.error('Error in fetchInstance:', error)
      toast.error('Error loading instance')
    } finally {
      setIsLoadingInstance(false)
    }
  }, [instanceId])

  // Загружаем информацию о чате
  const fetchChatInfo = useCallback(async () => {
    if (!chatId || !instanceId) {
      setIsLoadingChatInfo(false)
      return
    }

    try {
      setIsLoadingChatInfo(true)
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

      setChatInfo({
        contact_name: messageData.contact_name,
        from_number: messageData.from_number,
        is_group: messageData.is_group,
        group_id: messageData.group_id
      })
    } catch (error) {
      console.error('Error in fetchChatInfo:', error)
      setChatInfo(null)
    } finally {
      setIsLoadingChatInfo(false)
    }
  }, [chatId, instanceId])

  useEffect(() => {
    fetchInstance()
    fetchChatInfo()
  }, [fetchInstance, fetchChatInfo])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files))
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleAddUrl = (url: string) => {
    // Создаем временный объект для URL (как файл)
    const urlFile = new File([''], url.split('/').pop() || 'media', {
      type: 'application/octet-stream'
    })

    // Добавляем URL как свойство к файлу
    ;(urlFile as ExtendedFile).isUrl = true
    ;(urlFile as ExtendedFile).url = url

    setFiles([...files, urlFile])
    setShowMediaOptions(false)
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const sendTelegramMessage = async (
    message: string,
    port: number,
    instanceId: string,
    agentId?: string
  ) => {
    // Используем наш API route для проксирования запроса
    const payload: {
      port: number
      instanceId: string
      chatId: string
      message: string
      agent_id?: string
    } = {
      port: port,
      instanceId: instanceId,
      chatId: chatId,
      message: message
    }

    // Добавляем agent_id если есть
    if (agentId) {
      payload.agent_id = agentId
    }

    const response = await fetch('/api/v1/telegram/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error || `HTTP ${response.status}: Failed to send message`
      )
    }

    return response.json()
  }

  const sendWhatsAppMessage = async (
    message: string,
    port: number,
    instanceId: string,
    number: string,
    agentId?: string
  ) => {
    // Используем наш API route для проксирования запроса
    const payload: {
      port: number
      instanceId: string
      number: string
      message: string
      agent_id?: string
    } = {
      port: port,
      instanceId: instanceId,
      number: number,
      message: message
    }

    // Добавляем agent_id если есть
    if (agentId) {
      payload.agent_id = agentId
    }

    const response = await fetch('/api/v1/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error || `HTTP ${response.status}: Failed to send message`
      )
    }

    return response.json()
  }

  const sendWhatsAppMedia = async (
    port: number,
    instanceId: string,
    number: string,
    source: string,
    mediaType: 'image' | 'document' | 'audio' | 'video',
    caption?: string,
    agentId?: string
  ) => {
    // Используем наш API route для проксирования запроса
    const payload: {
      port: number
      instanceId: string
      number: string
      source: string
      mediaType: string
      caption?: string
      agent_id?: string
    } = {
      port: port,
      instanceId: instanceId,
      number: number,
      source: source,
      mediaType: mediaType
    }

    if (caption) {
      payload.caption = caption
    }

    // Добавляем agent_id если есть
    if (agentId) {
      payload.agent_id = agentId
    }

    const response = await fetch('/api/v1/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error || `HTTP ${response.status}: Failed to send media`
      )
    }

    return response.json()
  }

  const sendTelegramMedia = async (
    port: number,
    instanceId: string,
    chatId: string,
    source: string,
    caption?: string,
    agentId?: string
  ) => {
    // Используем наш API route для проксирования запроса
    const payload: {
      port: number
      instanceId: string
      chatId: string
      source: string
      caption?: string
      agent_id?: string
    } = {
      port: port,
      instanceId: instanceId,
      chatId: chatId,
      source: source
    }

    if (caption) {
      payload.caption = caption
    }

    // Добавляем agent_id если есть
    if (agentId) {
      payload.agent_id = agentId
    }

    const response = await fetch('/api/v1/telegram/send-media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error || `HTTP ${response.status}: Failed to send media`
      )
    }

    return response.json()
  }

  // Определение типа медиа по расширению файла
  const getMediaType = (
    filename: string
  ): 'image' | 'document' | 'audio' | 'video' => {
    const ext = filename.toLowerCase().split('.').pop() || ''

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return 'image'
    } else if (['mp4', 'avi', 'mov'].includes(ext)) {
      return 'video'
    } else if (['mp3', 'wav', 'ogg', 'aac'].includes(ext)) {
      return 'audio'
    } else {
      return 'document'
    }
  }

  // Проверка, является ли строка URL
  const isUrl = (str: string): boolean => {
    try {
      new URL(str)
      return str.startsWith('http://') || str.startsWith('https://')
    } catch {
      return false
    }
  }

  const handleSubmit = async () => {
    if (!inputMessage.trim() && files.length === 0) return

    // Проверяем загрузился ли инстанс
    if (isLoadingInstance || isLoadingChatInfo) {
      toast.error('Loading information...')
      return
    }

    if (!instance) {
      toast.error('Instance not found')
      return
    }

    if (!chatInfo) {
      toast.error('Chat information not found')
      return
    }

    // Проверяем поддерживается ли провайдер
    const supportedProviders = ['telegram', 'whatsappweb', 'whatsapp-official']
    if (!supportedProviders.includes(instance.provider)) {
      toast.error(
        `Sending messages for ${instance.provider} is not supported yet`
      )
      return
    }

    // Проверяем наличие необходимых данных
    if (!instance.port_api) {
      toast.error('Порт API не настроен')
      return
    }

    // Проверяем статус аутентификации только для Telegram
    if (instance.provider === 'telegram') {
      if (
        instance.auth_status !== 'authenticated' &&
        instance.auth_status !== 'client_ready'
      ) {
        toast.error(
          `Fine-tuning in progress... just a couple more minutes and everything will be ready! Status: ${instance.auth_status || 'unknown'}`
        )
        return
      }
    }
    // Для WhatsApp не проверяем аутентификацию - ошибки игнорируются

    const currentMessage = inputMessage
    const currentFiles = files
    setInputMessage('')
    setFiles([])
    setIsSending(true)

    try {
      let response

      // Обрабатываем отправку файлов
      if (files.length > 0) {
        // Отправляем каждый файл отдельно
        for (const file of currentFiles) {
          // Проверяем, это URL или обычный файл
          const isUrlFile = (file as ExtendedFile).isUrl
          const fileUrl = isUrlFile
            ? (file as ExtendedFile).url || ''
            : URL.createObjectURL(file)

          if (!fileUrl) {
            console.warn('Skipping file with empty URL:', file.name)
            continue
          }

          const mediaType = getMediaType(file.name)
          const caption = currentMessage || file.name

          if (instance.provider === 'telegram') {
            try {
              await sendTelegramMedia(
                instance.port_api,
                instanceId,
                chatId,
                fileUrl,
                caption,
                instance.agno_config?.agent_id || undefined
              )
              toast.success(`File ${file.name} sent to Telegram!`)
            } catch (error) {
              console.error('Telegram file error:', error)
              toast.error(`Failed to send ${file.name} to Telegram`)
            }
          } else if (
            instance.provider === 'whatsappweb' ||
            instance.provider === 'whatsapp-official'
          ) {
            if (!chatInfo.from_number) {
              throw new Error('Phone number not found in chat')
            }

            try {
              await sendWhatsAppMedia(
                instance.port_api,
                instanceId,
                chatInfo.from_number || '',
                fileUrl,
                mediaType,
                caption,
                instance.agno_config?.agent_id || undefined
              )
              toast.success(`File ${file.name} sent to WhatsApp!`)
            } catch (whatsappError) {
              console.warn(
                `WhatsApp file error (ignored) for ${file.name}:`,
                whatsappError
              )
              toast.success(`WhatsApp file command completed (errors ignored)`)
            }
          }
        }
        return
      }

      // Проверяем, содержит ли сообщение URL
      const messageWords = currentMessage.split(/\s+/)
      const urls = messageWords.filter((word) => isUrl(word))

      if (urls.length > 0 && currentMessage.trim()) {
        // Отправляем URL как медиа файлы
        const textWithoutUrls = messageWords
          .filter((word) => !isUrl(word))
          .join(' ')
          .trim()

        for (const url of urls) {
          const mediaType = getMediaType(url)
          const caption = textWithoutUrls || 'Shared media'

          if (instance.provider === 'telegram') {
            try {
              await sendTelegramMedia(
                instance.port_api,
                instanceId,
                chatId,
                url,
                caption,
                instance.agno_config?.agent_id || undefined
              )
              toast.success('Media URL sent to Telegram!')
            } catch (error) {
              console.error('Telegram URL error:', error)
              toast.error('Failed to send media URL to Telegram')
            }
          } else if (
            instance.provider === 'whatsappweb' ||
            instance.provider === 'whatsapp-official'
          ) {
            if (!chatInfo.from_number) {
              throw new Error('Phone number not found in chat')
            }

            try {
              await sendWhatsAppMedia(
                instance.port_api,
                instanceId,
                chatInfo.from_number || '',
                url,
                mediaType,
                caption,
                instance.agno_config?.agent_id || undefined
              )
              toast.success('Media URL sent to WhatsApp!')
            } catch (whatsappError) {
              console.warn('WhatsApp URL error (ignored):', whatsappError)
              toast.success('WhatsApp URL command completed (errors ignored)')
            }
          }
        }

        // Если остался текст без URL, отправляем его отдельно
        if (textWithoutUrls) {
          if (instance.provider === 'telegram') {
            response = await sendTelegramMessage(
              textWithoutUrls,
              instance.port_api,
              instanceId,
              instance.agno_config?.agent_id || undefined
            )
            toast.success('Text message sent to Telegram!')
          } else if (
            instance.provider === 'whatsappweb' ||
            instance.provider === 'whatsapp-official'
          ) {
            try {
              response = await sendWhatsAppMessage(
                textWithoutUrls,
                instance.port_api,
                instanceId,
                chatInfo.from_number || '',
                instance.agno_config?.agent_id || undefined
              )
              toast.success('Text message sent to WhatsApp!')
            } catch (whatsappError) {
              console.warn('WhatsApp text error (ignored):', whatsappError)
              toast.success('WhatsApp text command completed (errors ignored)')
            }
          }
        }
        return
      }

      // Обычная отправка текстовых сообщений
      if (instance.provider === 'telegram') {
        console.log('Sending message to Telegram:', {
          chatId,
          instanceId,
          message: currentMessage,
          port: instance.port_api,
          provider: instance.provider,
          auth_status: instance.auth_status
        })

        response = await sendTelegramMessage(
          currentMessage,
          instance.port_api,
          instanceId,
          instance.agno_config?.agent_id || undefined
        )

        toast.success('Message sent to Telegram!')
      } else if (
        instance.provider === 'whatsappweb' ||
        instance.provider === 'whatsapp-official'
      ) {
        if (!chatInfo.from_number) {
          throw new Error('Phone number not found in chat')
        }

        // Проверяем наличие порта
        if (!instance.port_api) {
          throw new Error(
            `API port not found for instance ${instanceId}. Check instance settings.`
          )
        }

        console.log('Sending message to WhatsApp:', {
          number: chatInfo.from_number || '',
          instanceId,
          message: currentMessage,
          port: instance.port_api,
          provider: instance.provider,
          chatInfo: chatInfo,
          instance: instance
        })

        try {
          response = await sendWhatsAppMessage(
            currentMessage,
            instance.port_api,
            instanceId,
            chatInfo.from_number || '',
            instance.agno_config?.agent_id || undefined
          )

          toast.success('Message sent to WhatsApp!')
        } catch (whatsappError) {
          // Игнорируем все ошибки WhatsApp как требуется
          console.warn('WhatsApp error (ignored):', whatsappError)
          toast.success('WhatsApp sending command completed (errors ignored)')
        }
      }

      console.log('API response:', response)

      // TODO: В будущем здесь можно добавить:
      // 1. Сохранение отправленного сообщения в базу данных
      // 2. Обработка файлов (изображения, документы)
      // 3. Поддержка других провайдеров (Discord, Slack, etc.)
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Error sending message: ${errorMessage}`)

      // Восстанавливаем сообщение при ошибке
      setInputMessage(currentMessage)
      setFiles(currentFiles)
    } finally {
      setIsSending(false)
    }
  }

  const getProviderDisplayName = () => {
    if (!instance) return 'Messenger'

    switch (instance.provider) {
      case 'telegram':
        return 'Telegram'
      case 'whatsappweb':
      case 'whatsapp-official':
        return 'WhatsApp'
      case 'discord':
        return 'Discord'
      case 'slack':
        return 'Slack'
      case 'messenger':
        return 'Messenger'
      default:
        return instance.provider
    }
  }

  const getStatusMessage = () => {
    // Убираем отображение статусов готовности - показываем только ошибки
    if (isLoadingInstance || isLoadingChatInfo) {
      return '⏳ Loading information...'
    }

    if (!instance) {
      return '❌ Instance not found'
    }

    if (!chatInfo) {
      return '❌ Chat information not found'
    }

    const providerName = getProviderDisplayName()
    const authStatus = instance.auth_status
    const supportedProviders = ['telegram', 'whatsappweb', 'whatsapp-official']

    if (!supportedProviders.includes(instance.provider)) {
      return `⚠️ Sending messages for ${providerName} is not supported yet`
    }

    if (instance.provider === 'telegram') {
      if (authStatus !== 'authenticated' && authStatus !== 'client_ready') {
        return `⚠️ ${providerName} not authenticated (${authStatus || 'unknown'})`
      }
    } else if (
      instance.provider === 'whatsappweb' ||
      instance.provider === 'whatsapp-official'
    ) {
      // Для WhatsApp проверяем только наличие номера (аутентификация игнорируется)
      if (!chatInfo.from_number) {
        return `⚠️ ${providerName} - phone number not found in chat`
      }
    }

    // Если все в порядке, не показываем никакого статуса
    return ''
  }

  const canSendMessages = () => {
    const supportedProviders = ['telegram', 'whatsappweb', 'whatsapp-official']

    if (
      !instance ||
      !chatInfo ||
      isLoadingInstance ||
      isLoadingChatInfo ||
      !supportedProviders.includes(instance.provider) ||
      !instance.port_api
    ) {
      return false
    }

    // Для Telegram требуется аутентификация
    if (instance.provider === 'telegram') {
      return (
        instance.auth_status === 'authenticated' ||
        instance.auth_status === 'client_ready'
      )
    }

    // Для WhatsApp всегда разрешаем отправку если есть номер (ошибки игнорируются)
    if (instance.provider.includes('whatsapp')) {
      return !!chatInfo.from_number
    }

    return false
  }

  return (
    <div className="font-geist relative mx-auto mb-1 flex w-full max-w-2xl flex-col justify-center gap-y-2">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => {
            const isUrlFile = (file as ExtendedFile).isUrl
            return (
              <div
                key={index}
                className="bg-primary/10 text-primary flex items-center gap-2 rounded-lg px-2 py-1"
              >
                <Icon type={isUrlFile ? 'link' : 'paperclip'} size="xs" />
                <Paragraph size="xsmall" className="font-medium">
                  {isUrlFile ? (file as ExtendedFile).url : file.name}
                </Paragraph>
                <button onClick={() => handleRemoveFile(index)}>
                  <Icon type="x" size="xs" />
                </button>
              </div>
            )
          })}
        </div>
      )}
      <div className="flex w-full items-end justify-center gap-x-2">
        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
        <Button
          onClick={() => setShowMediaOptions(true)}
          disabled={isSending}
          size="icon"
          variant="outline"
          className="border-accent bg-pimary text-primary shrink-0 rounded-xl border p-5"
          title="Attach media"
        >
          <Icon type="paperclip" color="secondary" />
        </Button>
        <TextArea
          placeholder={`Send message to ${getProviderDisplayName()}... (You can paste URLs for media files)`}
          value={inputMessage || ''}
          onChange={(e) => setInputMessage(e.target.value || '')}
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              !e.nativeEvent.isComposing &&
              !e.shiftKey &&
              !isSending &&
              canSendMessages()
            ) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          className="border-accent bg-background-primary text-secondary focus:border-accent w-full border px-4 text-sm"
          disabled={isSending || !canSendMessages()}
        />
        <Button
          onClick={handleSubmit}
          disabled={
            (!inputMessage.trim() && files.length === 0) ||
            isSending ||
            !canSendMessages()
          }
          size="icon"
          className="bg-foreground text-background-secondary rounded-xl p-5"
          title={
            isSending
              ? 'Sending...'
              : canSendMessages()
                ? 'Send message'
                : 'Instance not ready'
          }
        >
          {isSending ? (
            <Icon
              type="loader-2"
              color="primaryAccent"
              className="animate-spin"
            />
          ) : (
            <Icon type="send" color="primaryAccent" />
          )}
        </Button>
      </div>

      {/* Информационный текст */}
      {getStatusMessage() && (
        <div className="text-center">
          <p className="text-muted-foreground text-xs">{getStatusMessage()}</p>
        </div>
      )}

      {/* Модальное окно для выбора медиа */}
      <MediaOptionsModal
        isOpen={showMediaOptions}
        onClose={() => setShowMediaOptions(false)}
        onFileSelect={handleFileSelect}
        onUrlAdd={handleAddUrl}
      />
    </div>
  )
}

export default MessengerChatInput
