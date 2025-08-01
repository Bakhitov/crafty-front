'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import Icon from '@/components/ui/icon'
import { IconType } from '@/components/ui/icon/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { MessengerInstanceUnion, InstanceError } from '@/types/messenger'
import { useProviderConfig } from '@/hooks/useMessengerProvider'
import { messengerAPI } from '@/lib/messengerApi'
import { formatLogsWithAnsi } from '@/lib/ansiToHtml'

interface MessengerInstanceDetailProps {
  instance: MessengerInstanceUnion
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

const MessengerInstanceDetail = ({
  instance,
  onClose,
  onEdit,
  onDelete
}: MessengerInstanceDetailProps) => {
  const providerConfig = useProviderConfig(instance.provider)
  const [memoryData, setMemoryData] = useState<
    import('@/lib/messengerApi').MemoryResponse['data'] | null
  >(null)
  const [errors, setErrors] = useState<InstanceError[]>([])
  const [logs, setLogs] = useState<string>('')
  const [qrCode, setQrCode] = useState<string>('')
  const [authStatus, setAuthStatus] = useState<{
    status: string
    authenticated: boolean
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const logsContainerRef = useRef<HTMLDivElement>(null)

  const loadInstanceData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [memoryResponse, errorsResponse, authResponse] =
        await Promise.allSettled([
          messengerAPI.getInstanceMemory(instance.instance_id),
          messengerAPI.getInstanceErrors(instance.instance_id),
          messengerAPI.getInstanceAuthStatus(instance.instance_id)
        ])

      if (memoryResponse.status === 'fulfilled') {
        setMemoryData(memoryResponse.value.data)
      }

      if (errorsResponse.status === 'fulfilled') {
        setErrors(errorsResponse.value.errors)
      }

      if (authResponse.status === 'fulfilled') {
        setAuthStatus(authResponse.value)
      }
    } catch (error) {
      console.error('Failed to load instance data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [instance.instance_id])

  useEffect(() => {
    loadInstanceData()
  }, [loadInstanceData])

  const handleStartInstance = async () => {
    try {
      await messengerAPI.startInstance(instance.instance_id)
      toast.success('Инстанс запущен')
      loadInstanceData()
    } catch (error) {
      console.error('Error starting instance:', error)
      toast.error('Ошибка запуска инстанса')
    }
  }

  const handleStopInstance = async () => {
    try {
      await messengerAPI.stopInstance(instance.instance_id)
      toast.success('Инстанс остановлен')
      loadInstanceData()
    } catch (error) {
      console.error('Error stopping instance:', error)
      toast.error('Ошибка остановки инстанса')
    }
  }

  const handleRestartInstance = async () => {
    try {
      await messengerAPI.restartInstance(instance.instance_id)
      toast.success('Инстанс перезапущен')
      loadInstanceData()
    } catch (error) {
      console.error('Error restarting instance:', error)
      toast.error('Ошибка перезапуска инстанса')
    }
  }

  const handleViewLogs = async () => {
    try {
      const logsResponse = await messengerAPI.getInstanceLogs(
        instance.instance_id,
        { tail: 500 }
      )

      // API returns logs as an object with container names as keys
      // Extract the logs content from the response
      let logsContent = 'Logs not found'

      if (
        logsResponse.logs &&
        typeof logsResponse.logs === 'object' &&
        !Array.isArray(logsResponse.logs)
      ) {
        // Get the first container's logs (there might be multiple containers)
        const logsObject = logsResponse.logs as Record<string, string>
        const containerNames = Object.keys(logsObject)
        if (containerNames.length > 0) {
          const firstContainerLogs = logsObject[containerNames[0]]
          if (typeof firstContainerLogs === 'string') {
            logsContent = firstContainerLogs
          } else {
            // If all containers, join them
            logsContent = containerNames
              .map((name) => `=== ${name} ===\n${logsObject[name]}`)
              .join('\n\n')
          }
        }
      } else if (typeof logsResponse.logs === 'string') {
        logsContent = logsResponse.logs
      }

      // Format logs with ANSI colors and clean timestamps
      const formattedLogs = formatLogsWithAnsi(logsContent)
      setLogs(formattedLogs)
      setShowLogsDialog(true)

      // Автопрокрутка в конец логов
      setTimeout(() => {
        if (logsContainerRef.current) {
          logsContainerRef.current.scrollTop =
            logsContainerRef.current.scrollHeight
        }
      }, 100)
    } catch (error) {
      console.error('Error loading logs:', error)
      toast.error('Error loading logs')
    }
  }

  const handleViewQR = async () => {
    try {
      const qrResponse = await messengerAPI.getInstanceQR(instance.instance_id)
      setQrCode(qrResponse.qr_code || '')
      setShowQRDialog(true)
    } catch (error) {
      console.error('Error loading QR code:', error)
      toast.error('QR код недоступен')
    }
  }

  const handleClearErrors = async () => {
    try {
      await messengerAPI.clearInstanceErrors(instance.instance_id)
      toast.success('Ошибки очищены')
      setErrors([])
    } catch (error) {
      console.error('Error clearing errors:', error)
      toast.error('Ошибка очистки ошибок')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      created: 'blue',
      processing: 'yellow',
      running: 'green',
      stopped: 'gray',
      error: 'red',
      deleted: 'red'
    }
    return colors[status] || 'gray'
  }

  const getStatusIcon = (status: string): IconType => {
    const iconMap: Record<string, IconType> = {
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
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <motion.header
        className="border-border border-b p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: providerConfig.color }}
            >
              <Icon
                type={providerConfig.icon as IconType}
                size="md"
                className="text-white"
              />
            </div>
            <div>
              <h1 className="text-primary text-xl font-bold">
                {providerConfig.name} Instance
              </h1>
              <p className="text-muted-foreground text-sm">
                {instance.instance_id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'px-3 py-1',
                getStatusColor(instance.status) === 'green' &&
                  'border-green-500 bg-green-50 text-green-600 dark:bg-green-900/20',
                getStatusColor(instance.status) === 'red' &&
                  'border-red-500 bg-red-50 text-red-600 dark:bg-red-900/20',
                getStatusColor(instance.status) === 'yellow' &&
                  'border-yellow-500 bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20',
                getStatusColor(instance.status) === 'blue' &&
                  'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20',
                getStatusColor(instance.status) === 'gray' &&
                  'border-gray-500 bg-gray-50 text-gray-600 dark:bg-gray-800'
              )}
            >
              <Icon
                type={getStatusIcon(instance.status)}
                size="xs"
                className={cn(
                  'mr-1',
                  instance.status === 'processing' && 'animate-spin'
                )}
              />
              {instance.status}
            </Badge>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {instance.provider === 'whatsappweb' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewQR}
                  disabled={isLoading}
                >
                  <Icon type="qr-code" size="xs" className="mr-1" />
                  QR
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleViewLogs}
                disabled={isLoading}
              >
                <Icon type="file-text" size="xs" className="mr-1" />
                Логи
              </Button>

              {instance.status === 'running' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRestartInstance}
                    disabled={isLoading}
                  >
                    <Icon type="refresh-cw" size="xs" className="mr-1" />
                    Перезапуск
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStopInstance}
                    disabled={isLoading}
                  >
                    <Icon type="square" size="xs" className="mr-1" />
                    Стоп
                  </Button>
                </>
              ) : instance.status === 'stopped' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartInstance}
                  disabled={isLoading}
                >
                  <Icon type="play" size="xs" className="mr-1" />
                  Старт
                </Button>
              ) : null}

              <Button variant="outline" size="sm" onClick={onEdit}>
                <Icon type="edit" size="xs" className="mr-1" />
                Редактировать
              </Button>

              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Icon type="trash" size="xs" className="mr-1" />
                Удалить
              </Button>

              <Button variant="ghost" size="sm" onClick={onClose}>
                <Icon type="x" size="xs" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex h-full flex-col"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="config">Конфигурация</TabsTrigger>
            <TabsTrigger value="errors">Ошибки ({errors.length})</TabsTrigger>
            <TabsTrigger value="monitoring">Мониторинг</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 flex-1 space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Основная информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">ID</span>
                    <span className="font-mono text-sm">
                      {instance.instance_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Company ID
                    </span>
                    <span className="text-sm">{instance.company_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Провайдер
                    </span>
                    <span className="text-sm">{providerConfig.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Типы</span>
                    <span className="text-sm">
                      {instance.type_instance.join(', ')}
                    </span>
                  </div>
                  {instance.port && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Порт
                      </span>
                      <span className="font-mono text-sm">{instance.port}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Создан
                    </span>
                    <span className="text-sm">
                      {new Date(instance.created_at).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Обновлен
                    </span>
                    <span className="text-sm">
                      {new Date(instance.updated_at).toLocaleString('ru-RU')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Authentication */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Аутентификация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {authStatus && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Статус
                        </span>
                        <Badge
                          variant={
                            authStatus.authenticated ? 'default' : 'secondary'
                          }
                        >
                          {authStatus.authenticated
                            ? 'Авторизован'
                            : 'Не авторизован'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Детали
                        </span>
                        <span className="text-sm">{authStatus.status}</span>
                      </div>
                    </>
                  )}
                  {instance.api_key && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        API ключ
                      </span>
                      <span className="font-mono text-sm">
                        {instance.api_key.substring(0, 8)}...
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Memory Data */}
            {memoryData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Данные в памяти</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted max-h-40 overflow-auto rounded p-3 text-xs">
                    {JSON.stringify(memoryData, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="config" className="mt-4 flex-1 space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* AGNO Configuration */}
              {instance.agno_config && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">AGNO конфигурация</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Включен
                      </span>
                      <Badge
                        variant={
                          instance.agno_config.enabled ? 'default' : 'secondary'
                        }
                      >
                        {instance.agno_config.enabled ? 'Да' : 'Нет'}
                      </Badge>
                    </div>
                    {instance.agno_config.agent_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Agent ID
                        </span>
                        <span className="text-sm">
                          {instance.agno_config.agent_id}
                        </span>
                      </div>
                    )}
                    {instance.agno_config.model && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Модель
                        </span>
                        <span className="text-sm">
                          {instance.agno_config.model}
                        </span>
                      </div>
                    )}
                    {instance.agno_config.agnoUrl && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          URL
                        </span>
                        <span className="max-w-32 truncate font-mono text-sm">
                          {instance.agno_config.agnoUrl}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Webhook Configuration */}
              {instance.api_webhook_schema && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Webhook конфигурация
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Включен
                      </span>
                      <Badge
                        variant={
                          instance.api_webhook_schema.enabled
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {instance.api_webhook_schema.enabled ? 'Да' : 'Нет'}
                      </Badge>
                    </div>
                    {instance.api_webhook_schema.url && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          URL
                        </span>
                        <span className="max-w-32 truncate font-mono text-sm">
                          {instance.api_webhook_schema.url}
                        </span>
                      </div>
                    )}
                    {instance.api_webhook_schema.filters && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">
                            Группы
                          </span>
                          <Badge
                            variant={
                              instance.api_webhook_schema.filters.allowGroups
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {instance.api_webhook_schema.filters.allowGroups
                              ? 'Разрешены'
                              : 'Запрещены'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">
                            Приватные
                          </span>
                          <Badge
                            variant={
                              instance.api_webhook_schema.filters.allowPrivate
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {instance.api_webhook_schema.filters.allowPrivate
                              ? 'Разрешены'
                              : 'Запрещены'}
                          </Badge>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="errors" className="mt-4 flex-1">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Ошибки инстанса</CardTitle>
                {errors.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearErrors}
                  >
                    <Icon type="trash-2" size="xs" className="mr-1" />
                    Очистить
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                {errors.length === 0 ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="text-center">
                      <Icon
                        type="check"
                        size="md"
                        className="mx-auto mb-2 text-green-500"
                      />
                      <p className="text-muted-foreground text-sm">
                        Ошибок не найдено
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-96 space-y-3 overflow-y-auto">
                    {errors.map((error, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-red-200 bg-red-50 p-3 dark:bg-red-900/10"
                      >
                        <div className="flex items-start gap-2">
                          <Icon
                            type="alert-circle"
                            size="xs"
                            className="mt-0.5 text-red-500"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">
                              {error.error_message}
                            </p>
                            {error.stack_trace && (
                              <pre className="mt-1 overflow-x-auto text-xs text-red-600 dark:text-red-300">
                                {error.stack_trace}
                              </pre>
                            )}
                            <p className="mt-1 text-xs text-red-500">
                              {new Date(error.created_at).toLocaleString(
                                'ru-RU'
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="mt-4 flex-1">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Статистика</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Время работы
                    </span>
                    <span className="text-sm">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Последнее обновление
                    </span>
                    <span className="text-sm">
                      {new Date(instance.updated_at).toLocaleString('ru-RU')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Действия</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={loadInstanceData}
                    disabled={isLoading}
                  >
                    <Icon type="refresh-cw" size="xs" className="mr-2" />
                    Обновить данные
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleViewLogs}
                    disabled={isLoading}
                  >
                    <Icon type="file-text" size="xs" className="mr-2" />
                    Просмотреть логи
                  </Button>
                  {instance.provider === 'whatsappweb' && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleViewQR}
                      disabled={isLoading}
                    >
                      <Icon type="qr-code" size="xs" className="mr-2" />
                      Показать QR код
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-h-[80vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>Instance Logs</DialogTitle>
            <DialogDescription>
              Last 500 log lines for {providerConfig.name}
            </DialogDescription>
            <div className="mb-4 mr-8 mt-2">
              <Button variant="outline" size="sm" onClick={handleViewLogs}>
                <Icon type="refresh-cw" size="xs" className="mr-2" />
                Refresh
              </Button>
            </div>
          </DialogHeader>
          <div className="overflow-hidden">
            <div
              ref={logsContainerRef}
              className="bg-muted max-h-96 overflow-auto whitespace-pre-wrap rounded-lg p-4 font-mono text-xs"
              dangerouslySetInnerHTML={{ __html: logs }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR код для аутентификации</DialogTitle>
            <DialogDescription>
              Отсканируйте QR код в приложении WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {qrCode ? (
              <Image
                src={qrCode}
                alt="QR Code"
                width={256}
                height={256}
                className="max-h-64 max-w-full"
              />
            ) : (
              <div className="text-center">
                <Icon
                  type="qr-code"
                  size="lg"
                  className="text-muted-foreground mx-auto mb-2"
                />
                <p className="text-muted-foreground text-sm">
                  QR код недоступен
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MessengerInstanceDetail
