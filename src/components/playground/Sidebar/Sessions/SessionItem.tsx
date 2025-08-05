import { useQueryState } from 'nuqs'
import { SessionEntry } from '@/types/playground'
import { Button } from '../../../ui/button'
import useSessionLoader from '@/hooks/useSessionLoader'
import {
  deletePlaygroundSessionAPI,
  renamePlaygroundSessionAPI
} from '@/api/playground'
import { usePlaygroundStore } from '@/store'
import { toast } from 'sonner'
import Icon from '@/components/ui/icon'
import { useState, useRef, useEffect } from 'react'
import DeleteSessionModal from './DeleteSessionModal'
import useChatActions from '@/hooks/useChatActions'
import { truncateText, cn, getSessionDisplayName } from '@/lib/utils'
import { useAuthContext } from '@/components/AuthProvider'
import { Input } from '@/components/ui/input'

type SessionItemProps = SessionEntry & {
  isSelected: boolean
  onSessionClick: () => void
}

const SessionItem = ({
  title,
  session_id,
  session_data,
  isSelected,
  onSessionClick
}: SessionItemProps) => {
  const [agentId] = useQueryState('agent')
  const { getSession } = useSessionLoader()
  const [, setSessionId] = useQueryState('session')
  const { selectedEndpoint, sessionsData, setSessionsData } =
    usePlaygroundStore()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)

  const displayName = getSessionDisplayName({ title, session_data })
  const [newTitle, setNewTitle] = useState(displayName)

  const { clearChat } = useChatActions()
  const { user } = useAuthContext()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const currentDisplayName = getSessionDisplayName({ title, session_data })
    setNewTitle(currentDisplayName)
  }, [title, session_data])

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const handleGetSession = async () => {
    if (agentId && !isRenaming) {
      setSessionId(session_id)
      await getSession(session_id, agentId)
      onSessionClick()
    }
  }

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRenaming(true)
    setNewTitle(displayName)
  }

  const handleCancelRename = () => {
    setIsRenaming(false)
    setNewTitle(displayName)
  }

  const handleSaveRename = async () => {
    if (!agentId || !newTitle.trim() || newTitle === displayName) {
      handleCancelRename()
      return
    }

    try {
      const response = await renamePlaygroundSessionAPI(
        selectedEndpoint,
        agentId,
        session_id,
        newTitle.trim(),
        user?.id
      )

      if (response.ok) {
        setSessionsData(
          (prevSessions) =>
            prevSessions?.map((session) =>
              session.session_id === session_id
                ? {
                    ...session,
                    title: newTitle.trim(),
                    session_data: {
                      ...session.session_data,
                      session_name: newTitle.trim()
                    }
                  }
                : session
            ) ?? null
        )
        toast.success('Session renamed')
        setIsRenaming(false)
      } else {
        toast.error('Failed to rename session')
        handleCancelRename()
      }
    } catch {
      toast.error('Failed to rename session')
      handleCancelRename()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename()
    } else if (e.key === 'Escape') {
      handleCancelRename()
    }
  }

  const handleDeleteSession = async () => {
    if (!agentId) return

    setIsDeleting(true)
    try {
      const response = await deletePlaygroundSessionAPI(
        selectedEndpoint,
        agentId,
        session_id,
        user?.id
      )
      if (response.status === 200 && sessionsData) {
        setSessionsData(
          sessionsData.filter((session) => session.session_id !== session_id)
        )
        clearChat()
        toast.success('Session deleted')
      } else {
        toast.error('Failed to delete session')
      }
    } catch {
      toast.error('Failed to delete session')
    } finally {
      setIsDeleteModalOpen(false)
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div
        className={cn(
          'hover:bg-background-secondary group flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors',
          isSelected && 'bg-background-primary'
        )}
        onClick={handleGetSession}
      >
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <Input
              ref={inputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveRename}
              className="h-6 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="block truncate text-sm font-medium">
              {truncateText(displayName, 30)}
            </span>
          )}
        </div>

        {!isRenaming && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleStartRename}
            >
              <Icon type="edit" size="xs" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                setIsDeleteModalOpen(true)
              }}
            >
              <Icon type="trash" size="xs" />
            </Button>
          </div>
        )}
      </div>

      <DeleteSessionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDeleteSession}
        isDeleting={isDeleting}
      />
    </>
  )
}

export default SessionItem
