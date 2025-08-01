import { agnoAPI, AgnoAPIClient } from './agnoApiClient'
import { instancesAPI, InstancesAPIClient } from './instancesApiClient'
import { supabaseCrud, SupabaseCrudClient } from './supabaseCrudClient'
import { messengerChat, MessengerChatClient } from './messengerChatClient'

export type APITarget = 'agno' | 'instances' | 'supabase' | 'messenger-chat'

export interface APIRoute {
  target: APITarget
  description: string
}

/**
 * Карта маршрутизации API запросов
 * Определяет куда направлять каждый тип запроса
 */
export const API_ROUTES_MAP: Record<string, APIRoute> = {
  // ==================== AGNO FRAMEWORK ====================
  // Вызовы агентов и работа с сессиями
  'agents.run': {
    target: 'agno',
    description: 'Запуск агента через Agno Framework'
  },
  'agents.runStream': {
    target: 'agno',
    description: 'Запуск агента со стримингом через Agno Framework'
  },
  'sessions.list': {
    target: 'agno',
    description: 'Получение списка сессий агента из Agno'
  },
  'sessions.get': {
    target: 'agno',
    description: 'Получение конкретной сессии из Agno'
  },
  'sessions.delete': {
    target: 'agno',
    description: 'Удаление сессии в Agno'
  },
  'sessions.messages': {
    target: 'agno',
    description: 'Получение сообщений сессии из Agno'
  },
  'agents.cache.refresh': {
    target: 'agno',
    description: 'Обновление кэша агента в Agno'
  },
  'agno.health': {
    target: 'agno',
    description: 'Проверка здоровья Agno сервера'
  },

  // ==================== INSTANCES API ====================
  // Работа с инстансами мессенджеров
  'instances.list': {
    target: 'instances',
    description: 'Получение списка инстансов мессенджеров'
  },
  'instances.get': {
    target: 'instances',
    description: 'Получение конкретного инстанса'
  },
  'instances.create': {
    target: 'instances',
    description: 'Создание нового инстанса'
  },
  'instances.update': {
    target: 'instances',
    description: 'Обновление инстанса'
  },
  'instances.delete': {
    target: 'instances',
    description: 'Удаление инстанса'
  },
  'instances.status': {
    target: 'instances',
    description: 'Получение статуса инстанса'
  },
  'instances.start': {
    target: 'instances',
    description: 'Запуск инстанса'
  },
  'instances.stop': {
    target: 'instances',
    description: 'Остановка инстанса'
  },
  'instances.restart': {
    target: 'instances',
    description: 'Перезапуск инстанса'
  },
  'instances.auth': {
    target: 'instances',
    description: 'Проверка авторизации инстанса'
  },
  'instances.qr': {
    target: 'instances',
    description: 'Получение QR кода для WhatsApp Web'
  },
  'instances.send.telegram': {
    target: 'instances',
    description: 'Отправка сообщения через Telegram'
  },
  'instances.send.whatsapp': {
    target: 'instances',
    description: 'Отправка сообщения через WhatsApp'
  },
  'instances.health': {
    target: 'instances',
    description: 'Проверка здоровья API инстансов'
  },

  // ==================== SUPABASE CRUD ====================
  // CRUD операции для агентов и инструментов
  'agents.crud.list': {
    target: 'supabase',
    description: 'Получение списка агентов из Supabase'
  },
  'agents.crud.get': {
    target: 'supabase',
    description: 'Получение агента из Supabase'
  },
  'agents.crud.create': {
    target: 'supabase',
    description: 'Создание агента в Supabase'
  },
  'agents.crud.update': {
    target: 'supabase',
    description: 'Обновление агента в Supabase'
  },
  'agents.crud.delete': {
    target: 'supabase',
    description: 'Удаление агента в Supabase'
  },
  'agents.crud.search': {
    target: 'supabase',
    description: 'Поиск агентов в Supabase'
  },
  'tools.crud.list': {
    target: 'supabase',
    description: 'Получение списка инструментов из Supabase'
  },
  'tools.crud.get': {
    target: 'supabase',
    description: 'Получение инструмента из Supabase'
  },
  'tools.crud.create': {
    target: 'supabase',
    description: 'Создание инструмента в Supabase'
  },
  'tools.crud.update': {
    target: 'supabase',
    description: 'Обновление инструмента в Supabase'
  },
  'tools.crud.delete': {
    target: 'supabase',
    description: 'Удаление инструмента в Supabase'
  },
  'tools.crud.search': {
    target: 'supabase',
    description: 'Поиск инструментов в Supabase'
  },

  // ==================== MESSENGER CHATS ====================
  // Чаты мессенджера через Supabase
  'chats.list': {
    target: 'messenger-chat',
    description: 'Получение списка чатов из Supabase'
  },
  'chats.get': {
    target: 'messenger-chat',
    description: 'Получение конкретного чата из Supabase'
  },
  'messages.list': {
    target: 'messenger-chat',
    description: 'Получение сообщений чата из Supabase'
  },
  'messages.create': {
    target: 'messenger-chat',
    description: 'Создание сообщения в Supabase'
  },
  'messages.update': {
    target: 'messenger-chat',
    description: 'Обновление сообщения в Supabase'
  },
  'messages.delete': {
    target: 'messenger-chat',
    description: 'Удаление сообщения в Supabase'
  },
  'chats.subscribe': {
    target: 'messenger-chat',
    description: 'Подписка на изменения в чате'
  },
  'instances.subscribe': {
    target: 'messenger-chat',
    description: 'Подписка на новые сообщения в инстансе'
  }
}

/**
 * Универсальный роутер API запросов
 * Направляет запросы к соответствующим клиентам
 */
export class APIRouter {
  private agnoClient: AgnoAPIClient
  private instancesClient: InstancesAPIClient
  private supabaseClient: SupabaseCrudClient
  private messengerChatClient: MessengerChatClient

  constructor(
    agnoClient = agnoAPI,
    instancesClient = instancesAPI,
    supabaseClient = supabaseCrud,
    messengerChatClient = messengerChat
  ) {
    this.agnoClient = agnoClient
    this.instancesClient = instancesClient
    this.supabaseClient = supabaseClient
    this.messengerChatClient = messengerChatClient
  }

  /**
   * Получить информацию о маршруте
   */
  getRouteInfo(routeKey: string): APIRoute | null {
    return API_ROUTES_MAP[routeKey] || null
  }

  /**
   * Получить все маршруты по целевому API
   */
  getRoutesByTarget(target: APITarget): Record<string, APIRoute> {
    return Object.fromEntries(
      Object.entries(API_ROUTES_MAP).filter(
        ([, route]) => route.target === target
      )
    )
  }

  /**
   * Проверить доступность всех API
   */
  async checkAllAPIsHealth(): Promise<
    Record<APITarget, { status: string; error?: string }>
  > {
    const results: Record<APITarget, { status: string; error?: string }> = {
      agno: { status: 'unknown' },
      instances: { status: 'unknown' },
      supabase: { status: 'unknown' },
      'messenger-chat': { status: 'unknown' }
    }

    // Проверяем Agno
    try {
      await this.agnoClient.checkHealth()
      results.agno = { status: 'healthy' }
    } catch (error) {
      results.agno = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Проверяем Instances API
    try {
      await this.instancesClient.checkHealth()
      results.instances = { status: 'healthy' }
    } catch (error) {
      results.instances = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Проверяем Supabase (попробуем получить текущего пользователя)
    try {
      await this.supabaseClient.getCurrentUser()
      results.supabase = { status: 'healthy' }
    } catch (error) {
      results.supabase = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Messenger Chat использует тот же Supabase, поэтому статус такой же
    results['messenger-chat'] = results.supabase

    return results
  }

  // ==================== AGNO МЕТОДЫ ====================

  async runAgent(
    agentId: string,
    request: Parameters<AgnoAPIClient['runAgent']>[1]
  ) {
    return this.agnoClient.runAgent(agentId, request)
  }

  async runAgentStream(
    agentId: string,
    request: Parameters<AgnoAPIClient['runAgentStream']>[1],
    onChunk: Parameters<AgnoAPIClient['runAgentStream']>[2],
    onComplete: Parameters<AgnoAPIClient['runAgentStream']>[3],
    onError: Parameters<AgnoAPIClient['runAgentStream']>[4]
  ) {
    return this.agnoClient.runAgentStream(
      agentId,
      request,
      onChunk,
      onComplete,
      onError
    )
  }

  async getAgentSessions(agentId: string) {
    return this.agnoClient.getAgentSessions(agentId)
  }

  async getSession(agentId: string, sessionId: string) {
    return this.agnoClient.getSession(agentId, sessionId)
  }

  async deleteSession(agentId: string, sessionId: string) {
    return this.agnoClient.deleteSession(agentId, sessionId)
  }

  async getSessionMessages(agentId: string, sessionId: string) {
    return this.agnoClient.getSessionMessages(agentId, sessionId)
  }

  // refreshAgentCache метод удален - больше не используется

  // ==================== INSTANCES МЕТОДЫ ====================

  async getInstances(
    filters?: Parameters<InstancesAPIClient['getInstances']>[0],
    pagination?: Parameters<InstancesAPIClient['getInstances']>[1]
  ) {
    return this.instancesClient.getInstances(filters, pagination)
  }

  async getInstance(instanceId: string) {
    return this.instancesClient.getInstance(instanceId)
  }

  async createInstance(
    payload: Parameters<InstancesAPIClient['createInstance']>[0]
  ) {
    return this.instancesClient.createInstance(payload)
  }

  async updateInstance(
    instanceId: string,
    updates: Parameters<InstancesAPIClient['updateInstance']>[1]
  ) {
    return this.instancesClient.updateInstance(instanceId, updates)
  }

  async deleteInstance(instanceId: string) {
    return this.instancesClient.deleteInstance(instanceId)
  }

  async getInstanceStatus(instanceId: string) {
    return this.instancesClient.getInstanceStatus(instanceId)
  }

  async startInstance(instanceId: string) {
    return this.instancesClient.startInstance(instanceId)
  }

  async stopInstance(instanceId: string) {
    return this.instancesClient.stopInstance(instanceId)
  }

  async restartInstance(instanceId: string) {
    return this.instancesClient.restartInstance(instanceId)
  }

  async sendTelegramMessage(
    request: Parameters<InstancesAPIClient['sendTelegramMessage']>[0]
  ) {
    return this.instancesClient.sendTelegramMessage(request)
  }

  async sendWhatsAppMessage(
    request: Parameters<InstancesAPIClient['sendWhatsAppMessage']>[0]
  ) {
    return this.instancesClient.sendWhatsAppMessage(request)
  }

  async getWhatsAppQR(instanceId: string, port: number) {
    return this.instancesClient.getWhatsAppQR(instanceId, port)
  }

  async getInstanceAuth(instanceId: string, port: number) {
    return this.instancesClient.getInstanceAuth(instanceId, port)
  }

  // ==================== SUPABASE CRUD МЕТОДЫ ====================

  async getAgents(
    filters?: Parameters<SupabaseCrudClient['getAgents']>[0],
    pagination?: Parameters<SupabaseCrudClient['getAgents']>[1]
  ) {
    return this.supabaseClient.getAgents(filters, pagination)
  }

  async getAgent(agentId: string) {
    return this.supabaseClient.getAgent(agentId)
  }

  async createAgent(
    agentData: Parameters<SupabaseCrudClient['createAgent']>[0]
  ) {
    return this.supabaseClient.createAgent(agentData)
  }

  async updateAgent(
    agentId: string,
    updates: Parameters<SupabaseCrudClient['updateAgent']>[1]
  ) {
    return this.supabaseClient.updateAgent(agentId, updates)
  }

  async deleteAgent(agentId: string) {
    return this.supabaseClient.deleteAgent(agentId)
  }

  async searchAgents(
    searchQuery: string,
    filters?: Parameters<SupabaseCrudClient['searchAgents']>[1],
    pagination?: Parameters<SupabaseCrudClient['searchAgents']>[2]
  ) {
    return this.supabaseClient.searchAgents(searchQuery, filters, pagination)
  }

  async getTools(
    filters?: Parameters<SupabaseCrudClient['getTools']>[0],
    pagination?: Parameters<SupabaseCrudClient['getTools']>[1]
  ) {
    return this.supabaseClient.getTools(filters, pagination)
  }

  async getTool(toolName: string) {
    return this.supabaseClient.getTool(toolName)
  }

  async createTool(toolData: Parameters<SupabaseCrudClient['createTool']>[0]) {
    return this.supabaseClient.createTool(toolData)
  }

  async updateTool(
    toolId: string,
    updates: Parameters<SupabaseCrudClient['updateTool']>[1]
  ) {
    return this.supabaseClient.updateTool(toolId, updates)
  }

  async deleteTool(toolName: string) {
    return this.supabaseClient.deleteTool(toolName)
  }

  async searchTools(
    searchQuery: string,
    filters?: Parameters<SupabaseCrudClient['searchTools']>[1],
    pagination?: Parameters<SupabaseCrudClient['searchTools']>[2]
  ) {
    return this.supabaseClient.searchTools(searchQuery, filters, pagination)
  }

  // ==================== MESSENGER CHAT МЕТОДЫ ====================

  async getChats(
    filters?: Parameters<MessengerChatClient['getChats']>[0],
    pagination?: Parameters<MessengerChatClient['getChats']>[1]
  ) {
    return this.messengerChatClient.getChats(filters, pagination)
  }

  async getChat(chatId: string, instanceId: string) {
    return this.messengerChatClient.getChat(chatId, instanceId)
  }

  async getChatMessages(
    chatId: string,
    instanceId: string,
    pagination?: Parameters<MessengerChatClient['getChatMessages']>[2]
  ) {
    return this.messengerChatClient.getChatMessages(
      chatId,
      instanceId,
      pagination
    )
  }

  async getMessages(
    filters?: Parameters<MessengerChatClient['getMessages']>[0],
    pagination?: Parameters<MessengerChatClient['getMessages']>[1]
  ) {
    return this.messengerChatClient.getMessages(filters, pagination)
  }

  async createMessage(
    messageData: Parameters<MessengerChatClient['createMessage']>[0]
  ) {
    return this.messengerChatClient.createMessage(messageData)
  }

  async updateMessage(
    messageId: string,
    updates: Parameters<MessengerChatClient['updateMessage']>[1]
  ) {
    return this.messengerChatClient.updateMessage(messageId, updates)
  }

  async deleteMessage(messageId: string) {
    return this.messengerChatClient.deleteMessage(messageId)
  }

  subscribeToChat(
    chatId: string,
    instanceId: string,
    callback: Parameters<MessengerChatClient['subscribeToChat']>[2]
  ) {
    return this.messengerChatClient.subscribeToChat(
      chatId,
      instanceId,
      callback
    )
  }

  subscribeToInstance(
    instanceId: string,
    callback: Parameters<MessengerChatClient['subscribeToInstance']>[1]
  ) {
    return this.messengerChatClient.subscribeToInstance(instanceId, callback)
  }
}

// Экспортируем singleton instance
export const apiRouter = new APIRouter()

// Хук для использования в компонентах
export function useAPIRouter() {
  return apiRouter
}

// Утилиты для отладки
export function logAPIRoutes() {
  console.group('🔀 API Routes Map')
  Object.entries(API_ROUTES_MAP).forEach(([key, route]) => {
    console.log(`${key} → ${route.target} (${route.description})`)
  })
  console.groupEnd()
}

export function getAPIStats() {
  const stats = Object.values(API_ROUTES_MAP).reduce(
    (acc, route) => {
      acc[route.target] = (acc[route.target] || 0) + 1
      return acc
    },
    {} as Record<APITarget, number>
  )

  return {
    total: Object.keys(API_ROUTES_MAP).length,
    byTarget: stats
  }
}
