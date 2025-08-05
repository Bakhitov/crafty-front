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
import TabChatsList from './TabChatsList'
import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon } from 'lucide-react'

import { MessengerInstanceUnion } from '@/types/messenger'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'

const ENDPOINT_PLACEHOLDER = 'NO ENDPOINT ADDED'

// Компонент для модального окна настроек сервера
const ServerModal = ({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) => {
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
    onClose()
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

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Настройки сервера</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-start gap-4 p-4">
          <div className="text-primary text-xs font-medium uppercase">
            Server
          </div>
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
      </DialogContent>
    </Dialog>
  )
}

const UserProfile = () => {
  const router = useRouter()
  const { user } = useAuthContext()
  const [isServerModalOpen, setIsServerModalOpen] = useState(false)
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
            {user?.user_metadata?.full_name ||
              user?.email?.split('@')[0] ||
              'Пользователь'}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {user?.email}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary h-8 w-8 p-0"
              title="Меню"
            >
              <Icon type="more-horizontal" size="xs" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-primary/5 border-primary/20 w-56 backdrop-blur-sm"
          >
            <DropdownMenuItem
              onClick={() => setIsServerModalOpen(true)}
              className="cursor-pointer"
            >
              <Icon type="server" size="xs" className="mr-2" />
              Настройки сервера
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600"
            >
              <Icon type="log-out" size="xs" className="mr-2" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ServerModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
      />
    </div>
  )
}

const SidebarHeader = ({
  isCollapsed,
  setIsCollapsed
}: {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}) => {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-primary text-lg font-bold">CRAFTY</h1>
      <div className="flex items-center space-x-1">
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
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="text-muted-foreground hover:text-primary h-8 w-8 p-0"
            title="Collapse sidebar"
          >
            <Icon
              type="sheet"
              size="xs"
              className="text-primary rotate-0 transform"
            />
          </Button>
        )}
      </div>
    </div>
  )
}

// Компонент скелетона для агентов
const AgentsListSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3 rounded-lg p-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </div>
)

// Компонент скелетона для инструментов
const ToolsListSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3 rounded-lg p-3">
        <Skeleton className="h-6 w-6 rounded" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </div>
)

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { initializePlayground } = useChatActions()
  const {
    selectedEndpoint,
    isEndpointActive,
    hydrated,
    setMessengerInstances,
    activeTab,
    setActiveTab,
    agents,
    isEndpointLoading
  } = usePlaygroundStore()
  const [isMounted, setIsMounted] = useState(false)
  const [, setAgentId] = useQueryState('agent')
  const [, setSessionId] = useQueryState('session')

  // Загрузка messenger instances через прокси API (избегает Mixed Content)
  const loadMessengerInstances = useCallback(async () => {
    try {
      console.log('Sidebar: Loading messenger instances...')
      // Используем наш внутренний API endpoint вместо прямого вызова
      const response = await fetch('/api/v1/instances/list')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch instances`)
      }

      const instancesData = await response.json()
      console.log(
        'Sidebar: Messenger instances loaded:',
        instancesData.instances?.length || 0,
        instancesData.instances
      )

      // Преобразуем API response в MessengerInstanceUnion format
      const convertedInstances = (instancesData.instances || []).map(
        (instance: { id: string; [key: string]: unknown }) => {
          const { id, ...instanceWithoutId } = instance
          return {
            ...instanceWithoutId,
            instance_id: id
          } as MessengerInstanceUnion
        }
      )
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
    console.log('Sidebar: useEffect triggered', { hydrated, selectedEndpoint })

    // Инициализируем плейграунд только один раз при монтировании
    // или при изменении endpoint (но не при каждой гидратации)
    const shouldInitialize =
      selectedEndpoint && !selectedEndpoint.includes('undefined')

    if (shouldInitialize && isMounted) {
      console.log('Sidebar: Initializing playground...')
      initializePlayground()
      loadMessengerInstances()
    } else {
      console.log('Sidebar: Not initializing playground', {
        hydrated,
        selectedEndpoint,
        hasSelectedEndpoint: !!selectedEndpoint,
        shouldInitialize,
        isMounted
      })
    }
  }, [
    selectedEndpoint,
    isMounted,
    initializePlayground,
    loadMessengerInstances,
    hydrated
  ])

  // Определяем состояние загрузки для каждой вкладки
  const getTabLoadingState = () => {
    switch (activeTab) {
      case 'agents':
        return agents.length === 0 && isEndpointLoading
      case 'chats':
        return false // Чаты загружаются отдельно
      case 'tools':
        return isEndpointLoading
      default:
        return false
    }
  }

  const renderTabContent = () => {
    const isLoading = getTabLoadingState()

    switch (activeTab) {
      case 'agents':
        if (isLoading) {
          return <AgentsListSkeleton />
        }
        return <AgentsList />

      case 'chats':
        return <TabChatsList />

      case 'tools':
        if (isLoading) {
          return <ToolsListSkeleton />
        }
        return <ToolsList />

      default:
        return <AgentsList />
    }
  }

  return (
    <motion.aside
      className="font-dmmono relative flex h-screen shrink-0 grow-0 flex-col overflow-hidden px-2 py-3"
      initial={{ width: '19rem' }}
      animate={{ width: isCollapsed ? '2.5rem' : '19rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Кнопка свернуть/развернуть - всегда видима */}
      {isCollapsed && (
        <div className="absolute right-2 top-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="text-muted-foreground hover:text-primary h-8 w-8 p-0"
            title="Expand sidebar"
          >
            <Icon
              type="sheet"
              size="xs"
              className="text-primary rotate-180 transform"
            />
          </Button>
        </div>
      )}

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
          <SidebarHeader
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
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
                  default:
                    return 'agents'
                }
              })()}
              className="flex min-h-0 flex-1 flex-col"
              onValueChange={handleTabChange}
            >
              <TabsList className="bg-background-secondary grid h-8 w-full shrink-0 grid-cols-4">
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
                  <div title="Connections">
                    <Icon
                      type="message-circle"
                      size="xs"
                      className="text-primary"
                    />
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
                  {renderTabContent()}
                </TabsContent>
                <TabsContent
                  value="tools"
                  className="h-full data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <ToolsList />
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
                  <TabChatsList />
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
