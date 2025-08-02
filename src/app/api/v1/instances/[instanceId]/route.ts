import { NextRequest } from 'next/server'
import { messengerAPI } from '@/lib/messengerApi'
import {
  createCorsResponse,
  createCorsErrorResponse,
  handleOptionsRequest
} from '@/lib/cors'

// OPTIONS handler for preflight requests
export async function OPTIONS() {
  return handleOptionsRequest()
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ instanceId: string }> }
) {
  try {
    const params = await context.params

    // Проксируем запрос к API мессенджера
    const instance = await messengerAPI.getInstance(params.instanceId)

    return createCorsResponse(instance)
  } catch (error) {
    console.error('Instance get proxy error:', error)
    return createCorsErrorResponse(
      {
        error: error instanceof Error ? error.message : 'Failed to get instance'
      },
      500
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ instanceId: string }> }
) {
  try {
    const params = await context.params

    // Проксируем запрос к API мессенджера для удаления инстанса
    const result = await messengerAPI.deleteInstance(params.instanceId)

    return createCorsResponse({
      success: true,
      result
    })
  } catch (error) {
    console.error('Instance delete proxy error:', error)
    return createCorsErrorResponse(
      {
        error:
          error instanceof Error ? error.message : 'Failed to delete instance'
      },
      500
    )
  }
}
