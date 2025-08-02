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

export async function GET() {
  try {
    // Проксируем запрос к API мессенджера
    const performance = await messengerAPI.getSystemPerformance()

    return createCorsResponse({
      success: true,
      performance
    })
  } catch (error) {
    console.error('System performance proxy error:', error)
    return createCorsErrorResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get system performance'
      },
      500
    )
  }
}
