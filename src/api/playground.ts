import { toast } from 'sonner'

import { APIRoutes } from './routes'

import { Agent, ComboboxAgent, SessionEntry } from '@/types/playground'

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
    const url = APIRoutes.PlaygroundStatus(base)
    console.log('getPlaygroundStatusAPI: Request URL:', url)

    const response = await fetch(url, {
      method: 'GET'
    })

    console.log('getPlaygroundStatusAPI: Response status:', response.status)
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
    const url = new URL(APIRoutes.GetPlaygroundSessions(base, agentId))

    // Добавляем user_id как query параметр если передан
    if (userId) {
      url.searchParams.append('user_id', userId)
    }

    console.log('🌐 API: Fetching sessions from:', {
      url: url.toString(),
      agentId,
      userId,
      hasUserId: !!userId
    })

    const response = await fetch(url.toString(), {
      method: 'GET'
    })

    if (!response.ok) {
      console.error('❌ API: Sessions fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        agentId,
        userId
      })

      if (response.status === 404) {
        // Return empty array when storage is not enabled
        return []
      }
      throw new Error(`Failed to fetch sessions: ${response.statusText}`)
    }

    const sessions = await response.json()
    console.log('✅ API: Sessions fetched successfully:', {
      count: sessions.length,
      agentId,
      userId,
      sessions: sessions.map((s: SessionEntry) => ({
        id: s.session_id,
        title: s.title
      }))
    })

    return sessions
  } catch (error) {
    console.error('❌ API: Sessions fetch error:', error)
    return []
  }
}

export const getPlaygroundSessionAPI = async (
  base: string,
  agentId: string,
  sessionId: string,
  userId?: string
) => {
  const url = new URL(APIRoutes.GetPlaygroundSession(base, agentId, sessionId))

  // Добавляем user_id как query параметр если передан
  if (userId) {
    url.searchParams.append('user_id', userId)
  }

  console.log('🌐 API: Fetching session from:', {
    url: url.toString(),
    agentId,
    sessionId,
    userId,
    hasUserId: !!userId
  })

  const response = await fetch(url.toString(), {
    method: 'GET'
  })

  if (!response.ok) {
    console.error('❌ API: Session fetch failed:', {
      status: response.status,
      statusText: response.statusText,
      agentId,
      sessionId,
      userId
    })
    throw new Error(`Failed to fetch session: ${response.statusText}`)
  }

  const sessionData = await response.json()
  console.log('✅ API: Session fetched successfully:', {
    sessionId: sessionData?.session_id,
    hasMemory: !!sessionData?.memory,
    runsCount: sessionData?.memory?.runs?.length || 0
  })

  return sessionData
}

export const deletePlaygroundSessionAPI = async (
  base: string,
  agentId: string,
  sessionId: string,
  userId?: string
) => {
  const url = new URL(
    APIRoutes.DeletePlaygroundSession(base, agentId, sessionId)
  )

  // Добавляем user_id как query параметр если передан
  if (userId) {
    url.searchParams.append('user_id', userId)
  }

  const response = await fetch(url.toString(), {
    method: 'DELETE'
  })
  return response
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
  const url = new URL(
    `${base}/v1/agents/${agentId}/sessions/${sessionId}/rename`
  )

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: newName,
      user_id: userId
    })
  })

  return response
}
