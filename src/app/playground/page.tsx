'use client'
import Sidebar from '@/components/playground/Sidebar/Sidebar'
import AgentInfoSidebar from '@/components/playground/AgentInfoSidebar'
import { ChatArea } from '@/components/playground/ChatArea'
import AgentCreator from '@/components/playground/AgentCreator'
import MessengerInstanceEditor from '@/components/playground/MessengerProvider/MessengerInstanceEditor'
import MessengerManager from '@/components/playground/MessengerManager'
import { Suspense, useEffect } from 'react'
import { usePlaygroundStore } from '@/store'
import { useQueryState } from 'nuqs'

function PlaygroundContent() {
  const {
    isAgentCreationMode,
    setIsAgentCreationMode,
    isMessengerInstanceEditorMode,
    setIsMessengerInstanceEditorMode,
    editingMessengerInstance,
    setEditingMessengerInstance,
    isMessengerManagerMode,
    setIsMessengerManagerMode,
    editingMessengerInstanceId,
    setEditingMessengerInstanceId
  } = usePlaygroundStore()
  const [agentId] = useQueryState('agent')

  // Устанавливаем режим создания агента при agent=new
  useEffect(() => {
    if (agentId === 'new' && !isAgentCreationMode) {
      setIsAgentCreationMode(true)
    } else if (agentId !== 'new' && isAgentCreationMode) {
      setIsAgentCreationMode(false)
    }
  }, [agentId, isAgentCreationMode, setIsAgentCreationMode])

  const handleCloseMessengerEditor = () => {
    setIsMessengerInstanceEditorMode(false)
    setEditingMessengerInstance(null)
  }

  const handleCloseMessengerManager = () => {
    setIsMessengerManagerMode(false)
    setEditingMessengerInstanceId(null)
  }

  return (
    <div className="bg-background/80 flex h-screen">
      <Sidebar />
      {isAgentCreationMode ? (
        <AgentCreator />
      ) : isMessengerManagerMode ? (
        <MessengerManager
          isOpen={isMessengerManagerMode}
          onClose={handleCloseMessengerManager}
          editingInstanceId={editingMessengerInstanceId}
        />
      ) : isMessengerInstanceEditorMode ? (
        <MessengerInstanceEditor
          editingInstance={editingMessengerInstance}
          onClose={handleCloseMessengerEditor}
        />
      ) : (
        <>
          <ChatArea />
          <AgentInfoSidebar />
        </>
      )}
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
