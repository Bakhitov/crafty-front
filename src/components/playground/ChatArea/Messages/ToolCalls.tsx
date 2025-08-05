import React, { memo } from 'react'
import { ToolCall } from '@/types/playground'
import Tooltip from '@/components/ui/tooltip'

interface ToolCallsSectionProps {
  toolCalls: ToolCall[]
}

const ToolComponent = memo(({ tools }: { tools: ToolCall }) => {
  const tooltipContent = (
    <div className="font-geist text-primary max-w-[70vw] whitespace-pre-wrap break-words text-xs">
      <div className="mb-3 text-sm font-semibold">
        {tools.tool_name || 'Unknown Tool'}
      </div>
      <div className="space-y-2">
        {tools.tool_call_id && (
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground shrink-0 font-medium">
              ID:
            </span>
            <span className="text-primary break-all font-mono text-xs">
              {tools.tool_call_id}
            </span>
          </div>
        )}
        {tools.status && (
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground shrink-0 font-medium">
              Status:
            </span>
            <span
              className={`font-medium ${
                tools.status === 'completed'
                  ? 'text-green-600'
                  : tools.status === 'running'
                    ? 'text-yellow-600'
                    : 'text-primary'
              }`}
            >
              {tools.status}
            </span>
          </div>
        )}
        {tools.tool_args && (
          <div className="space-y-1">
            <span className="text-muted-foreground font-medium">
              Arguments:
            </span>
            <div className="bg-muted/50 max-h-32 overflow-auto rounded-md p-2">
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {JSON.stringify(tools.tool_args, null, 2)}
              </pre>
            </div>
          </div>
        )}
        {(tools.tool_output || tools.content) && (
          <div className="space-y-1">
            <span className="text-muted-foreground font-medium">Result:</span>
            <div className="bg-muted/50 max-h-32 overflow-auto rounded-md p-2">
              <div className="whitespace-pre-wrap text-xs">
                {String(tools.tool_output || tools.content)}
              </div>
            </div>
          </div>
        )}
        {tools.metrics?.time && (
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground shrink-0 font-medium">
              Execution Time:
            </span>
            <span className="text-primary font-medium">
              {tools.metrics.time.toFixed(2)}s
            </span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Tooltip
      content={tooltipContent}
      side="top"
      delayDuration={300}
      contentClassName="font-geist p-4 bg-background border border-border shadow-lg max-w-[70vw] rounded-xl"
    >
      <div className="bg-accent hover:bg-accent/80 cursor-default rounded-full px-2 py-1 text-xs transition-colors">
        <p className="text-primary/80 font-mono uppercase">
          {tools.tool_name || 'Tool'}
        </p>
      </div>
    </Tooltip>
  )
})

ToolComponent.displayName = 'ToolComponent'

const ToolCallsSection: React.FC<ToolCallsSectionProps> = ({ toolCalls }) => {
  if (!toolCalls || toolCalls.length === 0) {
    return null
  }

  // Если передан только один инструмент, отображаем как chip
  if (toolCalls.length === 1) {
    return <ToolComponent tools={toolCalls[0]} />
  }

  // Если несколько инструментов, отображаем список chips
  return (
    <div className="flex flex-wrap gap-2">
      {toolCalls.map((toolCall, index) => (
        <ToolComponent
          key={`${toolCall.tool_call_id || toolCall.tool_name}-${toolCall.created_at}-${index}`}
          tools={toolCall}
        />
      ))}
    </div>
  )
}

export default ToolCallsSection
