'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Icon from '@/components/ui/icon'
import { IconType } from '@/components/ui/icon/types'
import { cn } from '@/lib/utils'
import {
  useMessengerProvider,
  useProviderConfig
} from '@/hooks/useMessengerProvider'
import { MessengerInstanceUnion, InstanceStatus } from '@/types/messenger'

import { usePlaygroundStore } from '@/store'
import { InstanceCreateBlankState } from '../Sidebar/BlankStates'

interface InstanceItemProps {
  instance: MessengerInstanceUnion
  onEdit: (instance: MessengerInstanceUnion) => void
  isSelected: boolean
}

const InstanceItem = ({ instance, onEdit, isSelected }: InstanceItemProps) => {
  const providerConfig = useProviderConfig(instance.provider)

  const getStatusText = (status: InstanceStatus) => {
    const statusMap = {
      created: 'Created',
      processing: 'Processing',
      running: 'Running',
      stopped: 'Stopped',
      error: 'Error',
      deleted: 'Deleted'
    }
    return statusMap[status] || status
  }

  const getStatusIcon = (status: InstanceStatus): IconType => {
    const iconMap: Record<InstanceStatus, IconType> = {
      created: 'plus',
      processing: 'loader-2',
      running: 'play',
      stopped: 'square',
      error: 'alert-circle',
      deleted: 'trash'
    }
    return iconMap[status] || 'message-circle'
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'bg-background-secondary border-border group relative cursor-pointer rounded-lg border p-3 transition-all duration-200',
        isSelected
          ? 'bg-background-secondary'
          : 'bg-background-secondary hover:bg-background-primary'
      )}
      onClick={() => onEdit(instance)}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center">
            <Icon
              type={providerConfig.icon as IconType}
              size="xs"
              className={cn(
                instance.provider === 'whatsappweb' && 'text-green-500',
                instance.provider === 'telegram' && 'text-blue-500',
                instance.provider === 'discord' && 'text-indigo-600',
                instance.provider === 'slack' && 'text-purple-600',
                instance.provider === 'messenger' && 'text-blue-600',
                instance.provider === 'whatsapp-official' && 'text-green-500'
              )}
            />
          </div>
          <div>
            <h3 className="text-primary text-sm font-medium">
              {providerConfig.name}
            </h3>
            <p className="text-muted max-w-44 truncate text-xs">
              {instance.instance_id ||
                (instance as unknown as { id?: string }).id}
            </p>
          </div>
        </div>

        {/* Restart button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            // Handle restart logic here
          }}
        >
          <Icon type="refresh-cw" size="xs" className="text-muted-foreground" />
        </Button>
      </div>

      {/* Provider specific info */}
      {instance.provider === 'whatsappweb' && (
        <div className="mb-2 flex items-center gap-2 text-xs">
          <div className="flex h-4 w-4 items-center justify-center">
            <Icon type="qr-code" size="xs" className="text-muted-foreground" />
          </div>
          <span className="text-muted-foreground">
            Auth:{' '}
            {(instance as { auth_status?: string }).auth_status || 'pending'}
          </span>
        </div>
      )}

      {instance.provider === 'telegram' && (
        <div className="mb-2 flex items-center gap-2 text-xs">
          <div className="flex h-4 w-4 items-center justify-center">
            <Icon type="bot" size="xs" className="text-muted-foreground" />
          </div>
          <span className="text-muted-foreground">
            Bot: {(instance as { account?: string }).account || 'Not set'}
          </span>
        </div>
      )}

      {/* Bottom row with status and date */}
      <div className="border-secondary flex items-center justify-between border-t pt-1">
        <div className="flex items-center gap-2">
          <div className="flex h-4 w-4 items-center justify-center">
            {instance.status === 'running' ? (
              <div className="h-2 w-2 rounded-full bg-green-500" />
            ) : (
              <Icon
                type={getStatusIcon(instance.status)}
                size="xs"
                className={cn(
                  'transition-colors',
                  instance.status === 'error' && 'text-destructive',
                  instance.status === 'processing' &&
                    'text-warning animate-spin',
                  instance.status === 'stopped' && 'text-muted-foreground',
                  instance.status === 'created' && 'text-primary'
                )}
              />
            )}
          </div>
          <Badge
            variant="outline"
            className={cn(
              'border-0 px-1.5 py-0.5 text-xs',
              instance.status === 'running' && 'bg-positive/10 text-positive',
              instance.status === 'error' &&
                'bg-destructive/10 text-destructive',
              instance.status === 'processing' && 'bg-warning/10 text-warning',
              instance.status === 'stopped' && 'bg-muted text-muted-foreground',
              instance.status === 'created' && 'bg-primary/10 text-primary'
            )}
          >
            {getStatusText(instance.status)}
          </Badge>
        </div>

        <div className="text-muted flex items-center gap-1 text-xs">
          <Icon type="calendar" size="xs" />
          <span>{new Date(instance.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  )
}

const MessengerProviderList = () => {
  const { instances, isLoading, error, fetchInstances } = useMessengerProvider()
  const {
    setIsMessengerInstanceEditorMode,
    setEditingMessengerInstance,
    setIsMessengerManagerMode
  } = usePlaygroundStore()

  const handleCreateNew = () => {
    setEditingMessengerInstance(null)
    setIsMessengerInstanceEditorMode(true)
  }

  const handleEditInstance = (instance: MessengerInstanceUnion) => {
    setEditingMessengerInstance(instance)
    setIsMessengerInstanceEditorMode(true)
  }

  const handleOpenManager = () => {
    setIsMessengerInstanceEditorMode(false)
    setEditingMessengerInstance(null)
    setIsMessengerManagerMode(true)
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-primary text-xs font-medium uppercase">
            Messengers
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            size="lg"
            variant="outline"
            className="border-primary/20 text-primary hover:bg-primary/10 h-9 w-full rounded-xl border-dashed text-xs font-medium"
            onClick={handleCreateNew}
          >
            <Icon type="plus-icon" size="xs" className="text-primary" />
            <span className="uppercase">Create Instance</span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary/20 text-primary hover:bg-primary/10 h-9 w-full rounded-xl text-xs font-medium"
            onClick={handleOpenManager}
          >
            <Icon type="settings" size="xs" className="text-primary" />
            <span className="uppercase">Instance Manager</span>
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-background-secondary border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Icon
              type="alert-circle"
              size="md"
              className="text-destructive mx-auto mb-2"
            />
            <p className="text-destructive text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={fetchInstances}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && instances.length === 0 && (
        <InstanceCreateBlankState onCreateInstance={handleCreateNew} />
      )}

      {/* Instances List */}
      {!isLoading && !error && instances.length > 0 && (
        <div className="[&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-background-secondary flex-1 space-y-3 overflow-y-auto pb-[10px] pr-1 transition-all duration-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar]:w-1">
          <AnimatePresence>
            {instances.map(
              (instance: MessengerInstanceUnion, index: number) => (
                <InstanceItem
                  key={
                    instance.instance_id ||
                    `instance-${index}-${instance.provider}-${instance.user_id}`
                  }
                  instance={instance}
                  onEdit={handleEditInstance}
                  isSelected={false}
                />
              )
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default MessengerProviderList
