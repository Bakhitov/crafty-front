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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ instanceId: string }> }
) {
  try {
    const params = await context.params

    // Проксируем запрос к API мессенджера для остановки инстанса
    const result = await messengerAPI.stopInstance(params.instanceId)

    return createCorsResponse({
      success: true,
      result
    })
  } catch (error) {
    console.error('Instance stop proxy error:', error)
    return createCorsErrorResponse(
      {
        error:
          error instanceof Error ? error.message : 'Failed to stop instance'
      },
      500
    )
  }
}
