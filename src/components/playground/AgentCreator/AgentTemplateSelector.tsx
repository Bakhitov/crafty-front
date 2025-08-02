'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import Icon from '@/components/ui/icon'
import { AgentTemplate, AgentTemplateManager } from '@/lib/agentTemplates'
import { IconType } from '@/components/ui/icon/types'

interface AgentTemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: AgentTemplate) => void
}

// Маппинг иконок шаблонов на доступные иконки
const getTemplateIcon = (iconName: string): IconType => {
  const iconMap: Record<string, IconType> = {
    'user-circle': 'user',
    brain: 'brain',
    'chart-bar': 'cpu',
    'book-open': 'file-text',
    'wrench-screwdriver': 'hammer',
    users: 'users',
    pencil: 'edit',
    'code-bracket': 'cpu'
  }
  return iconMap[iconName] || 'bot'
}

export default function AgentTemplateSelector({
  isOpen,
  onClose,
  onSelectTemplate
}: AgentTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] =
    useState<AgentTemplate | null>(null)
  const [showTemplateDetails, setShowTemplateDetails] = useState(false)

  const categories = AgentTemplateManager.getCategories()
  const allTemplates = AgentTemplateManager.getAllTemplates()

  // Фильтрация шаблонов
  const filteredTemplates = allTemplates.filter((template) => {
    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )

    return matchesCategory && matchesSearch
  })

  const handleTemplateClick = (template: AgentTemplate) => {
    setSelectedTemplate(template)
    setShowTemplateDetails(true)
  }

  const handleSelectTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate)
      onClose()
    }
  }

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'low':
        return 'text-green-400'
      case 'medium':
        return 'text-yellow-400'
      case 'high':
        return 'text-red-400'
      default:
        return 'text-zinc-400'
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner':
        return 'text-green-400'
      case 'intermediate':
        return 'text-yellow-400'
      case 'advanced':
        return 'text-red-400'
      default:
        return 'text-zinc-400'
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-background-secondary h-[80vh] max-w-6xl border-none">
          <DialogHeader>
            <DialogTitle className="font-dmmono text-primary text-lg font-medium uppercase">
              Select Agent Template
            </DialogTitle>
            <DialogDescription className="text-muted text-sm">
              Use ready-made templates for quick agent creation
            </DialogDescription>
          </DialogHeader>

          <div className="flex h-full flex-col">
            {/* Поиск и фильтры */}
            <div className="mb-6 space-y-4">
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-secondary bg-background-primary text-primary"
              />

              <Tabs
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <TabsList className="bg-background-primary grid w-full grid-cols-5">
                  <TabsTrigger
                    value="all"
                    className="font-dmmono text-xs font-medium uppercase"
                  >
                    Все
                  </TabsTrigger>
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="font-dmmono text-xs font-medium uppercase"
                    >
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Список шаблонов */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      className="bg-background-primary border-secondary hover:border-accent h-full cursor-pointer transition-all duration-200"
                      onClick={() => handleTemplateClick(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-accent/20 flex h-8 w-8 items-center justify-center rounded">
                              <Icon
                                type={getTemplateIcon(template.icon)}
                                size="sm"
                                className="text-accent"
                              />
                            </div>
                            <div>
                              <CardTitle className="font-dmmono text-primary text-sm font-medium uppercase">
                                {template.name}
                              </CardTitle>
                              <Badge
                                variant="outline"
                                className="border-accent text-accent mt-1 text-xs"
                              >
                                {
                                  categories.find(
                                    (c) => c.id === template.category
                                  )?.name
                                }
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <CardDescription className="text-muted mb-3 line-clamp-2 text-xs">
                          {template.description}
                        </CardDescription>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-secondary">Сложность:</span>
                            <span
                              className={getComplexityColor(
                                template.complexity
                              )}
                            >
                              {template.complexity}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-secondary">Стоимость:</span>
                            <span
                              className={getCostColor(template.estimatedCost)}
                            >
                              {template.estimatedCost}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-secondary">Модель:</span>
                            <span className="text-muted">
                              {template.modelConfig.id}
                            </span>
                          </div>
                        </div>

                        {/* Теги */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="bg-background-secondary text-muted text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="bg-background-secondary text-muted text-xs"
                            >
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Icon
                    type="alert-circle"
                    size="lg"
                    className="text-muted mb-4"
                  />
                  <h3 className="font-dmmono text-primary mb-2 text-sm font-medium uppercase">
                    No templates found
                  </h3>
                  <p className="text-muted text-xs">
                    Попробуйте изменить поисковый запрос или фильтры
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={() => setSelectedCategory('all')}
              variant="ghost"
              className="text-primary"
            >
              Сбросить фильтры
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Детали шаблона */}
      <Dialog open={showTemplateDetails} onOpenChange={setShowTemplateDetails}>
        <DialogContent className="bg-background-secondary max-h-[80vh] max-w-4xl overflow-y-auto border-none">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-accent/20 flex h-10 w-10 items-center justify-center rounded">
                    <Icon
                      type={getTemplateIcon(selectedTemplate.icon)}
                      size="md"
                      className="text-accent"
                    />
                  </div>
                  <div>
                    <DialogTitle className="font-dmmono text-primary text-lg font-medium uppercase">
                      {selectedTemplate.name}
                    </DialogTitle>
                    <DialogDescription className="text-muted text-sm">
                      {selectedTemplate.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Основная информация */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-background-primary border-secondary">
                    <CardContent className="pt-4">
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-secondary">Категория:</span>
                          <span className="text-muted">
                            {
                              categories.find(
                                (c) => c.id === selectedTemplate.category
                              )?.name
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">Сложность:</span>
                          <span
                            className={getComplexityColor(
                              selectedTemplate.complexity
                            )}
                          >
                            {selectedTemplate.complexity}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">Стоимость:</span>
                          <span
                            className={getCostColor(
                              selectedTemplate.estimatedCost
                            )}
                          >
                            {selectedTemplate.estimatedCost}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">Модель:</span>
                          <span className="text-muted">
                            {selectedTemplate.modelConfig.id}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-background-primary border-secondary">
                    <CardContent className="pt-4">
                      <h4 className="font-dmmono text-primary mb-2 text-xs font-medium uppercase">
                        Сценарий использования
                      </h4>
                      <p className="text-muted text-xs">
                        {selectedTemplate.useCase}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Системные инструкции */}
                <Card className="bg-background-primary border-secondary">
                  <CardHeader>
                    <CardTitle className="font-dmmono text-primary text-sm font-medium uppercase">
                      Системные инструкции
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedTemplate.systemInstructions.map(
                        (instruction, index) => (
                          <li
                            key={index}
                            className="text-muted flex items-start text-xs"
                          >
                            <span className="text-accent mr-2">•</span>
                            {instruction}
                          </li>
                        )
                      )}
                    </ul>
                  </CardContent>
                </Card>

                {/* Зависимости */}
                <Card className="bg-background-primary border-secondary">
                  <CardHeader>
                    <CardTitle className="font-dmmono text-primary text-sm font-medium uppercase">
                      Зависимости
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedTemplate.dependencies.map(
                        (dependency, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <Icon
                              type="check-circle"
                              size="xs"
                              className="text-accent"
                            />
                            <span className="text-muted text-xs">
                              {dependency}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Теги */}
                <div>
                  <h4 className="font-dmmono text-primary mb-3 text-sm font-medium uppercase">
                    Теги
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-background-secondary text-muted"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowTemplateDetails(false)}
                >
                  Назад
                </Button>
                <Button
                  onClick={handleSelectTemplate}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Использовать шаблон
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
