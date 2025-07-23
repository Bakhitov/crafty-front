'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { TextArea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import Paragraph from '@/components/ui/typography/Paragraph'
import { supabase } from '@/lib/supabase'
import { MessageInstance } from '@/types/messenger'

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
        toast.error('Ошибка загрузки инстанса')
        return
      }

      setInstance(instanceData)
    } catch (error) {
      console.error('Error in fetchInstance:', error)
      toast.error('Ошибка загрузки инстанса')
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

  const handleSubmit = async () => {
    if (!inputMessage.trim() && files.length === 0) return

    // Проверяем загрузился ли инстанс
    if (isLoadingInstance || isLoadingChatInfo) {
      toast.error('Загружается информация...')
      return
    }

    if (!instance) {
      toast.error('Инстанс не найден')
      return
    }

    if (!chatInfo) {
      toast.error('Информация о чате не найдена')
      return
    }

    // Проверяем поддерживается ли провайдер
    const supportedProviders = ['telegram', 'whatsappweb', 'whatsapp-official']
    if (!supportedProviders.includes(instance.provider)) {
      toast.error(
        `Отправка сообщений для ${instance.provider} пока не поддерживается`
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
          `Telegram не аутентифицирован. Статус: ${instance.auth_status || 'неизвестен'}`
        )
        return
      }
    }

    const currentMessage = inputMessage
    const currentFiles = files
    setInputMessage('')
    setFiles([])
    setIsSending(true)

    try {
      let response

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
          instance.agno_config?.agent_id
        )

        toast.success('Сообщение отправлено в Telegram!')
      } else if (
        instance.provider === 'whatsappweb' ||
        instance.provider === 'whatsapp-official'
      ) {
        if (!chatInfo.from_number) {
          throw new Error('Номер телефона не найден в чате')
        }

        // Проверяем наличие порта
        if (!instance.port_api) {
          throw new Error(
            `Порт API не найден для инстанса ${instanceId}. Проверьте настройки инстанса.`
          )
        }

        console.log('Sending message to WhatsApp:', {
          number: chatInfo.from_number,
          instanceId,
          message: currentMessage,
          port: instance.port_api,
          provider: instance.provider
        })

        try {
          response = await sendWhatsAppMessage(
            currentMessage,
            instance.port_api,
            instanceId,
            chatInfo.from_number,
            instance.agno_config?.agent_id
          )

          toast.success('Сообщение отправлено в WhatsApp!')
        } catch (whatsappError) {
          // Игнорируем все ошибки WhatsApp как требуется
          console.warn('WhatsApp error (ignored):', whatsappError)
          toast.success(
            'Команда отправки WhatsApp выполнена (ошибки игнорируются)'
          )
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
        error instanceof Error ? error.message : 'Неизвестная ошибка'
      toast.error(`Ошибка отправки сообщения: ${errorMessage}`)

      // Восстанавливаем сообщение при ошибке
      setInputMessage(currentMessage)
      setFiles(currentFiles)
    } finally {
      setIsSending(false)
    }
  }

  const getProviderDisplayName = () => {
    if (!instance) return 'мессенджер'

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
    if (isLoadingInstance || isLoadingChatInfo) {
      return '⏳ Загрузка информации...'
    }

    if (!instance) {
      return '❌ Инстанс не найден'
    }

    if (!chatInfo) {
      return '❌ Информация о чате не найдена'
    }

    const providerName = getProviderDisplayName()
    const authStatus = instance.auth_status
    const supportedProviders = ['telegram', 'whatsappweb', 'whatsapp-official']

    if (!supportedProviders.includes(instance.provider)) {
      return `⚠️ Отправка сообщений для ${providerName} пока не поддерживается`
    }

    if (instance.provider === 'telegram') {
      if (authStatus === 'authenticated' || authStatus === 'client_ready') {
        return `✅ ${providerName} готов к отправке сообщений`
      } else {
        return `⚠️ ${providerName} не аутентифицирован (${authStatus || 'неизвестно'})`
      }
    } else if (
      instance.provider === 'whatsappweb' ||
      instance.provider === 'whatsapp-official'
    ) {
      if (!chatInfo.from_number) {
        return `⚠️ ${providerName} - номер телефона не найден в чате`
      }
      // Для WhatsApp всегда показываем готовность независимо от статуса
      return `✅ ${providerName} готов к отправке сообщений`
    }

    return `⚠️ Проверьте настройки ${providerName}`
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
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          size="icon"
          variant="outline"
          className="border-accent bg-pimary text-primary shrink-0 rounded-xl border p-5"
          title="Прикрепить файл"
        >
          <Icon type="paperclip" color="secondary" />
        </Button>
        <TextArea
          placeholder={`Отправить сообщение в ${getProviderDisplayName()}...`}
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
              ? 'Отправка...'
              : canSendMessages()
                ? 'Отправить сообщение'
                : 'Инстанс не готов'
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
      <div className="text-center">
        <p className="text-muted-foreground text-xs">{getStatusMessage()}</p>
      </div>
    </div>
  )
}

export default MessengerChatInput
