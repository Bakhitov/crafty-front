import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Heading from '@/components/ui/typography/Heading'
import Paragraph from '@/components/ui/typography/Paragraph'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, HelpCircle } from 'lucide-react'
import { ExtraData } from '@/types/playground'

interface ReasoningStepsProps {
  steps: ExtraData['reasoning_steps']
}

const getNextActionIcon = (action: string) => {
  switch (action) {
    case 'final_answer':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'continue':
      return <HelpCircle className="h-4 w-4 text-yellow-500" />
    default:
      return <AlertCircle className="h-4 w-4 text-red-500" />
  }
}

const ReasoningSteps: React.FC<ReasoningStepsProps> = ({ steps }) => {
  if (!steps || steps.length === 0) {
    return null
  }

  return (
    <div className="mt-4 space-y-4">
      <Heading as="h3" size="sm" className="text-gray-900 dark:text-gray-100">
        Reasoning Steps
      </Heading>
      {steps.map((step, index) => (
        <Card
          key={index}
          className="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
        >
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {index + 1}. {step.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Heading
                as="h4"
                size="xs"
                className="mb-1 font-semibold text-gray-700 dark:text-gray-300"
              >
                Action
              </Heading>
              <Paragraph size="sm" className="text-gray-600 dark:text-gray-400">
                {step.action}
              </Paragraph>
            </div>
            <div>
              <Heading
                as="h4"
                size="xs"
                className="mb-1 font-semibold text-gray-700 dark:text-gray-300"
              >
                Result
              </Heading>
              <Paragraph size="sm" className="text-gray-600 dark:text-gray-400">
                {step.result}
              </Paragraph>
            </div>
            <div>
              <Heading
                as="h4"
                size="xs"
                className="mb-1 font-semibold text-gray-700 dark:text-gray-300"
              >
                Reasoning
              </Heading>
              <Paragraph size="sm" className="text-gray-600 dark:text-gray-400">
                {step.reasoning}
              </Paragraph>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Heading
                  as="h4"
                  size="xs"
                  className="font-semibold text-gray-700 dark:text-gray-300"
                >
                  Next Action:
                </Heading>
                <Badge
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  {getNextActionIcon(step.next_action)}
                  <span>{step.next_action}</span>
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Heading
                  as="h4"
                  size="xs"
                  className="font-semibold text-gray-700 dark:text-gray-300"
                >
                  Confidence:
                </Heading>
                <Badge
                  variant={step.confidence > 0.8 ? 'default' : 'secondary'}
                >
                  {(step.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default ReasoningSteps
