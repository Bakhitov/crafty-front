'use client'
import Sidebar from '@/components/playground/Sidebar/Sidebar'
import AgentInfoSidebar, {
  MessengerAgentSidebar
} from '@/components/playground/AgentInfoSidebar'
import MainContent from '@/components/playground/MainContent'
import { Suspense } from 'react'
import { usePlaygroundStore } from '@/store'
import { useQueryState } from 'nuqs'

function PlaygroundContent() {
  const {
    isChatMode,
    activeTab,
    selectedChatId,
    isAgentCreationMode,
    isToolCreationMode,
    isMessengerInstanceEditorMode,
    isMessengerManagerMode
  } = usePlaygroundStore()

  const [agentId] = useQueryState('agent')

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
      {shouldShowMessengerSidebar && <MessengerAgentSidebar />}
      {shouldShowAgentSidebar && <AgentInfoSidebar />}
    </div>
  )
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlaygroundContent />
    </Suspense>
  )
}
