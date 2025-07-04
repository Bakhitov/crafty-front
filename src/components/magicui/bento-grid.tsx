import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BentoGridProps {
  children: ReactNode
  className?: string
}

interface BentoCardProps {
  name: string
  className: string
  background: ReactNode
  Icon: ReactNode
  description: string
  href?: string
  cta?: string
}

const BentoGrid = ({ children, className }: BentoGridProps) => {
  return (
    <div
      className={cn(
        'grid w-full auto-rows-[22rem] grid-cols-3 gap-4',
        className
      )}
    >
      {children}
    </div>
  )
}

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      'group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl',
      // light styles
      'bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
      // dark styles
      'dark:bg-background transform-gpu dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]',
      className
    )}
  >
    <div className="absolute inset-0 z-0">{background}</div>
    <div className="pointer-events-none relative z-20 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
      {Icon}
      <h3 className="text-primary text-xl font-semibold">{name}</h3>
      <p className="text-muted max-w-lg">{description}</p>
    </div>

    <div
      className={cn(
        'pointer-events-none absolute bottom-0 z-20 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100'
      )}
    >
      {href && cta && (
        <a
          href={href}
          className="text-primary pointer-events-auto text-sm font-medium hover:underline"
        >
          {cta}
        </a>
      )}
    </div>
  </div>
)

export { BentoCard, BentoGrid }
