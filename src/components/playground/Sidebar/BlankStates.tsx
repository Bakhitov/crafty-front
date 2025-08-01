import React from 'react'
import Icon from '@/components/ui/icon'
import { Button } from '@/components/ui/button'

interface BlankStateProps {
  icon: string
  title: string
  description: string
  actionButton?: {
    text: string
    onClick: () => void
  }
}

export const BlankState = ({
  icon,
  title,
  description,
  actionButton
}: BlankStateProps) => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="flex max-w-md flex-col items-center justify-center text-center">
      <Icon
        type={icon as 'agent' | 'hammer' | 'message-circle' | 'link'}
        size="lg"
        className="text-muted-foreground mb-6 !size-16"
      />
      <h2 className="mb-4 text-3xl font-[400] tracking-tight">{title}</h2>
      <p className="text-muted-foreground font-geist mb-8 text-sm leading-relaxed">
        {description}
      </p>
      {actionButton && (
        <Button
          onClick={actionButton.onClick}
          size="lg"
          variant="outline"
          className="border-primary/20 text-primary hover:bg-primary/10 h-9 w-48 rounded-xl border-dashed text-xs font-medium"
        >
          <Icon type="plus-icon" size="xs" className="text-primary mr-2" />
          <span className="uppercase">{actionButton.text}</span>
        </Button>
      )}
    </div>
  </div>
)

// Specific blank states for each section
export const AgentBlankState = ({
  onCreateAgent
}: {
  onCreateAgent: () => void
}) => (
  <BlankState
    icon="agent"
    title="No agents"
    description="Create your first agent to start working. Agents help automate tasks and answer questions."
    actionButton={{
      text: 'Create Agent',
      onClick: onCreateAgent
    }}
  />
)

export const ToolBlankState = () => (
  <BlankState
    icon="hammer"
    title="No tools"
    description="Create your first tool to extend agent capabilities. Tools help agents perform special tasks."
  />
)

export const ChatSelectBlankState = () => (
  <BlankState
    icon="message-circle"
    title="Select a chat"
    description="Choose a chat from the list to start communicating with users through messengers."
  />
)

export const ChatCreateBlankState = () => (
  <BlankState
    icon="message-circle"
    title="No chats"
    description="To display chats, you need to create a messenger instance. Chats will appear after receiving messages."
  />
)

export const InstanceSelectBlankState = () => (
  <BlankState
    icon="link"
    title="Select an instance"
    description="Choose a messenger instance from the list to configure or manage the connection."
  />
)

export const InstanceCreateBlankState = () => (
  <BlankState
    icon="link"
    title="No instances"
    description="A messenger instance is a connection to WhatsApp, Telegram, or another messenger. Create your first instance to work with chats."
  />
)

export const AgentSelectBlankState = () => (
  <BlankState
    icon="agent"
    title="Select an agent"
    description="Choose an agent from the list to start chatting or edit settings."
  />
)
