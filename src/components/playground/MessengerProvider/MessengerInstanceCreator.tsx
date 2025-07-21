'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Icon from '@/components/ui/icon'
import { toast } from 'sonner'
import { useMessengerProvider } from '@/hooks/useMessengerProvider'
import { ProviderType, InstanceType } from '@/types/messenger'
import { PROVIDER_CONFIGS } from '@/lib/messengerApi'

interface MessengerInstanceCreatorProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface FormData {
  user_id: string
  provider: ProviderType | ''
  type_instance: InstanceType[]
  agno_enabled: boolean
  agno_config: {
    model: string
    stream: boolean
    agnoUrl: string
    agent_id: string
  }
  webhook_enabled: boolean
  api_webhook_schema: {
    url: string
    allowGroups: boolean
    allowPrivate: boolean
  }
  [key: string]: unknown
}

const MessengerInstanceCreator = ({
  onSuccess,
  onCancel
}: MessengerInstanceCreatorProps) => {
  const { actions } = useMessengerProvider()
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    user_id: '',
    provider: '',
    type_instance: ['api'],
    agno_enabled: false,
    agno_config: {
      model: 'gpt-4o-mini',
      stream: false,
      agnoUrl:
        'https://crafty-v0-0-1.onrender.com/v1/playground/agents/demo_agent/runs',
      agent_id: 'demo_agent'
    },
    webhook_enabled: false,
    api_webhook_schema: {
      url: '',
      allowGroups: false,
      allowPrivate: true
    }
  })

  const selectedProviderConfig = formData.provider
    ? PROVIDER_CONFIGS[formData.provider]
    : null

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const updateNestedData = useCallback(
    (key: string, updates: Record<string, unknown>) => {
      setFormData((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...updates }
      }))
    },
    []
  )

  const validateForm = (): string | null => {
    if (!formData.user_id.trim()) return 'User ID is required'
    if (!formData.provider) return 'Please select a provider'

    if (selectedProviderConfig) {
      // Validate provider-specific required fields
      for (const field of selectedProviderConfig.fields) {
        if (field.required && !formData[field.key]) {
          return `${field.label} is required`
        }
      }
    }

    if (formData.webhook_enabled && !formData.api_webhook_schema.url.trim()) {
      return 'Webhook URL is required when webhook is enabled'
    }

    return null
  }

  const handleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsCreating(true)

    try {
      const payload: Record<string, unknown> = {
        user_id: formData.user_id,
        provider: formData.provider,
        type_instance: formData.type_instance
      }

      // Add provider-specific fields
      if (selectedProviderConfig) {
        selectedProviderConfig.fields.forEach((field) => {
          if (formData[field.key]) {
            payload[field.key] = formData[field.key]
          }
        })
      }

      // Add AGNO configuration if enabled
      if (formData.agno_enabled) {
        payload.agno_config = {
          ...formData.agno_config,
          enabled: true
        }
      }

      // Add webhook configuration if enabled
      if (formData.webhook_enabled) {
        payload.api_webhook_schema = {
          enabled: true,
          url: formData.api_webhook_schema.url,
          filters: {
            allowGroups: formData.api_webhook_schema.allowGroups,
            allowPrivate: formData.api_webhook_schema.allowPrivate
          }
        }
      }

      const response = await actions.createInstance(payload)

      if (response && onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create instance:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const renderProviderFields = () => {
    if (!selectedProviderConfig) return null

    return (
      <div className="space-y-4">
        {selectedProviderConfig.fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </Label>

            {field.type === 'select' ? (
              <Select
                value={(formData[field.key] as string) || ''}
                onValueChange={(value) =>
                  updateFormData({ [field.key]: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === 'boolean' ? (
              <div className="flex items-center space-x-2">
                <Switch
                  id={field.key}
                  checked={(formData[field.key] as boolean) || false}
                  onCheckedChange={(checked) =>
                    updateFormData({ [field.key]: checked })
                  }
                />
                <Label
                  htmlFor={field.key}
                  className="text-muted-foreground text-sm"
                >
                  {field.description}
                </Label>
              </div>
            ) : (
              <Input
                id={field.key}
                type={field.type}
                placeholder={field.placeholder}
                value={(formData[field.key] as string) || ''}
                onChange={(e) =>
                  updateFormData({ [field.key]: e.target.value })
                }
                className="text-sm"
              />
            )}

            {field.description && field.type !== 'boolean' && (
              <p className="text-muted-foreground text-xs">
                {field.description}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <Card className="bg-background-primary border-secondary">
        <CardHeader>
          <CardTitle className="font-dmmono text-primary text-xs font-medium uppercase">
            Select Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {Object.values(PROVIDER_CONFIGS).map((config) => (
              <motion.div
                key={config.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative cursor-pointer rounded-lg border p-3 transition-all ${
                  formData.provider === config.id
                    ? 'border-primary bg-accent ring-primary/20 ring-2'
                    : 'border-secondary hover:border-primary/50 bg-background-primary'
                }`}
                onClick={() => updateFormData({ provider: config.id })}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <div className="flex-1">
                    <h3 className="text-primary text-sm font-medium">
                      {config.name}
                    </h3>
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {config.description}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex gap-1">
                  {config.dockerRequired && (
                    <Badge variant="outline" className="text-xs">
                      Docker
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {config.authType.toUpperCase()}
                  </Badge>
                </div>

                {formData.provider === config.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-2 top-2"
                  >
                    <Icon type="check" size="xs" className="text-primary" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      {formData.provider && (
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="bg-background-secondary grid h-8 w-full shrink-0 grid-cols-3">
            <TabsTrigger
              value="basic"
              className="font-dmmono text-primary text-xs font-medium uppercase"
            >
              Basic
            </TabsTrigger>
            <TabsTrigger
              value="agno"
              className="font-dmmono text-primary text-xs font-medium uppercase"
            >
              AI Agent
            </TabsTrigger>
            <TabsTrigger
              value="webhook"
              className="font-dmmono text-primary text-xs font-medium uppercase"
            >
              Webhook
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4 space-y-4">
            <Card className="bg-background-primary border-secondary">
              <CardHeader>
                <CardTitle className="font-dmmono text-primary text-xs font-medium uppercase">
                  Basic Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user_id" className="text-sm font-medium">
                    User ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="user_id"
                    placeholder="Enter unique user ID"
                    value={formData.user_id}
                    onChange={(e) =>
                      updateFormData({ user_id: e.target.value })
                    }
                    className="text-sm"
                  />
                  <p className="text-muted-foreground text-xs">
                    Unique identifier for this instance
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Instance Type</Label>
                  <div className="flex gap-2">
                    {(['api', 'mcp'] as InstanceType[]).map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Switch
                          checked={formData.type_instance.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFormData({
                                type_instance: [...formData.type_instance, type]
                              })
                            } else {
                              updateFormData({
                                type_instance: formData.type_instance.filter(
                                  (t) => t !== type
                                )
                              })
                            }
                          }}
                        />
                        <Label className="text-sm">{type.toUpperCase()}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {renderProviderFields()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agno" className="mt-4 space-y-4">
            <Card className="bg-background-primary border-secondary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-dmmono text-primary text-xs font-medium uppercase">
                    AI Agent Integration
                  </CardTitle>
                  <Switch
                    checked={formData.agno_enabled}
                    onCheckedChange={(checked) =>
                      updateFormData({ agno_enabled: checked })
                    }
                  />
                </div>
              </CardHeader>
              {formData.agno_enabled && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Model</Label>
                    <Select
                      value={formData.agno_config.model}
                      onValueChange={(value) =>
                        updateNestedData('agno_config', { model: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">GPT-4O Mini</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4O</SelectItem>
                        <SelectItem value="claude-3-haiku">
                          Claude 3 Haiku
                        </SelectItem>
                        <SelectItem value="claude-3-sonnet">
                          Claude 3 Sonnet
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Agent ID</Label>
                    <Input
                      placeholder="demo_agent"
                      value={formData.agno_config.agent_id}
                      onChange={(e) =>
                        updateNestedData('agno_config', {
                          agent_id: e.target.value
                        })
                      }
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">AGNO URL</Label>
                    <Input
                      placeholder="https://your-agno-endpoint.com"
                      value={formData.agno_config.agnoUrl}
                      onChange={(e) =>
                        updateNestedData('agno_config', {
                          agnoUrl: e.target.value
                        })
                      }
                      className="text-sm"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.agno_config.stream}
                      onCheckedChange={(checked) =>
                        updateNestedData('agno_config', { stream: checked })
                      }
                    />
                    <Label className="text-sm">Enable Streaming</Label>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="webhook" className="mt-4 space-y-4">
            <Card className="bg-background-primary border-secondary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-dmmono text-primary text-xs font-medium uppercase">
                    Webhook Configuration
                  </CardTitle>
                  <Switch
                    checked={formData.webhook_enabled}
                    onCheckedChange={(checked) =>
                      updateFormData({ webhook_enabled: checked })
                    }
                  />
                </div>
              </CardHeader>
              {formData.webhook_enabled && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Webhook URL <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="https://your-webhook-endpoint.com"
                      value={formData.api_webhook_schema.url}
                      onChange={(e) =>
                        updateNestedData('api_webhook_schema', {
                          url: e.target.value
                        })
                      }
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Message Filters
                    </Label>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.api_webhook_schema.allowPrivate}
                        onCheckedChange={(checked) =>
                          updateNestedData('api_webhook_schema', {
                            allowPrivate: checked
                          })
                        }
                      />
                      <Label className="text-sm">Allow Private Messages</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.api_webhook_schema.allowGroups}
                        onCheckedChange={(checked) =>
                          updateNestedData('api_webhook_schema', {
                            allowGroups: checked
                          })
                        }
                      />
                      <Label className="text-sm">Allow Group Messages</Label>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Actions */}
      <div className="border-secondary flex justify-end gap-3 border-t pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isCreating}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isCreating || !formData.provider}
          className="bg-primary text-primary-foreground min-w-24"
        >
          {isCreating ? (
            <>
              <Icon type="loader-2" size="xs" className="mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Icon type="plus" size="xs" className="mr-2" />
              Create Instance
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default MessengerInstanceCreator
