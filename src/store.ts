import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import {
  type PlaygroundChatMessage,
  type SessionEntry
} from '@/types/playground'
import { MessengerInstanceUnion } from '@/types/messenger'

interface Agent {
  value: string
  label: string
  model: {
    provider: string
  }
  storage?: boolean
  storage_config?: {
    enabled?: boolean
  }
}

// Типы инструментов для кеширования
interface DynamicTool {
  id: number
  tool_id: string
  name: string
  display_name?: string
  agno_class: string
  module_path?: string
  config?: Record<string, unknown>
  description?: string
  category?: string
  icon?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CustomTool {
  id: number
  tool_id: string
  name: string
  description?: string
  source_code: string
  config: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

interface McpServer {
  id: number
  server_id: string
  name: string
  description?: string
  command?: string | null
  url?: string | null
  transport: string
  env_config?: Record<string, unknown> | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ToolsCache {
  dynamicTools: DynamicTool[]
  customTools: CustomTool[]
  mcpServers: McpServer[]
  lastFetchTime: number | null
  isLoading: boolean
}

export interface PlaygroundStore {
  hydrated: boolean
  setHydrated: () => void
  streamingErrorMessage: string
  setStreamingErrorMessage: (streamingErrorMessage: string) => void
  endpoints: { endpoint: string; id_playground_endpoint: string }[]
  setEndpoints: (
    endpoints: { endpoint: string; id_playground_endpoint: string }[]
  ) => void
  isStreaming: boolean
  setIsStreaming: (isStreaming: boolean) => void
  isEndpointActive: boolean
  setIsEndpointActive: (isActive: boolean) => void
  isEndpointLoading: boolean
  setIsEndpointLoading: (isLoading: boolean) => void
  messages: PlaygroundChatMessage[]
  setMessages: (
    messages:
      | PlaygroundChatMessage[]
      | ((prevMessages: PlaygroundChatMessage[]) => PlaygroundChatMessage[])
  ) => void
  hasStorage: boolean
  setHasStorage: (hasStorage: boolean) => void
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>
  selectedEndpoint: string
  setSelectedEndpoint: (selectedEndpoint: string) => void
  agents: Agent[]
  setAgents: (agents: Agent[]) => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  sessionsData: SessionEntry[] | null
  setSessionsData: (
    sessionsData:
      | SessionEntry[]
      | ((prevSessions: SessionEntry[] | null) => SessionEntry[] | null)
  ) => void
  isSessionsLoading: boolean
  setIsSessionsLoading: (isSessionsLoading: boolean) => void
  selectedAgent: Agent | null
  setSelectedAgent: (agent: Agent | null) => void
  isAgentCreationMode: boolean
  setIsAgentCreationMode: (isAgentCreationMode: boolean) => void
  editingAgentId: string | null
  setEditingAgentId: (agentId: string | null) => void
  // Messenger instance editor state
  isMessengerInstanceEditorMode: boolean
  setIsMessengerInstanceEditorMode: (isEditorMode: boolean) => void
  editingMessengerInstance: MessengerInstanceUnion | null
  setEditingMessengerInstance: (instance: MessengerInstanceUnion | null) => void
  // Messenger manager state
  isMessengerManagerMode: boolean
  setIsMessengerManagerMode: (isManagerMode: boolean) => void
  // Messenger instances
  messengerInstances: MessengerInstanceUnion[]
  setMessengerInstances: (instances: MessengerInstanceUnion[]) => void
  // Selected chat state
  selectedChatId: string | null
  setSelectedChatId: (chatId: string | null) => void
  selectedInstanceId: string | null
  setSelectedInstanceId: (instanceId: string | null) => void
  // Chat mode state
  isChatMode: boolean
  setIsChatMode: (isChatMode: boolean) => void
  // Tool creation mode state
  isToolCreationMode: boolean
  setIsToolCreationMode: (isToolCreationMode: boolean) => void
  // Navigation modes
  activeTab: 'agents' | 'tools' | 'chats' | 'instances'
  setActiveTab: (tab: 'agents' | 'tools' | 'chats' | 'instances') => void
  // Кеширование инструментов
  toolsCache: {
    dynamicTools: DynamicTool[]
    customTools: CustomTool[]
    mcpServers: McpServer[]
    lastFetchTime: number | null
    isLoading: boolean
  }
  setToolsCache: (cache: {
    dynamicTools: DynamicTool[]
    customTools: CustomTool[]
    mcpServers: McpServer[]
    lastFetchTime: number
  }) => void
  setToolsLoading: (isLoading: boolean) => void
  clearToolsCache: () => void
}

export const usePlaygroundStore = create<PlaygroundStore>()(
  persist(
    (set) => ({
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      streamingErrorMessage: '',
      setStreamingErrorMessage: (streamingErrorMessage) =>
        set(() => ({ streamingErrorMessage })),
      endpoints: [],
      setEndpoints: (endpoints) => set(() => ({ endpoints })),
      isStreaming: false,
      setIsStreaming: (isStreaming) => set(() => ({ isStreaming })),
      isEndpointActive: false,
      setIsEndpointActive: (isActive) =>
        set(() => ({ isEndpointActive: isActive })),
      isEndpointLoading: true,
      setIsEndpointLoading: (isLoading) =>
        set(() => ({ isEndpointLoading: isLoading })),
      messages: [],
      setMessages: (messages) =>
        set((state) => ({
          messages:
            typeof messages === 'function' ? messages(state.messages) : messages
        })),
      hasStorage: false,
      setHasStorage: (hasStorage) => set(() => ({ hasStorage })),
      chatInputRef: { current: null },
      selectedEndpoint: 'https://crafty-v0-0-1.onrender.com',
      setSelectedEndpoint: (selectedEndpoint) =>
        set(() => ({ selectedEndpoint })),
      agents: [],
      setAgents: (agents) => set({ agents }),
      selectedModel: '',
      setSelectedModel: (selectedModel) => set(() => ({ selectedModel })),
      sessionsData: null,
      setSessionsData: (sessionsData) =>
        set((state) => ({
          sessionsData:
            typeof sessionsData === 'function'
              ? sessionsData(state.sessionsData)
              : sessionsData
        })),
      isSessionsLoading: false,
      setIsSessionsLoading: (isSessionsLoading) =>
        set(() => ({ isSessionsLoading })),
      selectedAgent: null,
      setSelectedAgent: (agent) => set({ selectedAgent: agent }),
      isAgentCreationMode: false,
      setIsAgentCreationMode: (isAgentCreationMode) =>
        set({ isAgentCreationMode }),
      editingAgentId: null,
      setEditingAgentId: (agentId) => set({ editingAgentId: agentId }),
      // Messenger instance editor state
      isMessengerInstanceEditorMode: false,
      setIsMessengerInstanceEditorMode: (isEditorMode) =>
        set({ isMessengerInstanceEditorMode: isEditorMode }),
      editingMessengerInstance: null,
      setEditingMessengerInstance: (instance) =>
        set({ editingMessengerInstance: instance }),
      // Messenger manager state
      isMessengerManagerMode: false,
      setIsMessengerManagerMode: (isManagerMode) =>
        set({ isMessengerManagerMode: isManagerMode }),
      // Messenger instances
      messengerInstances: [],
      setMessengerInstances: (instances) =>
        set({ messengerInstances: instances }),
      // Selected chat state
      selectedChatId: null,
      setSelectedChatId: (chatId) => set({ selectedChatId: chatId }),
      selectedInstanceId: null,
      setSelectedInstanceId: (instanceId) =>
        set({ selectedInstanceId: instanceId }),
      // Chat mode state
      isChatMode: false,
      setIsChatMode: (isChatMode) => set({ isChatMode }),
      // Tool creation mode state
      isToolCreationMode: false,
      setIsToolCreationMode: (isToolCreationMode) =>
        set({ isToolCreationMode }),
      // Navigation modes
      activeTab: 'agents',
      setActiveTab: (tab) => set({ activeTab: tab }),
      // Кеширование инструментов
      toolsCache: {
        dynamicTools: [],
        customTools: [],
        mcpServers: [],
        lastFetchTime: null,
        isLoading: false
      },
      setToolsCache: (cache) =>
        set((state) => ({
          toolsCache: {
            ...state.toolsCache,
            ...cache,
            isLoading: false
          }
        })),
      setToolsLoading: (isLoading) =>
        set((state) => ({
          toolsCache: {
            ...state.toolsCache,
            isLoading
          }
        })),
      clearToolsCache: () =>
        set((state) => ({
          toolsCache: {
            ...state.toolsCache,
            dynamicTools: [],
            customTools: [],
            mcpServers: [],
            lastFetchTime: null
          }
        }))
    }),
    {
      name: 'endpoint-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedEndpoint: state.selectedEndpoint
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated?.()
      }
    }
  )
)
