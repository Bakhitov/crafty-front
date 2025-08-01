'use client'

import { useCallback, useState, useEffect } from 'react'
import { useQueryState } from 'nuqs'
import { usePlaygroundStore } from '@/store'
import useChatActions from '@/hooks/useChatActions'
import { useCompanyContext } from '@/components/CompanyProvider'
import Icon from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { cn } from '@/lib/utils'
import { getProviderIcon } from '@/lib/modelProvider'

import { toast } from 'sonner'
import { getAPIClient, type Agent as APIAgent } from '@/lib/apiClient'
import type { Agent } from '@/types/playground'
import SearchAgents from '@/components/playground/SearchAgents'
import { BsSearch } from 'react-icons/bs'

interface AgentItemProps {
  agentId: string
  name: string
  modelProvider?: string
  isSelected: boolean
  isPublic?: boolean
  companyId?: string
  onAgentClick: () => void
  onEditClick: () => void
  onCopyClick: () => void
}

const AgentItem = ({
  agentId,
  name,
  modelProvider,
  isSelected,
  isPublic,
  companyId,
  onAgentClick,
  onEditClick,
  onCopyClick
}: AgentItemProps) => {
  const providerIcon = modelProvider ? getProviderIcon(modelProvider) : null
  const { company } = useCompanyContext()
  const [canEdit, setCanEdit] = useState(false)
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Определяем возможность редактирования на основе company_id
  const isOwnAgent = !!(company?.id && companyId === company.id)

  // Упрощенная проверка разрешений без API запроса
  useEffect(() => {
    // Логика редактирования:
    // - Агенты своей компании (приватные и публичные) - можно редактировать
    // - Публичные агенты других компаний - нельзя редактировать
    // - Приватные агенты других компаний - нельзя редактировать
    const canEditAgent = isOwnAgent
    setCanEdit(canEditAgent)
    setPermissionsLoaded(true)
  }, [isOwnAgent])

  const handleEditClick = () => {
    if (!canEdit) {
      toast.error('У вас нет прав для редактирования этого агента')
      return
    }
    setIsMenuOpen(false)
    onEditClick()
  }

  const handleCopyClick = () => {
    setIsMenuOpen(false)
    onCopyClick()
  }

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
          <div className="flex items-center gap-1">
            <h4
              className={cn(
                'font-geist truncate text-xs font-medium',
                isSelected && 'text-primary'
              )}
            >
              {name}
            </h4>
            {/* Индикатор публичного агента - уменьшенный размер и менее яркий */}
            {isPublic && (
              <div title="Public agent">
                <Icon type="users" size="xxs" className="text-muted shrink-0" />
              </div>
            )}
            {/* Индикатор приватного агента - уменьшенный размер и менее яркий */}
            {!isPublic && (
              <div title="Private agent">
                <Icon type="key" size="xxs" className="text-muted shrink-0" />
              </div>
            )}
          </div>
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

        {/* Меню с тремя точками - показывается для всех агентов */}
        {permissionsLoaded && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                setIsMenuOpen(!isMenuOpen)
              }}
              className="h-6 w-6 opacity-0 transition-opacity hover:bg-transparent group-hover:opacity-100"
              title="Actions"
            >
              <Icon
                type="more-horizontal"
                size="xs"
                className="text-muted-foreground hover:text-primary rotate-90"
              />
            </Button>

            {isMenuOpen && (
              <>
                {/* Backdrop для закрытия меню */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />

                {/* Выпадающее меню */}
                <div className="bg-primary text-secondary bg-background-primary absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border shadow-md">
                  <div className="flex flex-col gap-1 p-1">
                    {/* Редактирование доступно только для приватных агентов */}
                    {canEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditClick()
                        }}
                        className="hover:bg-primary/10 hover:text-secondary flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-sm"
                      >
                        <Icon type="edit" size="xs" />
                        <span>Edit</span>
                      </button>
                    )}

                    {/* Копирование доступно для всех агентов */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyClick()
                      }}
                      className="hover:bg-primary/10 hover:text-secondary flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-sm"
                    >
                      <Icon type="copy" size="xs" />
                      <span>Duplicate</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
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

const AgentsList = () => {
  const {
    agents,
    setSelectedAgent,
    isEndpointLoading,
    setIsAgentCreationMode,
    setEditingAgentId,
    setCopyingAgentData,
    selectedEndpoint,
    currentCompanyId
  } = usePlaygroundStore()
  const { clearChat, focusChatInput } = useChatActions()
  const [agentId, setAgentId] = useQueryState('agent')
  const [showSearch, setShowSearch] = useState(false)

  const handleAgentClick = useCallback(
    async (agent: {
      value: string
      label: string
      model: { provider: string }
    }) => {
      try {
        console.log('🔄 AgentsList: Clicking on agent:', agent.label)

        // Очищаем чат
        clearChat()

        // Очищаем sessionId из URL для создания нового чата
        const url = new URL(window.location.href)
        url.searchParams.delete('session')
        window.history.replaceState({}, '', url.toString())
        console.log('🧹 AgentsList: Cleared sessionId from URL for new chat')

        // Устанавливаем нового агента
        setSelectedAgent(agent)
        await setAgentId(agent.value)

        // Фокусируем поле ввода
        focusChatInput()
      } catch (error) {
        console.error('Error selecting agent:', error)
      }
    },
    [setSelectedAgent, setAgentId, clearChat, focusChatInput]
  )

  const handleEditAgent = useCallback(
    (agent: { value: string }) => {
      setEditingAgentId(agent.value)
      setIsAgentCreationMode(true)
    },
    [setEditingAgentId, setIsAgentCreationMode]
  )

  const handleCopyAgent = useCallback(
    async (agent: {
      value: string
      label: string
      model: { provider: string }
      is_public?: boolean
      company_id?: string
    }) => {
      try {
        if (!selectedEndpoint) {
          toast.error('No endpoint selected')
          return
        }

        // Используем новый API клиент для получения данных агента
        const apiClient = getAPIClient(selectedEndpoint)
        const fullAgentData = await apiClient.getAgent(agent.value)

        // Модифицируем данные для копии - убираем agent_id и создаем новый объект
        const copyData: Agent = {
          agent_id: `temp-copy-${Date.now()}`, // Временный ID для копии
          name: `${fullAgentData.name || 'Agent'} (copy)`,
          description: fullAgentData.description || '', // Обеспечиваем что description не undefined
          instructions: fullAgentData.instructions,
          is_active: fullAgentData.is_active ?? true, // Обеспечиваем что is_active не undefined
          is_active_api: fullAgentData.is_active_api ?? true, // Обеспечиваем что is_active_api не undefined
          is_public: false, // Копии всегда приватные
          company_id: currentCompanyId || '',
          // Обязательные поля для типа Agent
          model_config: fullAgentData.model_config || {
            id: '',
            provider: ''
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          agent_config: fullAgentData.agent_config || {},
          // Приводим конфигурации к нужным типам
          model_configuration: fullAgentData.model_configuration
            ? {
                provider: fullAgentData.model_configuration.provider || '',
                id: fullAgentData.model_configuration.id || '',
                temperature: fullAgentData.model_configuration.temperature,
                max_tokens: fullAgentData.model_configuration.max_tokens,
                top_p: fullAgentData.model_configuration.top_p,
                frequency_penalty:
                  fullAgentData.model_configuration.frequency_penalty,
                presence_penalty:
                  fullAgentData.model_configuration.presence_penalty,
                stop: fullAgentData.model_configuration.stop,
                seed: fullAgentData.model_configuration.seed,
                timeout: fullAgentData.model_configuration.timeout,
                max_retries: fullAgentData.model_configuration.max_retries
              }
            : undefined,
          storage_config: fullAgentData.storage_config,
          settings: fullAgentData.settings
        }

        // Сохраняем данные копируемого агента в store
        setCopyingAgentData(copyData)

        // Очищаем editingAgentId чтобы был режим создания, а не редактирования
        setEditingAgentId(null)

        // Открываем AgentCreator
        setIsAgentCreationMode(true)

        toast.success(`Copying agent "${agent.label}"`)
      } catch (error) {
        console.error('Error copying agent:', error)
        toast.error('Error copying agent')
      }
    },
    [
      selectedEndpoint,
      setCopyingAgentData,
      setEditingAgentId,
      setIsAgentCreationMode,
      currentCompanyId
    ]
  )

  const handleSearchAgentSelect = useCallback(
    async (agent: APIAgent) => {
      try {
        // Преобразуем Agent в AgentOption формат - создаем совместимый объект
        const agentOption = {
          value: agent.agent_id,
          label: agent.name || agent.agent_id,
          model: {
            provider: agent.model_config?.provider || ''
          },
          storage: false, // Устанавливаем по умолчанию false для новой структуры
          storage_config: undefined,
          is_public: agent.is_public,
          company_id: agent.company_id,
          category: agent.category,
          photo: agent.photo
        }
        setSelectedAgent(agentOption)
        await setAgentId(agent.agent_id)
        clearChat()
        focusChatInput()
      } catch (error) {
        console.error('Error selecting search agent:', error)
        toast.error('Failed to select agent')
      }
    },
    [setSelectedAgent, setAgentId, clearChat, focusChatInput]
  )

  if (isEndpointLoading) {
    return (
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-primary text-xs font-medium uppercase">
            Agents
          </div>
        </div>
        <div className="mb-3">
          <Skeleton className="border-primary/20 h-9 w-full rounded-xl border-dashed" />
        </div>
        <div className="[&::-webkit-scrollbar-thumb]:bg-border h-full overflow-y-auto transition-all duration-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
          <SkeletonList skeletonCount={5} />
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
      <div className="mb-3 flex gap-2">
        <Button
          onClick={() => {
            setEditingAgentId(null)
            setIsAgentCreationMode(true)
          }}
          size="lg"
          variant="outline"
          className="border-primary/20 text-primary hover:bg-primary/10 h-9 flex-1 rounded-xl border-dashed text-xs font-medium"
        >
          <Icon type="plus-icon" size="xs" className="text-primary" />
          <span className="uppercase">Create Agent</span>
        </Button>
        <Button
          onClick={() => setShowSearch(true)}
          size="lg"
          variant="outline"
          className="border-primary/20 text-primary hover:bg-primary/10 h-9 w-9 rounded-xl border-dashed"
          title="Search Agents"
        >
          <BsSearch className="h-4 w-4" />
        </Button>
      </div>

      <div className="[&::-webkit-scrollbar-thumb]:bg-border flex-1 overflow-y-auto transition-all duration-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
        <div className="flex flex-col gap-y-1 pb-[10px] pr-1">
          {agents.map((agent) => (
            <AgentItem
              key={agent.value}
              agentId={agent.value}
              name={agent.label}
              modelProvider={agent.model.provider}
              isSelected={agentId === agent.value}
              isPublic={agent.is_public}
              companyId={agent.company_id}
              onAgentClick={() => handleAgentClick(agent)}
              onEditClick={() => handleEditAgent(agent)}
              onCopyClick={() => handleCopyAgent(agent)}
            />
          ))}
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <SearchAgents
          onAgentSelect={handleSearchAgentSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  )
}

export default AgentsList
