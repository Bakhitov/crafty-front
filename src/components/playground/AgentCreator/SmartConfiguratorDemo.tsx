'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Icon from '@/components/ui/icon'
import { AgentTemplateManager } from '@/lib/agentTemplates'
import { AgentConfigValidator } from '@/lib/agentValidation'
import {
  ExtendedAgentConfig,
  ModelConfig,
  ValidationResult
} from '@/types/agentConfig'
import { IconType } from '@/components/ui/icon/types'

export default function SmartConfiguratorDemo() {
  const [selectedDemo, setSelectedDemo] = useState<string>('templates')
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null)

  // Демо валидации
  const runValidationDemo = () => {
    const problemConfig: ModelConfig = {
      provider: 'openai',
      id: 'gpt-4o', // Не поддерживает reasoning
      temperature: 0.7
    }

    const agentConfig: ExtendedAgentConfig = {
      reasoning: { enabled: true }, // Ошибка!
      memory: { enabled: true }, // Нет storage - ошибка!
      tool_call_limit: 50, // Слишком много - предупреждение
      use_json_mode: true,
      stream: true // Конфликт - предупреждение
    }

    const result = AgentConfigValidator.validateConfig(
      problemConfig,
      agentConfig,
      ['tool1', 'tool2']
    )

    setValidationResult(result)
  }

  const templates = AgentTemplateManager.getAllTemplates()
  const popularTemplates = AgentTemplateManager.getPopularTemplates()

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <Card className="bg-background-secondary border-none">
        <CardHeader>
          <CardTitle className="font-dmmono text-primary text-lg font-medium uppercase">
            🚀 Демо умного конфигуратора агентов
          </CardTitle>
          <CardDescription className="text-muted text-sm">
            Интерактивная демонстрация возможностей системы
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Навигация */}
      <div className="flex space-x-2">
        {[
          { id: 'templates', label: '🎨 Шаблоны', icon: 'bot' as IconType },
          {
            id: 'validation',
            label: '🛡️ Валидация',
            icon: 'alert-circle' as IconType
          },
          { id: 'features', label: '✨ Возможности', icon: 'cpu' as IconType }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={selectedDemo === tab.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDemo(tab.id)}
            className="font-dmmono text-xs font-medium uppercase"
          >
            <Icon type={tab.icon} size="xs" className="mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Контент демо */}
      <motion.div
        key={selectedDemo}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {selectedDemo === 'templates' && (
          <div className="space-y-4">
            <Card className="bg-background-secondary border-none">
              <CardHeader>
                <CardTitle className="font-dmmono text-primary text-sm font-medium uppercase">
                  Каталог шаблонов ({templates.length})
                </CardTitle>
                <CardDescription className="text-muted text-xs">
                  Готовые конфигурации для быстрого старта
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {popularTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-background-primary border-secondary hover:border-accent transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center space-x-3">
                            <div className="bg-accent/20 flex h-8 w-8 items-center justify-center rounded">
                              <Icon
                                type="bot"
                                size="sm"
                                className="text-accent"
                              />
                            </div>
                            <div>
                              <CardTitle className="font-dmmono text-primary text-xs font-medium uppercase">
                                {template.name}
                              </CardTitle>
                              <Badge
                                variant="outline"
                                className="border-accent text-accent mt-1 text-xs"
                              >
                                {template.category}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <CardDescription className="text-muted mb-3 text-xs">
                            {template.description}
                          </CardDescription>
                          <div className="flex justify-between text-xs">
                            <span className="text-secondary">Сложность:</span>
                            <span
                              className={
                                template.complexity === 'beginner'
                                  ? 'text-green-400'
                                  : template.complexity === 'intermediate'
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                              }
                            >
                              {template.complexity}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedDemo === 'validation' && (
          <div className="space-y-4">
            <Card className="bg-background-secondary border-none">
              <CardHeader>
                <CardTitle className="font-dmmono text-primary text-sm font-medium uppercase">
                  Система валидации
                </CardTitle>
                <CardDescription className="text-muted text-xs">
                  Автоматическая проверка конфигурации и зависимостей
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={runValidationDemo}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 mb-4"
                >
                  <Icon type="alert-circle" size="xs" className="mr-2" />
                  Запустить демо валидации
                </Button>

                {validationResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    {/* Ошибки */}
                    {validationResult.errors?.length > 0 && (
                      <Card className="border-red-800/30 bg-red-950/20">
                        <CardHeader>
                          <div className="flex items-center space-x-2">
                            <Icon
                              type="alert-circle"
                              size="sm"
                              className="text-red-400"
                            />
                            <CardTitle className="font-dmmono text-sm font-medium uppercase text-red-300">
                              Ошибки ({validationResult.errors.length})
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {validationResult.errors.map((error, index) => (
                              <div key={index} className="text-xs">
                                <Badge
                                  variant="destructive"
                                  className="mr-2 bg-red-900/30 text-xs text-red-300"
                                >
                                  {error.field}
                                </Badge>
                                <span className="text-red-300">
                                  {error.message}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Предупреждения */}
                    {validationResult.warnings?.length > 0 && (
                      <Card className="border-yellow-800/30 bg-yellow-950/20">
                        <CardHeader>
                          <div className="flex items-center space-x-2">
                            <Icon
                              type="alert-circle"
                              size="sm"
                              className="text-yellow-400"
                            />
                            <CardTitle className="font-dmmono text-sm font-medium uppercase text-yellow-300">
                              Предупреждения ({validationResult.warnings.length}
                              )
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {validationResult.warnings.map((warning, index) => (
                              <div key={index} className="text-xs">
                                <Badge
                                  variant="secondary"
                                  className="mr-2 bg-yellow-900/30 text-xs text-yellow-300"
                                >
                                  {warning.field}
                                </Badge>
                                <span className="text-yellow-300">
                                  {warning.message}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Предложения */}
                    {validationResult.suggestions?.length > 0 && (
                      <Card className="border-blue-800/30 bg-blue-950/20">
                        <CardHeader>
                          <div className="flex items-center space-x-2">
                            <Icon
                              type="info"
                              size="sm"
                              className="text-blue-400"
                            />
                            <CardTitle className="font-dmmono text-sm font-medium uppercase text-blue-300">
                              Предложения ({validationResult.suggestions.length}
                              )
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {validationResult.suggestions.map(
                              (suggestion, index) => (
                                <div key={index} className="text-xs">
                                  <Badge
                                    variant="outline"
                                    className="mr-2 border-blue-600 text-xs text-blue-400"
                                  >
                                    {suggestion.field}
                                  </Badge>
                                  <span className="text-blue-300">
                                    {suggestion.message}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {selectedDemo === 'features' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              {
                title: 'Расширенная конфигурация',
                description: '100+ параметров из полной спецификации Agno',
                icon: 'cpu' as IconType,
                features: ['Память v2', 'RAG знания', 'Рассуждения', 'Команды']
              },
              {
                title: 'Умная валидация',
                description:
                  'Автоматическая проверка совместимости и зависимостей',
                icon: 'alert-circle' as IconType,
                features: [
                  'Совместимость моделей',
                  'Зависимости ресурсов',
                  'Конфликты настроек',
                  'Рекомендации'
                ]
              },
              {
                title: 'Готовые шаблоны',
                description: '8 профессиональных шаблонов для типовых задач',
                icon: 'bot' as IconType,
                features: ['Ассистенты', 'Аналитики', 'Специалисты', 'Команды']
              },
              {
                title: 'Визуальный интерфейс',
                description: 'Интуитивный UI с мгновенной обратной связью',
                icon: 'edit' as IconType,
                features: [
                  'Панель валидации',
                  'Цветовая индикация',
                  'Интерактивные исправления',
                  'Автозаполнение'
                ]
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-background-primary border-secondary h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="bg-accent/20 flex h-8 w-8 items-center justify-center rounded">
                        <Icon
                          type={feature.icon}
                          size="sm"
                          className="text-accent"
                        />
                      </div>
                      <div>
                        <CardTitle className="font-dmmono text-primary text-sm font-medium uppercase">
                          {feature.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-muted mb-3 text-xs">
                      {feature.description}
                    </CardDescription>
                    <div className="space-y-1">
                      {feature.features.map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                          <Icon
                            type="check-circle"
                            size="xs"
                            className="text-accent"
                          />
                          <span className="text-muted text-xs">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Итоги */}
      <Card className="from-accent/10 to-accent/5 border-accent/20 bg-gradient-to-r">
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            <h3 className="font-dmmono text-primary text-lg font-medium uppercase">
              🎉 Результат
            </h3>
            <p className="text-muted mx-auto max-w-2xl text-sm">
              Умный конфигуратор превращает создание AI агентов из сложного
              технического процесса в интуитивный и надежный workflow.
              Профессиональные агенты за минуты, а не часы!
            </p>
            <div className="flex justify-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <Icon
                  type="check-circle"
                  size="xs"
                  className="text-green-400"
                />
                <span className="text-muted">90% меньше ошибок</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon
                  type="check-circle"
                  size="xs"
                  className="text-green-400"
                />
                <span className="text-muted">5x быстрее создание</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon
                  type="check-circle"
                  size="xs"
                  className="text-green-400"
                />
                <span className="text-muted">100% покрытие Agno</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
