import { useState, useCallback } from 'react'
import { usePlaygroundStore } from '@/store'
import { useCompanyContext } from '@/components/CompanyProvider'
import { getAPIClient } from '@/lib/apiClient'

interface PermissionsResponse {
  canEdit: boolean
  canDelete: boolean
  reason?: string
}

export function usePermissions() {
  const [loading, setLoading] = useState(false)
  const { selectedEndpoint } = usePlaygroundStore()
  const { company } = useCompanyContext()

  const checkAgentPermissions = useCallback(
    async (agentId: string): Promise<PermissionsResponse> => {
      if (!selectedEndpoint) {
        console.warn('No endpoint selected for permissions check')
        return {
          canEdit: false,
          canDelete: false,
          reason: 'No endpoint selected'
        }
      }

      setLoading(true)
      try {
        console.log('Checking agent permissions:', {
          agentId,
          endpoint: selectedEndpoint,
          companyId: company?.id
        })

        const apiClient = getAPIClient(selectedEndpoint)
        const agent = await apiClient.getAgent(agentId)

        console.log('Agent data for permissions:', agent)

        // Проверяем разрешения на основе данных агента
        const canEdit =
          agent.company_id === company?.id || agent.is_public === true
        const canDelete = agent.company_id === company?.id

        const result = {
          canEdit,
          canDelete,
          reason: !canEdit ? 'Agent belongs to different company' : undefined
        }

        console.log('Permissions result:', result)
        return result
      } catch (error) {
        console.error('Error checking agent permissions:', {
          error: error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          type: typeof error,
          agentId,
          endpoint: selectedEndpoint,
          companyId: company?.id
        })
        // Возвращаем безопасные значения по умолчанию
        return {
          canEdit: false,
          canDelete: false,
          reason:
            error instanceof Error
              ? error.message
              : 'Error checking permissions'
        }
      } finally {
        setLoading(false)
      }
    },
    [selectedEndpoint, company?.id]
  )

  const checkToolPermissions = useCallback(
    async (
      toolId: string,
      toolType: 'dynamic' | 'custom' | 'mcp' = 'dynamic'
    ): Promise<PermissionsResponse> => {
      if (!selectedEndpoint) {
        console.warn('No endpoint selected for tool permissions check')
        return {
          canEdit: false,
          canDelete: false,
          reason: 'No endpoint selected'
        }
      }

      setLoading(true)
      try {
        console.log('Checking tool permissions:', {
          toolId,
          toolType,
          endpoint: selectedEndpoint
        })

        // Для инструментов пока возвращаем базовые разрешения
        // TODO: Реализовать проверку разрешений для инструментов через API
        const result = {
          canEdit: true, // Предполагаем, что пользователь может редактировать инструменты
          canDelete: true,
          reason: undefined
        }

        console.log('Tool permissions result (default):', result)
        return result
      } catch (error) {
        console.error('Error checking tool permissions:', error)
        return {
          canEdit: false,
          canDelete: false,
          reason:
            error instanceof Error
              ? error.message
              : 'Error checking permissions'
        }
      } finally {
        setLoading(false)
      }
    },
    [selectedEndpoint]
  )

  return {
    loading,
    checkAgentPermissions,
    checkToolPermissions
  }
}
