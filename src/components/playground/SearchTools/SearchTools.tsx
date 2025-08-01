'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTools } from '@/hooks/useTools'
import { type Tool } from '@/lib/apiClient'
import Icon from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { BsSearch } from 'react-icons/bs'

interface SearchToolsProps {
  onToolSelect: (tool: Tool) => Promise<void>
  onClose: () => void
}

const SearchTools = ({ onToolSelect, onClose }: SearchToolsProps) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Tool[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { searchTools: searchToolsHook } = useTools()

  // Search function
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        setError(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Используем функцию поиска из хука
        const filteredTools = searchToolsHook(searchQuery)
        setResults(filteredTools)
      } catch (err) {
        console.error('Error searching tools:', err)
        setError(err instanceof Error ? err.message : 'Failed to search tools')
        setResults([])
      } finally {
        setIsLoading(false)
      }
    },
    [searchToolsHook]
  )

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, performSearch])

  const handleToolClick = async (tool: Tool) => {
    try {
      await onToolSelect(tool)
      onClose()
      toast.success(`Selected tool: ${tool.name}`)
    } catch (error) {
      console.error('Error selecting tool:', error)
      toast.error('Failed to select tool')
    }
  }

  const getToolIcon = (type: string) => {
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

  const getToolTypeLabel = (type: string) => {
    switch (type) {
      case 'dynamic':
        return 'Native'
      case 'custom':
        return 'Custom'
      case 'mcp':
        return 'MCP'
      default:
        return type
    }
  }

  const ToolItem = ({ tool }: { tool: Tool }) => {
    return (
      <div
        className="hover:bg-background-secondary group flex h-11 w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors duration-200"
        onClick={() => handleToolClick(tool)}
      >
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <Icon
            type={getToolIcon(tool.type) as 'hammer' | 'settings' | 'link'}
            size="xs"
            className="text-muted-foreground shrink-0"
          />
          <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
            <div className="flex items-center gap-1">
              <h4 className="font-geist truncate text-xs font-medium">
                {tool.name}
              </h4>
              <span className="text-muted-foreground bg-background-secondary text-xxs rounded px-1">
                {getToolTypeLabel(tool.type)}
              </span>
            </div>
            <p className="text-muted-foreground truncate text-xs">
              {tool.description || 'No description available'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div
            className={`h-2 w-2 rounded-full ${
              tool.is_active ? 'bg-green-500' : 'bg-gray-400'
            }`}
            title={tool.is_active ? 'Active' : 'Inactive'}
          />
        </div>
      </div>
    )
  }

  const LoadingSkeleton = () => (
    <div className="flex flex-col gap-y-1">
      {Array.from({ length: 3 }).map((_, index) => (
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background-primary w-full max-w-md rounded-xl border p-4 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-primary text-lg font-semibold">Search Tools</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <Icon type="x" size="xs" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <BsSearch className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search tools by name or description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {error && (
            <div className="text-destructive flex items-center gap-2 rounded-lg p-3 text-sm">
              <Icon type="alert-circle" size="xs" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && <LoadingSkeleton />}

          {!isLoading && !error && results.length === 0 && query.trim() && (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
              <BsSearch className="h-8 w-8 opacity-50" />
              <p className="text-sm">No tools found for &quot;{query}&quot;</p>
            </div>
          )}

          {!isLoading && !error && query.trim() === '' && (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
              <Icon type="hammer" size="md" className="opacity-50" />
              <p className="text-sm">Start typing to search for tools</p>
            </div>
          )}

          {!isLoading && !error && results.length > 0 && (
            <div className="flex flex-col gap-y-1">
              {results.map((tool) => (
                <ToolItem key={`${tool.type}-${tool.tool_id}`} tool={tool} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SearchTools
