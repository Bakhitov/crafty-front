'use client'

import { useEffect, useState } from 'react'
import { useQueryState } from 'nuqs'
import { usePlaygroundStore } from '@/store'
import { useAuthContext } from '@/components/AuthProvider'
import { getAgentMemoriesAPI } from '@/api/playground'
import { type AgentMemory } from '@/types/playground'
import { Skeleton } from '@/components/ui/skeleton'
import Paragraph from '@/components/ui/typography/Paragraph'
import Icon from '@/components/ui/icon'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ru'

dayjs.extend(relativeTime)
dayjs.locale('ru')

interface MemoryItemProps {
  memory: AgentMemory
}

const MemoryItem = ({ memory }: MemoryItemProps) => {
  const formattedDate = dayjs(memory.last_updated).fromNow()

  return (
    <div className="bg-background-primary hover:bg-accent rounded-lg p-3 transition-colors">
      <div className="mb-2">
        <Paragraph className="font-geist text-primary text-sm leading-relaxed">
          {memory.memory}
        </Paragraph>
      </div>

      {memory.topics.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {memory.topics.map((topic, index) => (
            <span
              key={index}
              className="bg-background-secondary text-primary inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
            >
              #{topic}
            </span>
          ))}
        </div>
      )}

      <div className="text-muted text-xxs font-geist flex items-center gap-1">
        <Icon type="clock" size="xxs" />
        <span>{formattedDate}</span>
      </div>
    </div>
  )
}

const MemorySkeletonList = () => {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="bg-background-secondary rounded-lg p-3">
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-3/4" />
          <div className="mb-2 flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

const AgentMemory = () => {
  const [agentId] = useQueryState('agent')
  const { selectedEndpoint } = usePlaygroundStore()
  const { user } = useAuthContext()
  const [memories, setMemories] = useState<AgentMemory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMemories = async () => {
      if (!agentId || !selectedEndpoint || !user?.id) {
        setMemories([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const agentMemories = await getAgentMemoriesAPI(
          selectedEndpoint,
          agentId,
          user.id
        )
        setMemories(agentMemories)
      } catch (error) {
        console.error('Failed to load agent memories:', error)
        setError('Failed to load memories')
        setMemories([])
      } finally {
        setIsLoading(false)
      }
    }

    loadMemories()
  }, [agentId, selectedEndpoint, user?.id])

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-2">
        <MemorySkeletonList />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Icon type="alert-circle" size="lg" className="text-red-600" />
          </div>
          <h3 className="text-primary mb-2 text-sm font-medium">Error</h3>
          <p className="text-muted-foreground max-w-[200px] text-xs">{error}</p>
        </div>
      </div>
    )
  }

  if (memories.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Icon type="brain" size="lg" className="text-gray-600" />
          </div>
          <h3 className="text-primary mb-2 text-sm font-medium">No Memories</h3>
          <p className="text-muted-foreground max-w-[200px] text-xs">
            This agent doesn&apos;t have any memories yet. Memories will appear
            here after conversations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-2">
      <div className="space-y-3">
        {memories.map((memory, index) => (
          <MemoryItem key={`${memory.last_updated}-${index}`} memory={memory} />
        ))}
      </div>
    </div>
  )
}

export default AgentMemory
