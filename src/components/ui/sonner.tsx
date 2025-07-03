'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        style: {
          background: '#27272A', // background.secondary
          color: '#FAFAFA', // primary (foreground color)
          border: '1px solid #f5f5f5', // border
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '10px'
        },
        classNames: {
          toast: 'group toast',
          description: '!text-[#FAFAFA] !opacity-100',
          actionButton: '!bg-[#FAFAFA] !text-[#18181B]',
          cancelButton: '!bg-[#A1A1AA] !text-[#FAFAFA]',
          title: '!text-[#FAFAFA] !font-semibold'
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
