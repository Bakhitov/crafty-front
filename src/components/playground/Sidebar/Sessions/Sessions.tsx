'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { usePlaygroundStore } from '@/store'
import { useQueryState } from 'nuqs'
import SessionItem from './SessionItem'

import useSessionLoader from '@/hooks/useSessionLoader'
import { useAuthContext } from '@/components/AuthProvider'
import useChatActions from '@/hooks/useChatActions'

import { cn } from '@/lib/utils'
import { FC } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface SkeletonListProps {
  skeletonCount: number
}

const SkeletonList: FC<SkeletonListProps> = ({ skeletonCount }) => {
  const skeletons = useMemo(
    () => Array.from({ length: skeletonCount }, (_, i) => i),
    [skeletonCount]
  )

  return skeletons.map((skeleton, index) => (
    <Skeleton
      key={skeleton}
      className={cn(
        'mb-1 h-11 rounded-lg px-3 py-2',
        index > 0 && 'bg-background-secondary'
      )}
    />
  ))
}

dayjs.extend(utc)

const formatDate = (
  timestamp: number,
  format: 'natural' | 'full' = 'full'
): string => {
  const date = dayjs.unix(timestamp).utc()
  return format === 'natural'
    ? date.format('HH:mm')
    : date.format('YYYY-MM-DD HH:mm:ss')
}

const Sessions = () => {
  const [agentId] = useQueryState('agent', {
    parse: (value) => value || undefined,
    history: 'push'
  })
  const [sessionId] = useQueryState('session')
  const {
    selectedEndpoint,
    isEndpointLoading,
    sessionsData,
    hydrated,
    hasStorage,
    setSessionsData,
    isAgentSwitching
  } = usePlaygroundStore()
  const [isScrolling, setIsScrolling] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  )
  const { getSessions } = useSessionLoader()
  const { completeAgentSwitch } = useChatActions()
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const { isSessionsLoading } = usePlaygroundStore()
  const { user } = useAuthContext() // Получаем user из AuthContext

  const handleScroll = () => {
    setIsScrolling(true)

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 1500)
  }

  // Cleanup the scroll timeout when component unmounts
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Если идет переключение агента, не загружаем сессии
    if (isAgentSwitching) {
      console.log('🔄 Sessions: Skipping session loading - agent is switching')
      return
    }

    if (!selectedEndpoint || !agentId || !hasStorage) {
      console.log('🔄 Sessions: Clearing sessions data - conditions not met:', {
        hasSelectedEndpoint: !!selectedEndpoint,
        hasAgentId: !!agentId,
        hasStorage,
        agentId,
        isAgentSwitching
      })
      setSessionsData(() => null)
      return
    }
    if (agentId === 'new') {
      console.log('🔄 Sessions: Setting empty sessions for new agent')
      setSessionsData([])
      return
    }
    if (!isEndpointLoading) {
      console.log(
        '🔄 Sessions: Clearing sessions before loading new ones for agent:',
        agentId
      )
      setSessionsData(() => null)
      console.log(
        '🔄 Sessions: Loading sessions for user:',
        user?.id,
        'agent:',
        agentId,
        'conditions:',
        {
          hasSelectedEndpoint: !!selectedEndpoint,
          hasAgentId: !!agentId,
          hasStorage,
          isEndpointLoading,
          userEmail: user?.email,
          isAgentSwitching
        }
      )
      getSessions(agentId)
    }
  }, [
    selectedEndpoint,
    agentId,
    getSessions,
    isEndpointLoading,
    hasStorage,
    setSessionsData,
    user?.id, // Добавляем user?.id в зависимости
    user?.email, // Добавляем user?.email в зависимости
    isAgentSwitching // Добавляем isAgentSwitching в зависимости
  ])

  // Завершаем переключение агента после загрузки сессий
  useEffect(() => {
    if (
      isAgentSwitching &&
      !isSessionsLoading &&
      (sessionsData !== null || !hasStorage)
    ) {
      console.log(
        '✅ Sessions: Completing agent switch after sessions loaded or no storage'
      )
      completeAgentSwitch()
    }
  }, [
    isAgentSwitching,
    isSessionsLoading,
    sessionsData,
    hasStorage,
    completeAgentSwitch
  ])

  // Load a specific session from URL only after sessions are loaded and session exists
  useEffect(() => {
    // ОТКЛЮЧАЕМ автоматическую загрузку сессий из URL
    // Всегда показываем заглушку "начать новый чат" при переключении/открытии агента

    // Если идет переключение агента, очищаем sessionId из URL
    if (isAgentSwitching && sessionId) {
      console.log(
        '🧹 Sessions: Clearing sessionId from URL - agent is switching'
      )
      const url = new URL(window.location.href)
      url.searchParams.delete('session')
      window.history.replaceState({}, '', url.toString())
      return
    }

    // Если идет переключение агента, не загружаем сессию из URL
    if (isAgentSwitching) {
      console.log(
        '📋 Sessions: Skipping URL session loading - agent is switching'
      )
      return
    }

    // БОЛЬШЕ НЕ ЗАГРУЖАЕМ СЕССИИ АВТОМАТИЧЕСКИ ИЗ URL
    // Пользователь должен вручную кликнуть на сессию в сайдбаре
  }, [
    sessionId,
    agentId,
    selectedEndpoint,
    hydrated,
    sessionsData,
    isSessionsLoading,
    isAgentSwitching
  ])

  useEffect(() => {
    if (sessionId) {
      setSelectedSessionId(sessionId)
    }
  }, [sessionId])

  const formattedSessionsData = useMemo(() => {
    if (!sessionsData || !Array.isArray(sessionsData)) return []

    return sessionsData.map((entry) => ({
      ...entry,
      created_at: entry.created_at,
      formatted_time: formatDate(entry.created_at, 'natural')
    }))
  }, [sessionsData])

  const handleSessionClick = useCallback(
    (id: string) => () => setSelectedSessionId(id),
    []
  )

  if (isSessionsLoading || isEndpointLoading)
    return (
      <div className="w-full">
        <div className="mt-4 h-full w-full overflow-y-auto">
          <SkeletonList skeletonCount={5} />
        </div>
      </div>
    )
  return (
    <div className="h-full w-full">
      <div
        className={`font-geist h-full overflow-y-auto transition-all duration-300 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:transition-opacity [&::-webkit-scrollbar]:duration-300 ${isScrolling ? '[&::-webkit-scrollbar-thumb]:bg-background [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:opacity-0' : '[&::-webkit-scrollbar]:opacity-100'}`}
        onScroll={handleScroll}
        onMouseOver={() => setIsScrolling(true)}
        onMouseLeave={handleScroll}
      >
        <div className="flex flex-col gap-y-1 pr-1">
          {formattedSessionsData.map((entry, index) => (
            <SessionItem
              key={`${entry.session_id}-${index}`}
              {...entry}
              isSelected={selectedSessionId === entry.session_id}
              onSessionClick={handleSessionClick(entry.session_id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Sessions
