'use client'
import { usePlaygroundStore } from '@/store'
import { ChatArea, MessengerChatArea } from '@/components/playground/ChatArea'
import { Suspense, lazy } from 'react'
import { useQueryState } from 'nuqs'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Lazy loading для тяжелых компонентов
const AgentCreator = lazy(() =>
  import('@/components/playground/AgentCreator').then((module) => ({
    default: module.AgentCreator
  }))
)
const ToolCreator = lazy(() => import('@/components/playground/ToolCreator'))
const MessengerInstanceEditor = lazy(
  () =>
    import('@/components/playground/MessengerProvider/MessengerInstanceEditor')
)
const MessengerInstanceManager = lazy(
  () =>
    import('@/components/playground/MessengerProvider/MessengerInstanceManager')
)

// Компонент загрузки для lazy components
const LazyComponentLoader = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner message="Загрузка компонента..." size="lg" />
      </div>
    }
  >
    {children}
  </Suspense>
)

export default function MainContent() {
  const {
    isChatMode,
    isAgentCreationMode,
    isToolCreationMode,
    isMessengerInstanceEditorMode,
    isMessengerManagerMode,
    editingMessengerInstance,
    selectedChatId,
    selectedInstanceId,
    setEditingMessengerInstance,
    setIsMessengerInstanceEditorMode,
    setIsMessengerManagerMode
  } = usePlaygroundStore()

  const [agentId] = useQueryState('agent')

  // Определяем, какой компонент показать
  if (isAgentCreationMode || agentId === 'new') {
    return (
      <LazyComponentLoader>
        <AgentCreator />
      </LazyComponentLoader>
    )
  }

  if (isToolCreationMode) {
    return (
      <LazyComponentLoader>
        <ToolCreator />
      </LazyComponentLoader>
    )
  }

  if (isMessengerInstanceEditorMode && editingMessengerInstance) {
    return (
      <LazyComponentLoader>
        <MessengerInstanceEditor
          editingInstance={editingMessengerInstance}
          onClose={() => {
            usePlaygroundStore
              .getState()
              .setIsMessengerInstanceEditorMode(false)
            usePlaygroundStore.getState().setEditingMessengerInstance(null)
          }}
        />
      </LazyComponentLoader>
    )
  }

  if (isMessengerManagerMode) {
    return (
      <LazyComponentLoader>
        <MessengerInstanceManager
          onEditInstance={(instance) => {
            setEditingMessengerInstance(instance)
            setIsMessengerInstanceEditorMode(true)
          }}
          onClose={() => setIsMessengerManagerMode(false)}
        />
      </LazyComponentLoader>
    )
  }

  // Основной контент чата
  if (isChatMode) {
    return (
      <MessengerChatArea
        chatId={selectedChatId}
        instanceId={selectedInstanceId}
      />
    )
  }

  // Обычный режим чата (по умолчанию)
  return <ChatArea />
}
