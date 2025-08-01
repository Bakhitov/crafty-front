'use client'
import Sidebar from '@/components/playground/Sidebar/Sidebar'
import AgentInfoSidebar, {
  MessengerAgentSidebar
} from '@/components/playground/AgentInfoSidebar'
import MainContent from '@/components/playground/MainContent'
import { Suspense, useEffect, lazy } from 'react'
import { usePlaygroundStore } from '@/store'
import { useQueryState } from 'nuqs'
import { useCompanyAccess } from '@/hooks/useCompanyAccess'
import { usePlaygroundData } from '@/hooks/usePlaygroundData'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Prefetch критически важных компонентов
const prefetchComponents = () => {
  // Prefetch AgentCreator для быстрого создания агентов
  const AgentCreator = lazy(() =>
    import('@/components/playground/AgentCreator').then((module) => ({
      default: module.AgentCreator
    }))
  )

  // Prefetch MessengerProvider компоненты
  const MessengerInstanceEditor = lazy(
    () =>
      import(
        '@/components/playground/MessengerProvider/MessengerInstanceEditor'
      )
  )

  // Prefetch ToolCreator
  const ToolCreator = lazy(() => import('@/components/playground/ToolCreator'))

  return { AgentCreator, MessengerInstanceEditor, ToolCreator }
}

// Prefetch критически важных данных
const usePrefetchCriticalData = () => {
  const { user, company } = useCompanyAccess()

  useEffect(() => {
    if (!user?.id || !company?.id) return

    // Prefetch agents data в фоновом режиме
    const prefetchAgents = async () => {
      try {
        const { getCachedAgents } = await import('@/lib/requestCache')
        await getCachedAgents(company.id)
        console.log('Prefetch: Agents data preloaded')
      } catch (error) {
        console.log('Prefetch: Failed to preload agents data', error)
      }
    }

    // Prefetch health check
    const prefetchHealthCheck = async () => {
      try {
        const { getCachedHealthCheck } = await import('@/lib/requestCache')
        await getCachedHealthCheck('http://localhost:8000')
        console.log('Prefetch: Health check preloaded')
      } catch (error) {
        console.log('Prefetch: Failed to preload health check', error)
      }
    }

    // Запускаем prefetch с небольшой задержкой чтобы не блокировать основной UI
    const prefetchTimer = setTimeout(() => {
      prefetchAgents()
      prefetchHealthCheck()
    }, 100)

    return () => clearTimeout(prefetchTimer)
  }, [user?.id, company?.id])
}

function PlaygroundContent() {
  const { isLoading, isInitialized, hasAccess, user, company } =
    useCompanyAccess()

  // Используем оптимизированный хук для загрузки данных
  const playgroundData = usePlaygroundData({
    endpoint: 'http://localhost:8000',
    autoLoad: true
  })

  // Prefetch критически важных данных
  usePrefetchCriticalData()

  // Prefetch компонентов при первой загрузке
  useEffect(() => {
    prefetchComponents()
  }, [])

  const {
    isChatMode,
    activeTab,
    selectedChatId,
    isAgentCreationMode,
    isToolCreationMode,
    isMessengerInstanceEditorMode,
    isMessengerManagerMode,
    setSelectedAgent,
    setSelectedModel,
    setHasStorage
  } = usePlaygroundStore()

  const [agentId] = useQueryState('agent')

  // Логируем состояние для отладки только в development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('PlaygroundContent: State update:', {
        isLoading,
        isInitialized,
        hasAccess,
        hasUser: !!user,
        hasCompany: !!company,
        companyActive: company?.is_active,
        playgroundDataReady: playgroundData.isReady,
        playgroundDataLoading: playgroundData.isLoading
      })
    }
  }, [isLoading, isInitialized, hasAccess, user, company, playgroundData])

  // Обработка agentId из URL после загрузки данных
  useEffect(() => {
    if (playgroundData.isReady && agentId && agentId !== 'new') {
      const currentAgents = usePlaygroundStore.getState().agents
      const selectedAgent = currentAgents.find(
        (agent) => agent.value === agentId
      )
      if (selectedAgent) {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            'PlaygroundContent: Setting agent from URL:',
            selectedAgent.label
          )
        }
        setSelectedAgent(selectedAgent)
        setSelectedModel(selectedAgent.model.provider)
        setHasStorage(selectedAgent.storage || false)
      }
    }
  }, [
    playgroundData.isReady,
    agentId,
    setSelectedAgent,
    setSelectedModel,
    setHasStorage
  ])

  // Показываем загрузку только пока данные действительно загружаются
  if (isLoading) {
    return <LoadingSpinner message="Загрузка данных..." size="lg" />
  }

  // Если система не инициализирована, показываем инициализацию
  if (!isInitialized) {
    return <LoadingSpinner message="Инициализация..." size="lg" />
  }

  // Если пользователь не загружен, показываем загрузку
  if (!user) {
    return <LoadingSpinner message="Загрузка пользователя..." size="lg" />
  }

  // Если компания еще загружается, ждем
  if (!company && isLoading) {
    return <LoadingSpinner message="Загрузка компании..." size="lg" />
  }

  // Дополнительная проверка доступа - если компания загружена, но неактивна
  if (company && !company.is_active) {
    window.location.href = '/access-denied'
    return <LoadingSpinner message="Перенаправление..." size="lg" />
  }

  // Показываем загрузку данных playground
  if (playgroundData.isLoading) {
    return <LoadingSpinner message="Загрузка агентов..." size="lg" />
  }

  const shouldShowMessengerSidebar =
    (isChatMode || activeTab === 'chats') && selectedChatId

  // AgentInfoSidebar показывается только когда:
  // - Активен таб agents
  // - НЕ в режиме создания/редактирования агента
  // - НЕ в других режимах редактирования
  // - Выбран агент (agentId существует и не 'new')
  const shouldShowAgentSidebar =
    activeTab === 'agents' &&
    !isAgentCreationMode &&
    !isToolCreationMode &&
    !isMessengerInstanceEditorMode &&
    !isMessengerManagerMode &&
    agentId &&
    agentId !== 'new'

  return (
    <div className="bg-background/80 flex h-screen">
      <Sidebar />
      <MainContent />

      {shouldShowAgentSidebar && <AgentInfoSidebar />}
      {shouldShowMessengerSidebar && <MessengerAgentSidebar />}

      {/* Показываем тонкий индикатор загрузки данных playground в углу, если они загружаются */}
      {playgroundData.isLoading && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-background border-border flex items-center space-x-2 rounded-lg border px-3 py-2 shadow-lg">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-muted-foreground text-sm">Обновление...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Загрузка..." size="lg" />}>
      <PlaygroundContent />
    </Suspense>
  )
}
