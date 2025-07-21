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
import { X, Save, Play, QrCode, Bot } from 'lucide-react'
import { toast } from 'sonner'
import Icon from '@/components/ui/icon'
import { IconType } from '@/components/ui/icon/types'
import { cn } from '@/lib/utils'
import {
  useMessengerProvider,
  useProviderConfig
} from '@/hooks/useMessengerProvider'
import {
  MessengerInstanceUnion,
  ProviderType,
  InstanceType,
  CreateWhatsAppWebInstancePayload,
  CreateTelegramInstancePayload,
  CreateWhatsAppOfficialInstancePayload,
  CreateDiscordInstancePayload,
  CreateSlackInstancePayload,
  CreateMessengerInstancePayload
} from '@/types/messenger'

// Provider configurations
const providerConfigs = [
  {
    id: 'whatsappweb' as ProviderType,
    name: 'WhatsApp Web',
    description: 'Connect via WhatsApp Web protocol',
    icon: 'message-circle' as IconType,
    color: '#25D366',
    requiresAuth: true,
    authType: 'qr' as const,
    dockerRequired: true
  },
  {
    id: 'telegram' as ProviderType,
    name: 'Telegram',
    description: 'Connect via Telegram Bot API',
    icon: 'bot' as IconType,
    color: '#0088CC',
    requiresAuth: true,
    authType: 'token' as const,
    dockerRequired: true
  },
  {
    id: 'whatsapp-official' as ProviderType,
    name: 'WhatsApp Official',
    description: 'Connect via WhatsApp Business API',
    icon: 'message-circle' as IconType,
    color: '#25D366',
    requiresAuth: true,
    authType: 'api_key' as const,
    dockerRequired: true
  },
  {
    id: 'discord' as ProviderType,
    name: 'Discord',
    description: 'Connect via Discord Bot API',
    icon: 'bot' as IconType,
    color: '#5865F2',
    requiresAuth: true,
    authType: 'token' as const,
    dockerRequired: true
  },
  {
    id: 'slack' as ProviderType,
    name: 'Slack',
    description: 'Connect via Slack API',
    icon: 'message-circle' as IconType,
    color: '#4A154B',
    requiresAuth: true,
    authType: 'token' as const,
    dockerRequired: true
  },
  {
    id: 'messenger' as ProviderType,
    name: 'Messenger',
    description: 'Connect via Facebook Messenger API',
    icon: 'message-circle' as IconType,
    color: '#006AFF',
    requiresAuth: true,
    authType: 'token' as const,
    dockerRequired: true
  }
]

interface MessengerInstanceEditorProps {
  editingInstance?: MessengerInstanceUnion | null
  onClose: () => void
}

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

export default function MessengerInstanceEditor({
  editingInstance,
  onClose
}: MessengerInstanceEditorProps) {
  const { actions } = useMessengerProvider()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Basic configuration
  const [userId, setUserId] = useState('')
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderType>('whatsappweb')
  const [instanceTypes, setInstanceTypes] = useState<InstanceType[]>(['mcp'])

  // Provider-specific fields
  const [token, setToken] = useState('')
  const [botUsername, setBotUsername] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [webhookVerifyToken, setWebhookVerifyToken] = useState('')
  const [businessAccountId, setBusinessAccountId] = useState('')
  const [clientId, setClientId] = useState('')
  const [guildId, setGuildId] = useState('')
  const [appToken, setAppToken] = useState('')
  const [signingSecret, setSigningSecret] = useState('')
  const [workspaceId, setWorkspaceId] = useState('')
  const [pageAccessToken, setPageAccessToken] = useState('')
  const [verifyToken, setVerifyToken] = useState('')
  const [pageId, setPageId] = useState('')
  const [appSecret, setAppSecret] = useState('')

  // AGNO Configuration
  const [agnoEnabled, setAgnoEnabled] = useState(false)
  const [agnoModel, setAgnoModel] = useState('gpt-4')
  const [agnoStream, setAgnoStream] = useState(true)
  const [agnoUrl, setAgnoUrl] = useState('')
  const [agentId, setAgentId] = useState('')

  // Webhook Configuration
  const [webhookEnabled, setWebhookEnabled] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [allowGroups, setAllowGroups] = useState(true)
  const [allowPrivate, setAllowPrivate] = useState(true)

  const isEditMode = !!editingInstance
  const selectedProviderConfig = providerConfigs.find(
    (p) => p.id === selectedProvider
  )

  // Load instance data for editing
  const loadInstanceData = useCallback(() => {
    if (!editingInstance) return

    setUserId(editingInstance.user_id)
    setSelectedProvider(editingInstance.provider)
    setInstanceTypes(editingInstance.type_instance)

    // Load provider-specific fields
    switch (editingInstance.provider) {
      case 'telegram': {
        const telegramInstance = editingInstance as any
        setToken(telegramInstance.token || '')
        setBotUsername(telegramInstance.bot_username || '')
        break
      }
      case 'whatsapp-official': {
        const waInstance = editingInstance as any
        setPhoneNumberId(waInstance.phone_number_id || '')
        setAccessToken(waInstance.access_token || '')
        setWebhookVerifyToken(waInstance.webhook_verify_token || '')
        setBusinessAccountId(waInstance.business_account_id || '')
        break
      }
      case 'discord': {
        const discordInstance = editingInstance as any
        setToken(discordInstance.bot_token || '')
        setClientId(discordInstance.client_id || '')
        setGuildId(discordInstance.guild_id || '')
        break
      }
      case 'slack': {
        const slackInstance = editingInstance as any
        setToken(slackInstance.bot_token || '')
        setAppToken(slackInstance.app_token || '')
        setSigningSecret(slackInstance.signing_secret || '')
        setWorkspaceId(slackInstance.workspace_id || '')
        break
      }
      case 'messenger': {
        const messengerInstance = editingInstance as any
        setPageAccessToken(messengerInstance.page_access_token || '')
        setVerifyToken(messengerInstance.verify_token || '')
        setPageId(messengerInstance.page_id || '')
        setAppSecret(messengerInstance.app_secret || '')
        break
      }
    }

    // Load AGNO configuration
    if (editingInstance.agno_config) {
      setAgnoEnabled(editingInstance.agno_config.enabled)
      setAgnoModel(editingInstance.agno_config.model)
      setAgnoStream(editingInstance.agno_config.stream)
      setAgnoUrl(editingInstance.agno_config.agnoUrl)
      setAgentId(editingInstance.agno_config.agent_id)
    }

    // Load webhook configuration
    if (editingInstance.api_webhook_schema) {
      setWebhookEnabled(editingInstance.api_webhook_schema.enabled)
      setWebhookUrl(editingInstance.api_webhook_schema.url)
      if (editingInstance.api_webhook_schema.filters) {
        setAllowGroups(editingInstance.api_webhook_schema.filters.allowGroups)
        setAllowPrivate(editingInstance.api_webhook_schema.filters.allowPrivate)
      }
    }
  }, [editingInstance])

  useEffect(() => {
    if (isEditMode) {
      loadInstanceData()
    } else {
      // Reset form for new instance
      setUserId('')
      setToken('')
      setBotUsername('')
      setPhoneNumberId('')
      setAccessToken('')
      setWebhookVerifyToken('')
      setBusinessAccountId('')
      setClientId('')
      setGuildId('')
      setAppToken('')
      setSigningSecret('')
      setWorkspaceId('')
      setPageAccessToken('')
      setVerifyToken('')
      setPageId('')
      setAppSecret('')
      setAgnoEnabled(false)
      setWebhookEnabled(false)
    }
  }, [isEditMode, loadInstanceData])

  const buildInstancePayload = () => {
    const basePayload = {
      user_id: userId,
      provider: selectedProvider,
      type_instance: instanceTypes,
      agno_config: agnoEnabled
        ? {
            model: agnoModel,
            stream: agnoStream,
            agnoUrl: agnoUrl,
            enabled: agnoEnabled,
            agent_id: agentId
          }
        : undefined,
      api_webhook_schema: webhookEnabled
        ? {
            enabled: webhookEnabled,
            url: webhookUrl,
            filters: {
              allowGroups: allowGroups,
              allowPrivate: allowPrivate
            }
          }
        : undefined
    }

    switch (selectedProvider) {
      case 'whatsappweb':
        return basePayload as CreateWhatsAppWebInstancePayload

      case 'telegram':
        return {
          ...basePayload,
          token: token
        } as CreateTelegramInstancePayload

      case 'whatsapp-official':
        return {
          ...basePayload,
          phone_number_id: phoneNumberId,
          access_token: accessToken,
          webhook_verify_token: webhookVerifyToken
        } as CreateWhatsAppOfficialInstancePayload

      case 'discord':
        return {
          ...basePayload,
          bot_token: token,
          client_id: clientId,
          guild_id: guildId
        } as CreateDiscordInstancePayload

      case 'slack':
        return {
          ...basePayload,
          bot_token: token,
          app_token: appToken,
          signing_secret: signingSecret
        } as CreateSlackInstancePayload

      case 'messenger':
        return {
          ...basePayload,
          page_access_token: pageAccessToken,
          verify_token: verifyToken,
          page_id: pageId,
          app_secret: appSecret
        } as CreateMessengerInstancePayload

      default:
        throw new Error(`Unsupported provider: ${selectedProvider}`)
    }
  }

  const handleSave = async () => {
    if (!userId.trim()) {
      toast.error('User ID is required')
      return
    }

    // Validate provider-specific fields
    switch (selectedProvider) {
      case 'telegram':
        if (!token.trim()) {
          toast.error('Bot token is required for Telegram')
          return
        }
        break
      case 'whatsapp-official':
        if (
          !phoneNumberId.trim() ||
          !accessToken.trim() ||
          !webhookVerifyToken.trim()
        ) {
          toast.error(
            'Phone Number ID, Access Token, and Webhook Verify Token are required for WhatsApp Official'
          )
          return
        }
        break
      case 'discord':
        if (!token.trim() || !clientId.trim()) {
          toast.error('Bot Token and Client ID are required for Discord')
          return
        }
        break
      case 'slack':
        if (!token.trim()) {
          toast.error('Bot Token is required for Slack')
          return
        }
        break
      case 'messenger':
        if (!pageAccessToken.trim() || !verifyToken.trim() || !pageId.trim()) {
          toast.error(
            'Page Access Token, Verify Token, and Page ID are required for Messenger'
          )
          return
        }
        break
    }

    setIsSaving(true)
    try {
      const payload = buildInstancePayload()
      const result = await actions.createInstance(payload)

      if (result) {
        toast.success(
          `${selectedProviderConfig?.name} instance ${isEditMode ? 'updated' : 'created'} successfully!`
        )
        onClose()
      }
    } catch (error) {
      console.error('Error saving instance:', error)
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} instance`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = () => {
    if (!userId.trim()) {
      toast.error('Please save the instance first before testing')
      return
    }
    toast.info('Instance testing functionality coming soon!')
  }

  const handleDelete = () => {
    if (!isEditMode || !editingInstance) {
      return
    }
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!editingInstance) return

    try {
      await actions.deleteInstance(editingInstance.instance_id)
      toast.success('Instance deleted successfully!')
      onClose()
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting instance:', error)
      toast.error('Failed to delete instance')
      setShowDeleteDialog(false)
    }
  }

  const renderProviderSpecificFields = () => {
    switch (selectedProvider) {
      case 'whatsappweb':
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="mb-2 flex items-center gap-2">
                <QrCode className="h-4 w-4 text-amber-500" />
                <h4 className="text-sm font-medium text-amber-500">
                  QR Code Authentication
                </h4>
              </div>
              <p className="text-xs text-zinc-400">
                WhatsApp Web instances require QR code scanning for
                authentication. After creating the instance, you'll need to scan
                the QR code with your WhatsApp mobile app.
              </p>
            </div>
          </div>
        )

      case 'telegram':
        return (
          <div className="space-y-4">
            <FormField
              label="Bot Token"
              description="Get from @BotFather on Telegram"
            >
              <Input
                type="password"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
            <FormField
              label="Bot Username"
              description="Optional: Bot username (without @)"
            >
              <Input
                placeholder="my_bot"
                value={botUsername}
                onChange={(e) => setBotUsername(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
          </div>
        )

      case 'whatsapp-official':
        return (
          <div className="space-y-4">
            <FormField
              label="Phone Number ID"
              description="WhatsApp Business phone number ID"
            >
              <Input
                placeholder="1234567890123456"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
            <FormField
              label="Access Token"
              description="WhatsApp Business API access token"
            >
              <Input
                type="password"
                placeholder="EAAxxxxxxxxxxxxxxx"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
            <FormField
              label="Webhook Verify Token"
              description="Token for webhook verification"
            >
              <Input
                placeholder="my_verify_token"
                value={webhookVerifyToken}
                onChange={(e) => setWebhookVerifyToken(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
            <FormField
              label="Business Account ID"
              description="Optional: WhatsApp Business Account ID"
            >
              <Input
                placeholder="1234567890123456"
                value={businessAccountId}
                onChange={(e) => setBusinessAccountId(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
          </div>
        )

      case 'discord':
        return (
          <div className="space-y-4">
            <FormField
              label="Bot Token"
              description="Discord bot token from Developer Portal"
            >
              <Input
                type="password"
                placeholder="MTxxxxxxxxxxxxxxxxx.Yxxxxx.Zxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
            <FormField
              label="Client ID"
              description="Discord application client ID"
            >
              <Input
                placeholder="1234567890123456789"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
            <FormField
              label="Guild ID"
              description="Optional: Discord server (guild) ID"
            >
              <Input
                placeholder="1234567890123456789"
                value={guildId}
                onChange={(e) => setGuildId(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
          </div>
        )

      case 'slack':
        return (
          <div className="space-y-4">
            <FormField
              label="Bot Token"
              description="Slack bot user OAuth token"
            >
              <Input
                type="password"
                placeholder="xoxb-xxxxxxxxxx-xxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
            <FormField
              label="App Token"
              description="Optional: Slack app-level token"
            >
              <Input
                type="password"
                placeholder="xapp-x-xxxxxxxxxx-xxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx"
                value={appToken}
                onChange={(e) => setAppToken(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
            <FormField
              label="Signing Secret"
              description="Optional: Slack signing secret"
            >
              <Input
                type="password"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={signingSecret}
                onChange={(e) => setSigningSecret(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
            <FormField
              label="Workspace ID"
              description="Optional: Slack workspace ID"
            >
              <Input
                placeholder="T1234567890"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
          </div>
        )

      case 'messenger':
        return (
          <div className="space-y-4">
            <FormField
              label="Page Access Token"
              description="Facebook page access token"
            >
              <Input
                type="password"
                placeholder="EAAxxxxxxxxxxxxxxx"
                value={pageAccessToken}
                onChange={(e) => setPageAccessToken(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
            <FormField
              label="Verify Token"
              description="Webhook verification token"
            >
              <Input
                placeholder="my_verify_token"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
            <FormField label="Page ID" description="Facebook page ID">
              <Input
                placeholder="1234567890123456"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
            <FormField
              label="App Secret"
              description="Optional: Facebook app secret"
            >
              <Input
                type="password"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-background-primary flex h-screen flex-1 flex-col">
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
                : 'Create New Messenger Instance'}
              {isLoading && (
                <span className="text-muted ml-2">(Loading...)</span>
              )}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              className="text-primary bg-primary"
            >
              <Play className="mr-2 h-3 w-3" />
              Test Instance
            </Button>
            {isEditMode && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            )}
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
                <TabsList className="bg-background-secondary grid w-full grid-cols-3">
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
                    AGNO
                  </TabsTrigger>
                  <TabsTrigger
                    value="webhook"
                    className="font-dmmono text-primary text-xs font-medium uppercase"
                  >
                    Webhook
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
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            label="User ID"
                            description="Unique identifier for this instance"
                          >
                            <Input
                              placeholder="user123"
                              value={userId}
                              onChange={(e) => setUserId(e.target.value)}
                              className="border-secondary bg-background-primary text-primary text-xs"
                            />
                          </FormField>

                          <FormField
                            label="Provider"
                            description="Messenger platform to connect"
                          >
                            <Select
                              value={selectedProvider}
                              onValueChange={(value) =>
                                setSelectedProvider(value as ProviderType)
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
                                        className="h-3 w-3 rounded-full"
                                        style={{
                                          backgroundColor: provider.color
                                        }}
                                      />
                                      <span className="text-xs font-medium uppercase">
                                        {provider.name}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormField>
                        </div>

                        <FormField
                          label="Instance Types"
                          description="Types of functionality to enable"
                        >
                          <div className="flex gap-4">
                            <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                              <div className="space-y-1">
                                <Label className="font-dmmono text-xs font-medium uppercase">
                                  API
                                </Label>
                                <p className="text-xs text-zinc-400">
                                  Enable API access
                                </p>
                              </div>
                              <Switch
                                checked={instanceTypes.includes('api')}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setInstanceTypes((prev) => [...prev, 'api'])
                                  } else {
                                    setInstanceTypes((prev) =>
                                      prev.filter((t) => t !== 'api')
                                    )
                                  }
                                }}
                              />
                            </div>
                            <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                              <div className="space-y-1">
                                <Label className="font-dmmono text-xs font-medium uppercase">
                                  MCP
                                </Label>
                                <p className="text-xs text-zinc-400">
                                  Enable MCP protocol
                                </p>
                              </div>
                              <Switch
                                checked={instanceTypes.includes('mcp')}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setInstanceTypes((prev) => [...prev, 'mcp'])
                                  } else {
                                    setInstanceTypes((prev) =>
                                      prev.filter((t) => t !== 'mcp')
                                    )
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </FormField>

                        {selectedProviderConfig && (
                          <div className="border-secondary border-t pt-4">
                            <h3 className="font-dmmono mb-4 text-xs font-medium uppercase">
                              {selectedProviderConfig.name} Configuration
                            </h3>
                            {renderProviderSpecificFields()}
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
                              AGNO Integration
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-400">
                              Connect with AGNO AI agents for intelligent
                              responses
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label className="font-dmmono text-xs font-medium uppercase">
                              Enable AGNO
                            </Label>
                            <Switch
                              checked={agnoEnabled}
                              onCheckedChange={setAgnoEnabled}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {agnoEnabled && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                label="AGNO URL"
                                description="AGNO server endpoint"
                              >
                                <Input
                                  placeholder="https://agno.example.com"
                                  value={agnoUrl}
                                  onChange={(e) => setAgnoUrl(e.target.value)}
                                  className="border-secondary bg-background-primary text-primary text-xs"
                                />
                              </FormField>

                              <FormField
                                label="Agent ID"
                                description="AGNO agent identifier"
                              >
                                <Input
                                  placeholder="agent-123"
                                  value={agentId}
                                  onChange={(e) => setAgentId(e.target.value)}
                                  className="border-secondary bg-background-primary text-primary text-xs"
                                />
                              </FormField>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                label="Model"
                                description="AI model to use"
                              >
                                <Select
                                  value={agnoModel}
                                  onValueChange={setAgnoModel}
                                >
                                  <SelectTrigger className="border-primary/15 bg-background-primary h-9 border text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                                    <SelectItem value="gpt-3.5-turbo">
                                      GPT-3.5 Turbo
                                    </SelectItem>
                                    <SelectItem value="claude-3-opus">
                                      Claude 3 Opus
                                    </SelectItem>
                                    <SelectItem value="claude-3-sonnet">
                                      Claude 3 Sonnet
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormField>

                              <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                <div className="space-y-1">
                                  <Label className="font-dmmono text-xs font-medium uppercase">
                                    Stream Responses
                                  </Label>
                                  <p className="text-xs text-zinc-400">
                                    Enable response streaming
                                  </p>
                                </div>
                                <Switch
                                  checked={agnoStream}
                                  onCheckedChange={setAgnoStream}
                                />
                              </div>
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
                      <CardContent className="space-y-4">
                        {webhookEnabled && (
                          <>
                            <FormField
                              label="Webhook URL"
                              description="URL to receive webhook notifications"
                            >
                              <Input
                                placeholder="https://your-server.com/webhook"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                className="border-secondary bg-background-primary text-primary text-xs"
                              />
                            </FormField>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                <div className="space-y-1">
                                  <Label className="font-dmmono text-xs font-medium uppercase">
                                    Allow Groups
                                  </Label>
                                  <p className="text-xs text-zinc-400">
                                    Process group messages
                                  </p>
                                </div>
                                <Switch
                                  checked={allowGroups}
                                  onCheckedChange={setAllowGroups}
                                />
                              </div>

                              <div className="bg-background-primary flex items-center justify-between rounded-lg p-3">
                                <div className="space-y-1">
                                  <Label className="font-dmmono text-xs font-medium uppercase">
                                    Allow Private
                                  </Label>
                                  <p className="text-xs text-zinc-400">
                                    Process private messages
                                  </p>
                                </div>
                                <Switch
                                  checked={allowPrivate}
                                  onCheckedChange={setAllowPrivate}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </motion.div>

            {/* Preview Sidebar */}
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
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-center">
                    <div
                      className="mx-auto h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          selectedProviderConfig?.color || '#6B7280'
                      }}
                    />
                    <h3 className="text-primary font-dmmono text-sm font-bold uppercase tracking-wider">
                      {selectedProviderConfig?.name || 'Select Provider'}
                    </h3>
                    <p className="text-muted text-xs">
                      {userId || 'No User ID'}
                    </p>
                  </div>

                  <Separator className="bg-zinc-700" />

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted font-dmmono uppercase">
                        Provider:
                      </span>
                      <span className="text-primary">
                        {selectedProviderConfig?.name || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted font-dmmono uppercase">
                        Types:
                      </span>
                      <span className="text-primary">
                        {instanceTypes.join(', ') || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted font-dmmono uppercase">
                        AGNO:
                      </span>
                      <span className="text-primary">
                        {agnoEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted font-dmmono uppercase">
                        Webhook:
                      </span>
                      <span className="text-primary">
                        {webhookEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background-secondary border-none">
                <CardHeader>
                  <CardTitle className="font-dmmono text-xs font-medium uppercase">
                    Configuration Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-muted space-y-2 text-xs">
                    <p>• Fill in required provider credentials</p>
                    <p>• Enable AGNO for AI-powered responses</p>
                    <p>• Configure webhooks for message processing</p>
                    <p>• Test the instance after creation</p>
                    <p>• Monitor instance status and logs</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Instance</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this messenger instance? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
