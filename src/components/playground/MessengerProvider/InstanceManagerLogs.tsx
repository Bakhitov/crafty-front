'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import Icon from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { messengerAPI } from '@/lib/messengerApi'

// Типы для логов
type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug'

interface InstanceManagerLogsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const InstanceManagerLogs = ({
  open,
  onOpenChange
}: InstanceManagerLogsProps) => {
  // Состояние логов
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Параметры фильтрации
  const [tailLines, setTailLines] = useState<number>(500)
  const [logLevel, setLogLevel] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Автообновление
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<number>(5) // секунды

  // Refs
  const logsContainerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Функция для получения логов
  const fetchLogs = useCallback(async (tail: number, level?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const validLevel =
        level &&
        level !== 'all' &&
        ['error', 'warn', 'info', 'http', 'debug'].includes(level)
          ? (level as LogLevel)
          : undefined

      const data = await messengerAPI.getInstanceManagerLogs(tail, validLevel)

      if (data.success) {
        setLogs(data.logs)
      } else {
        setError('Failed to fetch logs')
      }
    } catch (err) {
      setError('Network error while fetching logs')
      console.error('Error fetching logs:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Функция для получения последних логов (для автообновления)
  const fetchLatestLogs = useCallback(async () => {
    try {
      const data = await messengerAPI.getLatestInstanceManagerLogs(
        Math.min(100, tailLines)
      )

      if (data.success) {
        setLogs((prevLogs) => {
          // Объединяем старые и новые логи, избегая дубликатов
          const combinedLogs = [...prevLogs, ...data.logs]
          const uniqueLogs = Array.from(new Set(combinedLogs))
          return uniqueLogs.slice(-tailLines) // Ограничиваем количество
        })
      }
    } catch (err) {
      console.error('Error fetching latest logs:', err)
    }
  }, [tailLines])

  // Эффект для начальной загрузки логов
  useEffect(() => {
    if (open) {
      fetchLogs(tailLines, logLevel)
    }
  }, [open, tailLines, logLevel, fetchLogs])

  // Эффект для автообновления
  useEffect(() => {
    if (autoRefresh && open) {
      intervalRef.current = setInterval(() => {
        fetchLatestLogs()
      }, refreshInterval * 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, open, refreshInterval, fetchLatestLogs])

  // Функция для автоскролла вниз
  const scrollToBottom = useCallback(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
    }
  }, [])

  // Автоскролл при добавлении новых логов
  useEffect(() => {
    if (autoRefresh) {
      scrollToBottom()
    }
  }, [logs, autoRefresh, scrollToBottom])

  // Фильтрация логов по поисковому запросу
  const filteredLogs = logs.filter((log) =>
    log.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Функция для определения цвета лога по уровню
  const getLogLevelColor = (log: string): string => {
    const logLower = log.toLowerCase()
    if (logLower.includes('[error]')) return 'text-red-500'
    if (logLower.includes('[warn]')) return 'text-yellow-500'
    if (logLower.includes('[info]')) return 'text-blue-500'
    if (logLower.includes('[http]')) return 'text-green-500'
    if (logLower.includes('[debug]')) return 'text-gray-500'
    return 'text-foreground'
  }

  // Функция для форматирования времени в логе
  const formatLogTime = (log: string): { time: string; content: string } => {
    const timeMatch = log.match(/\[([\d-T:.Z]+)\]/)
    if (timeMatch) {
      const time = new Date(timeMatch[1]).toLocaleTimeString()
      const content = log.replace(timeMatch[0], '').trim()
      return { time, content }
    }
    return { time: '', content: log }
  }

  const handleRefresh = () => {
    fetchLogs(tailLines, logLevel)
    toast.success('Logs refreshed')
  }

  const handleClearLogs = () => {
    setLogs([])
    toast.success('Logs cleared from view')
  }

  const handleExportLogs = () => {
    const logsText = filteredLogs.join('\n')
    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `instance-manager-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Logs exported')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background-primary max-h-[90vh] max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon type="server" size="sm" />
            System Logs (Instance Manager)
          </DialogTitle>
          <DialogDescription>
            Просмотр и мониторинг системных логов Instance Manager в реальном
            времени
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Контролы */}
          <Card className="bg-background-secondary border-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Настройки логов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Первая строка контролов */}
              <div className="grid grid-cols-6 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Количество строк</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10000"
                    value={tailLines}
                    onChange={(e) =>
                      setTailLines(Math.max(1, parseInt(e.target.value) || 100))
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Уровень</Label>
                  <Select value={logLevel} onValueChange={setLogLevel}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все уровни</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="http">HTTP</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Поиск</Label>
                  <Input
                    placeholder="Поиск в логах..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Интервал (сек)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={refreshInterval}
                    onChange={(e) =>
                      setRefreshInterval(
                        Math.max(1, parseInt(e.target.value) || 5)
                      )
                    }
                    className="h-8 text-xs"
                    disabled={!autoRefresh}
                  />
                </div>

                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-refresh"
                      checked={autoRefresh}
                      onCheckedChange={setAutoRefresh}
                    />
                    <Label htmlFor="auto-refresh" className="text-xs">
                      Авто
                    </Label>
                  </div>
                </div>

                <div className="flex items-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="h-8 px-2"
                  >
                    <Icon
                      type="refresh-cw"
                      size="xs"
                      className={isLoading ? 'animate-spin' : ''}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={scrollToBottom}
                    className="h-8 px-2"
                  >
                    <Icon type="arrow-down" size="xs" />
                  </Button>
                </div>
              </div>

              {/* Вторая строка - кнопки действий */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Всего: {logs.length}
                  </Badge>
                  {searchQuery && (
                    <Badge variant="outline" className="text-xs">
                      Найдено: {filteredLogs.length}
                    </Badge>
                  )}
                  {autoRefresh && (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-xs text-green-700"
                    >
                      <Icon
                        type="refresh-cw"
                        size="xs"
                        className="mr-1 animate-spin"
                      />
                      Live
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearLogs}
                    className="h-7 text-xs"
                  >
                    <Icon type="trash" size="xs" className="mr-1" />
                    Очистить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportLogs}
                    className="h-7 text-xs"
                    disabled={filteredLogs.length === 0}
                  >
                    <Icon type="download" size="xs" className="mr-1" />
                    Экспорт
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Область логов */}
          <div className="relative">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
                <Icon type="alert-circle" size="sm" />
                <span className="text-sm">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="ml-auto h-6 text-xs"
                >
                  Повторить
                </Button>
              </div>
            )}

            <div
              ref={logsContainerRef}
              className="bg-background-secondary relative max-h-96 overflow-auto rounded-lg border p-4"
            >
              {isLoading && logs.length === 0 ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div>
                    <Icon
                      type="file-text"
                      size="md"
                      className="text-muted-foreground mx-auto mb-2"
                    />
                    <p className="text-muted-foreground text-sm">
                      {searchQuery
                        ? 'Логи не найдены по запросу'
                        : 'Логи не найдены'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 font-mono text-xs">
                  <AnimatePresence>
                    {filteredLogs.map((log, index) => {
                      const { time, content } = formatLogTime(log)
                      const colorClass = getLogLevelColor(log)

                      return (
                        <motion.div
                          key={`${index}-${log}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className={cn(
                            'border-border/30 flex gap-2 border-b pb-1 last:border-b-0',
                            colorClass
                          )}
                        >
                          <span className="text-muted-foreground shrink-0 text-xs">
                            {time}
                          </span>
                          <span className="break-all">{content}</span>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default InstanceManagerLogs
