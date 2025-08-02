'use client'
import { usePlaygroundStore } from '@/store'
import { ChatArea, MessengerChatArea } from '@/components/playground/ChatArea'
import { Suspense, lazy } from 'react'
import { useQueryState } from 'nuqs'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { motion } from 'framer-motion'
import Icon from '@/components/ui/icon'
import { Button } from '@/components/ui/button'

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
        <LoadingSpinner />
      </div>
    }
  >
    {children}
  </Suspense>
)

// Компонент заглушек для табов
const TabBlankState = ({
  icon,
  title,
  description,
  actionButton
}: {
  icon: string
  title: string
  description: string
  actionButton?: {
    text: string
    onClick: () => void
  }
}) => (
  <div className="bg-background-primary relative m-1.5 flex flex-grow flex-col items-center justify-center rounded-xl">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex max-w-md flex-col items-center justify-center text-center"
    >
      <Icon
        type={icon as 'agent' | 'hammer' | 'message-circle'}
        size="lg"
        className="text-muted-foreground mb-6 !size-16"
      />
      <h2 className="text-primary mb-4 text-3xl font-medium tracking-tight">
        {title}
      </h2>
      <p className="text-muted-foreground font-geist mb-8 text-xs leading-relaxed">
        {description}
      </p>
      {actionButton && (
        <Button
          onClick={actionButton.onClick}
          size="lg"
          variant="outline"
          className="border-primary/20 text-primary hover:bg-primary/10 font-dmmono h-10 w-52 rounded-xl border-dashed text-xs font-medium"
        >
          <Icon type="plus-icon" size="xs" className="text-primary mr-2" />
          <span className="uppercase">{actionButton.text}</span>
        </Button>
      )}
    </motion.div>
  </div>
)

// Заглушки для каждого таба
const AgentsTabBlankState = () => {
  const { setIsAgentCreationMode } = usePlaygroundStore()

  return (
    <TabBlankState
      icon="agent"
      title="Create or select an agent"
      description="Create your first agent or select an existing one from the list to start chatting and configure task automation."
      actionButton={{
        text: 'Create Agent',
        onClick: () => setIsAgentCreationMode(true)
      }}
    />
  )
}

const ToolsTabBlankState = () => {
  const { setIsToolCreationMode } = usePlaygroundStore()

  return (
    <TabBlankState
      icon="hammer"
      title="Create or add a tool"
      description="Create custom tools or add existing tools to your agent to expand its capabilities and perform specialized tasks."
      actionButton={{
        text: 'Create Tool',
        onClick: () => setIsToolCreationMode(true)
      }}
    />
  )
}

const ConnectionsTabBlankState = () => {
  const { setIsMessengerManagerMode } = usePlaygroundStore()

  return (
    <TabBlankState
      icon="message-circle"
      title="Create messenger connection"
      description="Create a connection to WhatsApp, Telegram or other messengers so agents can communicate with users through various communication channels."
      actionButton={{
        text: 'Create Connection',
        onClick: () => setIsMessengerManagerMode(true)
      }}
    />
  )
}

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
    setIsMessengerManagerMode,
    activeTab
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

  if (isMessengerInstanceEditorMode) {
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

  // Показываем заглушки в зависимости от активного таба
  if (!agentId) {
    switch (activeTab) {
      case 'agents':
        return <AgentsTabBlankState />
      case 'tools':
        return <ToolsTabBlankState />
      case 'chats':
        return <ConnectionsTabBlankState />
      default:
        return <AgentsTabBlankState />
    }
  }

  // Обычный режим чата (когда выбран агент)
  return <ChatArea />
}
