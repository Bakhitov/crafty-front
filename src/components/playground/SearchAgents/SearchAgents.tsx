'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePlaygroundStore } from '@/store'
import { useCompanyContext } from '@/components/CompanyProvider'
import { getAPIClient, type Agent as APIAgent } from '@/lib/apiClient'
import Icon from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getProviderIcon } from '@/lib/modelProvider'
import { toast } from 'sonner'
import { BsSearch } from 'react-icons/bs'

interface SearchAgentsProps {
  onAgentSelect: (agent: APIAgent) => Promise<void>
  onClose: () => void
}

const SearchAgents = ({ onAgentSelect, onClose }: SearchAgentsProps) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<APIAgent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { selectedEndpoint } = usePlaygroundStore()
  const { company } = useCompanyContext()

  // Debounced search function
  const debouncedSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        setError(null)
        return
      }

      if (!selectedEndpoint) {
        setError('No endpoint selected')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const apiClient = getAPIClient(selectedEndpoint)
        const searchResults = await apiClient.searchAgents({
          query: searchQuery,
          company_id: company?.id,
          limit: 20
        })

        setResults(searchResults)
      } catch (error) {
        console.error('Search error:', error)
        setError('Failed to search agents')
        toast.error('Ошибка поиска агентов')
      } finally {
        setIsLoading(false)
      }
    },
    [selectedEndpoint, company?.id]
  )

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, debouncedSearch])

  const handleAgentClick = async (agent: APIAgent) => {
    try {
      await onAgentSelect(agent)
      onClose()
      toast.success(`Selected agent: ${agent.name || agent.agent_id}`)
    } catch (error) {
      console.error('Error selecting agent:', error)
      toast.error('Failed to select agent')
    }
  }

  const AgentItem = ({ agent }: { agent: APIAgent }) => {
    const providerIcon = agent.model_configuration?.provider
      ? getProviderIcon(agent.model_configuration.provider)
      : null

    return (
      <div
        className="hover:bg-background-secondary group flex h-11 w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors duration-200"
        onClick={() => handleAgentClick(agent)}
      >
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <Icon
            type="agent"
            size="xs"
            className="text-muted-foreground shrink-0"
          />
          <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
            <div className="flex items-center gap-1">
              <h4 className="font-geist truncate text-xs font-medium">
                {agent.name || agent.agent_id}
              </h4>
              {agent.is_public && (
                <div title="Public agent">
                  <Icon
                    type="users"
                    size="xxs"
                    className="text-muted shrink-0"
                  />
                </div>
              )}
              {!agent.is_public && (
                <div title="Private agent">
                  <Icon type="key" size="xxs" className="text-muted shrink-0" />
                </div>
              )}
            </div>
            <p className="text-muted-foreground truncate text-xs">
              {agent.description || agent.agent_id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {providerIcon && (
            <Icon
              type={providerIcon}
              size="xs"
              className="text-muted-foreground shrink-0"
            />
          )}
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
          <h2 className="text-primary text-lg font-semibold">Search Agents</h2>
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
              placeholder="Search agents by name or description..."
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
              <p className="text-sm">No agents found for &quot;{query}&quot;</p>
            </div>
          )}

          {!isLoading && !error && query.trim() === '' && (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
              <Icon type="agent" size="md" className="opacity-50" />
              <p className="text-sm">Start typing to search for agents</p>
            </div>
          )}

          {!isLoading && !error && results.length > 0 && (
            <div className="flex flex-col gap-y-1">
              {results.map((agent) => (
                <AgentItem key={agent.agent_id} agent={agent} />
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

export default SearchAgents
