// Оптимизированный хук для переключения агентов
// Предотвращает избыточные запросы при клике на агента

import { useCallback, useRef } from 'react'
import { usePlaygroundStore } from '@/store'
import { useQueryState } from 'nuqs'
import useChatActions from '@/hooks/useChatActions'

export function useAgentSwitch() {
  const { setSelectedAgent, setSelectedModel, setHasStorage } =
    usePlaygroundStore()

  const { startAgentSwitch, completeAgentSwitch, focusChatInput } =
    useChatActions()
  const [, setAgentId] = useQueryState('agent')
  const [, setSessionId] = useQueryState('session')

  // Предотвращаем множественные одновременные переключения
  const switchInProgressRef = useRef(false)

  const switchToAgent = useCallback(
    async (agent: {
      value: string
      label: string
      model: { provider: string }
      storage?: boolean
      storage_config?: { enabled?: boolean }
    }) => {
      // Предотвращаем множественные одновременные переключения
      if (switchInProgressRef.current) {
        console.log('🔄 useAgentSwitch: Switch already in progress, skipping')
        return
      }

      try {
        switchInProgressRef.current = true

        console.log('🔄 useAgentSwitch: Switching to agent:', {
          agentId: agent.value,
          agentName: agent.label,
          model: agent.model.provider
        })

        // Начинаем переключение агента (блокирует лишние запросы)
        startAgentSwitch()

        // СИНХРОННО очищаем сессию из URL чтобы предотвратить загрузку старой сессии
        const url = new URL(window.location.href)
        url.searchParams.delete('session')
        window.history.replaceState({}, '', url.toString())
        console.log(
          '🧹 useAgentSwitch: Cleared sessionId from URL synchronously'
        )

        // Очищаем сессию из URL
        setSessionId(null)

        // Устанавливаем нового агента в store (БЕЗ перезагрузки данных)
        setSelectedAgent(agent)
        setSelectedModel(agent.model.provider)
        setHasStorage(agent.storage || agent.storage_config?.enabled || false)

        // Устанавливаем агента в URL
        await setAgentId(agent.value)

        console.log('✅ useAgentSwitch: Agent switched successfully:', {
          agentId: agent.value,
          agentName: agent.label
        })

        // НЕ завершаем переключение агента здесь - это должно происходить после загрузки сессий
        // completeAgentSwitch() будет вызван в Sessions.tsx после загрузки сессий
        focusChatInput()
      } catch (error) {
        console.error('❌ useAgentSwitch: Error switching agent:', error)
        completeAgentSwitch() // Разблокируем при ошибке
      } finally {
        switchInProgressRef.current = false
      }
    },
    [
      setSelectedAgent,
      setSelectedModel,
      setHasStorage,
      setAgentId,
      setSessionId,
      startAgentSwitch,
      completeAgentSwitch,
      focusChatInput
    ]
  )

  return {
    switchToAgent
  }
}
