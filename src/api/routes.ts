// API маршруты для разных систем
export const PLAYGROUND_API = '/api/v1/playground'
export const AGENTS_API = '/v1/agents'

// Agno Framework API - мультиагентный фреймворк (только запуск агентов и сессии)
export const AgnoAPIRoutes = {
  // Запуск агентов (оставляем - это основная функция Agno)
  AgentRun: (agnoEndpoint: string, agentId: string) =>
    `${agnoEndpoint}/v1/agents/${agentId}/runs`,

  // Сессии агентов (оставляем - управляется Agno)
  GetSessions: (agnoEndpoint: string, agentId: string) =>
    `${agnoEndpoint}/v1/agents/${agentId}/sessions`,
  GetSession: (agnoEndpoint: string, agentId: string, sessionId: string) =>
    `${agnoEndpoint}/v1/agents/${agentId}/sessions/${sessionId}`,
  DeleteSession: (agnoEndpoint: string, agentId: string, sessionId: string) =>
    `${agnoEndpoint}/v1/agents/${agentId}/sessions/${sessionId}`,

  // Система (оставляем - для проверки доступности Agno)
  HealthCheck: (agnoEndpoint: string) => `${agnoEndpoint}/v1/health`
}

// Messenger API - омниканальный мессенджер на сервере 13.61.141.6
const MESSENGER_SERVER = '13.61.141.6'
const MESSENGER_PROTOCOL =
  process.env.NODE_ENV === 'production' ? 'https' : 'http'
const MESSENGER_BASE_URL = `${MESSENGER_PROTOCOL}://${MESSENGER_SERVER}`

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

// Legacy support (для совместимости со старым кодом)
export const APIRoutes = {
  AgentRun: (agnoEndpoint: string) =>
    `${agnoEndpoint}/v1/agents/{agent_id}/runs`,
  PlaygroundStatus: AgnoAPIRoutes.HealthCheck,
  GetPlaygroundSessions: AgnoAPIRoutes.GetSessions,
  GetPlaygroundSession: AgnoAPIRoutes.GetSession,
  DeletePlaygroundSession: AgnoAPIRoutes.DeleteSession
}
