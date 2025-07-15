'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useQueryState } from 'nuqs'
import Icon from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { TextArea } from '@/components/ui/textarea'
import { AGENTS_API } from '@/api/routes'
import { useRouter } from 'next/navigation'
import { usePlaygroundStore } from '@/store'
import useChatActions from '@/hooks/useChatActions'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type TabName = 'Settings' | 'Tools' | 'Configs'

const labelMap: { [key: string]: string } = {
  is_active_api: 'Active',
  is_public: 'Public',
  model_configuration: 'Model LLM',
  knowledge_config: 'Knowledge',
  memory_config: 'Memory',
  reasoning_config: 'Reasoning',
  storage_config: 'Storage',
  tools_config: 'Tools'
}

const getLabel = (key: string) => labelMap[key] || key.replace(/_/g, ' ')

const NEW_AGENT_TEMPLATE: AgentDetails = {
  name: 'New Agent',
  description: '',
  instructions: '',
  photo: null,
  is_active_api: true,
  is_public: false,
  is_active: true,
  settings: {
    markdown: true,
    add_datetime_to_instructions: true,
    debug_mode: true,
    stream: true,
    store_events: true,
    config_version: '1.0'
  },
  tools_config: {},
  model_configuration: {
    id: 'gpt-4.1',
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 0.9,
    frequency_penalty: 0.1,
    presence_penalty: 0.1
  },
  knowledge_config: {
    chunk_size: 1000,
    chunk_overlap: 200,
    add_references: false,
    max_references: 10,
    search_knowledge: true,
    update_knowledge: false,
    read_chat_history: false,
    references_format: 'json',
    similarity_threshold: 0.7,
    read_tool_call_history: false,
    enable_agentic_knowledge_filters: false
  },
  memory_config: {
    schema: 'ai',
    table_name: 'agent_memory',
    memory_type: 'postgres',
    db_url:
      'postgresql://postgres:Ginifi51!@db.wyehpfzafbjfvyjzgjss.supabase.co:5432/postgres',
    auto_upgrade_schema: false,
    enable_user_memories: false,
    enable_agentic_memory: true,
    enable_session_summaries: false
  },
  reasoning_config: {
    reasoning: false,
    stream_reasoning: false,
    reasoning_max_steps: 10,
    reasoning_min_steps: 1,
    save_reasoning_steps: true
  },
  storage_config: {
    db_url:
      'postgresql://postgres:Ginifi51!@db.wyehpfzafbjfvyjzgjss.supabase.co:5432/postgres',
    enabled: true,
    storage_type: 'postgres',
    table_name: 'sessions',
    schema: 'ai'
  }
}

interface AgentDetails {
  // Keeping this interface simple, the component dynamically handles all fields from the API
  name: string | null
  description: string | null
  instructions: string | null
  photo: string | null
  [key: string]: unknown // Allow any other properties
}

const transliterate = (text: string): string => {
  const map: { [key: string]: string } = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'yo',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'c',
    ч: 'ch',
    ш: 'sh',
    щ: 'sch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
    А: 'A',
    Б: 'B',
    В: 'V',
    Г: 'G',
    Д: 'D',
    Е: 'E',
    Ё: 'Yo',
    Ж: 'Zh',
    З: 'Z',
    И: 'I',
    Й: 'Y',
    К: 'K',
    Л: 'L',
    М: 'M',
    Н: 'N',
    О: 'O',
    П: 'P',
    Р: 'R',
    С: 'S',
    Т: 'T',
    У: 'U',
    Ф: 'F',
    Х: 'H',
    Ц: 'C',
    Ч: 'Ch',
    Ш: 'Sh',
    Щ: 'Sch',
    Ъ: '',
    Ы: 'Y',
    Ь: '',
    Э: 'E',
    Ю: 'Yu',
    Я: 'Ya'
  }
  return text
    .split('')
    .map((char) => map[char] || char)
    .join('')
}

const AgentInfoSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [agentDetails, setAgentDetails] = useState<AgentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [agentId, setAgentId] = useQueryState('agent')
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabName>('Settings')
  const [editableAgentDetails, setEditableAgentDetails] =
    useState<AgentDetails | null>(null)
  const router = useRouter()
  const { selectedEndpoint } = usePlaygroundStore()
  const { initializePlayground, clearChat } = useChatActions()

  const isCreatingNewAgent = agentId === 'new'

  const fetchAgentDetails = async () => {
    if (!agentId || isCreatingNewAgent) {
      setAgentDetails(null)
      if (isCreatingNewAgent) {
        setEditableAgentDetails(JSON.parse(JSON.stringify(NEW_AGENT_TEMPLATE)))
        setIsEditing(true)
      }
      return
    }
    setIsLoading(true)
    const { data, error } = await supabase
      .from('dynamic_agents')
      .select('*')
      .eq('agent_id', agentId)
      .single()

    if (error) {
      console.error('Error fetching agent details:', error)
      toast.error('Failed to fetch agent details.')
      setAgentDetails(null)
    } else {
      setAgentDetails(data as AgentDetails)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    // Загружаем детали агента при изменении agentId
    if (isCreatingNewAgent) {
      setEditableAgentDetails(JSON.parse(JSON.stringify(NEW_AGENT_TEMPLATE)))
      setIsEditing(true)
      setAgentDetails(null) // Очищаем старые детали
    } else {
      fetchAgentDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, isCreatingNewAgent])

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditableAgentDetails(JSON.parse(JSON.stringify(agentDetails)))
    }
    setIsEditing(!isEditing)
  }

  const handleCancel = () => {
    if (isCreatingNewAgent) {
      router.push('/playground')
      setAgentId(null, { shallow: true })
    }
    setIsEditing(false)
    setEditableAgentDetails(null)
  }

  const handleSave = async () => {
    if (!editableAgentDetails) return
    setIsLoading(true)

    if (
      isCreatingNewAgent &&
      (!editableAgentDetails?.description?.trim() ||
        !editableAgentDetails?.instructions?.trim())
    ) {
      toast.error('Description and instructions are required.')
      setIsLoading(false)
      return
    }

    try {
      const payload: Record<string, unknown> = { ...editableAgentDetails }

      delete payload.photo
      delete payload.id

      if (!isCreatingNewAgent) {
        delete payload.agent_id
      } else {
        const name = (payload.name as string) || 'agent'
        let translitName = transliterate(name)
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
        if (!translitName) translitName = 'agent'
        const timestamp = Math.floor(Date.now() / 1000).toString()
        payload.agent_id = `${translitName}_${timestamp}`
      }

      for (const key in payload) {
        if (
          (key.endsWith('_config') ||
            key.endsWith('_settings') ||
            key === 'settings') &&
          typeof payload[key] === 'string'
        ) {
          try {
            if (payload[key]) {
              payload[key] = JSON.parse(payload[key] as string)
            }
          } catch {
            toast.error(`Invalid JSON in field: ${key}`)
            setIsLoading(false)
            return
          }
        }
      }

      let response
      let newAgentId = null

      if (isCreatingNewAgent) {
        const url = `${selectedEndpoint}${AGENTS_API}`
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response || !response.ok) {
          const errorData = response
            ? await response.json()
            : { detail: 'An unknown error occurred' }
          throw new Error(
            (errorData as { detail: string }).detail ||
              `Failed to ${isCreatingNewAgent ? 'create' : 'update'} agent`
          )
        }

        const responseData = await response.json()
        newAgentId = responseData.agent_id
        if (newAgentId) {
          await initializePlayground()
          setAgentId(newAgentId, { shallow: true, history: 'replace' })
          clearChat()
          toast.success('Agent created successfully!')
        }
      } else {
        const url = `${selectedEndpoint}${AGENTS_API}/${agentId}`
        response = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response || !response.ok) {
          const errorData = response
            ? await response.json()
            : { detail: 'An unknown error occurred' }
          throw new Error(
            (errorData as { detail: string }).detail ||
              `Failed to ${isCreatingNewAgent ? 'create' : 'update'} agent`
          )
        }

        const responseData = await response.json()
        newAgentId = responseData.agent_id
        if (newAgentId) {
          await initializePlayground()
          setAgentId(newAgentId, { shallow: true, history: 'replace' })
          clearChat()
          toast.success('Agent created successfully!')
        }
      }

      await fetchAgentDetails()
      setIsEditing(false)
    } catch (error: unknown) {
      console.error(
        `Error ${isCreatingNewAgent ? 'creating' : 'updating'} agent:`,
        error
      )
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred.'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!agentId || isCreatingNewAgent) return
    const isConfirmed = window.confirm(
      'Are you sure you want to delete this agent?'
    )
    if (!isConfirmed) return

    setIsLoading(true)
    try {
      const url = `${selectedEndpoint}${AGENTS_API}/${agentId}`
      const response = await fetch(url, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          (errorData as { detail: string }).detail || 'Failed to delete agent'
        )
      }

      toast.success('Agent deleted successfully!')
      // Redirect or clear selection after deletion
      router.push('/playground')
      setAgentDetails(null)
      await initializePlayground() // Refresh agent list in the sidebar
      usePlaygroundStore.getState().setMessages([])
      setIsEditing(false)
    } catch (error: unknown) {
      console.error('Error deleting agent:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred.'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: unknown) => {
    if (editableAgentDetails) {
      if (field === 'storage_config') {
        try {
          const parsed = JSON.parse(value as string)
          if (parsed.db_url === '***') {
            return // Do not update if the URL is masked
          }
        } catch {
          // ignore parsing error
        }
      }

      setEditableAgentDetails({
        ...editableAgentDetails,
        [field]: value
      })
    }
  }

  const renderField = (key: string, value: unknown) => {
    // Boolean fields handling
    if (key === 'is_active_api' || key === 'is_public') {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            id={key}
            checked={!!value}
            disabled={!isEditing}
            onCheckedChange={
              isEditing
                ? (checked) => handleInputChange(key, checked)
                : undefined
            }
          />
          <Label htmlFor={key} className="text-muted text-xs capitalize">
            {getLabel(key)}
          </Label>
        </div>
      )
    }

    // Editing mode: render inputs
    if (isEditing) {
      if (key === 'description' || key === 'instructions') {
        return (
          <TextArea
            value={value ? String(value) : ''}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="min-h-[60px] w-full whitespace-pre-wrap break-words rounded-md border border-zinc-700 bg-zinc-900 p-2 font-sans text-xs"
            rows={5}
            placeholder="Add description or instructions"
          />
        )
      }

      const isJsonObject =
        key.endsWith('_config') ||
        key.endsWith('_settings') ||
        key === 'settings'
      let textValue = ''

      if (typeof value === 'object' && value !== null) {
        let displayValue = JSON.parse(JSON.stringify(value))
        if (
          key === 'storage_config' &&
          displayValue.db_url ===
            'postgresql://postgres:Ginifi51!@db.wyehpfzafbjfvyjzgjss.supabase.co:5432/postgres'
        ) {
          displayValue = { ...displayValue, db_url: '***' }
        }
        textValue = JSON.stringify(displayValue, null, 2)
      } else if (value !== null && value !== undefined) {
        textValue = String(value)
      }

      return (
        <TextArea
          value={textValue}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            handleInputChange(key, e.target.value)
          }
          className="min-h-[60px] w-full whitespace-pre-wrap break-words rounded-md border border-zinc-700 bg-zinc-900 p-2 text-xs"
          rows={isJsonObject ? 5 : 3}
          placeholder="Not provided"
        />
      )
    }

    // View mode: render text
    if (key === 'description' || key === 'instructions') {
      return (
        <p className="text-muted font-sans text-xs">
          {value ? String(value) : ''}
        </p>
      )
    }

    if (value === null || value === undefined || value === '') {
      return <p className="text-muted text-xs italic">Not provided</p>
    }

    if (typeof value === 'object') {
      const displayValue: Record<string, unknown> = { ...value }
      if (
        key === 'storage_config' &&
        typeof displayValue['db_url'] === 'string' &&
        displayValue['db_url'] ===
          'postgresql://postgres:Ginifi51!@db.wyehpfzafbjfvyjzgjss.supabase.co:5432/postgres'
      ) {
        displayValue['db_url'] = '***'
      }
      return (
        <pre className="bg-accent max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md p-2 text-xs">
          {JSON.stringify(displayValue, null, 2)}
        </pre>
      )
    }

    if (key.endsWith('_at') && typeof value === 'string') {
      try {
        const dateStr = new Date(value).toLocaleString()
        return <p className="text-muted text-xs">{dateStr}</p>
      } catch {
        // Ignore parse error
      }
    }

    return <p className="text-muted break-words text-xs">{String(value)}</p>
  }

  const currentDetails = isEditing ? editableAgentDetails : agentDetails

  const order = [
    'description',
    'instructions'
    // все остальные ключи будут добавлены в конец
  ]

  const tabConfig: Record<TabName, string[]> = {
    Settings: ['settings'],
    Tools: ['tools_config'],
    Configs: [
      'model_configuration',
      'knowledge_config',
      'memory_config',
      'reasoning_config',
      'storage_config'
    ]
  }
  const allTabKeys = Object.values(tabConfig).flat()

  const sortedKeys = currentDetails
    ? Object.keys(currentDetails)
        .filter(
          (key) =>
            ![
              'photo',
              'name',
              'agent_id',
              'is_active_api',
              'is_public',
              'company_id',
              'is_active',
              'created_at',
              'updated_at',
              'team_config'
            ].includes(key)
        )
        .sort((a, b) => {
          const indexA = order.indexOf(a)
          const indexB = order.indexOf(b)
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB
          }
          if (indexA !== -1) return -1
          if (indexB !== -1) return 1
          return a.localeCompare(b)
        })
    : []

  const generalKeys = sortedKeys.filter((key) => !allTabKeys.includes(key))

  return (
    <motion.aside
      className="font-dmmono relative flex h-screen shrink-0 grow-0 flex-col overflow-hidden px-2 py-3"
      initial={{ width: '0rem' }}
      animate={{ width: isCollapsed ? '2.5rem' : '20.6rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="absolute right-2 top-4 z-10 flex items-center gap-2">
        {!isCollapsed && agentDetails && (
          <motion.button
            onClick={handleEditToggle}
            className="p-1"
            aria-label={isEditing ? 'Cancel editing' : 'Edit agent'}
            type="button"
            whileTap={{ scale: 0.95 }}
          >
            <Icon type={isEditing ? 'x' : 'edit'} size="xs" />
          </motion.button>
        )}
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
          whileTap={{ scale: 0.95 }}
        >
          <Icon
            type="sheet"
            size="xs"
            className={`transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
          />
        </motion.button>
      </div>

      <motion.div
        className="mt-10 flex w-80 flex-grow flex-col overflow-hidden pr-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? 20 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ pointerEvents: isCollapsed ? 'none' : 'auto' }}
      >
        {isLoading && !agentDetails && !isCreatingNewAgent && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={idx} className="h-4 w-full rounded" />
            ))}
          </div>
        )}

        {!isLoading && currentDetails && (
          <div className="flex h-full flex-col space-y-3">
            <div className="space-y-3">
              <Icon type="agent" size="md" className="text-primary mx-auto" />

              {agentId && !isCreatingNewAgent && (
                <p className="text-muted text-center text-xs">{agentId}</p>
              )}

              {isEditing ? (
                <TextArea
                  value={currentDetails.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleInputChange('name', e.target.value)
                  }
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 p-2 text-center text-sm font-bold uppercase"
                />
              ) : (
                <h2 className="text-primary text-center text-sm font-bold uppercase">
                  {currentDetails.name}
                </h2>
              )}

              <div className="flex justify-center gap-x-6 py-2">
                {renderField(
                  'is_active_api',
                  currentDetails.is_active_api ?? false
                )}
                {renderField('is_public', currentDetails.is_public ?? false)}
              </div>
            </div>

            <div className="flex-grow space-y-4 overflow-y-auto pr-1">
              {generalKeys.map((key) => {
                const value = currentDetails[key]

                return (
                  <details
                    key={key}
                    className="space-y-1"
                    open={Boolean(isEditing || value)}
                  >
                    <summary className="text-primary cursor-pointer list-none text-xs font-semibold uppercase">
                      {getLabel(key)}
                    </summary>
                    <div className="pl-2">{renderField(key, value)}</div>
                  </details>
                )
              })}

              {/* Tabs for configs */}
              <div className="mt-6">
                <div className="flex justify-center border-b border-zinc-700">
                  {(Object.keys(tabConfig) as TabName[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 focus:outline-none',
                        activeTab === tab
                          ? 'border-primary text-primary border-b-2'
                          : 'text-muted hover:text-primary border-b-2 border-transparent'
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="space-y-2 pt-4">
                  {sortedKeys
                    .filter((key) => tabConfig[activeTab]?.includes(key))
                    .map((key) => {
                      const value = currentDetails[key]

                      return (
                        <details
                          key={key}
                          className="space-y-1"
                          open={Boolean(isEditing || value)}
                        >
                          <summary className="text-primary cursor-pointer list-none text-xs font-semibold uppercase">
                            {getLabel(key)}
                          </summary>
                          <div className="pl-2">{renderField(key, value)}</div>
                        </details>
                      )
                    })}
                </div>
              </div>
            </div>
            {isEditing && (
              <div className="flex flex-shrink-0 items-center justify-end gap-2 pb-1.5 pt-4">
                {!isCreatingNewAgent && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive mr-auto"
                  >
                    <Icon type="trash" size="sm" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="border-primary/15"
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-primary text-background hover:bg-primary/80"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading
                    ? `${isCreatingNewAgent ? 'Creating' : 'Saving'}...`
                    : isCreatingNewAgent
                      ? 'Create Agent'
                      : 'Save'}
                </Button>
              </div>
            )}
          </div>
        )}

        {!isLoading && !agentDetails && !isCreatingNewAgent && (
          <p className="text-muted text-center text-xs">Агент не выбран</p>
        )}
      </motion.div>
    </motion.aside>
  )
}

export default AgentInfoSidebar
