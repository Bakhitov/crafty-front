import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'default' | 'lg' | 'icon'
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'foreground'
}

export function ThemeToggle({
  className = '',
  size = 'icon',
  variant = 'ghost'
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={`text-muted hover:text-foreground ${className}`}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  )
}
