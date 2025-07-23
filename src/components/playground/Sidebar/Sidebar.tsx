'use client'
import { Button } from '@/components/ui/button'
import useChatActions from '@/hooks/useChatActions'
import { usePlaygroundStore } from '@/store'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import Icon from '@/components/ui/icon'
import { isValidUrl, truncateText } from '@/lib/utils'
import { toast } from 'sonner'
import { useQueryState } from 'nuqs'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/components/AuthProvider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import AgentsList from './AgentsList'
import ToolsList from './ToolsList'
import ChatsList from './ChatsList'
import { MessengerProviderList } from '@/components/playground/MessengerProvider'
import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon } from 'lucide-react'
import { messengerAPI } from '@/lib/messengerApi'
import { MessengerInstanceUnion } from '@/types/messenger'

const ENDPOINT_PLACEHOLDER = 'NO ENDPOINT ADDED'

const UserProfile = () => {
  const router = useRouter()
  const { user } = useAuthContext()
  const { theme, toggleTheme } = useTheme()
  const {
    setMessages,
    setSessionsData,
    setAgents,
    setHasStorage,
    setSelectedModel
  } = usePlaygroundStore()

  const handleLogout = async () => {
    try {
      // Очищаем весь стейт плейграунда перед выходом
      setMessages([])
      setSessionsData(() => null)
      setAgents([])
      setHasStorage(false)
      setSelectedModel('')

      // Выходим из Supabase Auth
      await supabase.auth.signOut()

      // Очищаем все локальные данные браузера связанные с сессией
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }

      toast.success('Вы успешно вышли из системы')

      // Очищаем URL от query параметров и перенаправляем
      router.replace('/auth')
    } catch {
      toast.error('Ошибка при выходе из системы')
    }
  }

  const getInitials = (email: string | undefined) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  return (
    <div className="border-primary/20 bg-background-secondary flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center space-x-3">
        <div className="bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
          {getInitials(user?.email)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-primary truncate text-sm font-medium">
            {user?.user_metadata?.full_name || 'User'}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {user?.email}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-primary h-8 w-8 p-0"
          title={
            theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
          }
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-primary h-8 w-8 p-0"
          title="Logout"
        >
          <Icon type="log-out" size="xs" />
        </Button>
      </div>
    </div>
  )
}

const SidebarHeader = () => {
  return (
    <div className="flex items-center justify-center">
      <h1 className="text-primary text-lg font-bold">CRAFTY</h1>
    </div>
  )
}

const Endpoint = () => {
  const {
    selectedEndpoint,
    isEndpointActive,
    setSelectedEndpoint,
    setAgents,
    setSessionsData,
    setMessages
  } = usePlaygroundStore()
  const { initializePlayground } = useChatActions()
  const [isEditing, setIsEditing] = useState(false)
  const [endpointValue, setEndpointValue] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [, setAgentId] = useQueryState('agent')
  const [, setSessionId] = useQueryState('session')

  useEffect(() => {
    setEndpointValue(selectedEndpoint)
    setIsMounted(true)
  }, [selectedEndpoint])

  const getStatusColor = (isActive: boolean) =>
    isActive ? 'bg-positive' : 'bg-destructive'

  const handleSave = async () => {
    if (!isValidUrl(endpointValue)) {
      toast.error('Please enter a valid URL')
      return
    }
    const cleanEndpoint = endpointValue.replace(/\/$/, '').trim()
    setSelectedEndpoint(cleanEndpoint)
    setAgentId(null)
    setSessionId(null)
    setIsEditing(false)
    setIsHovering(false)
    setAgents([])
    setSessionsData([])
    setMessages([])
  }

  const handleCancel = () => {
    setEndpointValue(selectedEndpoint)
    setIsEditing(false)
    setIsHovering(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleRefresh = async () => {
    setIsRotating(true)
    await initializePlayground()
    setTimeout(() => setIsRotating(false), 500)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="text-primary text-xs font-medium uppercase">Server</div>
      {isEditing ? (
        <div className="flex w-full items-center gap-1">
          <input
            type="text"
            value={endpointValue}
            onChange={(e) => setEndpointValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-primary/15 bg-accent text-muted flex h-9 w-full items-center text-ellipsis rounded-xl border p-3 text-xs font-medium"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className="hover:cursor-pointer hover:bg-transparent"
          >
            <Icon type="save" size="xs" />
          </Button>
        </div>
      ) : (
        <div className="flex w-full items-center gap-1">
          <motion.div
            className="border-primary/15 bg-accent relative flex h-9 w-full cursor-pointer items-center justify-between rounded-xl border p-3 uppercase"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => setIsEditing(true)}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <AnimatePresence mode="wait">
              {isHovering ? (
                <motion.div
                  key="endpoint-display-hover"
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-primary flex items-center gap-2 whitespace-nowrap text-xs font-medium">
                    <Icon type="edit" size="xxs" /> EDIT ENDPOINT
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="endpoint-display"
                  className="absolute inset-0 flex items-center justify-between px-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-muted text-xs font-medium">
                    {isMounted
                      ? truncateText(selectedEndpoint, 21) ||
                        ENDPOINT_PLACEHOLDER
                      : 'https://crafty-v0-0-1.onrender.com'}
                  </p>
                  <div
                    className={`size-2 shrink-0 rounded-full ${getStatusColor(isEndpointActive)}`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="hover:cursor-pointer hover:bg-transparent"
          >
            <motion.div
              key={isRotating ? 'rotating' : 'idle'}
              animate={{ rotate: isRotating ? 360 : 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <Icon type="refresh" size="xs" />
            </motion.div>
          </Button>
        </div>
      )}
    </div>
  )
}

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { initializePlayground } = useChatActions()
  const {
    selectedEndpoint,
    isEndpointActive,
    hydrated,
    setMessengerInstances,
    activeTab,
    setActiveTab
  } = usePlaygroundStore()
  const [isMounted, setIsMounted] = useState(false)
  const [, setAgentId] = useQueryState('agent')
  const [, setSessionId] = useQueryState('session')

  // Загрузка messenger instances
  const loadMessengerInstances = useCallback(async () => {
    try {
      console.log('Sidebar: Loading messenger instances...')
      const response = await messengerAPI.getInstances()
      console.log(
        'Sidebar: Messenger instances loaded:',
        response.instances.length,
        response.instances
      )
      // Преобразуем RealInstanceResponse в MessengerInstanceUnion (id -> instance_id)
      const convertedInstances = response.instances.map((instance) => {
        const { id, ...instanceWithoutId } = instance
        return {
          ...instanceWithoutId,
          instance_id: id
        } as MessengerInstanceUnion
      })
      setMessengerInstances(convertedInstances)
    } catch (error) {
      console.error('Error loading messenger instances:', error)
      setMessengerInstances([])
    }
  }, [setMessengerInstances])

  // Функция сброса всех состояний
  const resetAllStates = useCallback(() => {
    const {
      setIsAgentCreationMode,
      setIsToolCreationMode,
      setIsChatMode,
      setIsMessengerInstanceEditorMode,
      setIsMessengerManagerMode,
      setEditingMessengerInstance,
      setSelectedChatId,
      setSelectedInstanceId,
      setEditingAgentId
    } = usePlaygroundStore.getState()

    // Сбрасываем все режимы
    setIsAgentCreationMode(false)
    setIsToolCreationMode(false)
    setIsChatMode(false)
    setIsMessengerInstanceEditorMode(false)
    setIsMessengerManagerMode(false)

    // Сбрасываем все выборы
    setEditingMessengerInstance(null)
    setSelectedChatId(null)
    setSelectedInstanceId(null)
    setEditingAgentId(null)

    // Сбрасываем URL параметры
    setAgentId(null)
    setSessionId(null)
  }, [setAgentId, setSessionId])

  // Обработчик изменения табов
  const handleTabChange = useCallback(
    (value: string) => {
      // Сначала сбрасываем все состояния
      resetAllStates()

      // Затем устанавливаем новый активный таб
      switch (value) {
        case 'agents':
          setActiveTab('agents')
          break
        case 'tools':
          setActiveTab('tools')
          break
        case 'connections':
          setActiveTab('chats')
          break
        case 'messengers':
          setActiveTab('instances')
          break
        case 'workflows':
          toast.info('Workflows пока не реализованы')
          break
        default:
          setActiveTab('agents')
          break
      }
    },
    [setActiveTab, resetAllStates]
  )

  useEffect(() => {
    setIsMounted(true)
    if (hydrated) {
      initializePlayground()
      loadMessengerInstances()
    }
  }, [selectedEndpoint, initializePlayground, hydrated, loadMessengerInstances])

  return (
    <motion.aside
      className="font-dmmono relative flex h-screen shrink-0 grow-0 flex-col overflow-hidden px-2 py-3"
      initial={{ width: '19rem' }}
      animate={{ width: isCollapsed ? '2.5rem' : '19rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-2 top-4 z-10 p-1"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        type="button"
        whileTap={{ scale: 0.95 }}
      >
        <Icon
          type="sheet"
          size="xs"
          className={`text-primary transform ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}
        />
      </motion.button>
      <motion.div
        className="flex h-full w-72 flex-col"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -20 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          pointerEvents: isCollapsed ? 'none' : 'auto'
        }}
      >
        <div className="space-y-5">
          <SidebarHeader />
          {isMounted && <Endpoint />}
        </div>

        {isMounted && isEndpointActive && (
          <div className="mt-5 flex min-h-0 flex-1 flex-col">
            <Tabs
              value={(() => {
                switch (activeTab) {
                  case 'agents':
                    return 'agents'
                  case 'tools':
                    return 'tools'
                  case 'chats':
                    return 'connections'
                  case 'instances':
                    return 'messengers'
                  default:
                    return 'agents'
                }
              })()}
              className="flex min-h-0 flex-1 flex-col"
              onValueChange={handleTabChange}
            >
              <TabsList className="bg-background-secondary grid h-8 w-full shrink-0 grid-cols-5">
                <TabsTrigger value="agents" className="py-1">
                  <div title="Agents">
                    <Icon type="agent" size="xs" className="text-primary" />
                  </div>
                </TabsTrigger>
                <TabsTrigger value="tools" className="py-1">
                  <div title="Tools">
                    <Icon type="hammer" size="xs" className="text-primary" />
                  </div>
                </TabsTrigger>
                <TabsTrigger value="connections" className="py-1">
                  <div title="Chats">
                    <Icon
                      type="message-circle"
                      size="xs"
                      className="text-primary"
                    />
                  </div>
                </TabsTrigger>
                <TabsTrigger value="messengers" className="py-1">
                  <div title="Messengers">
                    <Icon type="link" size="xs" className="text-primary" />
                  </div>
                </TabsTrigger>
                <TabsTrigger value="workflows" className="py-1">
                  <div title="Workflows">
                    <Icon type="workflow" size="xs" className="text-primary" />
                  </div>
                </TabsTrigger>
              </TabsList>

              <div className="mt-4 min-h-0 flex-1 overflow-hidden">
                <TabsContent
                  value="agents"
                  className="h-full data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <AgentsList />
                </TabsContent>
                <TabsContent
                  value="tools"
                  className="h-full data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <ToolsList />
                </TabsContent>
                <TabsContent
                  value="messengers"
                  className="h-full data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <MessengerProviderList />
                </TabsContent>
                <TabsContent
                  value="workflows"
                  className="h-full data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <div className="text-muted-foreground py-8 text-center text-sm">
                    Workflows coming soon
                  </div>
                </TabsContent>
                <TabsContent
                  value="connections"
                  className="h-full data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <ChatsList />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}

        {isMounted && (
          <div className="mt-auto pt-4">
            <UserProfile />
          </div>
        )}
      </motion.div>
    </motion.aside>
  )
}

export default Sidebar
