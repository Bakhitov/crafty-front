import { useCallback } from 'react'
import { toast } from 'sonner'

import { usePlaygroundStore } from '../store'

import { ComboboxAgent, type PlaygroundChatMessage } from '@/types/playground'
import { getPlaygroundStatusAPI } from '@/api/playground'
import { useQueryState } from 'nuqs'

const useChatActions = () => {
  const { chatInputRef } = usePlaygroundStore()
  const selectedEndpoint = usePlaygroundStore((state) => state.selectedEndpoint)
  const [, setSessionId] = useQueryState('session')
  const setMessages = usePlaygroundStore((state) => state.setMessages)
  const setIsEndpointActive = usePlaygroundStore(
    (state) => state.setIsEndpointActive
  )
  const setIsEndpointLoading = usePlaygroundStore(
    (state) => state.setIsEndpointLoading
  )
  const setAgents = usePlaygroundStore((state) => state.setAgents)
  const setSelectedModel = usePlaygroundStore((state) => state.setSelectedModel)
  const setSelectedAgent = usePlaygroundStore((state) => state.setSelectedAgent)
  const [agentId, setAgentId] = useQueryState('agent')
  const setHasStorage = usePlaygroundStore((state) => state.setHasStorage)

  const getStatus = useCallback(async () => {
    try {
      const status = await getPlaygroundStatusAPI(selectedEndpoint)
      return status
    } catch {
      return 503
    }
  }, [selectedEndpoint])

  const getAgents = useCallback(async () => {
    try {
      // Получаем агентов напрямую из Agno API через endpoint
      const url = `${selectedEndpoint}/v1/agents/detailed`
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch agents from Agno API')
      }

      const data = await response.json()

      if (!data || !Array.isArray(data)) {
        return []
      }

      // Преобразуем ответ в ComboboxAgent
      const agents: ComboboxAgent[] = data.map((item) => {
        // Извлекаем provider, если он есть в конфигурации модели
        let provider = ''
        try {
          if (
            item.model_configuration &&
            typeof item.model_configuration === 'object'
          ) {
            const cfg = item.model_configuration as { provider?: string }
            provider = cfg.provider ?? ''
          } else if (typeof item.model_configuration === 'string') {
            const cfg = JSON.parse(item.model_configuration) as {
              provider?: string
            }
            provider = cfg.provider ?? ''
          }
        } catch {
          provider = ''
        }

        // Определяем наличие storage
        let storageEnabled = false
        try {
          if (item.storage_config && typeof item.storage_config === 'object') {
            const cfg = item.storage_config as { enabled?: boolean }
            storageEnabled = cfg.enabled ?? false
          } else if (typeof item.storage_config === 'string') {
            const cfg = JSON.parse(item.storage_config) as {
              enabled?: boolean
            }
            storageEnabled = cfg.enabled ?? false
          }
        } catch {
          storageEnabled = false
        }

        return {
          value: item.agent_id,
          label: item.name || item.agent_id,
          model: { provider },
          storage: storageEnabled,
          storage_config: { enabled: storageEnabled }
        }
      })

      return agents
    } catch (err) {
      console.error('Error fetching agents from Agno API:', err)
      toast.error('Ошибка получения агентов от Agno API')
      return []
    }
  }, [selectedEndpoint])

  const refreshAgentsList = useCallback(async () => {
    try {
      const agents = await getAgents()
      setAgents(agents)
      return agents
    } catch (error) {
      console.error('Error refreshing agents list:', error)
      return []
    }
  }, [getAgents, setAgents])

  const clearChat = useCallback(() => {
    setMessages([])
    setSessionId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const focusChatInput = useCallback(() => {
    setTimeout(() => {
      requestAnimationFrame(() => chatInputRef?.current?.focus())
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addMessage = useCallback(
    (message: PlaygroundChatMessage) => {
      setMessages((prevMessages) => [...prevMessages, message])
    },
    [setMessages]
  )

  const initializePlayground = useCallback(async () => {
    setIsEndpointLoading(true)
    try {
      const status = await getStatus()
      let agents: ComboboxAgent[] = []
      if (status === 200) {
        setIsEndpointActive(true)
        agents = await getAgents()

        // Только устанавливаем агента если НЕ в режиме создания нового
        if (agentId !== 'new' && agents.length > 0) {
          if (!agentId) {
            const firstAgent = agents[0]
            setAgentId(firstAgent.value)
            setSelectedModel(firstAgent.model.provider || '')
            setSelectedAgent(firstAgent)
            setHasStorage(
              !!(firstAgent.storage || firstAgent.storage_config?.enabled)
            )
          } else {
            const currentAgent = agents.find((a) => a.value === agentId)
            if (currentAgent) {
              setSelectedAgent(currentAgent)
              setSelectedModel(currentAgent.model.provider || '')
              setHasStorage(
                !!(currentAgent.storage || currentAgent.storage_config?.enabled)
              )
            }
          }
        }
      } else {
        setIsEndpointActive(false)
      }
      setAgents(agents)
      return agents
    } catch {
      setIsEndpointLoading(false)
    } finally {
      setIsEndpointLoading(false)
    }
  }, [
    getStatus,
    getAgents,
    setIsEndpointActive,
    setIsEndpointLoading,
    setAgents,
    setAgentId,
    setSelectedModel,
    setSelectedAgent,
    setHasStorage,
    agentId
  ])

  return {
    clearChat,
    addMessage,
    getAgents,
    refreshAgentsList,
    focusChatInput,
    initializePlayground
  }
}

export default useChatActions
