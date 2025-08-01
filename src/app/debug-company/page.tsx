'use client'

import { useCompanyContext } from '@/components/CompanyProvider'
import { useAuthContext } from '@/components/AuthProvider'

export default function DebugCompanyPage() {
  const { user, loading: authLoading } = useAuthContext()
  const { company, loading: companyLoading, error } = useCompanyContext()

  if (authLoading || companyLoading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <h1 className="mb-6 text-2xl font-bold">Company Debug Info</h1>

      <div className="space-y-6">
        <div className="bg-background-secondary rounded-lg p-4">
          <h2 className="mb-2 text-lg font-semibold">User Info</h2>
          <pre className="text-muted-foreground text-sm">
            {JSON.stringify(
              {
                id: user?.id,
                email: user?.email,
                loading: authLoading
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="bg-background-secondary rounded-lg p-4">
          <h2 className="mb-2 text-lg font-semibold">Company Info</h2>
          <pre className="text-muted-foreground text-sm">
            {JSON.stringify(
              {
                company: company
                  ? {
                      id: company.id,
                      name: company.name,
                      is_active: company.is_active,
                      restricted_at: company.restricted_at,
                      user_ids: company.user_ids,
                      type: company.type,
                      created_at: company.created_at,
                      updated_at: company.updated_at
                    }
                  : null,
                loading: companyLoading,
                error: error
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="bg-background-secondary rounded-lg p-4">
          <h2 className="mb-2 text-lg font-semibold">Access Logic</h2>
          <div className="text-muted-foreground space-y-1 text-sm">
            <p>User exists: {user ? '✅' : '❌'}</p>
            <p>Company exists: {company ? '✅' : '❌'}</p>
            <p>
              Company is_active:{' '}
              {company?.is_active === true
                ? '✅'
                : company?.is_active === false
                  ? '❌'
                  : '❓'}
            </p>
            <p>
              Should have access:{' '}
              {user && company && company.is_active === true ? '✅' : '❌'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
