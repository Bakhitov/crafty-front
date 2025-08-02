'use client'

import Icon from '@/components/ui/icon'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({
  message = 'Loading...',
  size = 'md',
  className = ''
}: LoadingSpinnerProps) {
  const iconSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'

  return (
    <div
      className={`bg-background fixed inset-0 z-50 flex items-center justify-center ${className}`}
    >
      <div className="flex flex-col items-center space-y-4">
        <Icon
          type="agent"
          size={iconSize}
          className="text-primary animate-pulse"
        />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  )
}
