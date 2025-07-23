'use client'

import { useCallback } from 'react'
import { useQueryState } from 'nuqs'
import { usePlaygroundStore } from '@/store'
import useChatActions from '@/hooks/useChatActions'
import Icon from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getProviderIcon } from '@/lib/modelProvider'
import { AgentBlankState } from './BlankStates'

interface AgentItemProps {
  agentId: string
  name: string
  modelProvider?: string
  isSelected: boolean
  onAgentClick: () => void
  onEditClick: () => void
}

const AgentItem = ({
  agentId,
  name,
  modelProvider,
  isSelected,
  onAgentClick,
  onEditClick
}: AgentItemProps) => {
  const providerIcon = modelProvider ? getProviderIcon(modelProvider) : null

  return (
    <div
      className={cn(
        'group flex h-11 w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors duration-200',
        isSelected
          ? 'bg-accent cursor-default'
          : 'bg-background-secondary hover:bg-background-secondary'
      )}
    >
      <div
        className="flex flex-1 items-center gap-2 overflow-hidden"
        onClick={onAgentClick}
      >
        <Icon
          type="agent"
          size="xs"
          className={isSelected ? 'text-primary' : 'text-muted-foreground'}
        />
        <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
          <h4
            className={cn(
              'font-geist truncate text-xs font-medium',
              isSelected && 'text-primary'
            )}
          >
            {name}
          </h4>
          <p className="text-muted-foreground truncate text-xs">{agentId}</p>
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
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onEditClick()
          }}
          className="h-6 w-6 opacity-0 transition-opacity hover:bg-transparent group-hover:opacity-100"
        >
          <Icon
            type="edit"
            size="xs"
            className="text-muted-foreground hover:text-primary"
          />
        </Button>
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
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-2 w-16 rounded" />
        </div>
        <Skeleton className="h-3 w-3 rounded" />
      </div>
    ))}
  </div>
)

const AgentsList = () => {
  const [agentId, setAgentId] = useQueryState('agent', {
    parse: (value) => value || undefined,
    history: 'push'
  })

  const {
    agents,
    isEndpointActive,
    isEndpointLoading,
    setSelectedModel,
    setHasStorage,
    setIsAgentCreationMode,
    setEditingAgentId
  } = usePlaygroundStore()

  const { clearChat, focusChatInput } = useChatActions()

  const handleAgentClick = useCallback(
    (selectedAgentId: string) => {
      return () => {
        const selectedAgent = agents.find(
          (agent) => agent.value === selectedAgentId
        )
        setSelectedModel(selectedAgent?.model.provider || '')
        setHasStorage(
          !!(selectedAgent?.storage || selectedAgent?.storage_config?.enabled)
        )
        setAgentId(selectedAgentId)
        clearChat()
        if (selectedAgent?.model.provider) {
          focusChatInput()
        }
      }
    },
    [
      agents,
      setSelectedModel,
      setHasStorage,
      setAgentId,
      clearChat,
      focusChatInput
    ]
  )

  const handleCreateAgent = () => {
    setEditingAgentId(null) // Create mode
    setIsAgentCreationMode(true)
    setAgentId('new', { shallow: true })
  }

  const handleEditAgent = (agentId: string) => {
    setEditingAgentId(agentId) // Edit mode
    setIsAgentCreationMode(true)
    setAgentId('new', { shallow: true })
  }

  if (isEndpointLoading) {
    return (
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-primary text-xs font-medium uppercase">
            Agents
          </div>
        </div>

        {/* Create Agent Button */}
        <div className="mb-3">
          <Button
            size="lg"
            variant="outline"
            className="border-primary/20 text-primary h-9 w-full rounded-xl border-dashed text-xs font-medium opacity-50"
            disabled
          >
            <Icon type="plus-icon" size="xs" className="text-primary" />
            <span className="uppercase">Create Agent</span>
          </Button>
        </div>

        <div className="overflow-y-auto">
          <SkeletonList skeletonCount={3} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-primary text-xs font-medium uppercase">Agents</div>
      </div>

      {/* Create Agent Button */}
      <div className="mb-3">
        <Button
          onClick={handleCreateAgent}
          size="lg"
          variant="outline"
          className="border-primary/20 text-primary hover:bg-primary/10 h-9 w-full rounded-xl border-dashed text-xs font-medium"
        >
          <Icon type="plus-icon" size="xs" className="text-primary" />
          <span className="uppercase">Create Agent</span>
        </Button>
      </div>

      <div className="[&::-webkit-scrollbar-thumb]:bg-border flex-1 overflow-y-auto transition-all duration-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
        {(!isEndpointActive || agents.length === 0) && agentId !== 'new' ? (
          <AgentBlankState onCreateAgent={handleCreateAgent} />
        ) : (
          <div className="flex flex-col gap-y-1 pb-[10px] pr-1">
            {agents.map((agent) => (
              <AgentItem
                key={agent.value}
                agentId={agent.value}
                name={agent.label}
                modelProvider={agent.model.provider}
                isSelected={agentId === agent.value}
                onAgentClick={handleAgentClick(agent.value)}
                onEditClick={() => handleEditAgent(agent.value)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentsList
