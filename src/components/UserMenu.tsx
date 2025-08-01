'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Вы успешно вышли из системы')
      // Не делаем ручного редиректа - позволяем middleware обработать это
      // router.replace('/auth') - убираем, чтобы избежать цикла перезагрузок
    } catch {
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
        className="text-muted-foreground hover:text-foreground flex items-center space-x-2"
      >
        <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
          <Icon type="user" size="sm" className="text-primary" />
        </div>
        <span className="text-sm">{user.email}</span>
        <Icon
          type="chevron-down"
          size="sm"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-background border-border/10 absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border shadow-lg"
          >
            <div className="border-border/10 border-b p-3">
              <p className="text-foreground text-sm font-medium">
                {user.user_metadata?.full_name ||
                  user.email?.split('@')[0] ||
                  'Пользователь'}
              </p>
              <p className="text-muted-foreground text-xs">{user.email}</p>
            </div>

            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
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
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}
