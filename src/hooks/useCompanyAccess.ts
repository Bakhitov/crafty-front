import { useEffect, useState } from 'react'
import { useCompanyContext } from '@/components/CompanyProvider'
import { useAuthContext } from '@/components/AuthProvider'

export function useCompanyAccess() {
  const { user, loading: authLoading } = useAuthContext()
  const {
    company,
    loading: companyLoading,
    error,
    refetch
  } = useCompanyContext()
  const [lastAccessCheck, setLastAccessCheck] = useState<boolean | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const isLoading = authLoading || companyLoading
  const isActive = company?.is_active === true
  const hasAccess = user && company && isActive

  useEffect(() => {
    // Ждем пока загружаются данные
    if (authLoading || companyLoading) {
      return
    }

    // Помечаем как инициализированный после первой загрузки
    if (!isInitialized) {
      setIsInitialized(true)
      console.log('useCompanyAccess: Initialized')
    }

    // Логируем состояние для отладки
    console.log('useCompanyAccess: Current state:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasCompany: !!company,
      companyId: company?.id,
      isActive: company?.is_active === true,
      hasAccess: user && company && company?.is_active === true,
      authLoading,
      companyLoading,
      error: error || 'none'
    })

    // Логируем изменения состояния доступа для отладки
    const currentIsActive = company?.is_active === true
    if (lastAccessCheck !== currentIsActive) {
      console.log('useCompanyAccess: Access status changed:', {
        previous: lastAccessCheck,
        current: currentIsActive,
        company_id: company?.id,
        company_name: company?.name,
        is_active_value: company?.is_active,
        is_active_type: typeof company?.is_active,
        user_id: user?.id
      })
      setLastAccessCheck(currentIsActive)
    }
  }, [
    authLoading,
    companyLoading,
    user,
    company,
    error,
    lastAccessCheck,
    isInitialized
  ])

  return {
    user,
    company,
    isLoading,
    hasAccess,
    isActive,
    error,
    refreshAccess: refetch,
    isInitialized
  }
}
