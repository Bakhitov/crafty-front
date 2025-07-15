import { useCallback } from 'react'
import { toast } from 'sonner'

import { usePlaygroundStore } from '../store'

import { ComboboxAgent, type PlaygroundChatMessage } from '@/types/playground'
import { getPlaygroundStatusAPI } from '@/api/playground'
import { supabase } from '@/lib/supabase'
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
      // Используем view public.dynamic_agents (созданную поверх ai.dynamic_agents)
      const { data, error } = await supabase
        .from('dynamic_agents')
        .select(
          'agent_id, name, model_configuration, storage_config, is_active'
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error fetching agents:', error)
        toast.error('Ошибка получения агентов из базы')
        return []
      }

      if (!data) return []

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
          storage: storageEnabled
        }
      })

      return agents
    } catch (err) {
      console.error('Unknown error fetching agents:', err)
      toast.error('Ошибка получения агентов')
      return []
    }
  }, [])

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
    if (agentId === 'new') {
      setIsEndpointActive(true)
      setAgents([])
      setIsEndpointLoading(false)
      return
    }
    setIsEndpointLoading(true)
    try {
      const status = await getStatus()
      let agents: ComboboxAgent[] = []
      if (status === 200) {
        setIsEndpointActive(true)
        agents = await getAgents()
        if (agents.length > 0) {
          if (!agentId) {
            const firstAgent = agents[0]
            setAgentId(firstAgent.value)
            setSelectedModel(firstAgent.model.provider || '')
            setSelectedAgent(firstAgent)
          } else {
            const currentAgent = agents.find((a) => a.value === agentId)
            if (currentAgent) {
              setSelectedAgent(currentAgent)
              setSelectedModel(currentAgent.model.provider || '')
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
    agentId
  ])

  return {
    clearChat,
    addMessage,
    getAgents,
    focusChatInput,
    initializePlayground
  }
}

export default useChatActions
