'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)

  useEffect(() => {
    // Проверяем, есть ли пользователь для сброса пароля
    const checkUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (user) {
        setIsValidSession(true)
      } else {
        toast.error('Недействительная ссылка для сброса пароля')
        router.push('/auth')
      }
    }

    checkUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Пароли не совпадают')
      return
    }

    if (password.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Пароль успешно обновлен')
        router.push('/')
      }
    } catch {
      toast.error('Произошла ошибка при обновлении пароля')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid =
    password &&
    confirmPassword &&
    password === confirmPassword &&
    password.length >= 6

  if (!isValidSession) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Icon type="agent" size="lg" className="text-primary" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-background-secondary/20 border-border/10 rounded-xl border p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mb-4"
            >
              <Icon type="agent" size="lg" className="text-primary mx-auto" />
            </motion.div>
            <div>
              <h1 className="text-foreground mb-2 text-2xl font-semibold">
                Новый пароль
              </h1>
              <p className="text-muted-foreground text-sm">
                Введите новый пароль для вашего аккаунта
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Password field */}
              <div>
                <label
                  htmlFor="password"
                  className="text-foreground mb-2 block text-sm font-medium"
                >
                  Новый пароль
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите новый пароль"
                  className="border-border/10 bg-background-secondary/30 text-foreground placeholder:text-muted-foreground focus:ring-primary/50 focus:border-primary/50 w-full rounded-lg border px-4 py-3 transition-colors focus:outline-none focus:ring-2"
                  required
                  minLength={6}
                />
              </div>

              {/* Confirm Password field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="text-foreground mb-2 block text-sm font-medium"
                >
                  Подтвердите пароль
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Подтвердите новый пароль"
                  className="border-border/10 bg-background-secondary/30 text-foreground placeholder:text-muted-foreground focus:ring-primary/50 focus:border-primary/50 w-full rounded-lg border px-4 py-3 transition-colors focus:outline-none focus:ring-2"
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-2 text-sm text-red-500">
                    Пароли не совпадают
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full py-3 text-sm font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                    className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                  />
                  <span>Обновление...</span>
                </div>
              ) : (
                'Обновить пароль'
              )}
            </Button>
          </form>

          {/* Back to login */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => router.push('/auth')}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              ← Вернуться к входу
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
