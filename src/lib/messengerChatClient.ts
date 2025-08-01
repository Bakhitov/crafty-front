import { supabase } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { Message, Chat } from '@/types/messenger'

export interface ChatFilter {
  instance_id?: string
  company_id?: string
  is_group?: boolean
  contact_name?: string
}

export interface ChatPagination {
  limit?: number
  offset?: number
}

export interface ChatListResponse {
  chats: Chat[]
  total: number
  limit: number
  offset: number
}

export interface MessageFilter {
  chat_id?: string
  instance_id?: string
  from_number?: string
  message_type?: string
  is_from_me?: boolean
  agent_id?: string
  session_id?: string
}

export interface MessageListResponse {
  messages: Message[]
  total: number
  limit: number
  offset: number
}

/**
 * Клиент для работы с чатами мессенджера через Supabase
 * Обрабатывает сообщения и чаты из таблиц messages и message_instances
 */
export class MessengerChatClient {
  private supabaseClient: typeof supabase

  constructor(
    serverMode = false,
    cookies?: {
      get: (name: string) => string | undefined
      set: (name: string, value: string) => void
      remove: (name: string) => void
    }
  ) {
    if (serverMode && cookies) {
      // Для серверных компонентов
      this.supabaseClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies }
      )
    } else {
      // Для клиентских компонентов
      this.supabaseClient = supabase
    }
  }

  // ==================== ЧАТЫ ====================

  /**
   * Получить список чатов с последними сообщениями
   */
  async getChats(
    filters?: ChatFilter,
    pagination?: ChatPagination
  ): Promise<ChatListResponse> {
    try {
      // Используем RPC функцию для получения последних чатов
      const { data: chatsData, error } = await this.supabaseClient.rpc(
        'get_latest_chats',
        {
          p_company_id: filters?.company_id || null,
          p_instance_id: filters?.instance_id || null,
          p_limit: pagination?.limit || 100
        }
      )

      if (error) {
        console.error(
          'RPC function error, falling back to direct query:',
          error
        )
        return this.getChatsFallback(filters, pagination)
      }

      // Фильтруем результаты если нужно
      let filteredChats = chatsData || []

      if (filters?.is_group !== undefined) {
        filteredChats = filteredChats.filter(
          (chat: { is_group: boolean }) => chat.is_group === filters.is_group
        )
      }

      if (filters?.contact_name) {
        filteredChats = filteredChats.filter(
          (chat: { contact_name?: string }) =>
            chat.contact_name
              ?.toLowerCase()
              .includes(filters.contact_name!.toLowerCase())
        )
      }

      // Применяем пагинацию вручную если нужно
      const offset = pagination?.offset || 0
      const limit = pagination?.limit || 100
      const paginatedChats = filteredChats.slice(offset, offset + limit)

      return {
        chats: paginatedChats.map(this.formatChatFromRPC),
        total: filteredChats.length,
        limit,
        offset
      }
    } catch (error) {
      console.error('Failed to get chats via RPC, using fallback:', error)
      return this.getChatsFallback(filters, pagination)
    }
  }

  /**
   * Fallback метод для получения чатов без RPC функции
   */
  private async getChatsFallback(
    filters?: ChatFilter,
    pagination?: ChatPagination
  ): Promise<ChatListResponse> {
    let query = this.supabaseClient
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
      `,
        { count: 'exact' }
      )
      .not('chat_id', 'is', null)
      .order('timestamp', { ascending: false })

    // Применяем фильтры
    if (filters?.instance_id) {
      query = query.eq('instance_id', filters.instance_id)
    }

    if (filters?.company_id) {
      query = query.eq('message_instances.company_id', filters.company_id)
    }

    if (filters?.is_group !== undefined) {
      query = query.eq('is_group', filters.is_group)
    }

    if (filters?.contact_name) {
      query = query.ilike('contact_name', `%${filters.contact_name}%`)
    }

    // Пагинация
    const limit = pagination?.limit || 100
    const offset = pagination?.offset || 0
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch chats: ${error.message}`)
    }

    // Группируем по chat_id и берем последнее сообщение
    const chatMap = new Map<
      string,
      {
        chat_id: string
        instance_id: string
        contact_name: string | null
        from_number: string | null
        is_group: boolean
        group_id: string | null
        message_body: string | null
        timestamp: number | null
        updated_at: string | null
        session_id: string | null
      }
    >()

    data?.forEach(
      (message: {
        chat_id: string
        instance_id: string
        contact_name: string | null
        from_number: string | null
        is_group: boolean
        group_id: string | null
        message_body: string | null
        timestamp: number | null
        updated_at: string | null
        session_id: string | null
      }) => {
        const chatKey = `${message.instance_id}_${message.chat_id}`
        const existingChat = chatMap.get(chatKey)
        if (
          !existingChat ||
          (message.timestamp ?? 0) > (existingChat.timestamp ?? 0)
        ) {
          chatMap.set(chatKey, message)
        }
      }
    )

    const chats = Array.from(chatMap.values()).map(this.formatChatFromMessage)

    return {
      chats,
      total: count || 0,
      limit,
      offset
    }
  }

  /**
   * Получить конкретный чат
   */
  async getChat(chatId: string, instanceId: string): Promise<Chat | null> {
    const { data, error } = await this.supabaseClient
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
        session_id
      `
      )
      .eq('chat_id', chatId)
      .eq('instance_id', instanceId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch chat: ${error.message}`)
    }

    return this.formatChatFromMessage(data)
  }

  // ==================== СООБЩЕНИЯ ====================

  /**
   * Получить сообщения чата
   */
  async getChatMessages(
    chatId: string,
    instanceId: string,
    pagination?: ChatPagination
  ): Promise<MessageListResponse> {
    let query = this.supabaseClient
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('chat_id', chatId)
      .eq('instance_id', instanceId)
      .order('timestamp', { ascending: true })

    // Пагинация
    if (pagination?.limit) {
      query = query.limit(pagination.limit)
    }
    if (pagination?.offset) {
      query = query.range(
        pagination.offset,
        pagination.offset + (pagination.limit || 50) - 1
      )
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`)
    }

    return {
      messages: data || [],
      total: count || 0,
      limit: pagination?.limit || 50,
      offset: pagination?.offset || 0
    }
  }

  /**
   * Получить сообщения с фильтрацией
   */
  async getMessages(
    filters?: MessageFilter,
    pagination?: ChatPagination
  ): Promise<MessageListResponse> {
    let query = this.supabaseClient
      .from('messages')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })

    // Применяем фильтры
    if (filters?.chat_id) {
      query = query.eq('chat_id', filters.chat_id)
    }
    if (filters?.instance_id) {
      query = query.eq('instance_id', filters.instance_id)
    }
    if (filters?.from_number) {
      query = query.eq('from_number', filters.from_number)
    }
    if (filters?.message_type) {
      query = query.eq('message_type', filters.message_type)
    }
    if (filters?.is_from_me !== undefined) {
      query = query.eq('is_from_me', filters.is_from_me)
    }
    if (filters?.agent_id) {
      query = query.eq('agent_id', filters.agent_id)
    }
    if (filters?.session_id) {
      query = query.eq('session_id', filters.session_id)
    }

    // Пагинация
    if (pagination?.limit) {
      query = query.limit(pagination.limit)
    }
    if (pagination?.offset) {
      query = query.range(
        pagination.offset,
        pagination.offset + (pagination.limit || 50) - 1
      )
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`)
    }

    return {
      messages: data || [],
      total: count || 0,
      limit: pagination?.limit || 50,
      offset: pagination?.offset || 0
    }
  }

  /**
   * Создать новое сообщение
   */
  async createMessage(
    messageData: Omit<Message, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Message> {
    const { data, error } = await this.supabaseClient
      .from('messages')
      .insert({
        ...messageData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create message: ${error.message}`)
    }

    return data
  }

  /**
   * Обновить сообщение
   */
  async updateMessage(
    messageId: string,
    updates: Partial<Omit<Message, 'id' | 'created_at'>>
  ): Promise<Message> {
    const { data, error } = await this.supabaseClient
      .from('messages')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update message: ${error.message}`)
    }

    return data
  }

  /**
   * Удалить сообщение
   */
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`)
    }
  }

  // ==================== ПОДПИСКИ ====================

  /**
   * Подписаться на изменения в чате
   */
  subscribeToChat(
    chatId: string,
    instanceId: string,
    callback: (payload: {
      eventType: string
      new: unknown
      old: unknown
    }) => void
  ) {
    return this.supabaseClient
      .channel(`chat_${chatId}_${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        callback
      )
      .subscribe()
  }

  /**
   * Подписаться на новые сообщения в инстансе
   */
  subscribeToInstance(
    instanceId: string,
    callback: (payload: {
      eventType: string
      new: unknown
      old: unknown
    }) => void
  ) {
    return this.supabaseClient
      .channel(`instance_${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `instance_id=eq.${instanceId}`
        },
        callback
      )
      .subscribe()
  }

  // ==================== УТИЛИТЫ ====================

  /**
   * Форматировать чат из RPC результата
   */
  private formatChatFromRPC(rpcData: {
    chat_id: string
    instance_id: string
    contact_name: string | null
    from_number: string | null
    is_group: boolean
    group_id: string | null
    last_message: string | null
    last_message_timestamp: number | null
    updated_at: string | null
    session_id: string | null
  }): Chat {
    return {
      chat_id: rpcData.chat_id,
      instance_id: rpcData.instance_id,
      contact_name: rpcData.contact_name,
      from_number: rpcData.from_number,
      is_group: rpcData.is_group,
      group_id: rpcData.group_id,
      last_message: rpcData.last_message,
      last_message_timestamp: rpcData.last_message_timestamp,
      updated_at: rpcData.updated_at,
      session_id: rpcData.session_id,
      unread_count: 0, // Добавляем недостающие поля
      provider: 'whatsappweb' // Значение по умолчанию
    }
  }

  /**
   * Форматировать чат из сообщения
   */
  private formatChatFromMessage(messageData: {
    chat_id: string
    instance_id: string
    contact_name: string | null
    from_number: string | null
    is_group: boolean
    group_id: string | null
    message_body: string | null
    timestamp: number | null
    updated_at: string | null
    session_id: string | null
  }): Chat {
    return {
      chat_id: messageData.chat_id,
      instance_id: messageData.instance_id,
      contact_name: messageData.contact_name,
      from_number: messageData.from_number,
      is_group: messageData.is_group,
      group_id: messageData.group_id,
      last_message: messageData.message_body,
      last_message_timestamp: messageData.timestamp,
      updated_at: messageData.updated_at,
      session_id: messageData.session_id,
      unread_count: 0, // Добавляем недостающие поля
      provider: 'whatsappweb' // Значение по умолчанию
    }
  }
}

// Экспортируем singleton instances
export const messengerChat = new MessengerChatClient()

// Для серверных компонентов
export function createServerMessengerChatClient(cookies: {
  get: (name: string) => string | undefined
  set: (name: string, value: string) => void
  remove: (name: string) => void
}) {
  return new MessengerChatClient(true, cookies)
}

// Хуки для использования в компонентах
export function useMessengerChat() {
  return messengerChat
}
