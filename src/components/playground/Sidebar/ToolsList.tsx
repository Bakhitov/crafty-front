'use client'

import { useCallback, useEffect } from 'react'
import { usePlaygroundStore } from '@/store'
import Icon from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// Типы инструментов
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

// API response types
interface DynamicToolsResponse {
  tools: DynamicTool[]
  total: number
}

interface CustomToolsResponse {
  success: boolean
  tools: CustomTool[]
  total: number
}

interface McpServersResponse {
  success: boolean
  servers: McpServer[]
  total: number
}

interface ToolItemProps {
  id: string
  name: string
  type: 'dynamic' | 'custom' | 'mcp'
  isActive: boolean
  onToggle: () => void
  onInfo: () => void
}

const ToolItem = ({
  id,
  name,
  type,
  isActive,
  onToggle,
  onInfo
}: ToolItemProps) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'dynamic':
        return 'hammer'
      case 'custom':
        return 'settings'
      case 'mcp':
        return 'link'
      default:
        return 'hammer'
    }
  }

  return (
    <div
      className={cn(
        'group flex h-11 w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors duration-200',
        isActive
          ? 'bg-primary/20 cursor-default'
          : 'bg-background-secondary hover:bg-background-secondary/80'
      )}
    >
      <div
        className="flex flex-1 items-center gap-2 overflow-hidden"
        onClick={onToggle}
      >
        <Icon
          type={getTypeIcon()}
          size="xs"
          className={isActive ? 'text-primary' : 'text-muted-foreground'}
        />
        <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
          <h4
            className={cn(
              'font-geist truncate text-xs font-medium',
              isActive && 'text-primary'
            )}
          >
            {name}
          </h4>
          <p className="text-muted-foreground truncate text-xs">{id}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onInfo()
          }}
          className="h-6 w-6 opacity-0 transition-opacity hover:bg-transparent group-hover:opacity-100"
        >
          <Icon
            type="brain"
            size="xs"
            className="text-muted-foreground hover:text-primary"
          />
        </Button>
      </div>
    </div>
  )
}

const ToolBlankState = () => {
  const { selectedEndpoint, isEndpointActive } = usePlaygroundStore()

  const errorMessage = (() => {
    switch (true) {
      case !isEndpointActive:
        return 'Endpoint is not connected. Please connect the endpoint to see tools.'
      case !selectedEndpoint:
        return 'Select an endpoint to see tools.'
      default:
        return 'No tools found. Create or add tools to the system.'
    }
  })()

  return (
    <div className="bg-background-secondary/50 mt-1 flex items-center justify-center rounded-lg pb-6 pt-4">
      <div className="flex flex-col items-center gap-1">
        <Icon type="hammer" size="lg" className="text-muted-foreground" />
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-primary text-sm font-medium">No tools found</h3>
          <p className="text-muted max-w-[210px] text-center text-sm">
            {errorMessage}
          </p>
        </div>
      </div>
    </div>
  )
}

const SkeletonList = ({ skeletonCount = 3 }: { skeletonCount: number }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <div key={index} className="bg-background-secondary rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Skeleton className="h-4 w-4 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const ToolsList = () => {
  const {
    selectedEndpoint,
    isEndpointActive,
    isEndpointLoading,
    toolsCache,
    setToolsCache,
    setToolsLoading,
    clearToolsCache
  } = usePlaygroundStore()

  // Время жизни кеша - 5 минут
  const CACHE_LIFETIME = 5 * 60 * 1000

  // Получение всех инструментов с кешированием
  const fetchTools = useCallback(async () => {
    if (!selectedEndpoint || !isEndpointActive) return

    // Проверяем кеш
    const now = Date.now()
    if (
      toolsCache.lastFetchTime &&
      now - toolsCache.lastFetchTime < CACHE_LIFETIME &&
      (toolsCache.dynamicTools.length > 0 ||
        toolsCache.customTools.length > 0 ||
        toolsCache.mcpServers.length > 0)
    ) {
      // Кеш актуален, не загружаем заново
      return
    }

    setToolsLoading(true)

    let dynamicTools: DynamicTool[] = []
    let customTools: CustomTool[] = []
    let mcpServers: McpServer[] = []

    try {
      // Динамические инструменты
      try {
        const dynamicResponse = await fetch(`${selectedEndpoint}/v1/tools/`)
        if (dynamicResponse.ok) {
          const dynamicData: DynamicToolsResponse = await dynamicResponse.json()
          dynamicTools = Array.isArray(dynamicData.tools)
            ? dynamicData.tools
            : []
        }
      } catch (error) {
        console.error('Error fetching dynamic tools:', error)
      }

      // Кастомные инструменты
      try {
        const customResponse = await fetch(
          `${selectedEndpoint}/v1/tools/custom`
        )
        if (customResponse.ok) {
          const customData: CustomToolsResponse = await customResponse.json()
          if (customData.success && Array.isArray(customData.tools)) {
            customTools = customData.tools
          }
        }
      } catch (error) {
        console.error('Error fetching custom tools:', error)
      }

      // MCP серверы
      try {
        const mcpResponse = await fetch(`${selectedEndpoint}/v1/tools/mcp`)
        if (mcpResponse.ok) {
          const mcpData: McpServersResponse = await mcpResponse.json()
          if (mcpData.success && Array.isArray(mcpData.servers)) {
            mcpServers = mcpData.servers
          }
        }
      } catch (error) {
        console.error('Error fetching MCP servers:', error)
      }

      // Сохраняем в кеш
      setToolsCache({
        dynamicTools,
        customTools,
        mcpServers,
        lastFetchTime: now
      })
    } catch (error) {
      console.error('Error fetching tools:', error)
      toast.error('Error loading tools')
    } finally {
      setToolsLoading(false)
    }
  }, [
    selectedEndpoint,
    isEndpointActive,
    toolsCache.lastFetchTime,
    toolsCache.dynamicTools.length,
    toolsCache.customTools.length,
    toolsCache.mcpServers.length,
    CACHE_LIFETIME,
    setToolsCache,
    setToolsLoading
  ])

  useEffect(() => {
    if (isEndpointActive && selectedEndpoint) {
      fetchTools()
    } else {
      clearToolsCache()
    }
  }, [isEndpointActive, selectedEndpoint, fetchTools, clearToolsCache])

  // Обработчики действий с инструментами
  const handleToggleTool = async (
    toolId: string,
    type: 'dynamic' | 'custom' | 'mcp'
  ) => {
    try {
      // Здесь должна быть логика для переключения состояния инструмента
      // const endpoint = type === 'dynamic'
      //   ? `${selectedEndpoint}/v1/tools/${toolId}`
      //   : type === 'custom'
      //   ? `${selectedEndpoint}/v1/tools/custom/${toolId}`
      //   : `${selectedEndpoint}/v1/tools/mcp/${toolId}`

      // Currently just showing notification
      toast.info(`Toggling ${type} tool ${toolId}`)
    } catch (error) {
      console.error('Error toggling tool:', error)
      toast.error('Error changing tool status')
    }
  }

  const handleToolInfo = (
    toolId: string,
    type: 'dynamic' | 'custom' | 'mcp'
  ) => {
    let toolInfo = ''

    if (type === 'dynamic') {
      const tool = toolsCache.dynamicTools.find((t) => t.tool_id === toolId)
      if (tool) {
        toolInfo = `${tool.name}\nClass: ${tool.agno_class}\nCategory: ${tool.category || 'N/A'}\nDescription: ${tool.description || 'No description'}`
      }
    } else if (type === 'custom') {
      const tool = toolsCache.customTools.find((t) => t.tool_id === toolId)
      if (tool) {
        toolInfo = `${tool.name}\nType: Custom Python Tool\nDescription: ${tool.description || 'No description'}\nFunctions: ${tool.source_code.match(/def\s+(\w+)/g)?.join(', ') || 'None'}`
      }
    } else if (type === 'mcp') {
      const server = toolsCache.mcpServers.find((s) => s.server_id === toolId)
      if (server) {
        toolInfo = `${server.name}\nTransport: ${server.transport}\nDescription: ${server.description || 'No description'}\nCommand: ${server.command || server.url || 'N/A'}`
      }
    }

    toast.info(toolInfo || `Info for ${type} tool ${toolId}`)
  }

  // Get all tools from cache
  const allTools = [
    ...toolsCache.dynamicTools.map((tool) => ({
      ...tool,
      type: 'dynamic' as const
    })),
    ...toolsCache.customTools.map((tool) => ({
      ...tool,
      type: 'custom' as const
    })),
    ...toolsCache.mcpServers.map((server) => ({
      tool_id: server.server_id,
      name: server.name,
      description: server.description,
      is_active: server.is_active,
      type: 'mcp' as const
    }))
  ]

  if (toolsCache.isLoading || isEndpointLoading) {
    return (
      <div className="w-full">
        <div className="mt-4 h-full w-full overflow-y-auto">
          <SkeletonList skeletonCount={5} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-primary text-xs font-medium uppercase">Tools</div>
      </div>

      {/* Create Tool Button */}
      <div className="mb-3">
        <Button
          onClick={() => toast.info('Tool creation coming soon')}
          size="lg"
          variant="outline"
          className="border-primary/20 text-primary hover:bg-primary/10 h-9 w-full rounded-xl border-dashed text-xs font-medium"
        >
          <Icon type="plus-icon" size="xs" className="text-primary" />
          <span className="uppercase">Create Tool</span>
        </Button>
      </div>

      {!isEndpointActive || allTools.length === 0 ? (
        <ToolBlankState />
      ) : (
        <Tabs
          defaultValue="all"
          className="flex flex-1 flex-col overflow-hidden"
        >
          <TabsList className="bg-background-secondary mb-3 grid w-full shrink-0 grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="dynamic" className="text-xs">
              Native
            </TabsTrigger>
            <TabsTrigger value="mcp" className="text-xs">
              MCP
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">
              Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="all"
            className="flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
          >
            <div className="[&::-webkit-scrollbar-thumb]:bg-border flex-1 overflow-y-auto transition-all duration-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
              <div className="flex flex-col gap-y-1 pr-1">
                {allTools.map((tool) => (
                  <ToolItem
                    key={`${tool.type}-${tool.tool_id}`}
                    id={tool.tool_id}
                    name={tool.name}
                    type={tool.type}
                    isActive={tool.is_active}
                    onToggle={() => handleToggleTool(tool.tool_id, tool.type)}
                    onInfo={() => handleToolInfo(tool.tool_id, tool.type)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="dynamic"
            className="flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
          >
            <div className="[&::-webkit-scrollbar-thumb]:bg-border flex-1 overflow-y-auto transition-all duration-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
              <div className="flex flex-col gap-y-1 pr-1">
                {toolsCache.dynamicTools.map((tool) => (
                  <ToolItem
                    key={`dynamic-${tool.tool_id}`}
                    id={tool.tool_id}
                    name={tool.name}
                    type="dynamic"
                    isActive={tool.is_active}
                    onToggle={() => handleToggleTool(tool.tool_id, 'dynamic')}
                    onInfo={() => handleToolInfo(tool.tool_id, 'dynamic')}
                  />
                ))}
                {toolsCache.dynamicTools.length === 0 && (
                  <div className="p-4 text-center text-xs text-zinc-400">
                    No native tools available
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="mcp"
            className="flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
          >
            <div className="[&::-webkit-scrollbar-thumb]:bg-border flex-1 overflow-y-auto transition-all duration-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
              <div className="flex flex-col gap-y-1 pr-1">
                {toolsCache.mcpServers.map((server) => (
                  <ToolItem
                    key={`mcp-${server.server_id}`}
                    id={server.server_id}
                    name={server.name}
                    type="mcp"
                    isActive={server.is_active}
                    onToggle={() => handleToggleTool(server.server_id, 'mcp')}
                    onInfo={() => handleToolInfo(server.server_id, 'mcp')}
                  />
                ))}
                {toolsCache.mcpServers.length === 0 && (
                  <div className="p-4 text-center text-xs text-zinc-400">
                    No MCP servers available
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="custom"
            className="flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
          >
            <div className="[&::-webkit-scrollbar-thumb]:bg-border flex-1 overflow-y-auto transition-all duration-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
              <div className="flex flex-col gap-y-1 pr-1">
                {toolsCache.customTools.map((tool) => (
                  <ToolItem
                    key={`custom-${tool.tool_id}`}
                    id={tool.tool_id}
                    name={tool.name}
                    type="custom"
                    isActive={tool.is_active}
                    onToggle={() => handleToggleTool(tool.tool_id, 'custom')}
                    onInfo={() => handleToolInfo(tool.tool_id, 'custom')}
                  />
                ))}
                {toolsCache.customTools.length === 0 && (
                  <div className="p-4 text-center text-xs text-zinc-400">
                    No custom tools available
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default ToolsList
