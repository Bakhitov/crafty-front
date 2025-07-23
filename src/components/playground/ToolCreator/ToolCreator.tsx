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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Icon from '@/components/ui/icon'
import { IconType } from '@/components/ui/icon/types'
import { usePlaygroundStore } from '@/store'
import { toast } from 'sonner'
import { X } from 'lucide-react'

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

const ToolCreator = () => {
  const { setIsToolCreationMode } = usePlaygroundStore()

  const handleClose = () => {
    setIsToolCreationMode(false)
  }

  const handleCreateTool = () => {
    toast.info('Создание тулзов будет реализовано в следующих версиях')
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
          Choose Tool Type
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {toolTypes.map((type) => (
            <Card
              key={type.id}
              className="border-accent/20 hover:border-primary/30 cursor-pointer transition-colors duration-200"
              onClick={() =>
                toast.info(
                  `${type.name} создание будет доступно в следующих версиях`
                )
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-lg p-2">
                    <Icon type={type.icon} size="sm" className="text-primary" />
                  </div>
                  <CardTitle className="text-sm">{type.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground text-xs">
                  {type.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Mock Creation Form */}
      <div className="flex-1">
        <Tabs defaultValue="basic" className="h-full">
          <TabsList className="bg-background-secondary mb-6 grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tool-name">Tool Name</Label>
                  <Input
                    id="tool-name"
                    placeholder="Enter tool name"
                    className="border-secondary bg-background-primary"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tool-description">Description</Label>
                  <TextArea
                    id="tool-description"
                    placeholder="Describe what this tool does"
                    className="border-secondary bg-background-primary"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tool-category">Category</Label>
                  <Select disabled>
                    <SelectTrigger className="border-secondary bg-background-primary">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">Web & API</SelectItem>
                      <SelectItem value="data">Data Processing</SelectItem>
                      <SelectItem value="ai">AI & ML</SelectItem>
                      <SelectItem value="utility">Utility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-background-secondary/50 rounded-lg p-4">
                <h3 className="text-primary mb-3 text-sm font-medium">
                  Tool Preview
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon type="hammer" size="xs" />
                    <span className="text-muted-foreground text-sm">
                      Tool Name
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Draft
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Tool description will appear here
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      Category
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Custom
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <div className="py-8 text-center">
              <Icon
                type="settings"
                size="lg"
                className="text-muted-foreground mb-4"
              />
              <h3 className="text-primary mb-2 text-lg font-medium">
                Configuration Panel
              </h3>
              <p className="text-muted-foreground text-sm">
                Tool configuration options will be available here
              </p>
            </div>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <div className="py-8 text-center">
              <Icon
                type="play"
                size="lg"
                className="text-muted-foreground mb-4"
              />
              <h3 className="text-primary mb-2 text-lg font-medium">
                Tool Testing
              </h3>
              <p className="text-muted-foreground text-sm">
                Test your tool functionality before deployment
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
            Coming soon in next versions
          </span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateTool}>Create Tool</Button>
        </div>
      </div>
    </motion.main>
  )
}

export default ToolCreator
