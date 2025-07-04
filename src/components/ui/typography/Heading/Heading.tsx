'use client'

import { type FC, type JSX } from 'react'
import { cn } from '@/lib/utils'

import { HEADING_SIZES } from './constants'
import { type HeadingProps } from './types'

const Heading: FC<HeadingProps> = ({ children, size, fontSize, className }) => {
  const Tag = `h${size}` as keyof JSX.IntrinsicElements
  
  // Check if text-center is in className to decide whether to use flex or block
  const isTextCenter = className?.includes('text-center')

  return (
    <Tag
      className={cn(
        isTextCenter 
          ? 'font-semibold' 
          : 'flex items-center gap-x-3 font-semibold',
        fontSize ? HEADING_SIZES[fontSize] : HEADING_SIZES[size],
        className
      )}
    >
      {children}
    </Tag>
  )
}

export default Heading
