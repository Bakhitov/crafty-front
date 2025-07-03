'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Вы успешно вышли из системы')
      router.push('/auth')
    } catch (error) {
      toast.error('Ошибка при выходе из системы')
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon type="user" size="sm" className="text-primary" />
        </div>
        <span className="text-sm">{user.email}</span>
        <Icon type="chevron-down" size="sm" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-56 bg-background border border-border/10 rounded-lg shadow-lg z-50"
          >
            <div className="p-3 border-b border-border/10">
              <p className="text-sm font-medium text-foreground">
                {user.user_metadata?.full_name || 'Пользователь'}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Icon type="log-out" size="sm" className="mr-2" />
                Выйти
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay для закрытия меню при клике вне его */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 