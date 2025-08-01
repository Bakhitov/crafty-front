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
    // setSelectedModel, // используется напрямую из store в других компонентах
    // setSelectedAgent, // используется напрямую из store в других компонентах
    // setHasStorage, // используется напрямую из store в других компонентах
    setCurrentCompanyId,
    selectedEndpoint,
    chatInputRef,
    setMessages,
    isAgentSwitching,
    setIsAgentSwitching
  } = usePlaygroundStore()
  const { company } = useCompany()
  const { agents: supabaseAgents, refreshAgents } = useAgents()

  // Используем ref для предотвращения повторных инициализаций
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
      // Используем кешированный health check
      return await getCachedHealthCheck(selectedEndpoint)
    } catch {
      return 503
    }
  }, [selectedEndpoint])

  const getAgents = useCallback(async (): Promise<ComboboxAgent[]> => {
    try {
      // Используем агентов из Supabase
      return transformAPIAgentsToCombobox(supabaseAgents)
    } catch (err) {
      console.error('Error transforming agents:', err)
      toast.error('Ошибка обработки агентов')
      return []
    }
  }, [supabaseAgents])

  const refreshAgentsList = useCallback(async () => {
    try {
      console.log('useChatActions: Starting agents list refresh...')

      // Force refresh agents from Supabase with cache invalidation
      const freshAgents = await refreshAgents()
      console.log('useChatActions: Got fresh agents:', freshAgents?.length || 0)

      // Trансформируем свежие данные, полученные из refreshAgents
      const agents = transformAPIAgentsToCombobox(freshAgents || [])
      console.log('useChatActions: Transformed agents:', agents.length)

      // Update the store
      setAgents(agents)

      console.log('useChatActions: Successfully refreshed agents list')
      return agents
    } catch (error) {
      console.error('Error refreshing agents list:', error)
      toast.error('Failed to refresh agents list')
      return []
    }
  }, [refreshAgents, setAgents])

  const clearChat = useCallback(() => {
    console.log('🧹 useChatActions: Clearing chat messages')

    // Единая синхронная очистка через setState
    usePlaygroundStore.setState({
      messages: [],
      isSessionLoading: false
    })

    console.log('✅ useChatActions: Chat cleared successfully')
  }, [])

  const startAgentSwitch = useCallback(() => {
    console.log('🔄 useChatActions: Starting agent switch')
    setIsAgentSwitching(true)

    // Принудительная синхронная очистка чата и состояния
    console.log('🧹 useChatActions: Force clearing chat for agent switch')

    // Используем только синхронную очистку через setState для гарантии
    usePlaygroundStore.setState({
      messages: [],
      isSessionLoading: false
    })

    console.log('✅ useChatActions: Chat cleared for agent switch')
  }, [setIsAgentSwitching])

  const completeAgentSwitch = useCallback(() => {
    console.log('✅ useChatActions: Completing agent switch')
    setIsAgentSwitching(false)
  }, [setIsAgentSwitching])

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
    console.log('useChatActions: Starting initializePlayground')

    // Проверяем, что endpoint установлен
    if (!selectedEndpoint) {
      console.log(
        'useChatActions: No endpoint selected, skipping initialization'
      )
      return
    }

    // Предотвращаем повторную инициализацию если уже идет процесс
    // или если endpoint и company не изменились
    const currentCompanyId = company?.id || null
    if (
      initializationRef.current.isInitializing ||
      (initializationRef.current.lastEndpoint === selectedEndpoint &&
        initializationRef.current.lastCompanyId === currentCompanyId)
    ) {
      console.log(
        'useChatActions: Initialization already in progress or no changes detected, skipping'
      )
      return
    }

    initializationRef.current.isInitializing = true
    initializationRef.current.lastEndpoint = selectedEndpoint
    initializationRef.current.lastCompanyId = currentCompanyId

    setIsEndpointLoading(true)

    // Устанавливаем company_id в стор если компания загружена
    if (company?.id) {
      setCurrentCompanyId(company.id)
    }

    try {
      // Проверяем статус Agno сервера (для чата)
      console.log('useChatActions: Checking Agno endpoint status...')
      const status = await getStatus()

      if (status === 200) {
        console.log('useChatActions: Agno endpoint is active')
        setIsEndpointActive(true)
      } else {
        console.log(
          'useChatActions: Agno endpoint is not active, status:',
          status
        )
        setIsEndpointActive(false)
      }
    } catch (error) {
      console.error('useChatActions: Error during initialization:', error)
      setIsEndpointActive(false)
      toast.error('Ошибка проверки статуса Agno сервера')
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
    isAgentSwitching
  }
}

export default useChatActions
