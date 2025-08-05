import { toast } from 'sonner'

import { APIRoutes, AgnoProxyRoutes } from './routes'

import {
  Agent,
  ComboboxAgent,
  SessionEntry,
  AgentMemory
} from '@/types/playground'

export const getPlaygroundAgentsAPI = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _endpoint: string // Параметр оставляем для совместимости API, но не используем
): Promise<ComboboxAgent[]> => {
  // Используем наш внутренний API для получения агентов из Supabase
  const url = '/api/v1/agents'
  try {
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) {
      toast.error(`Failed to fetch playground agents: ${response.statusText}`)
      return []
    }
    const data = await response.json()
    // Transform the API response into the expected shape.
    const agents: ComboboxAgent[] = (data as Agent[]).map((item: Agent) => ({
      value: item.agent_id,
      label: item.name || item.agent_id,
      model: {
        provider: item.model_config?.provider || ''
      },
      storage: true, // Все агенты из Supabase поддерживают storage через Agno
      storage_config: { enabled: true },
      is_public: item.is_public,
      company_id: item.company_id,
      category: item.category,
      photo: item.photo
    }))
    return agents
  } catch (error) {
    console.error('Error fetching playground agents:', error)
    toast.error('Failed to fetch playground agents')
    return []
  }
}

export const getPlaygroundStatusAPI = async (base: string): Promise<number> => {
  console.log('getPlaygroundStatusAPI: Checking status for endpoint:', base)
  try {
    // Используем прокси health check
    const url = APIRoutes.PlaygroundStatus(base)
    console.log('getPlaygroundStatusAPI: Request URL:', url)

    const response = await fetch(url, {
      method: 'GET'
    })

    console.log('getPlaygroundStatusAPI: Response status:', response.status)

    // Для прокси эндпоинта нужно проверить body для получения реального статуса
    if (response.ok) {
      try {
        const data = await response.json()
        return data.status || response.status
      } catch {
        return response.status
      }
    }

    return response.status
  } catch (error) {
    console.error('getPlaygroundStatusAPI: Error:', error)
    return 503
  }
}

export const getAllPlaygroundSessionsAPI = async (
  base: string,
  agentId: string,
  userId?: string
): Promise<SessionEntry[]> => {
  try {
    const url = APIRoutes.GetPlaygroundSessions(base, agentId)
    const finalUrl = new URL(url, window.location.origin)

    if (userId) {
      finalUrl.searchParams.set('user_id', userId)
    }

    const response = await fetch(finalUrl.toString(), {
      method: 'GET'
    })

    if (!response.ok) {
      if (response.status === 404) {
        return []
      }
      throw new Error(`Failed to fetch sessions: ${response.statusText}`)
    }

    const rawSessions = await response.json()

    // Трансформируем данные согласно новой структуре AGNO API
    const sessions: SessionEntry[] = rawSessions.map(
      (s: {
        session_id: string
        title?: string
        created_at: number
        session_name?: string
        session_data?: Record<string, unknown>
      }) => ({
        session_id: s.session_id,
        title:
          s.session_name || s.title || `Session ${s.session_id.slice(0, 8)}`,
        created_at: s.created_at,
        session_data: {
          session_name: s.session_name,
          ...s.session_data
        }
      })
    )

    return sessions
  } catch {
    return []
  }
}

export const getPlaygroundSessionAPI = async (
  base: string,
  agentId: string,
  sessionId: string,
  userId?: string
) => {
  const url = APIRoutes.GetPlaygroundSession(base, agentId, sessionId)
  const finalUrl = new URL(url, window.location.origin)

  if (userId) {
    finalUrl.searchParams.set('user_id', userId)
  }

  const response = await fetch(finalUrl.toString(), {
    method: 'GET'
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch session: ${response.statusText}`)
  }

  return await response.json()
}

export const deletePlaygroundSessionAPI = async (
  base: string,
  agentId: string,
  sessionId: string,
  userId?: string
) => {
  const url = APIRoutes.DeletePlaygroundSession(base, agentId, sessionId)
  const finalUrl = new URL(url, window.location.origin)

  if (userId) {
    finalUrl.searchParams.set('user_id', userId)
  }

  return await fetch(finalUrl.toString(), {
    method: 'DELETE'
  })
}

export const getAgents = async (url: string): Promise<Agent[]> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch agents')
    }
    const agents = (await response.json()) as Agent[]
    return agents
  } catch (error) {
    console.error('Error fetching agents:', error)
    toast.error('Could not fetch agents from the specified endpoint.')
    return []
  }
}

export const renamePlaygroundSessionAPI = async (
  base: string,
  agentId: string,
  sessionId: string,
  newName: string,
  userId?: string
) => {
  const url = AgnoProxyRoutes.RenameSession(agentId, sessionId, base)

  return await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: newName,
      user_id: userId
    })
  })
}

export const getAgentMemoriesAPI = async (
  base: string,
  agentId: string,
  userId: string
): Promise<AgentMemory[]> => {
  try {
    const url = AgnoProxyRoutes.GetMemories(agentId, base, userId)

    const response = await fetch(url, {
      method: 'GET'
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Агент не имеет памяти
        return []
      }
      throw new Error(`Failed to fetch memories: ${response.statusText}`)
    }

    const memories = await response.json()
    return Array.isArray(memories) ? memories : []
  } catch (error) {
    console.error('Error fetching agent memories:', error)
    return []
  }
}
