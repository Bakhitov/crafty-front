'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
import { X, Save, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { IconType } from '@/components/ui/icon/types'
import { usePlaygroundStore } from '@/store'
import { useMessengerProvider } from '@/hooks/useMessengerProvider'
import { useAuthContext } from '@/components/AuthProvider'
import { generateQRCodeImage, isWhatsAppQRCode } from '@/lib/qrcode'
import { messengerAPI } from '@/lib/messengerApi'
import { formatLogsWithAnsi } from '@/lib/ansiToHtml'
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
import { ComboboxAgent } from '@/types/playground'
import Icon from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'

// Provider configurations
const providerConfigs = [
  {
    id: 'whatsappweb' as ProviderType,
    name: 'WhatsApp Web',
    description: 'Connect via WhatsApp Web protocol',
    icon: 'whatsapp' as IconType,
    color: '#25D366',
    requiresAuth: true,
    authType: 'qr' as const,
    dockerRequired: true
  },
  {
    id: 'telegram' as ProviderType,
    name: 'Telegram',
    description: 'Connect via Telegram Bot API',
    icon: 'telegram' as IconType,
    color: '#0088CC',
    requiresAuth: true,
    authType: 'token' as const,
    dockerRequired: true
  },
  {
    id: 'whatsapp-official' as ProviderType,
    name: 'WhatsApp Official',
    description: 'Connect via WhatsApp Business API',
    icon: 'whatsapp' as IconType,
    color: '#25D366',
    requiresAuth: true,
    authType: 'api_key' as const,
    dockerRequired: true
  },
  {
    id: 'discord' as ProviderType,
    name: 'Discord',
    description: 'Connect via Discord Bot API',
    icon: 'discord' as IconType,
    color: '#5865F2',
    requiresAuth: true,
    authType: 'token' as const,
    dockerRequired: true
  },
  {
    id: 'slack' as ProviderType,
    name: 'Slack',
    description: 'Connect via Slack API',
    icon: 'slack' as IconType,
    color: '#4A154B',
    requiresAuth: true,
    authType: 'token' as const,
    dockerRequired: true
  },
  {
    id: 'messenger' as ProviderType,
    name: 'Messenger',
    description: 'Connect via Facebook Messenger API',
    icon: 'messenger' as IconType,
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
  children,
  required = false
}: {
  label: string
  description?: string
  children: React.ReactNode
  required?: boolean
}) => (
  <div className="space-y-2">
    <Label className="font-dmmono text-xs font-medium uppercase">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </Label>
    {description && <p className="text-xs text-zinc-400">{description}</p>}
    {children}
  </div>
)

export default function MessengerInstanceEditor({
  editingInstance,
  onClose
}: MessengerInstanceEditorProps) {
  const { createInstance, deleteInstance, isLoading } = useMessengerProvider()
  const { user } = useAuthContext()
  const { selectedEndpoint } = usePlaygroundStore()
  const [availableAgents, setAvailableAgents] = useState<ComboboxAgent[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showTelegramToken, setShowTelegramToken] = useState(false)
  const [showLogsDialog, setShowLogsDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [selectedInstanceLogs, setSelectedInstanceLogs] = useState<string>('')
  const logsContainerRef = useRef<HTMLDivElement>(null)

  const [selectedInstanceQR, setSelectedInstanceQR] = useState<string>('')
  const [qrExpiresIn, setQrExpiresIn] = useState<number>(0)
  const [qrCountdown, setQrCountdown] = useState<number>(0)
  const [isPerformingAction, setIsPerformingAction] = useState(false)

  // Local instance status to reflect real-time changes
  const [instanceStatus, setInstanceStatus] = useState<string>(
    editingInstance?.status || ''
  )

  // Basic configuration
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderType>('whatsappweb')
  const [instanceTypes, setInstanceTypes] = useState<InstanceType[]>(['api'])

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

  // Advanced Configuration
  const [selectedAgentId, setSelectedAgentId] = useState('none')

  const [webhookEnabled, setWebhookEnabled] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [allowGroups, setAllowGroups] = useState(true)
  const [allowPrivate, setAllowPrivate] = useState(true)

  const isEditMode = !!editingInstance
  const selectedProviderConfig = providerConfigs.find(
    (p) => p.id === selectedProvider
  )

  // Load available agents
  const loadAvailableAgents = useCallback(async () => {
    if (!selectedEndpoint) return

    try {
      const response = await fetch(`${selectedEndpoint}/v1/agents/detailed`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch agents')
      }

      const allAgents = await response.json()

      const agentOptions: ComboboxAgent[] = allAgents.map(
        (agent: {
          agent_id: string
          name?: string
          model_configuration?: { provider?: string }
          storage_config?: { enabled?: boolean }
        }) => ({
          value: agent.agent_id,
          label: agent.name || agent.agent_id,
          model: { provider: agent.model_configuration?.provider || '' },
          storage: agent.storage_config?.enabled || false,
          storage_config: agent.storage_config
        })
      )

      setAvailableAgents(agentOptions)

      // Keep "none" as default for new instances
    } catch (error) {
      console.error('Error loading agents:', error)
      toast.error('Failed to load agents')
    }
  }, [selectedEndpoint])

  // Load instance data for editing
  const loadInstanceData = useCallback(() => {
    if (!editingInstance) return

    setSelectedProvider(editingInstance.provider)
    setInstanceTypes(editingInstance.type_instance)

    // Load provider-specific fields
    switch (editingInstance.provider) {
      case 'telegram': {
        const telegramInstance = editingInstance
        setToken(telegramInstance.token || '')
        setBotUsername(telegramInstance.bot_username || '')
        break
      }
      case 'whatsapp-official': {
        const waInstance = editingInstance
        setPhoneNumberId(waInstance.phone_number_id || '')
        setAccessToken(waInstance.access_token || '')
        setWebhookVerifyToken(waInstance.webhook_verify_token || '')
        setBusinessAccountId(waInstance.business_account_id || '')
        break
      }
      case 'discord': {
        const discordInstance = editingInstance
        setToken(discordInstance.bot_token || '')
        setClientId(discordInstance.client_id || '')
        setGuildId(discordInstance.guild_id || '')
        break
      }
      case 'slack': {
        const slackInstance = editingInstance
        setToken(slackInstance.bot_token || '')
        setAppToken(slackInstance.app_token || '')
        setSigningSecret(slackInstance.signing_secret || '')
        setWorkspaceId(slackInstance.workspace_id || '')
        break
      }
      case 'messenger': {
        const messengerInstance = editingInstance
        setPageAccessToken(messengerInstance.page_access_token || '')
        setVerifyToken(messengerInstance.verify_token || '')
        setPageId(messengerInstance.page_id || '')
        setAppSecret(messengerInstance.app_secret || '')
        break
      }
    }

    // Load Advanced configuration
    if (editingInstance.agno_config) {
      setSelectedAgentId(editingInstance.agno_config.agent_id || 'none')
    }

    if (editingInstance.api_webhook_schema) {
      setWebhookEnabled(editingInstance.api_webhook_schema.enabled)
      setWebhookUrl(editingInstance.api_webhook_schema.url || '')
      if (editingInstance.api_webhook_schema.filters) {
        setAllowGroups(editingInstance.api_webhook_schema.filters.allowGroups)
        setAllowPrivate(editingInstance.api_webhook_schema.filters.allowPrivate)
      }
    }
  }, [editingInstance])

  useEffect(() => {
    if (editingInstance) {
      setInstanceStatus(editingInstance.status)
    }
  }, [editingInstance])

  useEffect(() => {
    loadAvailableAgents()
    if (isEditMode) {
      loadInstanceData()
    } else {
      // Reset form for new instance
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
      setWebhookEnabled(false)
    }
  }, [isEditMode, loadInstanceData, loadAvailableAgents, selectedEndpoint])

  const handleViewQR = useCallback(async () => {
    if (!editingInstance?.instance_id) return

    try {
      const qrData = await messengerAPI.getInstanceQR(
        editingInstance.instance_id
      )
      const qrText = qrData.qr_code || ''
      const expiresIn = qrData.expires_in || 0

      console.log('QR API Response:', {
        qrText: qrText.substring(0, 50) + '...',
        expiresIn
      })

      if (!qrText) {
        toast.error('QR code not available')
        return
      }

      // Set countdown timer
      setQrExpiresIn(expiresIn)
      setQrCountdown(expiresIn)

      // Check if it's a text QR code that needs to be converted to image
      if (isWhatsAppQRCode(qrText)) {
        try {
          const qrImageUrl = await generateQRCodeImage(qrText)
          setSelectedInstanceQR(qrImageUrl)
        } catch (qrError) {
          console.error('Error generating QR image:', qrError)
          // Fallback: display raw text
          setSelectedInstanceQR(qrText)
        }
      } else {
        // Assume it's already an image URL
        setSelectedInstanceQR(qrText)
      }

      setShowQRDialog(true)
    } catch (error) {
      console.error('Error loading QR code:', error)
      toast.error('QR code unavailable')
    }
  }, [editingInstance?.instance_id])

  // QR Code countdown timer - runs while dialog is open and countdown > 0
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (showQRDialog && qrCountdown > 0) {
      console.log('Starting QR countdown timer with:', qrCountdown)
      intervalId = setInterval(() => {
        setQrCountdown((prev) => {
          console.log('Countdown tick:', prev)
          const newValue = prev - 1
          return newValue < 0 ? 0 : newValue
        })
      }, 1000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [showQRDialog, qrCountdown])

  // Handle QR refresh when countdown reaches 0
  useEffect(() => {
    if (showQRDialog && qrCountdown === 0 && qrExpiresIn > 0) {
      console.log('Countdown finished, requesting new QR')
      // Request new QR immediately when countdown reaches 0
      if (editingInstance?.instance_id) {
        handleViewQR()
      }
    }
  }, [
    qrCountdown,
    showQRDialog,
    editingInstance?.instance_id,
    qrExpiresIn,
    handleViewQR
  ])

  const buildInstancePayload = () => {
    if (!user?.id) {
      throw new Error('User not authenticated')
    }

    const basePayload = {
      user_id: user.id,
      provider: selectedProvider,
      type_instance: instanceTypes,
      agno_config:
        selectedAgentId && selectedAgentId !== 'none'
          ? {
              enabled: true,
              agent_id: selectedAgentId,
              agnoUrl: `https://crafty-v0-0-1.onrender.com/v1/agents/${selectedAgentId}/runs`,
              stream: false // Always false for messengers
            }
          : undefined,
      api_webhook_schema: webhookEnabled
        ? {
            enabled: true,
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
          token: token,
          bot_username: botUsername
        } as CreateTelegramInstancePayload

      case 'whatsapp-official':
        return {
          ...basePayload,
          phone_number_id: phoneNumberId,
          access_token: accessToken,
          webhook_verify_token: webhookVerifyToken,
          business_account_id: businessAccountId
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
          signing_secret: signingSecret,
          workspace_id: workspaceId
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
    if (!user?.id) {
      toast.error('User not authenticated')
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

    // Validate advanced configuration - agent is optional

    if (webhookEnabled && !webhookUrl.trim()) {
      toast.error('Webhook URL is required when webhook is enabled')
      return
    }

    setIsSaving(true)
    try {
      const payload = buildInstancePayload()
      const result = await createInstance(payload)

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

  const handleDelete = () => {
    if (!isEditMode || !editingInstance) {
      return
    }
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!editingInstance) return

    try {
      await deleteInstance(editingInstance.instance_id)
      toast.success('Instance deleted successfully!')
      onClose()
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting instance:', error)
      toast.error('Failed to delete instance')
      setShowDeleteDialog(false)
    }
  }

  // Instance management functions
  const handleStartInstance = async () => {
    if (!editingInstance?.instance_id) return
    setIsPerformingAction(true)
    try {
      await messengerAPI.startInstance(editingInstance.instance_id)
      toast.success('Instance started')
      // Update instance status locally
      setInstanceStatus('running')
    } catch (error) {
      console.error('Error starting instance:', error)
      toast.error('Error starting instance')
    } finally {
      setIsPerformingAction(false)
    }
  }

  const handleStopInstance = async () => {
    if (!editingInstance?.instance_id) return
    setIsPerformingAction(true)
    try {
      await messengerAPI.stopInstance(editingInstance.instance_id)
      toast.success('Instance stopped')
      // Update instance status locally
      setInstanceStatus('stopped')
    } catch (error) {
      console.error('Error stopping instance:', error)
      toast.error('Error stopping instance')
    } finally {
      setIsPerformingAction(false)
    }
  }

  const handleRestartInstance = async () => {
    if (!editingInstance?.instance_id) return
    setIsPerformingAction(true)
    try {
      await messengerAPI.restartInstance(editingInstance.instance_id)
      toast.success('Instance restarted')
      // Status remains 'running' after restart
    } catch (error) {
      console.error('Error restarting instance:', error)
      toast.error('Error restarting instance')
    } finally {
      setIsPerformingAction(false)
    }
  }

  const handleViewLogs = async () => {
    if (!editingInstance?.instance_id) return
    try {
      const logs = await messengerAPI.getInstanceLogs(
        editingInstance.instance_id,
        { tail: 500 }
      )

      // API returns logs as an object with container names as keys
      // Extract the logs content from the response
      let logsContent = 'Logs not found'

      if (
        logs.logs &&
        typeof logs.logs === 'object' &&
        !Array.isArray(logs.logs)
      ) {
        // Get the first container's logs (there might be multiple containers)
        const logsObject = logs.logs as Record<string, string>
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
      } else if (typeof logs.logs === 'string') {
        logsContent = logs.logs
      }

      // Format logs with ANSI colors and clean timestamps
      const formattedLogs = formatLogsWithAnsi(logsContent)
      setSelectedInstanceLogs(formattedLogs)
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

  const renderProviderSpecificFields = () => {
    switch (selectedProvider) {
      case 'whatsappweb':
        return null // Moved to Configuration Tips

      case 'telegram':
        return (
          <div className="space-y-6">
            {/* Telegram Bot Creation Instructions */}
            <div className="bg-background-primary rounded-lg p-4">
              <h4 className="font-dmmono text-primary mb-3 text-xs font-medium uppercase">
                How to create a Telegram Bot
              </h4>
              <div className="space-y-2 text-xs text-zinc-400">
                <p>
                  1. Send{' '}
                  <code className="bg-muted rounded px-1 text-zinc-300">
                    /newbot
                  </code>{' '}
                  command to @BotFather in Telegram
                </p>
                <p>2. Follow the instructions: enter bot name and username</p>
                <p>
                  3. Copy the received token and paste it into &quot;Bot
                  Token&quot; field
                </p>
                <p>
                  4. Bot username can be specified in &quot;Bot Username&quot;
                  field (with or without @)
                </p>
              </div>
            </div>

            {/* Bot Token and Username in one row */}
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: '70% 30%' }}
            >
              <FormField
                label="Bot Token"
                description="Токен от @BotFather"
                required
              >
                <div className="relative">
                  <Input
                    type={showTelegramToken ? 'text' : 'password'}
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="border-secondary bg-background-primary text-primary pr-10 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowTelegramToken(!showTelegramToken)}
                  >
                    {showTelegramToken ? (
                      <EyeOff className="h-4 w-4 text-zinc-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-zinc-400" />
                    )}
                  </Button>
                </div>
              </FormField>
              <FormField label="Bot Username" description="Username бота">
                <Input
                  placeholder="@my_bot или my_bot"
                  value={botUsername ? `@${botUsername}` : ''}
                  onChange={(e) => {
                    const value = e.target.value
                    const cleanValue = value.startsWith('@')
                      ? value.slice(1)
                      : value
                    setBotUsername(cleanValue)
                  }}
                  className="border-secondary bg-background-primary text-primary text-xs"
                />
              </FormField>
            </div>
          </div>
        )

      case 'whatsapp-official':
        return (
          <div className="space-y-4">
            <FormField
              label="Phone Number ID"
              description="WhatsApp Business phone number ID"
              required
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
              required
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
              required
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
              required
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
              required
            >
              <Input
                placeholder="1234567890123456789"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="border-secondary bg-background-primary text-xs"
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
              required
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
              required
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
              required
            >
              <Input
                placeholder="my_verify_token"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className="border-secondary bg-background-primary text-primary text-xs"
              />
            </FormField>
            <FormField label="Page ID" description="Facebook page ID" required>
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
    <motion.main
      className="bg-background-primary relative flex flex-grow flex-col rounded-xl p-6"
      style={{ margin: '5px' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
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
              {isEditMode ? 'Edit Messenger' : 'Create New Messenger'}
              {isLoading && (
                <span className="text-muted ml-2">(Loading...)</span>
              )}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            {isEditMode && editingInstance && (
              <>
                {/* Instance Management Buttons */}
                {editingInstance.provider === 'whatsappweb' && (
                  <Button
                    variant="foreground"
                    size="sm"
                    onClick={handleViewQR}
                    title="Show QR Code"
                  >
                    <Icon type="qr-code" size="xs" className="mr-2" />
                    QR
                  </Button>
                )}

                <Button
                  variant="foreground"
                  size="sm"
                  onClick={handleViewLogs}
                  title="View Logs"
                >
                  <Icon type="file-text" size="xs" className="mr-2" />
                  Logs
                </Button>

                {instanceStatus === 'running' && (
                  <Button
                    variant="foreground"
                    size="sm"
                    onClick={handleRestartInstance}
                    disabled={isPerformingAction}
                    title="Restart"
                    className="text-orange-500 hover:text-orange-600"
                  >
                    <Icon
                      type="refresh-cw"
                      size="xs"
                      className={`mr-2 ${isPerformingAction ? 'animate-spin' : ''}`}
                    />
                    Restart
                  </Button>
                )}

                {instanceStatus === 'running' ? (
                  <Button
                    variant="foreground"
                    size="sm"
                    onClick={handleStopInstance}
                    disabled={isPerformingAction}
                    title="Stop"
                    className="text-destructive"
                  >
                    <Icon type="square" size="xs" className="mr-2" />
                    Stop
                  </Button>
                ) : instanceStatus === 'stopped' ? (
                  <Button
                    variant="foreground"
                    size="sm"
                    onClick={handleStartInstance}
                    disabled={isPerformingAction}
                    title="Start"
                    className="text-green-500 hover:text-green-600"
                  >
                    <Icon type="play" size="xs" className="mr-2" />
                    Start
                  </Button>
                ) : null}
              </>
            )}
            <Button
              className="text-primary bg-secondary border-primary border-1 border border-dashed"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="mr-2 h-3 w-3" />
              {isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
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
        <div className="h-full px-3 py-6">
          <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Main Content */}
            <motion.div
              className="space-y-6 lg:col-span-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex h-full flex-col">
                <div className="flex-1 space-y-6 overflow-y-auto">
                  {/* BASIC CONFIGURATION */}
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
                      <div
                        className="grid gap-8"
                        style={{ gridTemplateColumns: '25% 40% 25%' }}
                      >
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
                                    <Icon
                                      type={provider.icon}
                                      size="xxs"
                                      className={
                                        provider.id === 'whatsappweb' ||
                                        provider.id === 'whatsapp-official'
                                          ? 'text-green-500'
                                          : provider.id === 'telegram'
                                            ? 'text-blue-500'
                                            : provider.id === 'discord'
                                              ? 'text-indigo-600'
                                              : provider.id === 'slack'
                                                ? 'text-purple-600'
                                                : provider.id === 'messenger'
                                                  ? 'text-blue-600'
                                                  : 'text-gray-500'
                                      }
                                    />
                                    <span className="font-dmmono text-xs font-medium uppercase">
                                      {provider.name}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>

                        <FormField
                          label="Instance Types"
                          description="Types of functionality to enable"
                        >
                          <div className="flex gap-4">
                            <div className="bg-background-primary flex items-center justify-between rounded-lg p-2">
                              <div className="space-y-1">
                                <Label className="font-dmmono p-2 text-xs font-medium uppercase">
                                  API
                                </Label>
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
                            <div className="bg-background-primary flex items-center justify-between rounded-lg p-2">
                              <div className="space-y-1">
                                <Label className="font-dmmono p-2 text-xs font-medium uppercase">
                                  MCP
                                </Label>
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
                            <div className="bg-background-primary flex items-center justify-between rounded-lg p-2">
                              <div className="space-y-1">
                                <Label className="font-dmmono p-2 text-xs font-medium uppercase">
                                  WEBHOOK
                                </Label>
                              </div>
                              <Switch
                                checked={webhookEnabled}
                                onCheckedChange={setWebhookEnabled}
                              />
                            </div>
                          </div>
                        </FormField>

                        <FormField
                          label="Agent"
                          description="Select an AI agent"
                        >
                          <Select
                            value={selectedAgentId}
                            onValueChange={setSelectedAgentId}
                          >
                            <SelectTrigger className="border-primary/15 bg-background-primary h-9 border text-xs">
                              <SelectValue placeholder="Select agent" />
                            </SelectTrigger>
                            <SelectContent className="bg-background-primary font-dmmono border-none shadow-lg">
                              <SelectItem value="none">
                                <span className="text-xs text-zinc-400">
                                  No agent
                                </span>
                              </SelectItem>
                              {availableAgents.map((agent) => (
                                <SelectItem
                                  key={agent.value}
                                  value={agent.value}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className="font-geist text-xs font-medium">
                                      {agent.label}
                                    </span>
                                    {agent.model.provider && (
                                      <span className="font-dmmono text-xs text-zinc-400">
                                        ({agent.model.provider})
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                      </div>

                      {webhookEnabled && (
                        <div
                          className="grid gap-5"
                          style={{ gridTemplateColumns: '50% 20% 20%' }}
                        >
                          <FormField
                            label="Webhook URL"
                            description="URL to receive webhook notifications"
                            required
                          >
                            <Input
                              placeholder="https://your-server.com/webhook"
                              value={webhookUrl}
                              onChange={(e) => setWebhookUrl(e.target.value)}
                              className="border-secondary bg-background-primary text-primary text-xs"
                            />
                          </FormField>

                          <div className="space-y-2">
                            <Label className="font-dmmono text-xs font-medium uppercase">
                              Allow Groups
                            </Label>
                            <div className="bg-background-primary flex items-center justify-between rounded-lg p-2">
                              <span className="text-xs text-zinc-400">
                                Process group messages
                              </span>
                              <Switch
                                checked={allowGroups}
                                onCheckedChange={setAllowGroups}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="font-dmmono text-xs font-medium uppercase">
                              Allow Private
                            </Label>
                            <div className="bg-background-primary flex items-center justify-between rounded-lg p-2">
                              <span className="text-xs text-zinc-400">
                                Process private messages
                              </span>
                              <Switch
                                checked={allowPrivate}
                                onCheckedChange={setAllowPrivate}
                              />
                            </div>
                          </div>
                        </div>
                      )}

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
                </div>
              </div>
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-dmmono text-xs font-medium uppercase">
                      Instance Preview
                    </CardTitle>
                    {isEditMode && editingInstance && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="text-destructive hover:text-destructive/80 h-7 w-7 p-0"
                        title="Delete Instance"
                      >
                        <Icon type="trash" size="xs" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-background-secondary rounded-xl p-6">
                    <div className="space-y-3 text-center">
                      <div className="bg-background-primary mx-auto flex h-12 w-12 items-center justify-center rounded-xl">
                        {selectedProviderConfig && (
                          <Icon
                            type={selectedProviderConfig.icon}
                            size="sm"
                            className={
                              selectedProvider === 'whatsappweb' ||
                              selectedProvider === 'whatsapp-official'
                                ? 'text-green-500'
                                : selectedProvider === 'telegram'
                                  ? 'text-blue-500'
                                  : selectedProvider === 'discord'
                                    ? 'text-indigo-600'
                                    : selectedProvider === 'slack'
                                      ? 'text-purple-600'
                                      : selectedProvider === 'messenger'
                                        ? 'text-blue-600'
                                        : 'text-gray-500'
                            }
                          />
                        )}
                      </div>
                      <h3 className="text-primary font-dmmono text-sm font-bold uppercase tracking-wide">
                        {selectedProviderConfig?.name || 'Unknown Provider'}
                      </h3>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">
                          {selectedProviderConfig?.description ||
                            'Provider integration'}
                        </p>
                        <div className="flex items-center justify-center">
                          <Badge
                            variant="outline"
                            className="border-primary/20 bg-primary/5 text-primary px-2 py-1 text-xs"
                          >
                            {selectedProvider}
                          </Badge>
                        </div>
                      </div>
                    </div>
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
                        AI Agent:
                      </span>
                      <span className="text-primary">
                        {selectedAgentId && selectedAgentId !== 'none'
                          ? 'Enabled'
                          : 'Disabled'}
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
                    {selectedAgentId && selectedAgentId !== 'none' && (
                      <div className="flex justify-between">
                        <span className="text-muted font-dmmono uppercase">
                          Agent:
                        </span>
                        <span className="text-primary text-xs">
                          {availableAgents.find(
                            (a) => a.value === selectedAgentId
                          )?.label || selectedAgentId}
                        </span>
                      </div>
                    )}
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

      {/* Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-h-[80vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>Instance Logs</DialogTitle>
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
              className="bg-background-secondary max-h-96 overflow-auto whitespace-pre-wrap rounded-lg p-4 font-mono text-xs"
              dangerouslySetInnerHTML={{ __html: selectedInstanceLogs }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog
        open={showQRDialog}
        onOpenChange={(open) => {
          setShowQRDialog(open)
          // Don't reset timer when dialog closes - keep the countdown running
        }}
      >
        <DialogContent className="bg-background-primary">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Authentication QR Code
              {qrCountdown > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="bg-background-secondary rounded-full px-3 py-1">
                    <span className="font-mono text-sm font-medium text-orange-500">
                      {Math.floor(qrCountdown / 60)}:
                      {(qrCountdown % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              )}
            </DialogTitle>
            <DialogDescription>
              {qrCountdown > 0
                ? 'Scan the QR code in the WhatsApp application before it expires'
                : qrCountdown === 0 && selectedInstanceQR
                  ? 'QR code expired. Refreshing in 2 seconds...'
                  : 'Scan the QR code in the WhatsApp application'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 p-4">
            {selectedInstanceQR ? (
              <>
                {selectedInstanceQR.startsWith('data:image') ||
                selectedInstanceQR.startsWith('http') ? (
                  <div className="relative">
                    <Image
                      src={selectedInstanceQR}
                      alt="QR Code"
                      width={256}
                      height={256}
                      className="max-h-64 max-w-full"
                    />
                    {qrCountdown === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                        <div className="text-center text-white">
                          <Icon
                            type="refresh-cw"
                            size="sm"
                            className="mx-auto mb-2 animate-spin"
                          />
                          <p className="text-sm">Refreshing...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-background-secondary relative mb-4 rounded-lg p-4">
                      <p className="break-all font-mono text-xs text-zinc-400">
                        {selectedInstanceQR}
                      </p>
                      {qrCountdown === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                          <div className="text-center text-white">
                            <Icon
                              type="refresh-cw"
                              size="sm"
                              className="mx-auto mb-2 animate-spin"
                            />
                            <p className="text-sm">Refreshing...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Scan this code in WhatsApp
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <Icon
                  type="qr-code"
                  size="lg"
                  className="text-muted-foreground mx-auto mb-2"
                />
                <p className="text-muted-foreground text-sm">
                  QR code unavailable
                </p>
              </div>
            )}

            {/* Progress bar */}
            {qrExpiresIn > 0 && (
              <div className="w-full">
                <div className="bg-background-secondary h-2 overflow-hidden rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-orange-500 transition-all duration-1000 ease-linear"
                    style={{
                      width: `${Math.max(0, (qrCountdown / qrExpiresIn) * 100)}%`,
                      backgroundColor:
                        qrCountdown < 10
                          ? '#ef4444'
                          : qrCountdown < 30
                            ? '#f97316'
                            : '#22c55e'
                    }}
                  />
                </div>
                <p className="mt-2 text-center text-xs text-zinc-400">
                  {qrCountdown > 0
                    ? `Expires in ${qrCountdown} sec.`
                    : 'QR code expired'}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.main>
  )
}
