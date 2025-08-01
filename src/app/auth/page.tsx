'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
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

  useEffect(() => {
    if (user && !loading) {
      router.replace('/playground')
    }
  }, [user, loading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
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
          toast.success(
            'A password reset email has been sent to your email address'
          )
          setIsResetPassword(false)
        }
      } else if (isLogin) {
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
          toast.error(error)
        } else {
          toast.success('Successfully logged in')
          router.replace('/playground')
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match')
          return
        }

        const { error } = await signUp(
          formData.email,
          formData.password,
          formData.name
        )
        if (error) {
          toast.error(error)
        } else {
          toast.success(
            'Account created! Please check your email to confirm your account'
          )
          setIsLogin(true)
          setFormData({
            name: '',
            email: formData.email,
            password: '',
            confirmPassword: ''
          })
        }
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoginFormValid = formData.email && formData.password
  const isRegisterFormValid =
    formData.name &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword
  const isResetFormValid = formData.email
  const isFormValid = isResetPassword
    ? isResetFormValid
    : isLogin
      ? isLoginFormValid
      : isRegisterFormValid

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setIsResetPassword(false)
    setFormData({ name: '', email: '', password: '', confirmPassword: '' })
  }

  const toggleResetPassword = () => {
    setIsResetPassword(!isResetPassword)
    setFormData({ name: '', email: '', password: '', confirmPassword: '' })
  }

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Icon
          type="agent"
          size="lg"
          className="text-foreground animate-pulse"
        />
      </div>
    )
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-background-secondary border-border rounded-xl border p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mb-6">
              <Icon
                type="agent"
                size="lg"
                className="text-foreground mx-auto"
              />
            </div>
            <div>
              <h1 className="text-foreground mb-2 text-lg font-bold">
                {isResetPassword
                  ? 'RESET PASSWORD'
                  : isLogin
                    ? 'CRAFTY'
                    : 'JOIN CRAFTY'}
              </h1>
              <p className="text-muted-foreground text-xs font-medium uppercase">
                {isResetPassword
                  ? 'Enter your email'
                  : isLogin
                    ? 'Sign in to your account'
                    : 'Create new account'}
              </p>
            </div>
          </div>

          {!isResetPassword && (
            <div className="bg-accent border-border mb-8 flex rounded-xl border p-1">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-medium uppercase transition-all duration-200 ${
                  isLogin
                    ? 'bg-background-secondary text-foreground border-border border shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-medium uppercase transition-all duration-200 ${
                  !isLogin
                    ? 'bg-background-secondary text-foreground border-border border shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Register
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {!isLogin && !isResetPassword && (
                <div>
                  <label
                    htmlFor="name"
                    className="text-foreground mb-2 block text-xs font-medium uppercase"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="border-border bg-accent text-foreground placeholder:text-muted-foreground focus:ring-foreground/20 focus:border-foreground w-full rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2"
                    required={!isLogin && !isResetPassword}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="text-foreground mb-2 block text-xs font-medium uppercase"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="border-border bg-accent text-foreground placeholder:text-muted-foreground focus:ring-foreground/20 focus:border-foreground w-full rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2"
                  required
                />
              </div>

              {!isResetPassword && (
                <div>
                  <label
                    htmlFor="password"
                    className="text-foreground mb-2 block text-xs font-medium uppercase"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={
                      isLogin ? 'Enter your password' : 'Create a password'
                    }
                    className="border-border bg-accent text-foreground placeholder:text-muted-foreground focus:ring-foreground/20 focus:border-foreground w-full rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2"
                    required
                  />
                </div>
              )}

              {!isLogin && !isResetPassword && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="text-foreground mb-2 block text-xs font-medium uppercase"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="border-border bg-accent text-foreground placeholder:text-muted-foreground focus:ring-foreground/20 focus:border-foreground w-full rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2"
                    required={!isLogin && !isResetPassword}
                  />
                  {formData.confirmPassword &&
                    formData.password !== formData.confirmPassword && (
                      <p className="text-destructive mt-2 text-xs font-medium">
                        Passwords do not match
                      </p>
                    )}
                </div>
              )}
            </div>

            {isLogin && !isResetPassword && (
              <div className="text-right text-xs">
                <button
                  type="button"
                  onClick={toggleResetPassword}
                  className="text-foreground hover:text-muted-foreground font-medium uppercase transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/90 h-9 w-full rounded-xl text-xs font-medium uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Please wait...</span>
                </div>
              ) : (
                <span>
                  {isResetPassword
                    ? 'Reset Password'
                    : isLogin
                      ? 'Sign In'
                      : 'Create Account'}
                </span>
              )}
            </Button>

            {isResetPassword && (
              <button
                type="button"
                onClick={toggleResetPassword}
                className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center space-x-1 text-xs font-medium uppercase transition-colors"
              >
                <span>← Back to Login</span>
              </button>
            )}
          </form>

          {!isResetPassword && (
            <div className="text-muted-foreground mt-6 text-center text-xs">
              {isLogin ? (
                <p>
                  No account?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-foreground hover:text-muted-foreground font-medium uppercase transition-colors"
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
                    className="text-foreground hover:text-muted-foreground font-medium uppercase transition-colors"
                  >
                    Sign In
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
