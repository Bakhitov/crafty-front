'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TextArea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  X,
  Save,
  Play,
  Trash2,
  RefreshCw,
  Power,
  PowerOff,
  QrCode,
  Key,
  Activity,
  Smartphone,
  MessageSquare,
  Bot,
  Globe,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'
import { useMessengerProvider } from '@/hooks/useMessengerProvider'
import Icon from '@/components/ui/icon'
import {
  ProviderType,
  InstanceStatus,
  InstanceType,
  MessengerInstanceUnion,
  CreateWhatsAppWebInstancePayload,
  CreateTelegramInstancePayload,
  CreateWhatsAppOfficialInstancePayload,
  CreateDiscordInstancePayload,
  CreateSlackInstancePayload,
  CreateMessengerInstancePayload,
  ProviderConfig
} from '@/types/messenger'

// Provider configurations
const providerConfigs: ProviderConfig[] = [
  {
    id: 'whatsappweb',
    name: 'WhatsApp Web',
    description: 'WhatsApp Web client using whatsapp-web.js',
    icon: 'message-circle',
    color: 'green',
    requiresAuth: true,
    authType: 'qr',
    dockerRequired: true,
    fields: [
      {
        key: 'user_id',
        label: 'User ID',
        type: 'text',
        required: true,
        placeholder: 'user-12345',
        description: 'Unique identifier for the user'
      }
    ]
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    description: 'Telegram Bot API integration',
    icon: 'message-circle',
    color: 'blue',
    requiresAuth: true,
    authType: 'token',
    dockerRequired: false,
    fields: [
      {
        key: 'user_id',
        label: 'User ID',
        type: 'text',
        required: true,
        placeholder: 'user-12345',
        description: 'Unique identifier for the user'
      },
      {
        key: 'token',
        label: 'Bot Token',
        type: 'password',
        required: true,
        placeholder: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        description: 'Bot token from @BotFather',
        validation: {
          pattern: '^\\d+:[A-Za-z0-9_-]+$',
          minLength: 35
        }
      }
    ]
  },
  {
    id: 'whatsapp-official',
    name: 'WhatsApp Business',
    description: 'WhatsApp Official Business API',
    icon: 'message-circle',
    color: 'green',
    requiresAuth: true,
    authType: 'api_key',
    dockerRequired: false,
    fields: [
      {
        key: 'user_id',
        label: 'User ID',
        type: 'text',
        required: true,
        placeholder: 'user-12345',
        description: 'Unique identifier for the user'
      },
      {
        key: 'phone_number_id',
        label: 'Phone Number ID',
        type: 'text',
        required: true,
        placeholder: '123456789012345',
        description: 'WhatsApp Business phone number ID'
      },
      {
        key: 'access_token',
        label: 'Access Token',
        type: 'password',
        required: true,
        placeholder: 'EAAxxxxxxxxxxxx',
        description: 'Facebook Graph API access token'
      },
      {
        key: 'webhook_verify_token',
        label: 'Webhook Verify Token',
        type: 'password',
        required: true,
        placeholder: 'your-verify-token',
        description: 'Token for webhook verification'
      }
    ]
  },
  {
    id: 'discord',
    name: 'Discord Bot',
    description: 'Discord bot integration',
    icon: 'bot',
    color: 'purple',
    requiresAuth: true,
    authType: 'token',
    dockerRequired: false,
    fields: [
      {
        key: 'user_id',
        label: 'User ID',
        type: 'text',
        required: true,
        placeholder: 'user-12345',
        description: 'Unique identifier for the user'
      },
      {
        key: 'bot_token',
        label: 'Bot Token',
        type: 'password',
        required: true,
        placeholder: 'MTxxxxxxxxx.xxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxx',
        description: 'Discord bot token from Discord Developer Portal'
      },
      {
        key: 'client_id',
        label: 'Client ID',
        type: 'text',
        required: true,
        placeholder: '123456789012345678',
        description: 'Discord application client ID'
      },
      {
        key: 'guild_id',
        label: 'Guild ID',
        type: 'text',
        required: false,
        placeholder: '123456789012345678',
        description: 'Discord server (guild) ID (optional)'
      }
    ]
  },
  {
    id: 'slack',
    name: 'Slack Bot',
    description: 'Slack workspace integration',
    icon: 'settings',
    color: 'purple',
    requiresAuth: true,
    authType: 'token',
    dockerRequired: false,
    fields: [
      {
        key: 'user_id',
        label: 'User ID',
        type: 'text',
        required: true,
        placeholder: 'user-12345',
        description: 'Unique identifier for the user'
      },
      {
        key: 'bot_token',
        label: 'Bot Token',
        type: 'password',
        required: true,
        placeholder: 'xoxb-xxxxxxxxxx-xxxxxxxxxx-xxxxxxxxxxxxxxxx',
        description: 'Slack bot token from Slack App settings'
      },
      {
        key: 'app_token',
        label: 'App Token',
        type: 'password',
        required: false,
        placeholder: 'xapp-xxxxxxxxxx-xxxxxxxxxx-xxxxxxxxxxxxxxxx',
        description: 'Slack app-level token (for socket mode)'
      },
      {
        key: 'signing_secret',
        label: 'Signing Secret',
        type: 'password',
        required: false,
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        description: 'Slack app signing secret'
      }
    ]
  }
]

const instanceStatuses: { id: InstanceStatus; name: string; color: string }[] =
  [
    { id: 'created', name: 'Created', color: 'gray' },
    { id: 'processing', name: 'Processing', color: 'yellow' },
    { id: 'running', name: 'Running', color: 'green' },
    { id: 'stopped', name: 'Stopped', color: 'red' },
    { id: 'error', name: 'Error', color: 'red' },
    { id: 'deleted', name: 'Deleted', color: 'gray' }
  ]

const instanceTypes: { id: InstanceType; name: string; description: string }[] =
  [
    { id: 'api', name: 'API', description: 'REST API integration' },
    { id: 'mcp', name: 'MCP', description: 'Model Context Protocol' }
  ]

// Move FormField component outside to prevent re-renders
const FormField = ({
  label,
  description,
  children
}: {
  label: string
  description?: string
  children: React.ReactNode
}) => (
  <div className="space-y-2">
    <Label className="font-dmmono text-xs font-medium uppercase">{label}</Label>
    {description && <p className="text-xs text-zinc-400">{description}</p>}
    {children}
  </div>
)

interface MessengerManagerProps {
  isOpen: boolean
  onClose: () => void
  editingInstanceId?: string | null
}

export default function MessengerManager({
  isOpen,
  onClose,
  editingInstanceId
}: MessengerManagerProps) {
  const {
    instances,
    isLoading,
    isCreating,
    error,
    stats,
    fetchInstances,
    createInstance,
    deleteInstance,
    startInstance,
    stopInstance,
    restartInstance,
    getInstanceMemory,
    getInstanceQR,
    clearInstanceErrors,
    setError
  } = useMessengerProvider()

  // Loading states
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null
  )

  // Form states
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderType>('whatsappweb')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [selectedInstanceTypes, setSelectedInstanceTypes] = useState<
    InstanceType[]
  >(['api'])

  // AGNO Configuration
  const [agnoEnabled, setAgnoEnabled] = useState(false)
  const [agnoModel, setAgnoModel] = useState('gpt-4.1')
  const [agnoStream, setAgnoStream] = useState(false)
  const [agnoUrl, setAgnoUrl] = useState(
    'https://crafty-v0-0-1.onrender.com/v1/playground/agents'
  )
  const [agnoAgentId, setAgnoAgentId] = useState('demo_agent')

  // Webhook Configuration
  const [webhookEnabled, setWebhookEnabled] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookAllowGroups, setWebhookAllowGroups] = useState(false)
  const [webhookAllowPrivate, setWebhookAllowPrivate] = useState(true)

  // Instance details for sidebar
  const [selectedInstance, setSelectedInstance] =
    useState<MessengerInstanceUnion | null>(null)
  const [instanceMemory, setInstanceMemory] = useState<any>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)

  const isEditMode = !!editingInstanceId
  const selectedProviderConfig = providerConfigs.find(
    (p) => p.id === selectedProvider
  )

  // Handle form field changes
  const updateFormField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  // Toggle instance type
  const toggleInstanceType = (type: InstanceType) => {
    setSelectedInstanceTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  // Load instance data for editing
  const loadInstanceData = useCallback(async () => {
    if (!editingInstanceId) return

    const instance = instances.find((i) => i.instance_id === editingInstanceId)
    if (!instance) {
      toast.error('Instance not found')
      return
    }

    setSelectedInstance(instance)
    setSelectedProvider(instance.provider)
    setSelectedInstanceTypes(instance.type_instance)

    // Load provider-specific data
    const newFormData: Record<string, string> = { user_id: instance.user_id }

    switch (instance.provider) {
      case 'telegram':
        if ('token' in instance) {
          newFormData.token = instance.token
        }
        break
      case 'whatsapp-official':
        if ('phone_number_id' in instance) {
          newFormData.phone_number_id = instance.phone_number_id
          newFormData.access_token = instance.access_token
          newFormData.webhook_verify_token = instance.webhook_verify_token
        }
        break
      case 'discord':
        if ('bot_token' in instance) {
          newFormData.bot_token = instance.bot_token
          newFormData.client_id = instance.client_id
          if ('guild_id' in instance && instance.guild_id) {
            newFormData.guild_id = instance.guild_id
          }
        }
        break
      case 'slack':
        if ('bot_token' in instance) {
          newFormData.bot_token = instance.bot_token
          if ('app_token' in instance && instance.app_token) {
            newFormData.app_token = instance.app_token
          }
          if ('signing_secret' in instance && instance.signing_secret) {
            newFormData.signing_secret = instance.signing_secret
          }
        }
        break
    }

    setFormData(newFormData)

    // Load AGNO config
    if (instance.agno_config) {
      setAgnoEnabled(instance.agno_config.enabled)
      setAgnoModel(instance.agno_config.model)
      setAgnoStream(instance.agno_config.stream)
      setAgnoUrl(instance.agno_config.agnoUrl)
      setAgnoAgentId(instance.agno_config.agent_id)
    }

    // Load webhook config
    if (instance.api_webhook_schema) {
      setWebhookEnabled(instance.api_webhook_schema.enabled)
      setWebhookUrl(instance.api_webhook_schema.url)
      if (instance.api_webhook_schema.filters) {
        setWebhookAllowGroups(instance.api_webhook_schema.filters.allowGroups)
        setWebhookAllowPrivate(instance.api_webhook_schema.filters.allowPrivate)
      }
    }

    // Load memory data
    try {
      const memoryData = await getInstanceMemory(editingInstanceId)
      setInstanceMemory(memoryData)
    } catch (error) {
      console.error('Failed to load instance memory:', error)
    }

    // Load QR code for WhatsApp Web
    if (instance.provider === 'whatsappweb') {
      try {
        const qrData = await getInstanceQR(editingInstanceId)
        setQrCode(qrData.qr_code)
      } catch (error) {
        console.error('Failed to load QR code:', error)
      }
    }
  }, [editingInstanceId, instances, getInstanceMemory, getInstanceQR])

  // Build instance payload
  const buildInstancePayload = () => {
    const basePayload = {
      user_id: formData.user_id,
      type_instance: selectedInstanceTypes,
      agno_config: agnoEnabled
        ? {
            model: agnoModel,
            stream: agnoStream,
            agnoUrl: agnoUrl + `/${agnoAgentId}/runs`,
            enabled: true,
            agent_id: agnoAgentId
          }
        : undefined,
      api_webhook_schema: webhookEnabled
        ? {
            enabled: true,
            url: webhookUrl,
            filters: {
              allowGroups: webhookAllowGroups,
              allowPrivate: webhookAllowPrivate
            }
          }
        : undefined
    }

    switch (selectedProvider) {
      case 'whatsappweb':
        return {
          ...basePayload,
          provider: 'whatsappweb'
        } as CreateWhatsAppWebInstancePayload

      case 'telegram':
        return {
          ...basePayload,
          provider: 'telegram',
          token: formData.token
        } as CreateTelegramInstancePayload

      case 'whatsapp-official':
        return {
          ...basePayload,
          provider: 'whatsapp-official',
          phone_number_id: formData.phone_number_id,
          access_token: formData.access_token,
          webhook_verify_token: formData.webhook_verify_token
        } as CreateWhatsAppOfficialInstancePayload

      case 'discord':
        return {
          ...basePayload,
          provider: 'discord',
          bot_token: formData.bot_token,
          client_id: formData.client_id,
          guild_id: formData.guild_id || undefined
        } as CreateDiscordInstancePayload

      case 'slack':
        return {
          ...basePayload,
          provider: 'slack',
          bot_token: formData.bot_token,
          app_token: formData.app_token || undefined,
          signing_secret: formData.signing_secret || undefined
        } as CreateSlackInstancePayload

      default:
        throw new Error(`Unsupported provider: ${selectedProvider}`)
    }
  }

  // Handle save
  const handleSave = async () => {
    // Validation
    if (!formData.user_id?.trim()) {
      toast.error('User ID is required')
      return
    }

    if (selectedInstanceTypes.length === 0) {
      toast.error('At least one instance type must be selected')
      return
    }

    // Provider-specific validation
    const config = selectedProviderConfig
    if (config) {
      for (const field of config.fields) {
        if (field.required && !formData[field.key]?.trim()) {
          toast.error(`${field.label} is required`)
          return
        }
      }
    }

    setIsSaving(true)
    try {
      const payload = buildInstancePayload()

      if (isEditMode) {
        // For edit mode, we would need an update endpoint
        toast.info('Edit functionality coming soon')
        return
      }

      const result = await createInstance(payload)
      toast.success(`Instance created successfully! ID: ${result.instance_id}`)

      // Refresh instances list
      await fetchInstances()

      // Close dialog
      onClose()
    } catch (error) {
      console.error('Error saving instance:', error)
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} instance`)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedInstanceId) return

    try {
      await deleteInstance(selectedInstanceId)
      toast.success('Instance deleted successfully')
      await fetchInstances()
      setShowDeleteDialog(false)
      onClose()
    } catch (error) {
      console.error('Error deleting instance:', error)
      toast.error('Failed to delete instance')
    }
  }

  // Handle instance actions
  const handleInstanceAction = async (
    action: 'start' | 'stop' | 'restart',
    instanceId: string
  ) => {
    try {
      switch (action) {
        case 'start':
          await startInstance(instanceId)
          break
        case 'stop':
          await stopInstance(instanceId)
          break
        case 'restart':
          await restartInstance(instanceId)
          break
      }
      toast.success(`Instance ${action} successful`)
      await fetchInstances()
    } catch (error) {
      console.error(`Error ${action} instance:`, error)
      toast.error(`Failed to ${action} instance`)
    }
  }

  // Load data on mount and when editing
  useEffect(() => {
    if (isOpen) {
      fetchInstances()
      if (isEditMode) {
        loadInstanceData()
      }
    }
  }, [isOpen, isEditMode, fetchInstances, loadInstanceData])

  // Reset form when provider changes
  useEffect(() => {
    if (!isEditMode) {
      setFormData({ user_id: `user-${Date.now()}` })
    }
  }, [selectedProvider, isEditMode])

  if (!isOpen) return null

  return (
    <div className="bg-background-primary fixed inset-0 z-50 flex flex-col">
      {/* Header */}
      <motion.header
        className="border-secondary border-b px-6 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="font-dmmono text-primary text-xs font-medium uppercase">
              {isEditMode
                ? 'Edit Messenger Instance'
                : 'Create Messenger Instance'}
              {isLoading && (
                <span className="text-muted ml-2">(Loading...)</span>
              )}
            </h1>
            {stats && (
              <div className="flex items-center space-x-4 text-xs text-zinc-400">
                <span>Total: {stats.total_instances}</span>
                <span>Active: {stats.active_instances}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              className="text-primary bg-secondary border-primary border-1 border border-dashed"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="mr-2 h-3 w-3" />
              {isSaving
                ? 'Saving...'
                : isEditMode
                  ? 'Update Instance'
                  : 'Create Instance'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-primary"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="flex-1 overflow-hidden">
        <div className="h-full px-6 py-6">
          <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Main Content */}
            <motion.div
              className="space-y-6 lg:col-span-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Tabs defaultValue="basic" className="flex h-full flex-col">
                <TabsList className="bg-background-secondary grid w-full grid-cols-4">
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
                    AI Config
                  </TabsTrigger>
                  <TabsTrigger
                    value="webhook"
                    className="font-dmmono text-primary text-xs font-medium uppercase"
                  >
                    Webhooks
                  </TabsTrigger>
                  <TabsTrigger
                    value="instances"
                    className="font-dmmono text-primary text-xs font-medium uppercase"
                  >
                    Instances
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6 flex-1 overflow-y-auto">
                  {/* BASIC CONFIGURATION */}
                  <TabsContent value="basic" className="mt-0 space-y-6">
                    <Card className="bg-background-secondary border-none">
                      <CardHeader>
                        <CardTitle className="font-dmmono text-xs font-medium uppercase">
                          Instance Configuration
                        </CardTitle>
                        <CardDescription className="text-xs text-zinc-400">
                          Basic instance settings and provider configuration
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Provider Selection */}
                        <FormField
                          label="Provider"
                          description="Select messenger platform"
                        >
                          <Select
                            value={selectedProvider}
                            onValueChange={(value: ProviderType) =>
                              setSelectedProvider(value)
                            }
                            disabled={isEditMode}
                          >
                            <SelectTrigger className="border-primary/15 bg-background-primary h-9 border text-xs font-medium uppercase">
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent className="bg-background-primary font-dmmono border-none shadow-lg">
                              {providerConfigs.map((provider) => (
                                <SelectItem
                                  key={provider.id}
                                  value={provider.id}
                                >
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className={`flex h-4 w-4 items-center justify-center rounded bg-${provider.color}-600`}
                                    >
                                      <Icon type={provider.icon} size="xs" />
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium uppercase">
                                        {provider.name}
                                      </div>
                                      <div className="text-xs text-zinc-400">
                                        {provider.description}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>

                        {/* Instance Types */}
                        <FormField
                          label="Instance Types"
                          description="Select instance operation modes"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            {instanceTypes.map((type) => (
                              <div
                                key={type.id}
                                className={`bg-background-primary cursor-pointer rounded-lg border border-zinc-700 p-3 transition-colors ${
                                  selectedInstanceTypes.includes(type.id)
                                    ? 'border-green-500 bg-green-950'
                                    : 'hover:border-zinc-600'
                                }`}
                                onClick={() => toggleInstanceType(type.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="text-primary text-xs font-medium uppercase">
                                      {type.name}
                                    </h5>
                                    <p className="text-xs text-zinc-400">
                                      {type.description}
                                    </p>
                                  </div>
                                  <Switch
                                    checked={selectedInstanceTypes.includes(
                                      type.id
                                    )}
                                    onCheckedChange={() =>
                                      toggleInstanceType(type.id)
                                    }
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </FormField>

                        {/* Provider-specific fields */}
                        {selectedProviderConfig && (
                          <div className="space-y-4">
                            <Separator className="bg-zinc-700" />
                            <h3 className="font-dmmono text-xs font-medium uppercase">
                              {selectedProviderConfig.name} Configuration
                            </h3>

                            <div className="grid grid-cols-1 gap-4">
                              {selectedProviderConfig.fields.map((field) => (
                                <FormField
                                  key={field.key}
                                  label={field.label}
                                  description={field.description}
                                >
                                  <Input
                                    type={field.type}
                                    placeholder={field.placeholder}
                                    value={formData[field.key] || ''}
                                    onChange={(e) =>
                                      updateFormField(field.key, e.target.value)
                                    }
                                    className="border-secondary bg-background-primary text-primary text-xs"
                                    required={field.required}
                                  />
                                </FormField>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* AGNO CONFIGURATION */}
                  <TabsContent value="agno" className="mt-0 space-y-6">
                    <Card className="bg-background-secondary border-none">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="font-dmmono text-xs font-medium uppercase">
                              AI Agent Configuration
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-400">
                              Configure AI agent integration (AGNO)
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label className="font-dmmono text-xs font-medium uppercase">
                              Enable AI
                            </Label>
                            <Switch
                              checked={agnoEnabled}
                              onCheckedChange={setAgnoEnabled}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {agnoEnabled && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                label="Model"
                                description="AI model to use"
                              >
                                <Select
                                  value={agnoModel}
                                  onValueChange={setAgnoModel}
                                >
                                  <SelectTrigger className="border-primary/15 bg-background-primary h-9 border text-xs font-medium uppercase">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background-primary font-dmmono border-none">
                                    <SelectItem value="gpt-4.1">
                                      GPT-4.1
                                    </SelectItem>
                                    <SelectItem value="gpt-4o">
                                      GPT-4O
                                    </SelectItem>
                                    <SelectItem value="claude-3-5-sonnet">
                                      Claude 3.5 Sonnet
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormField>

                              <FormField
                                label="Agent ID"
                                description="Agent identifier"
                              >
                                <Input
                                  placeholder="demo_agent"
                                  value={agnoAgentId}
                                  onChange={(e) =>
                                    setAgnoAgentId(e.target.value)
                                  }
                                  className="border-secondary bg-background-primary text-primary text-xs"
                                />
                              </FormField>
                            </div>

                            <FormField
                              label="AGNO URL"
                              description="AI agent service endpoint"
                            >
                              <Input
                                placeholder="https://crafty-v0-0-1.onrender.com/v1/playground/agents"
                                value={agnoUrl}
                                onChange={(e) => setAgnoUrl(e.target.value)}
                                className="border-secondary bg-background-primary text-primary text-xs"
                              />
                            </FormField>

                            <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                              <div className="space-y-1">
                                <Label className="font-dmmono text-xs font-medium uppercase">
                                  Stream Response
                                </Label>
                                <p className="text-xs text-zinc-400">
                                  Enable streaming responses
                                </p>
                              </div>
                              <Switch
                                checked={agnoStream}
                                onCheckedChange={setAgnoStream}
                              />
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* WEBHOOK CONFIGURATION */}
                  <TabsContent value="webhook" className="mt-0 space-y-6">
                    <Card className="bg-background-secondary border-none">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="font-dmmono text-xs font-medium uppercase">
                              Webhook Configuration
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-400">
                              Configure webhook for receiving messages
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label className="font-dmmono text-xs font-medium uppercase">
                              Enable Webhook
                            </Label>
                            <Switch
                              checked={webhookEnabled}
                              onCheckedChange={setWebhookEnabled}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {webhookEnabled && (
                          <>
                            <FormField
                              label="Webhook URL"
                              description="Endpoint to receive webhook events"
                            >
                              <Input
                                placeholder="https://your-app.com/webhook"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                className="border-secondary bg-background-primary text-primary text-xs"
                              />
                            </FormField>

                            <div className="space-y-3">
                              <h4 className="font-dmmono text-xs font-medium uppercase">
                                Webhook Filters
                              </h4>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                  <div className="space-y-1">
                                    <Label className="font-dmmono text-xs font-medium uppercase">
                                      Allow Groups
                                    </Label>
                                    <p className="text-xs text-zinc-400">
                                      Receive group messages
                                    </p>
                                  </div>
                                  <Switch
                                    checked={webhookAllowGroups}
                                    onCheckedChange={setWebhookAllowGroups}
                                  />
                                </div>

                                <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                  <div className="space-y-1">
                                    <Label className="font-dmmono text-xs font-medium uppercase">
                                      Allow Private
                                    </Label>
                                    <p className="text-xs text-zinc-400">
                                      Receive private messages
                                    </p>
                                  </div>
                                  <Switch
                                    checked={webhookAllowPrivate}
                                    onCheckedChange={setWebhookAllowPrivate}
                                  />
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* INSTANCES LIST */}
                  <TabsContent value="instances" className="mt-0 space-y-6">
                    <Card className="bg-background-secondary border-none">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="font-dmmono text-xs font-medium uppercase">
                              Messenger Instances
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-400">
                              Manage existing messenger instances
                            </CardDescription>
                          </div>
                          <Button
                            size="sm"
                            onClick={fetchInstances}
                            className="bg-background-primary text-primary"
                          >
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Refresh
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-80 space-y-3 overflow-y-auto">
                          {instances.map((instance) => (
                            <div
                              key={instance.instance_id}
                              className="bg-background-primary rounded-lg border border-zinc-700 p-4"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <Badge
                                      variant="outline"
                                      className={`border-${
                                        providerConfigs.find(
                                          (p) => p.id === instance.provider
                                        )?.color
                                      }-500 text-${
                                        providerConfigs.find(
                                          (p) => p.id === instance.provider
                                        )?.color
                                      }-400`}
                                    >
                                      {instance.provider}
                                    </Badge>
                                    <Badge
                                      variant="secondary"
                                      className={`bg-${
                                        instanceStatuses.find(
                                          (s) => s.id === instance.status
                                        )?.color
                                      }-950 text-${
                                        instanceStatuses.find(
                                          (s) => s.id === instance.status
                                        )?.color
                                      }-400`}
                                    >
                                      {instance.status}
                                    </Badge>
                                  </div>
                                  <p className="mt-1 text-xs text-zinc-400">
                                    ID: {instance.instance_id}
                                  </p>
                                  <p className="text-xs text-zinc-400">
                                    User: {instance.user_id}
                                  </p>
                                  {instance.port && (
                                    <p className="text-xs text-zinc-400">
                                      Port: {instance.port}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center space-x-2">
                                  {instance.status === 'running' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleInstanceAction(
                                          'stop',
                                          instance.instance_id
                                        )
                                      }
                                      className="h-7 w-7 p-0"
                                    >
                                      <PowerOff className="h-3 w-3" />
                                    </Button>
                                  )}

                                  {instance.status === 'stopped' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleInstanceAction(
                                          'start',
                                          instance.instance_id
                                        )
                                      }
                                      className="h-7 w-7 p-0"
                                    >
                                      <Power className="h-3 w-3" />
                                    </Button>
                                  )}

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleInstanceAction(
                                        'restart',
                                        instance.instance_id
                                      )
                                    }
                                    className="h-7 w-7 p-0"
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>

                                  {instance.provider === 'whatsappweb' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        setSelectedInstance(instance)
                                      }
                                      className="h-7 w-7 p-0"
                                    >
                                      <QrCode className="h-3 w-3" />
                                    </Button>
                                  )}

                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedInstanceId(
                                        instance.instance_id
                                      )
                                      setShowDeleteDialog(true)
                                    }}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}

                          {instances.length === 0 && (
                            <div className="py-8 text-center text-xs text-zinc-400">
                              No instances found. Create your first instance
                              using the form above.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </motion.div>

            {/* Sidebar - Instance Preview */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="bg-background-secondary border-none">
                <CardHeader>
                  <CardTitle className="font-dmmono text-xs font-medium uppercase">
                    Instance Preview
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Configuration summary
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-secondary">Provider:</span>
                      <span className="text-muted">
                        {selectedProviderConfig?.name || 'Not selected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Instance Types:</span>
                      <span className="text-muted">
                        {selectedInstanceTypes.join(', ') || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">AI Integration:</span>
                      <span
                        className={`text-xs ${agnoEnabled ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {agnoEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Webhooks:</span>
                      <span
                        className={`text-xs ${webhookEnabled ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {webhookEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {agnoEnabled && (
                      <>
                        <Separator className="my-3 bg-zinc-700" />
                        <div className="flex justify-between">
                          <span className="text-secondary">AI Model:</span>
                          <span className="text-muted">{agnoModel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">Agent ID:</span>
                          <span className="text-muted">{agnoAgentId}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {selectedInstance && (
                    <>
                      <Separator className="my-4 bg-zinc-700" />
                      <div>
                        <p className="font-dmmono mb-2 text-xs font-medium uppercase text-zinc-200">
                          Selected Instance:
                        </p>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-secondary">ID:</span>
                            <span className="text-muted">
                              {selectedInstance.instance_id.slice(0, 8)}...
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-secondary">Status:</span>
                            <Badge
                              variant="outline"
                              className={`text-xs text-${
                                instanceStatuses.find(
                                  (s) => s.id === selectedInstance.status
                                )?.color
                              }-400`}
                            >
                              {selectedInstance.status}
                            </Badge>
                          </div>
                          {selectedInstance.port && (
                            <div className="flex justify-between">
                              <span className="text-secondary">Port:</span>
                              <span className="text-muted">
                                {selectedInstance.port}
                              </span>
                            </div>
                          )}
                          {selectedInstance.api_key && (
                            <div className="flex justify-between">
                              <span className="text-secondary">API Key:</span>
                              <span className="text-muted">
                                {selectedInstance.api_key.slice(0, 8)}...
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {qrCode && (
                    <>
                      <Separator className="my-4 bg-zinc-700" />
                      <div>
                        <p className="font-dmmono mb-2 text-xs font-medium uppercase text-zinc-200">
                          QR Code:
                        </p>
                        <div className="rounded bg-white p-2">
                          <img
                            src={qrCode}
                            alt="WhatsApp QR Code"
                            className="h-auto w-full"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Stats Card */}
              {stats && (
                <Card className="bg-background-secondary border-none">
                  <CardHeader>
                    <CardTitle className="font-dmmono text-xs font-medium uppercase">
                      System Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-secondary">Total Instances:</span>
                        <span className="text-muted">
                          {stats.total_instances}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary">Active:</span>
                        <span className="text-green-400">
                          {stats.active_instances}
                        </span>
                      </div>
                      <Separator className="my-2 bg-zinc-700" />
                      {Object.entries(stats.by_provider).map(
                        ([provider, count]) => (
                          <div key={provider} className="flex justify-between">
                            <span className="text-secondary">{provider}:</span>
                            <span className="text-muted">{count}</span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-background-primary border-zinc-700">
          <DialogHeader>
            <DialogTitle className="font-dmmono text-xs font-medium uppercase">
              Delete Instance
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Are you sure you want to delete this instance? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
