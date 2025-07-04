'use client'

import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'motion/react'
import React, {
  ComponentPropsWithoutRef,
  useEffect,
  useMemo,
  useState
} from 'react'

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  const animations = {
    initial: { scale: 0.8, opacity: 0, y: -50 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.8, opacity: 0, y: 50 },
    transition: { type: 'spring' as const, stiffness: 350, damping: 40 }
  }

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  )
}

export interface AnimatedListProps extends ComponentPropsWithoutRef<'div'> {
  children: React.ReactNode
  delay?: number
}

export const AnimatedList = React.memo(
  ({ children, className, delay = 1000, ...props }: AnimatedListProps) => {
    const [index, setIndex] = useState(0)
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children]
    )

    useEffect(() => {
      const timeout = setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % childrenArray.length)
      }, delay)

      return () => clearTimeout(timeout)
    }, [index, delay, childrenArray.length])

    const itemsToShow = useMemo(() => {
      const maxItemsToShow = 3
      const startIndex = Math.max(0, index + 1 - maxItemsToShow)
      const endIndex = index + 1
      const result = childrenArray.slice(startIndex, endIndex)
      return result
    }, [index, childrenArray])

    return (
      <div
        className={cn(`flex flex-col items-center gap-4`, className)}
        {...props}
      >
        <AnimatePresence>
          {itemsToShow.map((item) => (
            <AnimatedListItem key={(item as React.ReactElement).key}>
              {item}
            </AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    )
  }
)

AnimatedList.displayName = 'AnimatedList'
