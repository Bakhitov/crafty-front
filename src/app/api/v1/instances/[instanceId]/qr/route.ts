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
    const qrData = await messengerAPI.getInstanceQR(params.instanceId)

    return createCorsResponse({
      success: true,
      ...qrData
    })
  } catch (error) {
    console.error('Instance QR proxy error:', error)
    return createCorsErrorResponse(
      {
        error:
          error instanceof Error ? error.message : 'Failed to get instance QR'
      },
      500
    )
  }
}
