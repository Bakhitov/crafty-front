'use client'

import { usePlaygroundStore } from '@/store'
import { ChatArea, MessengerChatArea } from '@/components/playground/ChatArea'
import AgentCreator from '@/components/playground/AgentCreator'
import ToolCreator from '@/components/playground/ToolCreator'
import MessengerInstanceEditor from '@/components/playground/MessengerProvider/MessengerInstanceEditor'
import MessengerInstanceManager from '@/components/playground/MessengerProvider/MessengerInstanceManager'
import {
  AgentSelectBlankState,
  ChatSelectBlankState,
  ChatCreateBlankState,
  InstanceSelectBlankState,
  InstanceCreateBlankState,
  ToolBlankState
} from './Sidebar/BlankStates'
import { useQueryState } from 'nuqs'

const MainContent = () => {
  const {
    // Mode states
    isAgentCreationMode,
    isToolCreationMode,
    isMessengerInstanceEditorMode,
    setIsMessengerInstanceEditorMode,
    isChatMode,
    activeTab,
    isMessengerManagerMode,

    // Data states
    agents,
    messengerInstances,
    selectedChatId,
    selectedInstanceId,
    editingMessengerInstance,
    setEditingMessengerInstance,
    setIsMessengerManagerMode,
    toolsCache
  } = usePlaygroundStore()

  const [agentId] = useQueryState('agent')

  const handleCloseMessengerEditor = () => {
    setIsMessengerInstanceEditorMode(false)
    setEditingMessengerInstance(null)
    setIsMessengerManagerMode(false)
  }

  const handleCreateInstance = () => {
    setEditingMessengerInstance(null)
    setIsMessengerInstanceEditorMode(true)
  }

  const handleCreateTool = () => {
    const { setIsToolCreationMode } = usePlaygroundStore.getState()
    setIsToolCreationMode(true)
  }

  // Agent creation mode
  if (isAgentCreationMode) {
    return <AgentCreator />
  }

  // Tool creation mode
  if (isToolCreationMode) {
    return <ToolCreator />
  }

  // Messenger instance editing mode
  if (isMessengerInstanceEditorMode) {
    return (
      <MessengerInstanceEditor
        editingInstance={editingMessengerInstance}
        onClose={handleCloseMessengerEditor}
      />
    )
  }

  // Messenger manager mode (only when explicitly activated)
  if (isMessengerManagerMode) {
    return (
      <MessengerInstanceManager
        onEditInstance={(instance) => {
          setEditingMessengerInstance(instance)
          setIsMessengerInstanceEditorMode(true)
        }}
      />
    )
  }

  // Messenger chat mode
  if (isChatMode && selectedChatId && selectedInstanceId) {
    return (
      <MessengerChatArea
        chatId={selectedChatId}
        instanceId={selectedInstanceId}
      />
    )
  }

  // Blank states by tabs depending on state
  switch (activeTab) {
    case 'agents':
      if (agents.length === 0) {
        return <AgentSelectBlankState />
      }
      // If there are agents but no agentId is selected, try to select the first one
      if (!agentId && agents.length > 0) {
        return <AgentSelectBlankState />
      }
      // Regular playground mode with agent
      return <ChatArea />

    case 'tools':
      // Get all tools from cache
      const allTools = [
        ...toolsCache.dynamicTools,
        ...toolsCache.customTools,
        ...toolsCache.mcpServers
      ]

      if (allTools.length === 0) {
        return <ToolBlankState onCreateTool={handleCreateTool} />
      }
      // Show tools selection blank state by default
      return <ToolBlankState onCreateTool={handleCreateTool} />

    case 'chats':
      if (messengerInstances.length === 0) {
        return <ChatCreateBlankState onCreateInstance={handleCreateInstance} />
      }
      if (!selectedChatId) {
        return <ChatSelectBlankState />
      }
      return (
        <MessengerChatArea
          chatId={selectedChatId}
          instanceId={selectedInstanceId}
        />
      )

    case 'instances':
      if (messengerInstances.length === 0) {
        return (
          <InstanceCreateBlankState onCreateInstance={handleCreateInstance} />
        )
      }
      return <InstanceSelectBlankState />

    default:
      // By default show agents
      if (agents.length === 0) {
        return <AgentSelectBlankState />
      }
      // If there are agents, show the chat area (it will handle agent selection internally)
      return <ChatArea />
  }
}

export default MainContent
