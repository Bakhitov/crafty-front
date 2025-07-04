import React from 'react'
import { cn } from '@/lib/utils'

interface PulsatingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pulseColor?: string
  duration?: string
}

export const PulsatingButton = React.forwardRef<
  HTMLButtonElement,
  PulsatingButtonProps
>(
  (
    { className, children, pulseColor = '#374151', duration = '2s', ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'bg-primary text-background relative flex cursor-pointer items-center justify-center rounded-xl px-4 py-2 text-center font-semibold shadow-lg transition-all hover:scale-105',
          className
        )}
        style={
          {
            '--pulse-color': pulseColor,
            '--duration': duration
          } as React.CSSProperties
        }
        {...props}
      >
        <div className="relative z-10">{children}</div>
        <div
          className="animate-pulse-glow absolute -inset-2 rounded-xl opacity-60"
          style={{
            backgroundColor: pulseColor,
            animationDuration: duration
          }}
        />
        <div
          className="absolute -inset-1 animate-ping rounded-xl opacity-30"
          style={{
            backgroundColor: pulseColor,
            animationDuration: `calc(${duration} * 1.5)`
          }}
        />
      </button>
    )
  }
)

PulsatingButton.displayName = 'PulsatingButton'
