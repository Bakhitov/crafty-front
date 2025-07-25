import { type ElementType } from 'react'

export type IconType =
  | 'mistral'
  | 'gemini'
  | 'aws'
  | 'azure'
  | 'anthropic'
  | 'groq'
  | 'fireworks'
  | 'deepseek'
  | 'cohere'
  | 'ollama'
  | 'xai'
  | 'agno'
  | 'user'
  | 'agent'
  | 'open-ai'
  | 'sheet'
  | 'nextjs'
  | 'shadcn'
  | 'refresh'
  | 'edit'
  | 'save'
  | 'x'
  | 'arrow-down'
  | 'arrow-left'
  | 'send'
  | 'download'
  | 'hammer'
  | 'check'
  | 'chevron-down'
  | 'chevron-up'
  | 'plus-icon'
  | 'trash'
  | 'log-out'
  | 'paperclip'
  | 'brain'
  | 'settings'
  | 'image'
  | 'cpu'
  | 'workflow'
  | 'link'
  | 'message-circle'
  | 'key'
  | 'calendar'
  | 'qr-code'
  | 'bot'
  | 'more-horizontal'
  | 'play'
  | 'square'
  | 'refresh-cw'
  | 'trash-2'
  | 'loader-2'
  | 'copy'
  | 'alert-circle'
  | 'database'
  | 'file-text'
  | 'plus'
  | 'users'
  | 'whatsapp'
  | 'telegram'
  | 'discord'
  | 'slack'
  | 'messenger'
  | 'instagram'
  | 'facebook'
  | 'info'
  | 'clock'
  | 'server'
  | 'check-circle'
  | 'dot'

export interface IconProps {
  type: IconType
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'dot' | 'xxs' | 'default'
  className?: string
  color?: string
  disabled?: boolean
}

export type IconTypeMap = {
  [key in IconType]: ElementType
}
