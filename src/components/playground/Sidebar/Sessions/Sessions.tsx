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
    hasStorage,
    setSessionsData,
    isAgentSwitching,
    isSessionsLoading
  } = usePlaygroundStore()
  const [isScrolling, setIsScrolling] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  )
  const { getSessions } = useSessionLoader()
  const { completeAgentSwitch } = useChatActions()
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const { user } = useAuthContext()
  const lastLoadedAgentRef = useRef<string | null>(null)

  const handleScroll = useCallback(() => {
    setIsScrolling(true)
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 1500)
  }, [])

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Загрузка сессий при смене агента
  useEffect(() => {
    if (isAgentSwitching) return

    if (!selectedEndpoint || !agentId || !hasStorage) {
      lastLoadedAgentRef.current = null
      setSessionsData(() => null)
      return
    }

    if (agentId === 'new') {
      lastLoadedAgentRef.current = null
      setSessionsData([])
      return
    }

    if (
      !isEndpointLoading &&
      user?.id &&
      lastLoadedAgentRef.current !== agentId
    ) {
      lastLoadedAgentRef.current = agentId
      getSessions(agentId)
    }
  }, [
    selectedEndpoint,
    agentId,
    getSessions,
    isEndpointLoading,
    hasStorage,
    setSessionsData,
    user?.id,
    isAgentSwitching
  ])

  // Завершение переключения агента
  useEffect(() => {
    if (
      isAgentSwitching &&
      !isSessionsLoading &&
      (sessionsData !== null || !hasStorage)
    ) {
      completeAgentSwitch()
    }
  }, [
    isAgentSwitching,
    isSessionsLoading,
    sessionsData,
    hasStorage,
    completeAgentSwitch
  ])

  // Очистка sessionId из URL при переключении агента
  useEffect(() => {
    if (isAgentSwitching && sessionId) {
      const url = new URL(window.location.href)
      url.searchParams.delete('session')
      window.history.replaceState({}, '', url.toString())
    }
  }, [isAgentSwitching, sessionId])

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

  const renderHistoryContent = () => {
    if (isSessionsLoading || isEndpointLoading) {
      return (
        <div className="mt-4 h-full w-full overflow-y-auto">
          <SkeletonList skeletonCount={5} />
        </div>
      )
    }

    return (
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
    )
  }

  return <div className="h-full w-full">{renderHistoryContent()}</div>
}

export default Sessions
