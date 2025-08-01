'use client'

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
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Icon from '@/components/ui/icon'
import { IconType } from '@/components/ui/icon/types'
import { usePlaygroundStore } from '@/store'
import { useCompanyContext } from '@/components/CompanyProvider'
import { useTools } from '@/hooks/useTools'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { useState, useCallback } from 'react'
import { supabaseCrud } from '@/lib/supabaseCrudClient'

const toolTypes: Array<{
  id: string
  name: string
  description: string
  icon: IconType
}> = [
  {
    id: 'dynamic',
    name: 'Dynamic Tool',
    description: 'Built-in Agno tools with predefined functionality',
    icon: 'hammer'
  },
  {
    id: 'custom',
    name: 'Custom Tool',
    description: 'Custom Python functions with your own logic',
    icon: 'settings'
  },
  {
    id: 'mcp',
    name: 'MCP Server',
    description: 'Model Context Protocol server integration',
    icon: 'link'
  }
]

const toolCategories = [
  'general',
  'data-processing',
  'web-scraping',
  'api-integration',
  'file-management',
  'communication',
  'analysis',
  'automation',
  'development',
  'other'
]

const ToolCreator = () => {
  const { setIsToolCreationMode } = usePlaygroundStore()
  const { company } = useCompanyContext()
  const { refreshTools } = useTools()

  // Form state
  const [selectedType, setSelectedType] = useState<string>('')
  const [toolName, setToolName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [isPublic, setIsPublic] = useState(false)
  const [configuration, setConfiguration] = useState('{}')
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    setIsToolCreationMode(false)
  }

  const validateForm = useCallback(() => {
    if (!selectedType) {
      toast.error('Please select a tool type')
      return false
    }
    if (!toolName.trim()) {
      toast.error('Tool name is required')
      return false
    }
    if (!description.trim()) {
      toast.error('Description is required')
      return false
    }

    // Validate configuration JSON
    try {
      JSON.parse(configuration)
    } catch {
      toast.error('Configuration must be valid JSON')
      return false
    }

    return true
  }, [selectedType, toolName, description, configuration])

  const handleCreateTool = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const configData = JSON.parse(configuration)

      await supabaseCrud.createTool({
        name: toolName.trim(),
        display_name: displayName.trim() || undefined,
        type: selectedType,
        description: description.trim(),
        configuration: configData,
        category: category,
        is_public: isPublic,
        is_active: true,
        company_id: company?.id
      })

      toast.success('Tool created successfully!')

      // Refresh tools list
      await refreshTools()

      // Close the creator
      handleClose()
    } catch (error) {
      console.error('Error creating tool:', error)
      toast.error('Failed to create tool')
      setIsLoading(false)
    }
  }

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    // Set default configuration based on type
    switch (typeId) {
      case 'dynamic':
        setConfiguration('{"agno_class": "", "module_path": ""}')
        break
      case 'custom':
        setConfiguration('{"source_code": "", "dependencies": []}')
        break
      case 'mcp':
        setConfiguration(
          '{"command": "", "url": "", "transport": "stdio", "env_config": {}}'
        )
        break
      default:
        setConfiguration('{}')
    }
  }

  return (
    <motion.main
      className="bg-background-primary relative m-1.5 flex flex-grow flex-col rounded-xl p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 rounded-lg p-2">
            <Icon type="hammer" size="sm" className="text-primary" />
          </div>
          <div>
            <h1 className="text-primary text-xl font-semibold">Tool Creator</h1>
            <p className="text-muted-foreground text-sm">
              Create and manage custom tools for your agents
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tool Types Grid */}
      <div className="mb-8">
        <h2 className="text-primary mb-4 text-lg font-medium">
          Select Tool Type
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {toolTypes.map((type) => (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedType === type.id
                  ? 'border-primary bg-primary/5'
                  : 'border-secondary bg-background-secondary'
              }`}
              onClick={() => handleTypeSelect(type.id)}
            >
              <CardContent className="p-4 text-center">
                <Icon
                  type={type.icon}
                  size="md"
                  className={`mx-auto mb-2 ${
                    selectedType === type.id
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                />
                <h3 className="text-primary mb-1 font-medium">{type.name}</h3>
                <p className="text-muted-foreground text-xs">
                  {type.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Creation Form */}
      <div className="flex-1">
        <Tabs defaultValue="basic" className="h-full">
          <TabsList className="bg-background-secondary mb-6 grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tool-name">Tool Name *</Label>
                  <Input
                    id="tool-name"
                    placeholder="Enter unique tool name"
                    className="border-secondary bg-background-primary"
                    value={toolName}
                    onChange={(e) => setToolName(e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">
                    Must be unique across all tools
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input
                    id="display-name"
                    placeholder="Human-readable name (optional)"
                    className="border-secondary bg-background-primary"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tool-description">Description *</Label>
                  <TextArea
                    id="tool-description"
                    placeholder="Describe what this tool does"
                    className="border-secondary bg-background-primary min-h-[100px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="border-secondary bg-background-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {toolCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() +
                            cat.slice(1).replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is-public"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="border-secondary rounded"
                    />
                    <Label htmlFor="is-public" className="text-sm">
                      Make this tool public
                    </Label>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Public tools can be used by other users
                  </p>
                </div>

                {selectedType && (
                  <div className="border-secondary bg-background-secondary rounded-lg border p-4">
                    <h4 className="text-primary mb-2 font-medium">
                      Selected Type
                    </h4>
                    <Badge variant="secondary">
                      {toolTypes.find((t) => t.id === selectedType)?.name}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="configuration">Tool Configuration</Label>
                <TextArea
                  id="configuration"
                  placeholder="Enter JSON configuration"
                  className="border-secondary bg-background-primary min-h-[200px] font-mono text-sm"
                  value={configuration}
                  onChange={(e) => setConfiguration(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">
                  Configuration must be valid JSON format
                </p>
              </div>

              {selectedType && (
                <div className="border-secondary bg-background-secondary rounded-lg border p-4">
                  <h4 className="text-primary mb-2 font-medium">
                    Configuration for{' '}
                    {toolTypes.find((t) => t.id === selectedType)?.name}
                  </h4>
                  <div className="text-muted-foreground text-sm">
                    {selectedType === 'dynamic' && (
                      <ul className="list-disc space-y-1 pl-4">
                        <li>
                          <code>agno_class</code>: The Agno tool class name
                        </li>
                        <li>
                          <code>module_path</code>: Path to the tool module
                        </li>
                      </ul>
                    )}
                    {selectedType === 'custom' && (
                      <ul className="list-disc space-y-1 pl-4">
                        <li>
                          <code>source_code</code>: Python source code
                        </li>
                        <li>
                          <code>dependencies</code>: Required packages
                        </li>
                      </ul>
                    )}
                    {selectedType === 'mcp' && (
                      <ul className="list-disc space-y-1 pl-4">
                        <li>
                          <code>command</code>: Command to start server
                        </li>
                        <li>
                          <code>url</code>: Server URL (for HTTP transport)
                        </li>
                        <li>
                          <code>transport</code>: Transport type (stdio/http)
                        </li>
                        <li>
                          <code>env_config</code>: Environment variables
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="py-8 text-center">
              <Icon
                type="settings"
                size="lg"
                className="text-muted-foreground mb-4"
              />
              <h3 className="text-primary mb-2 text-lg font-medium">
                Advanced Settings
              </h3>
              <p className="text-muted-foreground text-sm">
                Additional tool configuration options will be available here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer Actions */}
      <div className="border-accent/20 mt-8 flex items-center justify-between border-t pt-6">
        <div className="flex items-center gap-2">
          <Icon type="brain" size="xs" className="text-muted-foreground" />
          <span className="text-muted-foreground text-xs">
            {selectedType
              ? `Creating ${selectedType} tool`
              : 'Select a tool type to continue'}
          </span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTool}
            disabled={!selectedType || !toolName || !description || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Tool'}
          </Button>
        </div>
      </div>
    </motion.main>
  )
}

export default ToolCreator
