'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import Icon from '@/components/ui/icon'
import {
  ValidationResult,
  ValidationError,
  ValidationSuggestion
} from '@/types/agentConfig'

interface AgentValidationPanelProps {
  validationResult: ValidationResult | null
  onApplySuggestion?: (suggestion: ValidationSuggestion) => void
  onFixError?: (error: ValidationError) => void
  className?: string
}

interface AgentValidationModalProps extends AgentValidationPanelProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  trigger?: React.ReactNode
}

// Основной компонент валидации (для использования внутри модального окна)
export function ValidationContent({
  validationResult,
  onApplySuggestion,
  onFixError,
  className = ''
}: AgentValidationPanelProps) {
  const [showErrors, setShowErrors] = React.useState(true)
  const [showWarnings, setShowWarnings] = React.useState(true)
  const [showSuggestions, setShowSuggestions] = React.useState(true)

  if (!validationResult) return null

  const { isValid, errors, warnings, suggestions } = validationResult

  const getValidationIcon = () => {
    if (errors.length > 0) return 'alert-circle'
    if (warnings.length > 0) return 'alert-circle'
    return 'check-circle'
  }

  const getValidationColor = () => {
    if (errors.length > 0) return 'text-red-400'
    if (warnings.length > 0) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getValidationStatus = () => {
    if (errors.length > 0) return 'Ошибки конфигурации'
    if (warnings.length > 0) return 'Предупреждения'
    return 'Конфигурация валидна'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Заголовок валидации */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon
            type={getValidationIcon()}
            size="sm"
            className={getValidationColor()}
          />
          <div>
            <h3 className="font-dmmono text-primary text-sm font-medium uppercase">
              Configuration Validation
            </h3>
            <p className={`text-xs ${getValidationColor()}`}>
              {getValidationStatus()}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          {errors.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {errors.length} ошибок
            </Badge>
          )}
          {warnings.length > 0 && (
            <Badge
              variant="secondary"
              className="bg-yellow-900/20 text-xs text-yellow-400"
            >
              {warnings.length} предупреждений
            </Badge>
          )}
          {suggestions.length > 0 && (
            <Badge
              variant="outline"
              className="border-blue-400 text-xs text-blue-400"
            >
              {suggestions.length} предложений
            </Badge>
          )}
        </div>
      </div>

      {/* Ошибки */}
      <AnimatePresence>
        {errors.length > 0 && showErrors && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="space-y-3">
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-0 text-red-400 hover:text-red-300"
                onClick={() => setShowErrors(!showErrors)}
              >
                <div className="flex items-center space-x-2">
                  <Icon type="alert-circle" size="xs" />
                  <span className="font-dmmono text-xs font-medium uppercase">
                    Ошибки ({errors.length})
                  </span>
                </div>
                <Icon
                  type={showErrors ? 'chevron-up' : 'chevron-down'}
                  size="xs"
                />
              </Button>

              <div className="space-y-2">
                {errors.map((error, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-lg border border-red-800/30 bg-red-950/20 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center space-x-2">
                          <Badge
                            variant="destructive"
                            className="bg-red-900/30 text-xs text-red-300"
                          >
                            {error.field}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-red-600 text-xs text-red-400"
                          >
                            {error.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-red-300">{error.message}</p>
                      </div>
                      {onFixError && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onFixError(error)}
                          className="ml-3 h-6 border-red-600 px-2 text-xs text-red-400 hover:bg-red-950/30"
                        >
                          Исправить
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Предупреждения */}
      <AnimatePresence>
        {warnings.length > 0 && showWarnings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="space-y-3">
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-0 text-yellow-400 hover:text-yellow-300"
                onClick={() => setShowWarnings(!showWarnings)}
              >
                <div className="flex items-center space-x-2">
                  <Icon type="alert-circle" size="xs" />
                  <span className="font-dmmono text-xs font-medium uppercase">
                    Предупреждения ({warnings.length})
                  </span>
                </div>
                <Icon
                  type={showWarnings ? 'chevron-up' : 'chevron-down'}
                  size="xs"
                />
              </Button>

              <div className="space-y-2">
                {warnings.map((warning, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-lg border border-yellow-800/30 bg-yellow-950/20 p-3"
                  >
                    <div className="mb-1 flex items-center space-x-2">
                      <Badge
                        variant="secondary"
                        className="bg-yellow-900/30 text-xs text-yellow-300"
                      >
                        {warning.field}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-yellow-600 text-xs text-yellow-400"
                      >
                        {warning.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-yellow-300">{warning.message}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Предложения */}
      <AnimatePresence>
        {suggestions.length > 0 && showSuggestions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="space-y-3">
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-0 text-blue-400 hover:text-blue-300"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                <div className="flex items-center space-x-2">
                  <Icon type="info" size="xs" />
                  <span className="font-dmmono text-xs font-medium uppercase">
                    Предложения ({suggestions.length})
                  </span>
                </div>
                <Icon
                  type={showSuggestions ? 'chevron-up' : 'chevron-down'}
                  size="xs"
                />
              </Button>

              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-lg border border-blue-800/30 bg-blue-950/20 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center space-x-2">
                          <Badge
                            variant="secondary"
                            className="bg-blue-900/30 text-xs text-blue-300"
                          >
                            {suggestion.field}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-blue-600 text-xs text-blue-400"
                          >
                            {suggestion.type}
                          </Badge>
                        </div>
                        <p className="mb-2 text-xs text-blue-300">
                          {suggestion.message}
                        </p>
                        {suggestion.suggestedValue !== undefined && (
                          <div className="text-xs text-blue-200">
                            <span className="text-blue-400">
                              Предлагаемое значение:
                            </span>{' '}
                            <code className="rounded bg-blue-950/30 px-1">
                              {typeof suggestion.suggestedValue === 'object'
                                ? JSON.stringify(suggestion.suggestedValue)
                                : String(suggestion.suggestedValue)}
                            </code>
                          </div>
                        )}
                      </div>
                      {onApplySuggestion && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onApplySuggestion(suggestion)}
                          className="ml-3 h-6 border-blue-600 px-2 text-xs text-blue-400 hover:bg-blue-950/30"
                        >
                          Применить
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Статус "все хорошо" */}
      {isValid && errors.length === 0 && warnings.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border border-green-800/30 bg-green-950/20 p-4 text-center"
        >
          <Icon
            type="check-circle"
            size="md"
            className="mx-auto mb-2 text-green-400"
          />
          <h3 className="font-dmmono mb-1 text-sm font-medium uppercase text-green-300">
            Конфигурация валидна
          </h3>
          <p className="text-xs text-green-400">
            Все настройки корректны. Агент готов к созданию.
          </p>
        </motion.div>
      )}
    </div>
  )
}

// Модальное окно валидации
export function AgentValidationModal({
  validationResult,
  onApplySuggestion,
  onFixError,
  isOpen,
  onOpenChange,
  trigger,
  className = ''
}: AgentValidationModalProps) {
  const getValidationIcon = () => {
    if (!validationResult) return 'info'
    const { errors, warnings } = validationResult
    if (errors.length > 0) return 'alert-circle'
    if (warnings.length > 0) return 'alert-circle'
    return 'check-circle'
  }

  const getValidationTitle = () => {
    if (!validationResult) return 'Configuration Validation'
    const { errors, warnings } = validationResult
    if (errors.length > 0) return 'Найдены ошибки конфигурации'
    if (warnings.length > 0) return 'Есть предупреждения'
    return 'Конфигурация валидна'
  }

  const getValidationDescription = () => {
    if (!validationResult) return 'Agent configuration validation'
    const { errors, warnings, suggestions } = validationResult

    const parts = []
    if (errors.length > 0) parts.push(`${errors.length} ошибок`)
    if (warnings.length > 0) parts.push(`${warnings.length} предупреждений`)
    if (suggestions.length > 0) parts.push(`${suggestions.length} предложений`)

    return parts.length > 0
      ? `Обнаружено: ${parts.join(', ')}`
      : 'Все настройки корректны'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Icon
              type={getValidationIcon()}
              size="sm"
              className={
                !validationResult
                  ? 'text-blue-400'
                  : validationResult.errors.length > 0
                    ? 'text-red-400'
                    : validationResult.warnings.length > 0
                      ? 'text-yellow-400'
                      : 'text-green-400'
              }
            />
            <span>{getValidationTitle()}</span>
          </DialogTitle>
          <DialogDescription>{getValidationDescription()}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto pr-2">
          <ValidationContent
            validationResult={validationResult}
            onApplySuggestion={onApplySuggestion}
            onFixError={onFixError}
            className={className}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Экспорт по умолчанию (старый компонент для обратной совместимости)
export default function AgentValidationPanel({
  validationResult,
  onApplySuggestion,
  onFixError,
  className = ''
}: AgentValidationPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="bg-background-secondary border-none">
        <CardHeader>
          <ValidationContent
            validationResult={validationResult}
            onApplySuggestion={onApplySuggestion}
            onFixError={onFixError}
          />
        </CardHeader>
      </Card>
    </motion.div>
  )
}
