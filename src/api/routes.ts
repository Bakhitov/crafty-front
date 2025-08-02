// API маршруты для разных систем
export const PLAYGROUND_API = '/api/v1/playground'
export const AGENTS_API = '/v1/agents'

// Agno Framework API - мультиагентный фреймворк (только запуск агентов и сессии)
export const AgnoAPIRoutes = {
  // Прямые вызовы к агно (могут блокироваться CORS)
  AgentRun: (agnoEndpoint: string, agentId: string) =>
    `${agnoEndpoint}/v1/agents/${agentId}/runs`,
  GetSessions: (agnoEndpoint: string, agentId: string) =>
    `${agnoEndpoint}/v1/agents/${agentId}/sessions`,
  GetSession: (agnoEndpoint: string, agentId: string, sessionId: string) =>
    `${agnoEndpoint}/v1/agents/${agentId}/sessions/${sessionId}`,
  DeleteSession: (agnoEndpoint: string, agentId: string, sessionId: string) =>
    `${agnoEndpoint}/v1/agents/${agentId}/sessions/${sessionId}`,
  HealthCheck: (agnoEndpoint: string) => `${agnoEndpoint}/v1/health`
}

// Прокси маршруты для агно API (решают проблемы с CORS)
export const AgnoProxyRoutes = {
  // Прокси для запуска агентов
  AgentRun: (agentId: string, agnoEndpoint?: string) => {
    const url = `/api/v1/agno-proxy/agents/${agentId}/runs`
    return agnoEndpoint
      ? `${url}?endpoint=${encodeURIComponent(agnoEndpoint)}`
      : url
  },

  // Прокси для получения сессий
  GetSessions: (agentId: string, agnoEndpoint?: string, userId?: string) => {
    const url = `/api/v1/agno-proxy/agents/${agentId}/sessions`
    const params = new URLSearchParams()
    if (agnoEndpoint) params.set('endpoint', agnoEndpoint)
    if (userId) params.set('user_id', userId)
    return params.toString() ? `${url}?${params.toString()}` : url
  },

  // Прокси для получения конкретной сессии
  GetSession: (
    agentId: string,
    sessionId: string,
    agnoEndpoint?: string,
    userId?: string
  ) => {
    const url = `/api/v1/agno-proxy/agents/${agentId}/sessions/${sessionId}`
    const params = new URLSearchParams()
    if (agnoEndpoint) params.set('endpoint', agnoEndpoint)
    if (userId) params.set('user_id', userId)
    return params.toString() ? `${url}?${params.toString()}` : url
  },

  // Прокси для удаления сессии
  DeleteSession: (
    agentId: string,
    sessionId: string,
    agnoEndpoint?: string,
    userId?: string
  ) => {
    const url = `/api/v1/agno-proxy/agents/${agentId}/sessions/${sessionId}`
    const params = new URLSearchParams()
    if (agnoEndpoint) params.set('endpoint', agnoEndpoint)
    if (userId) params.set('user_id', userId)
    return params.toString() ? `${url}?${params.toString()}` : url
  },

  // Прокси для health check (уже существует)
  HealthCheck: (agnoEndpoint: string) =>
    `/api/v1/health-proxy?endpoint=${encodeURIComponent(agnoEndpoint)}`
}

// Messenger API - омниканальный мессенджер на сервере 13.61.141.6
const MESSENGER_SERVER = '13.61.141.6'

// Функция для определения протокола мессенджер сервера
const getMessengerProtocol = () => {
  // Можно переопределить через environment variable
  if (process.env.MESSENGER_PROTOCOL) {
    return process.env.MESSENGER_PROTOCOL
  }
  // По умолчанию HTTP для 13.61.141.6 (можно изменить в настройках)
  return 'http'
}

const MESSENGER_BASE_URL = `${getMessengerProtocol()}://${MESSENGER_SERVER}`

export const MessengerAPIRoutes = {
  // Инстансы мессенджеров (на отдельном сервере)
  GetInstances: `${MESSENGER_BASE_URL}/api/v1/instances`,
  CreateInstance: `${MESSENGER_BASE_URL}/api/v1/instances`,
  UpdateInstance: (instanceId: string) =>
    `${MESSENGER_BASE_URL}/api/v1/instances/${instanceId}`,
  DeleteInstance: (instanceId: string) =>
    `${MESSENGER_BASE_URL}/api/v1/instances/${instanceId}`,

  // Отправка сообщений (на отдельном сервере)
  SendTelegram: `${MESSENGER_BASE_URL}/api/v1/telegram/send`,
  SendWhatsApp: `${MESSENGER_BASE_URL}/api/v1/whatsapp/send`,

  // Webhook endpoints (на отдельном сервере)
  TelegramWebhook: `${MESSENGER_BASE_URL}/api/v1/telegram/webhook`,
  WhatsAppWebhook: `${MESSENGER_BASE_URL}/api/v1/whatsapp/webhook`
}

// Наши внутренние API (только для компаний и прокси к мессенджеру)
export const InternalAPIRoutes = {
  // Компании (остается внутри Next.js)
  GetCompanies: '/api/v1/companies',
  CreateCompany: '/api/v1/companies',

  // Логи Instance Manager
  GetLogs: '/api/v1/logs',
  GetLatestLogs: '/api/v1/logs/latest',

  // Прокси для мессенджера (наши локальные endpoints, которые проксируют запросы к 13.61.141.6)
  GetInstances: '/api/v1/instances', // проксирует к 13.61.141.6
  SendTelegram: '/api/v1/telegram/send', // проксирует к 13.61.141.6
  SendWhatsApp: '/api/v1/whatsapp/send' // проксирует к 13.61.141.6
}

// Legacy support (для совместимости со старым кодом) - теперь использует прокси
export const APIRoutes = {
  AgentRun: (agnoEndpoint: string) =>
    `${agnoEndpoint}/v1/agents/{agent_id}/runs`,
  PlaygroundStatus: (agnoEndpoint: string) =>
    AgnoProxyRoutes.HealthCheck(agnoEndpoint), // Используем прокси
  GetPlaygroundSessions: (agnoEndpoint: string, agentId: string) =>
    AgnoProxyRoutes.GetSessions(agentId, agnoEndpoint), // Используем прокси
  GetPlaygroundSession: (
    agnoEndpoint: string,
    agentId: string,
    sessionId: string
  ) => AgnoProxyRoutes.GetSession(agentId, sessionId, agnoEndpoint), // Используем прокси
  DeletePlaygroundSession: (
    agnoEndpoint: string,
    agentId: string,
    sessionId: string
  ) => AgnoProxyRoutes.DeleteSession(agentId, sessionId, agnoEndpoint) // Используем прокси
}
