import { useCallback, useEffect, useState } from 'react'
import { usePlaygroundStore } from '@/store'
import { useCompanyContext } from '@/components/CompanyProvider'
import { getAPIClient, type Tool } from '@/lib/apiClient'
import { toast } from 'sonner'

interface UseToolsReturn {
  tools: Tool[]
  isLoading: boolean
  refreshTools: () => Promise<void>
  searchTools: (query: string) => Tool[]
  getToolsByType: (type: 'dynamic' | 'custom' | 'mcp') => Tool[]
}

export function useTools(): UseToolsReturn {
  const { selectedEndpoint, isEndpointActive } = usePlaygroundStore()
  const { company } = useCompanyContext()
  const [tools, setTools] = useState<Tool[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadTools = useCallback(async () => {
    if (!selectedEndpoint || !isEndpointActive) {
      setTools([])
      return
    }

    setIsLoading(true)
    try {
      // Получаем доступные инструменты через Supabase
      const { supabaseCrud } = await import('@/lib/supabaseCrudClient')
      const result = company?.id
        ? await supabaseCrud.getTools({ company_id: company.id })
        : await supabaseCrud.getTools({ is_public: true })

      // Преобразуем в формат Tool
      const toolsData = result.data.map((tool) => ({
        id: tool.id,
        name: tool.name,
        description: tool.description || '',
        type: (tool.type === 'builtin' ? 'dynamic' : tool.type) as
          | 'dynamic'
          | 'custom'
          | 'mcp',
        configuration: tool.configuration || {},
        is_public: tool.is_public,
        is_active: tool.is_active,
        company_id: tool.company_id,
        user_id: tool.user_id,
        display_name: tool.display_name,
        category: tool.category || 'general',
        created_at: tool.created_at,
        updated_at: tool.updated_at,
        // Для обратной совместимости
        tool_id: tool.id || tool.name,
        config: tool.configuration || {}
      }))

      setTools(toolsData)
    } catch (error) {
      console.error('Error loading tools:', error)
      toast.error('Error loading tools')
      setTools([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedEndpoint, isEndpointActive, company?.id])

  const refreshTools = useCallback(async () => {
    if (selectedEndpoint) {
      // Очищаем кэш перед обновлением
      getAPIClient(selectedEndpoint).clearCache()
    }
    await loadTools()
  }, [selectedEndpoint, loadTools])

  const searchTools = useCallback(
    (query: string): Tool[] => {
      if (!query.trim()) return tools

      const searchTerm = query.toLowerCase()
      return tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchTerm) ||
          tool.description?.toLowerCase().includes(searchTerm) ||
          tool.tool_id?.toLowerCase().includes(searchTerm) ||
          tool.id?.toLowerCase().includes(searchTerm)
      )
    },
    [tools]
  )

  const getToolsByType = useCallback(
    (type: 'dynamic' | 'custom' | 'mcp'): Tool[] => {
      return tools.filter((tool) => tool.type === type)
    },
    [tools]
  )

  // Загружаем инструменты при изменении endpoint или компании
  useEffect(() => {
    loadTools()
  }, [loadTools])

  return {
    tools,
    isLoading,
    refreshTools,
    searchTools,
    getToolsByType
  }
}
