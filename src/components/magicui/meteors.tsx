'use client'

import { cn } from '@/lib/utils'
import React, { useEffect, useState } from 'react'

interface MeteorsProps {
  number?: number
  minDelay?: number
  maxDelay?: number
  minDuration?: number
  maxDuration?: number
  angle?: number
  className?: string
}

export const Meteors = ({
  number = 20,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 10,
  angle = 215,
  className
}: MeteorsProps) => {
  const [meteorStyles, setMeteorStyles] = useState<Array<React.CSSProperties>>(
    []
  )

  useEffect(() => {
    const styles = [...new Array(number)].map(() => ({
      '--angle': -angle + 'deg',
      top: '-5%',
      left: `calc(0% + ${Math.floor(Math.random() * window.innerWidth)}px)`,
      animationDelay: Math.random() * (maxDelay - minDelay) + minDelay + 's',
      animationDuration:
        Math.floor(Math.random() * (maxDuration - minDuration) + minDuration) +
        's'
    }))
    setMeteorStyles(styles)
  }, [number, minDelay, maxDelay, minDuration, maxDuration, angle])

  return (
    <>
      {[...meteorStyles].map((style, idx) => (
        // Meteor Head
        <span
          key={idx}
          style={{ ...style }}
          className={cn(
            'animate-meteor pointer-events-none absolute size-1 rotate-[var(--angle)] rounded-full bg-white opacity-80 shadow-[0_0_0_1px_#ffffff80]',
            className
          )}
        >
          {/* Meteor Tail */}
          <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-[80px] -translate-y-1/2 bg-gradient-to-r from-white via-white/60 to-transparent opacity-90" />
        </span>
      ))}
    </>
  )
}
