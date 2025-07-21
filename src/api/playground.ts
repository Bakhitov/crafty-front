import { toast } from 'sonner'

import { APIRoutes } from './routes'

import { Agent, ComboboxAgent, SessionEntry } from '@/types/playground'

export const getPlaygroundAgentsAPI = async (
  endpoint: string
): Promise<ComboboxAgent[]> => {
  const url = APIRoutes.GetPlaygroundAgents(endpoint)
  try {
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) {
      toast.error(`Failed to fetch playground agents: ${response.statusText}`)
      return []
    }
    const data = await response.json()
    // Transform the API response into the expected shape.
    const agents: ComboboxAgent[] = (data as Agent[]).map(
      (item: Agent, idx: number) => ({
        value: item.agent_id || `agent-${idx}`,
        label: item.name || item.agent_id || `Agent ${idx}`,
        model: item.model || { provider: '' },
        storage: item.storage || false,
        storage_config: item.storage_config
      })
    )
    return agents
  } catch {
    toast.error('Error fetching playground agents')
    return []
  }
}

export const getPlaygroundStatusAPI = async (base: string): Promise<number> => {
  const response = await fetch(APIRoutes.PlaygroundStatus(base), {
    method: 'GET'
  })
  return response.status
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

    const response = await fetch(url.toString(), {
      method: 'GET'
    })
    if (!response.ok) {
      if (response.status === 404) {
        // Return empty array when storage is not enabled
        return []
      }
      throw new Error(`Failed to fetch sessions: ${response.statusText}`)
    }
    return response.json()
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
  const url = new URL(APIRoutes.GetPlaygroundSession(base, agentId, sessionId))

  // Добавляем user_id как query параметр если передан
  if (userId) {
    url.searchParams.append('user_id', userId)
  }

  const response = await fetch(url.toString(), {
    method: 'GET'
  })
  return response.json()
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
