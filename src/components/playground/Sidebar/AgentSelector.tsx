'use client'

import * as React from 'react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { usePlaygroundStore } from '@/store'
import { useQueryState } from 'nuqs'
import Icon from '@/components/ui/icon'
import { useEffect } from 'react'
import useChatActions from '@/hooks/useChatActions'

export function AgentSelector() {
  const { agents, setSelectedModel, setHasStorage } = usePlaygroundStore()
  const { focusChatInput, clearChat } = useChatActions()
  const [agentId, setAgentId] = useQueryState('agent', {
    parse: (value) => value || undefined,
    history: 'push'
  })
  useQueryState('session')

  // Set the model when the component mounts if an agent is already selected
  useEffect(() => {
    if (agentId && agents.length > 0) {
      if (agentId === 'new') {
        setHasStorage(false)
        return
      }
      const agent = agents.find((agent) => agent.value === agentId)
      if (agent) {
        setSelectedModel(agent.model.provider || '')
        setHasStorage(!!(agent.storage || agent.storage_config?.enabled))
        if (agent.model.provider) {
          focusChatInput()
        }
      } else {
        setAgentId(agents[0].value)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, agents, setSelectedModel])

  const handleOnValueChange = (value: string) => {
    const newAgent = value === agentId ? '' : value
    const selectedAgent = agents.find((agent) => agent.value === newAgent)
    setSelectedModel(selectedAgent?.model.provider || '')
    setHasStorage(
      !!(selectedAgent?.storage || selectedAgent?.storage_config?.enabled)
    )
    setAgentId(newAgent)
    clearChat()
    if (selectedAgent?.model.provider) {
      focusChatInput()
    }
  }

  return (
    <Select
      value={agentId || ''}
      onValueChange={(value) => handleOnValueChange(value)}
    >
      <SelectTrigger className="border-primary/15 bg-primaryAccent h-9 w-full rounded-xl border text-xs font-medium uppercase">
        <SelectValue placeholder="Select Agent" />
      </SelectTrigger>
      <SelectContent className="bg-primaryAccent font-dmmono border-none shadow-lg">
        {agents.map((agent, index) => (
          <SelectItem
            className="cursor-pointer"
            key={`${agent.value}-${index}`}
            value={agent.value}
          >
            <div className="flex items-center gap-3 text-xs font-medium uppercase">
              <Icon type={'agent'} size="xs" />
              {agent.label}
            </div>
          </SelectItem>
        ))}
        {agents.length === 0 && (
          <SelectItem
            value="no-agents"
            className="cursor-not-allowed select-none text-center"
          >
            No agents found
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}
