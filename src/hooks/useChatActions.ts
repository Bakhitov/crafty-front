import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { usePlaygroundStore } from '@/store'
import { useCompany } from './useCompany'
import { useAgents } from './useAgents'
import { transformAPIAgentsToCombobox } from '@/lib/apiClient'
import { ComboboxAgent, type PlaygroundChatMessage } from '@/types/playground'
import { getCachedHealthCheck } from '@/lib/requestCache'

const useChatActions = () => {
  const {
    setIsEndpointActive,
    setIsEndpointLoading,
    setAgents,
    setCurrentCompanyId,
    selectedEndpoint,
    chatInputRef,
    setIsAgentSwitching
  } = usePlaygroundStore()
  const { company } = useCompany()
  const { agents: supabaseAgents, refreshAgents } = useAgents()

  const initializationRef = useRef<{
    isInitializing: boolean
    lastEndpoint: string | null
    lastCompanyId: string | null
  }>({
    isInitializing: false,
    lastEndpoint: null,
    lastCompanyId: null
  })

  const getStatus = useCallback(async () => {
    if (!selectedEndpoint) return 503

    try {
      return await getCachedHealthCheck(selectedEndpoint)
    } catch {
      return 503
    }
  }, [selectedEndpoint])

  const getAgents = useCallback(async (): Promise<ComboboxAgent[]> => {
    try {
      return transformAPIAgentsToCombobox(supabaseAgents)
    } catch {
      toast.error('Error processing agents')
      return []
    }
  }, [supabaseAgents])

  const refreshAgentsList = useCallback(async () => {
    try {
      const freshAgents = await refreshAgents()
      const agents = transformAPIAgentsToCombobox(freshAgents || [])
      setAgents(agents)
      return agents
    } catch {
      toast.error('Failed to refresh agents list')
      return []
    }
  }, [refreshAgents, setAgents])

  const clearChat = useCallback(() => {
    usePlaygroundStore.setState({ messages: [] })
  }, [])

  const startAgentSwitch = useCallback(() => {
    setIsAgentSwitching(true)
    usePlaygroundStore.setState({
      messages: [],
      isSessionLoading: false
    })
  }, [setIsAgentSwitching])

  const completeAgentSwitch = useCallback(() => {
    setIsAgentSwitching(false)
  }, [setIsAgentSwitching])

  const focusChatInput = useCallback(() => {
    setTimeout(() => {
      requestAnimationFrame(() => chatInputRef?.current?.focus())
    }, 0)
  }, [chatInputRef])

  const addMessage = useCallback((message: PlaygroundChatMessage) => {
    usePlaygroundStore.setState((state) => ({
      messages: [...state.messages, message]
    }))
  }, [])

  const initializePlayground = useCallback(async () => {
    if (!selectedEndpoint) return

    const currentCompanyId = company?.id || null
    if (
      initializationRef.current.isInitializing ||
      (initializationRef.current.lastEndpoint === selectedEndpoint &&
        initializationRef.current.lastCompanyId === currentCompanyId)
    ) {
      return
    }

    initializationRef.current.isInitializing = true
    initializationRef.current.lastEndpoint = selectedEndpoint
    initializationRef.current.lastCompanyId = currentCompanyId

    setIsEndpointLoading(true)

    if (company?.id) {
      setCurrentCompanyId(company.id)
    }

    try {
      const status = await getStatus()
      setIsEndpointActive(status === 200)
    } catch {
      setIsEndpointActive(false)
      toast.error('Error checking Agno server status')
    } finally {
      setIsEndpointLoading(false)
      initializationRef.current.isInitializing = false
    }
  }, [
    selectedEndpoint,
    company?.id,
    setIsEndpointLoading,
    setCurrentCompanyId,
    getStatus,
    setIsEndpointActive
  ])

  return {
    getStatus,
    getAgents,
    refreshAgentsList,
    clearChat,
    focusChatInput,
    addMessage,
    initializePlayground,
    startAgentSwitch,
    completeAgentSwitch,
    isAgentSwitching: usePlaygroundStore((state) => state.isAgentSwitching)
  }
}

export default useChatActions
