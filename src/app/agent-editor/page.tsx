'use client'

import { useState } from 'react'
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
import { Play, Info } from 'lucide-react'
import Link from 'next/link'
import Icon from '@/components/ui/icon'
import { IconType } from '@/components/ui/icon/types'
import { cn } from '@/lib/utils'

const llmProviders = [
  {
    id: 'open-ai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: ['gemini-pro', 'gemini-pro-vision']
  },
  {
    id: 'mistral',
    name: 'Mistral',
    models: ['mistral-large', 'mistral-medium', 'mistral-small']
  },
  { id: 'ollama', name: 'Ollama', models: ['llama2', 'codellama', 'mistral'] }
]

const availableTools = [
  {
    id: 'duckduckgo_search',
    name: 'DuckDuckGo Search',
    description: 'Search the internet using DuckDuckGo'
  },
  {
    id: 'web_search',
    name: 'Web Search',
    description: 'General web search capabilities'
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Perform mathematical calculations'
  },
  {
    id: 'code_interpreter',
    name: 'Code Interpreter',
    description: 'Execute and analyze code'
  },
  {
    id: 'file_reader',
    name: 'File Reader',
    description: 'Read and analyze documents'
  },
  { id: 'email', name: 'Email', description: 'Send and manage emails' },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Schedule and manage calendar events'
  },
  {
    id: 'database',
    name: 'Database',
    description: 'Query and manage databases'
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    description: 'Search Wikipedia for information'
  },
  { id: 'weather', name: 'Weather', description: 'Get weather information' }
]

const memoryTypes = [
  { id: 'postgres', name: 'PostgreSQL' },
  { id: 'sqlite', name: 'SQLite' },
  { id: 'memory', name: 'In-Memory' }
]

const storageTypes = [
  { id: 'postgres', name: 'PostgreSQL' },
  { id: 'sqlite', name: 'SQLite' },
  { id: 'file', name: 'File System' }
]

const toolChoiceOptions = [
  { id: 'auto', name: 'Auto' },
  { id: 'none', name: 'None' },
  { id: 'required', name: 'Required' }
]

const teamModes = [
  { id: 'coordinate', name: 'Coordinate' },
  { id: 'parallel', name: 'Parallel' },
  { id: 'sequential', name: 'Sequential' }
]

const referencesFormats = [
  { id: 'json', name: 'JSON' },
  { id: 'markdown', name: 'Markdown' },
  { id: 'text', name: 'Plain Text' }
]

type TabName =
  | 'Basic'
  | 'Model'
  | 'Tools'
  | 'Memory'
  | 'Knowledge'
  | 'Team'
  | 'Advanced'

export default function AgentEditor() {
  // Basic Info
  const [agentName, setAgentName] = useState('')
  const [agentId, setAgentId] = useState('')
  const [agentDescription, setAgentDescription] = useState('')
  const [instructions, setInstructions] = useState('')

  // Model Configuration
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(4096)
  const [topP, setTopP] = useState(1.0)
  const [frequencyPenalty, setFrequencyPenalty] = useState(0.0)
  const [presencePenalty, setPresencePenalty] = useState(0.0)
  const [stopSequences, setStopSequences] = useState('')
  const [seed, setSeed] = useState('')

  // Tools Configuration
  const [showToolCalls, setShowToolCalls] = useState(true)
  const [toolCallLimit, setToolCallLimit] = useState(10)
  const [toolChoice, setToolChoice] = useState('auto')
  const [dynamicTools, setDynamicTools] = useState<string[]>([])
  const [customTools, setCustomTools] = useState('')
  const [mcpServers, setMcpServers] = useState('')

  // Memory Configuration
  const [memoryType, setMemoryType] = useState('postgres')
  const [enableAgenticMemory, setEnableAgenticMemory] = useState(true)
  const [enableUserMemories, setEnableUserMemories] = useState(true)
  const [addMemoryReferences, setAddMemoryReferences] = useState(true)
  const [memorySchema, setMemorySchema] = useState('ai')
  const [memoryDbUrl, setMemoryDbUrl] = useState('')

  // Storage Configuration
  const [storageEnabled, setStorageEnabled] = useState(true)
  const [storageType, setStorageType] = useState('postgres')
  const [storageDbUrl, setStorageDbUrl] = useState('')
  const [storageTableName, setStorageTableName] = useState('agent_sessions')
  const [storageSchema, setStorageSchema] = useState('ai')

  // Knowledge Configuration
  const [addReferences, setAddReferences] = useState(true)
  const [referencesFormat, setReferencesFormat] = useState('json')
  const [searchKnowledge, setSearchKnowledge] = useState(true)
  const [updateKnowledge, setUpdateKnowledge] = useState(false)
  const [maxReferences, setMaxReferences] = useState(5)
  const [similarityThreshold, setSimilarityThreshold] = useState(0.75)

  // Reasoning Configuration
  const [reasoning, setReasoning] = useState(false)
  const [reasoningGoal, setReasoningGoal] = useState('')
  const [reasoningMaxSteps, setReasoningMaxSteps] = useState(5)

  // Team Configuration
  const [teamMode, setTeamMode] = useState('')
  const [teamRole, setTeamRole] = useState('')

  // Settings
  const [systemMessage, setSystemMessage] = useState('')
  const [debugMode, setDebugMode] = useState(false)
  const [stream, setStream] = useState(true)
  const [markdown, setMarkdown] = useState(true)
  const [addDatetimeToInstructions, setAddDatetimeToInstructions] =
    useState(true)
  const [readChatHistory, setReadChatHistory] = useState(true)
  const [numHistoryRuns, setNumHistoryRuns] = useState(5)
  const [tags, setTags] = useState('')
  const [timezoneIdentifier, setTimezoneIdentifier] = useState('UTC')
  const [retries, setRetries] = useState(3)
  const [delayBetweenRetries, setDelayBetweenRetries] = useState(2)
  const [exponentialBackoff, setExponentialBackoff] = useState(true)
  const [useJsonMode, setUseJsonMode] = useState(false)
  const [storeEvents, setStoreEvents] = useState(true)

  const [activeTab, setActiveTab] = useState<TabName>('Basic')

  const toggleTool = (toolId: string) => {
    setDynamicTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    )
  }

  const selectedProviderData = llmProviders.find(
    (p) => p.id === selectedProvider
  )

  const renderFormField = (label: string, children: React.ReactNode) => (
    <details className="space-y-1" open>
      <summary className="text-primary font-dmmono cursor-pointer list-none text-xs font-semibold uppercase tracking-wider">
        {label}
      </summary>
      <div className="pl-2">{children}</div>
    </details>
  )

  return (
    <div className="bg-background font-dmmono min-h-screen">
      {/* Header */}
      <motion.header
        className="bg-background-secondary/50 border-b border-zinc-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-muted hover:text-primary flex items-center space-x-2 transition-colors"
              >
                <Icon type="arrow-left" size="xs" />
                <span className="text-xs uppercase tracking-wider">
                  Back to Agents
                </span>
              </Link>
              <Separator orientation="vertical" className="h-6 bg-zinc-700" />
              <div className="flex items-center space-x-2">
                <Icon type="agent" size="sm" className="text-primary" />
                <h1 className="text-primary text-lg font-semibold uppercase tracking-wider">
                  Agent Editor
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="border-primary/15 text-xs uppercase"
              >
                <Play className="mr-2 h-3 w-3" />
                Test Agent
              </Button>
              <Button
                size="sm"
                className="bg-primary text-background hover:bg-primary/80 text-xs uppercase"
              >
                <Icon type="save" size="xs" className="mr-2" />
                Save Agent
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <motion.div
            className="space-y-6 lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="bg-background-secondary/30 border-accent/20 w-full rounded-xl border p-6">
              {/* Tab Navigation */}
              <div className="mb-6 flex justify-center border-b border-zinc-700">
                {(
                  [
                    'Basic',
                    'Model',
                    'Tools',
                    'Memory',
                    'Knowledge',
                    'Team',
                    'Advanced'
                  ] as TabName[]
                ).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'font-dmmono px-2 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 focus:outline-none',
                      activeTab === tab
                        ? 'border-primary text-primary border-b-2'
                        : 'text-muted hover:text-primary border-b-2 border-transparent'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
                {activeTab === 'Basic' && (
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderFormField(
                      'Agent Name',
                      <Input
                        placeholder="e.g., Marketing Assistant"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}

                    {renderFormField(
                      'Agent ID',
                      <Input
                        placeholder="e.g., marketing-assistant-001"
                        value={agentId}
                        onChange={(e) => setAgentId(e.target.value)}
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}

                    {renderFormField(
                      'Description',
                      <TextArea
                        placeholder="Describe what your agent does and its main capabilities..."
                        value={agentDescription}
                        onChange={(e) => setAgentDescription(e.target.value)}
                        className="font-dmmono min-h-[80px] border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}

                    {renderFormField(
                      'Instructions',
                      <div className="space-y-2">
                        <TextArea
                          placeholder="Detailed instructions for the agent behavior..."
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          className="font-dmmono min-h-[120px] border-zinc-700 bg-zinc-900 text-xs"
                        />
                        <p className="text-muted text-xs">
                          Specific instructions that guide the agent&apos;s
                          behavior
                        </p>
                      </div>
                    )}

                    {renderFormField(
                      'System Message',
                      <div className="space-y-2">
                        <TextArea
                          placeholder="You are a helpful AI assistant that..."
                          value={systemMessage}
                          onChange={(e) => setSystemMessage(e.target.value)}
                          className="font-dmmono min-h-[100px] border-zinc-700 bg-zinc-900 text-xs"
                        />
                        <p className="text-muted text-xs">
                          Core system message that defines the agent&apos;s role
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'Model' && (
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderFormField(
                      'LLM Provider',
                      <Select
                        value={selectedProvider}
                        onValueChange={setSelectedProvider}
                      >
                        <SelectTrigger className="border-zinc-700 bg-zinc-900 text-xs">
                          <SelectValue placeholder="Select LLM provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {llmProviders.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              <div className="flex items-center space-x-2">
                                <Icon
                                  type={provider.id as IconType}
                                  size="xs"
                                />
                                <span className="text-xs">{provider.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {selectedProviderData &&
                      renderFormField(
                        'Model',
                        <Select
                          value={selectedModel}
                          onValueChange={setSelectedModel}
                        >
                          <SelectTrigger className="border-zinc-700 bg-zinc-900 text-xs">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedProviderData.models.map((model) => (
                              <SelectItem key={model} value={model}>
                                <span className="text-xs">{model}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                    {renderFormField(
                      `Temperature: ${temperature}`,
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={temperature}
                          onChange={(e) =>
                            setTemperature(Number.parseFloat(e.target.value))
                          }
                          className="accent-primary w-full"
                        />
                        <p className="text-muted text-xs">
                          Controls randomness (0 = deterministic, 2 = creative)
                        </p>
                      </div>
                    )}

                    {renderFormField(
                      'Max Tokens',
                      <Input
                        type="number"
                        value={maxTokens}
                        onChange={(e) =>
                          setMaxTokens(Number.parseInt(e.target.value))
                        }
                        min="1"
                        max="8192"
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}

                    {renderFormField(
                      `Top P: ${topP}`,
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={topP}
                          onChange={(e) =>
                            setTopP(Number.parseFloat(e.target.value))
                          }
                          className="accent-primary w-full"
                        />
                        <p className="text-muted text-xs">
                          Controls diversity via nucleus sampling
                        </p>
                      </div>
                    )}

                    {renderFormField(
                      `Frequency Penalty: ${frequencyPenalty}`,
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={frequencyPenalty}
                        onChange={(e) =>
                          setFrequencyPenalty(Number.parseFloat(e.target.value))
                        }
                        className="accent-primary w-full"
                      />
                    )}

                    {renderFormField(
                      `Presence Penalty: ${presencePenalty}`,
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={presencePenalty}
                        onChange={(e) =>
                          setPresencePenalty(Number.parseFloat(e.target.value))
                        }
                        className="accent-primary w-full"
                      />
                    )}

                    {renderFormField(
                      'Stop Sequences',
                      <Input
                        placeholder="\\n,END,STOP (comma separated)"
                        value={stopSequences}
                        onChange={(e) => setStopSequences(e.target.value)}
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}

                    {renderFormField(
                      'Seed',
                      <Input
                        type="number"
                        placeholder="42"
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}
                  </motion.div>
                )}

                {activeTab === 'Tools' && (
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Show Tool Calls
                        </Label>
                        <Switch
                          checked={showToolCalls}
                          onCheckedChange={setShowToolCalls}
                        />
                      </div>

                      {renderFormField(
                        'Tool Call Limit',
                        <Input
                          type="number"
                          value={toolCallLimit}
                          onChange={(e) =>
                            setToolCallLimit(Number.parseInt(e.target.value))
                          }
                          className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                        />
                      )}
                    </div>

                    {renderFormField(
                      'Tool Choice',
                      <Select value={toolChoice} onValueChange={setToolChoice}>
                        <SelectTrigger className="border-zinc-700 bg-zinc-900 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {toolChoiceOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              <span className="text-xs">{option.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {renderFormField(
                      'Dynamic Tools',
                      <div className="grid grid-cols-1 gap-2">
                        {availableTools.map((tool) => (
                          <div
                            key={tool.id}
                            className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-2"
                          >
                            <div className="flex-1">
                              <h4 className="text-primary font-dmmono text-xs font-semibold">
                                {tool.name}
                              </h4>
                              <p className="text-muted text-xs">
                                {tool.description}
                              </p>
                            </div>
                            <Switch
                              checked={dynamicTools.includes(tool.id)}
                              onCheckedChange={() => toggleTool(tool.id)}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {renderFormField(
                      'Custom Tools (IDs)',
                      <TextArea
                        placeholder="my_python_tool_id, another_tool_id"
                        value={customTools}
                        onChange={(e) => setCustomTools(e.target.value)}
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}

                    {renderFormField(
                      'MCP Servers (IDs)',
                      <TextArea
                        placeholder="my_mcp_server_id, another_server_id"
                        value={mcpServers}
                        onChange={(e) => setMcpServers(e.target.value)}
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}
                  </motion.div>
                )}

                {activeTab === 'Memory' && (
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderFormField(
                      'Memory Type',
                      <Select value={memoryType} onValueChange={setMemoryType}>
                        <SelectTrigger className="border-zinc-700 bg-zinc-900 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {memoryTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <span className="text-xs">{type.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Enable Agentic Memory
                        </Label>
                        <Switch
                          checked={enableAgenticMemory}
                          onCheckedChange={setEnableAgenticMemory}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Enable User Memories
                        </Label>
                        <Switch
                          checked={enableUserMemories}
                          onCheckedChange={setEnableUserMemories}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Add Memory References
                        </Label>
                        <Switch
                          checked={addMemoryReferences}
                          onCheckedChange={setAddMemoryReferences}
                        />
                      </div>
                    </div>

                    {renderFormField(
                      'Memory Schema',
                      <Input
                        placeholder="ai"
                        value={memorySchema}
                        onChange={(e) => setMemorySchema(e.target.value)}
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}

                    {renderFormField(
                      'Memory Database URL',
                      <Input
                        type="password"
                        placeholder="postgresql://user:password@host:port/database"
                        value={memoryDbUrl}
                        onChange={(e) => setMemoryDbUrl(e.target.value)}
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}
                  </motion.div>
                )}

                {activeTab === 'Knowledge' && (
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Add References
                        </Label>
                        <Switch
                          checked={addReferences}
                          onCheckedChange={setAddReferences}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Search Knowledge
                        </Label>
                        <Switch
                          checked={searchKnowledge}
                          onCheckedChange={setSearchKnowledge}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Update Knowledge
                        </Label>
                        <Switch
                          checked={updateKnowledge}
                          onCheckedChange={setUpdateKnowledge}
                        />
                      </div>
                    </div>

                    {renderFormField(
                      'References Format',
                      <Select
                        value={referencesFormat}
                        onValueChange={setReferencesFormat}
                      >
                        <SelectTrigger className="border-zinc-700 bg-zinc-900 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {referencesFormats.map((format) => (
                            <SelectItem key={format.id} value={format.id}>
                              <span className="text-xs">{format.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {renderFormField(
                      'Max References',
                      <Input
                        type="number"
                        value={maxReferences}
                        onChange={(e) =>
                          setMaxReferences(Number.parseInt(e.target.value))
                        }
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}

                    {renderFormField(
                      `Similarity Threshold: ${similarityThreshold}`,
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={similarityThreshold}
                          onChange={(e) =>
                            setSimilarityThreshold(
                              Number.parseFloat(e.target.value)
                            )
                          }
                          className="accent-primary w-full"
                        />
                        <p className="text-muted text-xs">
                          Minimum similarity score for knowledge retrieval
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                      <div className="space-y-1">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Reasoning Mode
                        </Label>
                        <p className="text-muted text-xs">
                          Enable step-by-step reasoning
                        </p>
                      </div>
                      <Switch
                        checked={reasoning}
                        onCheckedChange={setReasoning}
                      />
                    </div>

                    {reasoning && (
                      <>
                        {renderFormField(
                          'Reasoning Goal',
                          <TextArea
                            placeholder="Execute the given task using step-by-step reasoning..."
                            value={reasoningGoal}
                            onChange={(e) => setReasoningGoal(e.target.value)}
                            className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                          />
                        )}

                        {renderFormField(
                          'Max Reasoning Steps',
                          <Input
                            type="number"
                            value={reasoningMaxSteps}
                            onChange={(e) =>
                              setReasoningMaxSteps(
                                Number.parseInt(e.target.value)
                              )
                            }
                            className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                          />
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {activeTab === 'Team' && (
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderFormField(
                      'Team Mode',
                      <Select value={teamMode} onValueChange={setTeamMode}>
                        <SelectTrigger className="border-zinc-700 bg-zinc-900 text-xs">
                          <SelectValue placeholder="Select team mode" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamModes.map((mode) => (
                            <SelectItem key={mode.id} value={mode.id}>
                              <span className="text-xs">{mode.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {renderFormField(
                      'Team Role',
                      <Input
                        placeholder="e.g., Main Executor, Coordinator, Specialist"
                        value={teamRole}
                        onChange={(e) => setTeamRole(e.target.value)}
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}

                    {renderFormField(
                      'Storage Configuration',
                      <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                          <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                            Storage Enabled
                          </Label>
                          <Switch
                            checked={storageEnabled}
                            onCheckedChange={setStorageEnabled}
                          />
                        </div>

                        {storageEnabled && (
                          <>
                            <Select
                              value={storageType}
                              onValueChange={setStorageType}
                            >
                              <SelectTrigger className="border-zinc-700 bg-zinc-900 text-xs">
                                <SelectValue placeholder="Select storage type" />
                              </SelectTrigger>
                              <SelectContent>
                                {storageTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    <span className="text-xs">{type.name}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Input
                              type="password"
                              placeholder="Storage Database URL"
                              value={storageDbUrl}
                              onChange={(e) => setStorageDbUrl(e.target.value)}
                              className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                            />

                            <Input
                              placeholder="Table Name (e.g., agent_sessions)"
                              value={storageTableName}
                              onChange={(e) =>
                                setStorageTableName(e.target.value)
                              }
                              className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                            />

                            <Input
                              placeholder="Schema (e.g., ai)"
                              value={storageSchema}
                              onChange={(e) => setStorageSchema(e.target.value)}
                              className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                            />
                          </>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'Advanced' && (
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Debug Mode
                        </Label>
                        <Switch
                          checked={debugMode}
                          onCheckedChange={setDebugMode}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Stream Response
                        </Label>
                        <Switch checked={stream} onCheckedChange={setStream} />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Markdown Support
                        </Label>
                        <Switch
                          checked={markdown}
                          onCheckedChange={setMarkdown}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Add Datetime to Instructions
                        </Label>
                        <Switch
                          checked={addDatetimeToInstructions}
                          onCheckedChange={setAddDatetimeToInstructions}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Read Chat History
                        </Label>
                        <Switch
                          checked={readChatHistory}
                          onCheckedChange={setReadChatHistory}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Use JSON Mode
                        </Label>
                        <Switch
                          checked={useJsonMode}
                          onCheckedChange={setUseJsonMode}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Store Events
                        </Label>
                        <Switch
                          checked={storeEvents}
                          onCheckedChange={setStoreEvents}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <Label className="text-primary font-dmmono text-xs font-semibold uppercase">
                          Exponential Backoff
                        </Label>
                        <Switch
                          checked={exponentialBackoff}
                          onCheckedChange={setExponentialBackoff}
                        />
                      </div>
                    </div>

                    {renderFormField(
                      'History Runs Count',
                      <Input
                        type="number"
                        value={numHistoryRuns}
                        onChange={(e) =>
                          setNumHistoryRuns(Number.parseInt(e.target.value))
                        }
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}

                    {renderFormField(
                      'Tags',
                      <Input
                        placeholder="example, documentation, ai-agent"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}

                    {renderFormField(
                      'Timezone',
                      <Input
                        placeholder="UTC, Europe/Moscow, America/New_York"
                        value={timezoneIdentifier}
                        onChange={(e) => setTimezoneIdentifier(e.target.value)}
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}

                    {renderFormField(
                      'Retries',
                      <Input
                        type="number"
                        value={retries}
                        onChange={(e) =>
                          setRetries(Number.parseInt(e.target.value))
                        }
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}

                    {renderFormField(
                      'Delay Between Retries (seconds)',
                      <Input
                        type="number"
                        value={delayBetweenRetries}
                        onChange={(e) =>
                          setDelayBetweenRetries(
                            Number.parseInt(e.target.value)
                          )
                        }
                        className="font-dmmono border-zinc-700 bg-zinc-900 text-xs"
                      />
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="bg-background-secondary/30 border-accent/20 rounded-xl border p-6">
              <div className="space-y-4">
                <div className="space-y-3 text-center">
                  <Icon
                    type="agent"
                    size="md"
                    className="text-primary mx-auto"
                  />
                  <h3 className="text-primary font-dmmono text-sm font-bold uppercase tracking-wider">
                    {agentName || 'Untitled Agent'}
                  </h3>
                  <p className="text-muted text-xs">
                    {agentDescription || 'No description provided'}
                  </p>
                  {agentId && (
                    <p className="text-muted font-dmmono text-center text-xs">
                      ID: {agentId}
                    </p>
                  )}
                </div>

                <Separator className="bg-zinc-700" />

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted font-dmmono uppercase">
                      Provider:
                    </span>
                    <span className="text-primary">
                      {selectedProvider || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-dmmono uppercase">
                      Model:
                    </span>
                    <span className="text-primary">
                      {selectedModel || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-dmmono uppercase">
                      Tools:
                    </span>
                    <span className="text-primary">
                      {dynamicTools.length} enabled
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-dmmono uppercase">
                      Memory:
                    </span>
                    <span className="text-primary">
                      {enableAgenticMemory ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-dmmono uppercase">
                      Storage:
                    </span>
                    <span className="text-primary">
                      {storageEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {dynamicTools.length > 0 && (
                  <>
                    <Separator className="bg-zinc-700" />
                    <div>
                      <p className="text-primary font-dmmono mb-2 text-xs font-semibold uppercase">
                        Enabled Tools:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {dynamicTools.map((toolId) => {
                          const tool = availableTools.find(
                            (t) => t.id === toolId
                          )
                          return (
                            <Badge
                              key={toolId}
                              variant="secondary"
                              className="font-dmmono text-xs"
                            >
                              {tool?.name}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-background-secondary/30 border-accent/20 rounded-xl border p-6">
              <div className="mb-3 flex items-center">
                <Info className="text-primary mr-2 h-4 w-4" />
                <h4 className="text-primary font-dmmono text-xs font-semibold uppercase">
                  Configuration Tips
                </h4>
              </div>
              <div className="text-muted space-y-2 text-xs">
                <p>• Start with basic info and model configuration</p>
                <p>• Enable memory for conversation continuity</p>
                <p>• Use reasoning mode for complex tasks</p>
                <p>• Configure team settings for multi-agent workflows</p>
                <p>• Test thoroughly before deploying</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
