'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { CompanyContextType } from '@/types/company'
import { useCompany } from '@/hooks/useCompany'

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { company, loading, error, refetch } = useCompany()

  const contextValue: CompanyContextType = useMemo(
    () => ({
      company,
      loading,
      error,
      refetch
    }),
    [company, loading, error, refetch]
  )

  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  )
}

export const useCompanyContext = () => {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider')
  }
  return context
}
