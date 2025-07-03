'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export default function AuthPage() {
  const router = useRouter()
  const { user, loading, signIn, signUp, resetPassword } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [isResetPassword, setIsResetPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Если пользователь уже авторизован, перенаправляем на playground
  useEffect(() => {
    if (user && !loading) {
      router.replace('/playground')
    }
  }, [user, loading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      if (isResetPassword) {
        const { error } = await resetPassword(formData.email)
        if (error) {
          toast.error(error)
        } else {
          toast.success('A password reset email has been sent to your email address')
          setIsResetPassword(false)
        }
      } else if (isLogin) {
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          toast.error(error)
        } else {
          toast.success('Successfully logged in')
          // Принудительно перенаправляем после успешного входа
          router.replace('/playground')
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match')
          return
        }
        
        const { error } = await signUp(formData.email, formData.password, formData.name)
        if (error) {
          toast.error(error)
        } else {
          toast.success('Account created! Please check your email to confirm your account')
          // Если пользователь создан успешно, переключаемся на форму входа
          setIsLogin(true)
          setFormData({
            name: '',
            email: formData.email, // Оставляем email для удобства
            password: '',
            confirmPassword: ''
          })
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoginFormValid = formData.email && formData.password
  const isRegisterFormValid = formData.name && formData.email && formData.password && 
                             formData.confirmPassword && formData.password === formData.confirmPassword
  const isResetFormValid = formData.email

  const isFormValid = isResetPassword ? isResetFormValid : (isLogin ? isLoginFormValid : isRegisterFormValid)

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setIsResetPassword(false)
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
  }

  const toggleResetPassword = () => {
    setIsResetPassword(!isResetPassword)
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon type="agent" size="lg" className="text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-background-secondary/20 border border-border/10 rounded-xl p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <Icon type="agent" size="lg" className="mx-auto text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                {isResetPassword ? 'Reset password' : (isLogin ? 'Welcome' : 'Create account')}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isResetPassword 
                  ? 'Enter your email to reset your password' 
                  : (isLogin ? 'Login to your Crafty account' : 'Join Crafty AI')
                }
              </p>
            </div>
          </div>

          {/* Mode Toggle - скрываем во время сброса пароля */}
          {!isResetPassword && (
            <div className="flex mb-8 p-1 bg-background-secondary/30 rounded-lg">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  isLogin 
                    ? 'bg-primary text-background shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  !isLogin 
                    ? 'bg-primary text-background shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Name field - только для регистрации */}
              {!isLogin && !isResetPassword && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-lg border border-border/10 bg-background-secondary/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                    required={!isLogin && !isResetPassword}
                  />
                </div>
              )}

              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-lg border border-border/10 bg-background-secondary/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                  required
                />
              </div>

              {/* Password field - скрываем при сбросе пароля */}
              {!isResetPassword && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isLogin ? "Enter your password" : "Create a password"}
                    className="w-full px-4 py-3 rounded-lg border border-border/10 bg-background-secondary/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                    required
                  />
                </div>
              )}

              {/* Confirm Password field - только для регистрации */}
              {!isLogin && !isResetPassword && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="w-full px-4 py-3 rounded-lg border border-border/10 bg-background-secondary/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                    required={!isLogin && !isResetPassword}
                  />
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-2 text-sm text-red-500">Passwords do not match</p>
                  )}
                </div>
              )}
            </div>

            {/* Forgot Password - только для входа */}
            {isLogin && !isResetPassword && (
              <div className="text-sm text-right">
                <button
                  type="button"
                  onClick={toggleResetPassword}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button - стиль как в New Chat */}
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              size="lg"
              className="h-9 w-full rounded-xl bg-primary text-xs font-medium text-background hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="uppercase">Please wait...</span>
                </div>
              ) : (
                <span className="uppercase">
                  {isResetPassword ? 'Reset password' : (isLogin ? 'Login' : 'Create account')}
                </span>
              )}
            </Button>

            {/* Reset Password Back Button */}
            {isResetPassword && (
              <button
                type="button"
                onClick={toggleResetPassword}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to login
              </button>
            )}
          </form>

          {/* Footer Links */}
          {!isResetPassword && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              {isLogin ? (
                <p>
                  No account?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Register
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Login
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}