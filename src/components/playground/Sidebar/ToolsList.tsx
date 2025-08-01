'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { usePlaygroundStore } from '@/store'
import { useTools } from '@/hooks/useTools'
import { useCompanyContext } from '@/components/CompanyProvider'
import { type Tool } from '@/lib/apiClient'
import Icon from '@/components/ui/icon'
import SearchTools from '@/components/playground/SearchTools'
import { BsSearch } from 'react-icons/bs'

interface ToolItemProps {
  name: string
  type: 'dynamic' | 'custom' | 'mcp'
  category?: string
  isPublic?: boolean
}

const ToolItem = ({ name, type, category, isPublic }: ToolItemProps) => {
  return (
    <div className="bg-background-secondary hover:bg-background-secondary group flex h-11 w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors duration-200">
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <Icon
          type={type === 'mcp' ? 'link' : 'hammer'}
          size="xs"
          className="text-muted-foreground shrink-0"
        />
        <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
          <div className="flex items-center gap-1">
            <h4 className="font-geist text-primary truncate text-xs font-medium">
              {name}
            </h4>
            {/* Индикатор публичного тула */}
            {isPublic && (
              <div title="Public tool">
                <Icon type="users" size="xxs" className="text-muted shrink-0" />
              </div>
            )}
            {/* Индикатор приватного тула */}
            {!isPublic && (
              <div title="Private tool">
                <Icon type="key" size="xxs" className="text-muted shrink-0" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground capitalize">{type}</span>
            {category && (
              <Badge
                variant="outline"
                className="text-muted-foreground bg-background-primary border-muted-foreground/20 pointer-events-none h-4 px-1.5 py-0 text-[10px]"
              >
                {category.replace('-', ' ')}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const SkeletonList = ({ skeletonCount }: { skeletonCount: number }) => (
  <div className="flex flex-col gap-y-1">
    {Array.from({ length: skeletonCount }).map((_, index) => (
      <div
        key={index}
        className="bg-background-secondary flex items-center gap-2 rounded-lg px-3 py-2"
      >
        <Skeleton className="h-4 w-4 rounded" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
    ))}
  </div>
)

const ToolsList = () => {
  const { isEndpointLoading, setIsToolCreationMode } = usePlaygroundStore()
  const { tools, isLoading, refreshTools, getToolsByType } = useTools()
  const [showSearch, setShowSearch] = useState(false)
  const { company } = useCompanyContext()

  // Фильтрация тулзов по аналогии с агентами
  // Показываем тулзы компании + публичные (как у агентов)
  const getFilteredTools = (
    filterType?: 'all' | 'dynamic' | 'custom' | 'mcp'
  ) => {
    let filtered = tools

    // Фильтрация по типу
    if (filterType && ['dynamic', 'custom', 'mcp'].includes(filterType)) {
      filtered = getToolsByType(filterType as 'dynamic' | 'custom' | 'mcp')
    }

    // Логика фильтрации как у агентов: показываем тулзы компании + публичные
    if (company?.id) {
      // Если есть компания, показываем тулзы компании + публичные
      filtered = filtered.filter(
        (tool) => tool.company_id === company.id || tool.is_public === true
      )
    } else {
      // Если нет компании, показываем только публичные
      filtered = filtered.filter((tool) => tool.is_public === true)
    }

    return filtered
  }

  const handleSearchToolSelect = async (tool: Tool) => {
    try {
      toast.success(`Selected tool: ${tool.name}`)
      // Здесь можно добавить логику выбора инструмента
    } catch (error) {
      console.error('Error selecting search tool:', error)
      toast.error('Failed to select tool')
    }
  }

  const handleRefreshTools = async () => {
    try {
      await refreshTools()
      toast.success('Tools refreshed')
    } catch (error) {
      console.error('Error refreshing tools:', error)
      toast.error('Error refreshing tools')
    }
  }

  const handleCreateTool = () => {
    setIsToolCreationMode(true)
  }

  if (isLoading || isEndpointLoading) {
    return (
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-primary text-xs font-medium uppercase">
            Tools
          </div>
        </div>
        <div className="mb-3">
          <Skeleton className="border-primary/20 h-9 w-full rounded-xl border-dashed" />
        </div>
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
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefreshTools}
          className="h-6 w-6 hover:bg-transparent"
          title="Refresh tools"
        >
          <Icon
            type="refresh"
            size="xs"
            className="text-muted-foreground hover:text-primary"
          />
        </Button>
      </div>

      {/* Create Tool Button */}
      <div className="mb-3 flex gap-2">
        <Button
          onClick={handleCreateTool}
          size="lg"
          variant="outline"
          className="border-primary/20 text-primary hover:bg-primary/10 h-9 flex-1 rounded-xl border-dashed text-xs font-medium"
        >
          <Icon type="plus-icon" size="xs" className="text-primary" />
          <span className="uppercase">Create Tool</span>
        </Button>
        <Button
          onClick={() => setShowSearch(true)}
          size="lg"
          variant="outline"
          className="border-primary/20 text-primary hover:bg-primary/10 h-9 w-9 rounded-xl border-dashed"
          title="Search Tools"
        >
          <BsSearch className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="all" className="flex h-full flex-1 flex-col">
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
          className="h-full data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="[&::-webkit-scrollbar-thumb]:bg-border flex-1 overflow-y-auto transition-all duration-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
            <div className="flex flex-col gap-y-1 pb-[10px] pr-1">
              {getFilteredTools('all').map((tool) => (
                <ToolItem
                  key={`${tool.type}-${tool.id || tool.tool_id}`}
                  name={tool.name}
                  type={tool.type}
                  category={tool.category}
                  isPublic={tool.is_public}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {(['dynamic', 'mcp', 'custom'] as const).map((filterType) => (
          <TabsContent
            key={filterType}
            value={filterType}
            className="h-full data-[state=active]:flex data-[state=active]:flex-col"
          >
            <div className="[&::-webkit-scrollbar-thumb]:bg-border flex-1 overflow-y-auto transition-all duration-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
              <div className="flex flex-col gap-y-1 pb-[10px] pr-1">
                {getFilteredTools(filterType).map((tool) => (
                  <ToolItem
                    key={`${tool.type}-${tool.id || tool.tool_id}`}
                    name={tool.name}
                    type={tool.type}
                    category={tool.category}
                    isPublic={tool.is_public}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Search Modal */}
      {showSearch && (
        <SearchTools
          onToolSelect={handleSearchToolSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  )
}

export default ToolsList
