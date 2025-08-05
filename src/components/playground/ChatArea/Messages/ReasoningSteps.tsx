import React, { type FC } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import Heading from '@/components/ui/typography/Heading'
import Paragraph from '@/components/ui/typography/Paragraph'
import { CheckCircle, AlertCircle, HelpCircle } from 'lucide-react'
import { ReasoningSteps } from '@/types/playground'

interface ReasoningSectionProps {
  reasoning: ReasoningSteps[] | ReasoningSteps
  showDetailed?: boolean
}

interface ReasoningStepProps {
  step: ReasoningSteps
  index: number
}

const getNextActionIcon = (action: string) => {
  switch (action) {
    case 'final_answer':
      return <CheckCircle className="h-3 w-3 text-green-500" />
    case 'continue':
      return <HelpCircle className="h-3 w-3 text-yellow-500" />
    default:
      return <AlertCircle className="h-3 w-3 text-red-500" />
  }
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200'
  if (confidence >= 0.6)
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

// Простой компонент шага как в example_ui
const SimpleReasoningStep: FC<ReasoningStepProps> = ({ step }) => (
  <div className="text-secondary flex items-start gap-2">
    <p className="text-xs">{step.title}</p>
  </div>
)

// Детальный компонент с аккордеоном для сложных случаев
const DetailedReasoningStep: FC<ReasoningStepProps> = ({ step, index }) => (
  <AccordionItem
    value={`reasoning-step-${index}`}
    className="bg-background-secondary/40 rounded-lg border-none"
  >
    <AccordionTrigger className="p-3 hover:no-underline">
      <div className="flex w-full items-start gap-3 text-left">
        <div className="bg-background-secondary flex h-[30px] min-w-[65px] items-center justify-center rounded-md">
          <p className="text-primary/60 text-xs font-medium uppercase">
            step {index + 1}
          </p>
        </div>
      </div>
    </AccordionTrigger>
    <AccordionContent className="p-4 pt-0">
      <div className="space-y-4 px-1">
        {step.action && (
          <div>
            <Heading
              size={6}
              className="text-primary/80 mb-2 font-mono text-xs uppercase"
            >
              Action
            </Heading>
            <div className="bg-background-secondary/60 rounded-md p-3">
              <Paragraph size="sm" className="text-secondary">
                {step.action}
              </Paragraph>
            </div>
          </div>
        )}

        <div>
          <Heading
            size={6}
            className="text-primary/80 mb-2 font-mono text-xs uppercase"
          >
            Result
          </Heading>
          <div className="bg-background-secondary/60 rounded-md p-3">
            <Paragraph size="sm" className="text-secondary">
              {step.result}
            </Paragraph>
          </div>
        </div>

        <div>
          <Heading
            size={6}
            className="text-primary/80 mb-2 font-mono text-xs uppercase"
          >
            Reasoning
          </Heading>
          <div className="bg-background-secondary/60 rounded-md p-3">
            <Paragraph size="sm" className="text-secondary">
              {step.reasoning}
            </Paragraph>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {step.next_action && (
            <div className="flex items-center space-x-2">
              <Heading
                size={6}
                className="text-primary/80 font-mono text-xs uppercase"
              >
                Next Action:
              </Heading>
              <Badge
                variant="outline"
                className="border-accent flex items-center space-x-1"
              >
                {getNextActionIcon(step.next_action)}
                <span className="text-xs">{step.next_action}</span>
              </Badge>
            </div>
          )}

          {step.confidence !== undefined && (
            <div className="flex items-center space-x-2">
              <Heading
                size={6}
                className="text-primary/80 font-mono text-xs uppercase"
              >
                Confidence:
              </Heading>
              <Badge
                variant="outline"
                className={`flex items-center space-x-1 ${getConfidenceColor(step.confidence)}`}
              >
                <span className="text-xs">
                  {(step.confidence * 100).toFixed(0)}%
                </span>
              </Badge>
            </div>
          )}
        </div>
      </div>
    </AccordionContent>
  </AccordionItem>
)

// Функция для проверки наличия детальной информации
export const hasDetailedReasoningInfo = (
  reasoning: ReasoningSteps[] | ReasoningSteps
): boolean => {
  if (!reasoning) return false

  const reasoningArray = Array.isArray(reasoning) ? reasoning : [reasoning]
  return reasoningArray.some(
    (step) => step.action || step.reasoning || step.confidence !== undefined
  )
}

const ReasoningStepsComponent: FC<ReasoningSectionProps> = ({
  reasoning,
  showDetailed = false
}) => {
  if (!reasoning) {
    return null
  }

  // Ensure reasoning is an array
  const reasoningArray = Array.isArray(reasoning) ? reasoning : [reasoning]

  if (reasoningArray.length === 0) {
    return null
  }

  // Проверяем, есть ли детальная информация (action, reasoning, confidence)
  const hasDetailedInfo = hasDetailedReasoningInfo(reasoning)

  // Если нет детальной информации, показываем простой вид как в example_ui
  if (!hasDetailedInfo) {
    return (
      <div className="flex flex-col items-start justify-center gap-2">
        {reasoningArray.map((step, index) => (
          <SimpleReasoningStep key={index} step={step} index={index} />
        ))}
      </div>
    )
  }

  // Если есть детальная информация, показываем с управлением извне
  return (
    <div className="w-full">
      {/* Простой вид всегда показываем */}
      <div className="flex flex-col items-start justify-center gap-2">
        {reasoningArray.map((step, index) => (
          <SimpleReasoningStep key={index} step={step} index={index} />
        ))}
      </div>

      {/* Детальный вид показываем только если showDetailed = true */}
      {showDetailed && (
        <div className="mt-3">
          <Accordion type="multiple" className="w-full space-y-2">
            {reasoningArray.map((step, index) => (
              <DetailedReasoningStep key={index} step={step} index={index} />
            ))}
          </Accordion>
        </div>
      )}
    </div>
  )
}

export default ReasoningStepsComponent
