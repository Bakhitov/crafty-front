export interface Company {
  id: string
  created_at: string
  updated_at: string | null
  user_ids: string[] | null
  name: string | null
  type: string | null
  restricted_at: string | null
  is_active: boolean | null
}

export interface CompanyResponse {
  success: boolean
  company: Company
}

export interface CompanyContextType {
  company: Company | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}
