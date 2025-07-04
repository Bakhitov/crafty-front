import { cn } from '@/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { cva, VariantProps } from 'class-variance-authority'
import React from 'react'

const rainbowButtonVariants = cva(
  cn(
    'relative cursor-pointer group transition-all animate-rainbow',
    'inline-flex items-center justify-center gap-2 shrink-0',
    'rounded-xl outline-none focus-visible:ring-[3px] aria-invalid:border-destructive',
    'text-sm font-medium whitespace-nowrap',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0"
  ),
  {
    variants: {
      variant: {
        default:
          'border-2 bg-[linear-gradient(#111113,#111113),linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] bg-[length:200%] text-primary [background-clip:padding-box,border-box] [background-origin:border-box] [border:2px_solid_transparent] before:absolute before:inset-0 before:z-[-1] before:animate-rainbow before:bg-[linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] before:bg-[length:200%] before:rounded-[inherit] before:[filter:blur(6px)] before:opacity-70',
        outline:
          'border-2 bg-[linear-gradient(#111113,#111113),linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] bg-[length:200%] text-primary [background-clip:padding-box,border-box] [background-origin:border-box] [border:2px_solid_transparent] before:absolute before:inset-0 before:z-[-1] before:animate-rainbow before:bg-[linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] before:bg-[length:200%] before:rounded-[inherit] before:[filter:blur(4px)] before:opacity-50'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-xl px-3 text-xs',
        lg: 'h-11 rounded-xl px-8',
        icon: 'size-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof rainbowButtonVariants> {
  asChild?: boolean
}

const RainbowButton = React.forwardRef<HTMLButtonElement, RainbowButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        data-slot="button"
        className={cn(rainbowButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

RainbowButton.displayName = 'RainbowButton'

export { RainbowButton, rainbowButtonVariants, type RainbowButtonProps }
