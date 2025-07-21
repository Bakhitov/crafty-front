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

interface InstanceItemProps {
  instance: MessengerInstanceUnion
  onSelect: (instance: MessengerInstanceUnion) => void
  onEdit: (instance: MessengerInstanceUnion) => void
  isSelected: boolean
}

const InstanceItem = ({
  instance,
  onSelect,
  onEdit,
  isSelected
}: InstanceItemProps) => {
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
        'group relative cursor-pointer rounded-lg border p-4 transition-all duration-200 hover:shadow-md',
        isSelected
          ? 'border-primary bg-accent shadow-md'
          : 'bg-background-primary border-secondary hover:bg-background-secondary'
      )}
      onClick={() => onSelect(instance)}
      onDoubleClick={() => onEdit(instance)}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: providerConfig.color }}
          />
          <div>
            <h3 className="text-primary text-sm font-medium">
              {providerConfig.name}
            </h3>
            <p className="text-muted-foreground max-w-32 truncate text-xs">
              {instance.user_id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Icon
            type={getStatusIcon(instance.status)}
            size="xs"
            className={cn(
              'transition-colors',
              instance.status === 'running' && 'text-positive',
              instance.status === 'error' && 'text-destructive',
              instance.status === 'processing' && 'text-warning animate-spin',
              instance.status === 'stopped' && 'text-muted-foreground',
              instance.status === 'created' && 'text-primary'
            )}
          />
          <Badge
            variant="outline"
            className={cn(
              'border-0 px-2 py-1 text-xs',
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
      </div>

      {/* Instance Info */}
      <div className="space-y-2">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Icon type="calendar" size="xs" />
          <span>{new Date(instance.created_at).toLocaleDateString()}</span>
        </div>

        {/* Provider specific info */}
        {instance.provider === 'whatsappweb' && (
          <div className="border-border mt-2 border-t pt-2">
            <div className="flex items-center gap-2 text-xs">
              <Icon
                type="qr-code"
                size="xs"
                className="text-muted-foreground"
              />
              <span className="text-muted-foreground">
                Auth:{' '}
                {(instance as { auth_status?: string }).auth_status ||
                  'pending'}
              </span>
            </div>
          </div>
        )}

        {instance.provider === 'telegram' && (
          <div className="border-border mt-2 border-t pt-2">
            <div className="flex items-center gap-2 text-xs">
              <Icon type="bot" size="xs" className="text-muted-foreground" />
              <span className="text-muted-foreground">
                Bot:{' '}
                {(instance as { bot_username?: string }).bot_username ||
                  'Not set'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute right-2 top-2"
        >
          <Icon type="check" size="xs" className="text-primary" />
        </motion.div>
      )}
    </motion.div>
  )
}

const InstanceBlankState = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <Icon
        type="message-circle"
        size="md"
        className="text-muted-foreground mx-auto mb-2"
      />
      <p className="text-muted-foreground mb-1 text-sm">
        No messenger instances found
      </p>
      <p className="text-muted-foreground text-xs">
        Create your first messenger instance to get started
      </p>
    </div>
  </div>
)

const MessengerProviderList = () => {
  const {
    instances,
    isLoading,
    error,
    stats,
    selectedInstance,
    fetchInstances,
    setSelectedInstance
  } = useMessengerProvider()
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

          {stats && (
            <Badge variant="outline" className="text-xs">
              {stats.total_instances}
            </Badge>
          )}
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
            className="border-secondary/50 text-secondary hover:bg-secondary/10 h-9 w-full rounded-xl text-xs font-medium"
            onClick={handleOpenManager}
          >
            <Icon type="settings" size="xs" className="text-secondary" />
            <span className="uppercase">Manage Instances</span>
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-background-primary">
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
      {!isLoading && !error && instances.length === 0 && <InstanceBlankState />}

      {/* Instances List */}
      {!isLoading && !error && instances.length > 0 && (
        <div className="[&::-webkit-scrollbar-thumb]:bg-border flex-1 space-y-3 overflow-y-auto pr-1 transition-all duration-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
          <AnimatePresence>
            {instances.map(
              (instance: MessengerInstanceUnion, index: number) => (
                <InstanceItem
                  key={
                    instance.instance_id ||
                    `instance-${index}-${instance.provider}-${instance.user_id}`
                  }
                  instance={instance}
                  onSelect={setSelectedInstance}
                  onEdit={handleEditInstance}
                  isSelected={
                    selectedInstance?.instance_id === instance.instance_id
                  }
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
