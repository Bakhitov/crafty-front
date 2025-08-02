// Removed unused imports
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
    const stats = await messengerAPI.getInstanceStats()

    return createCorsResponse({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Instance stats proxy error:', error)
    return createCorsErrorResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get instance stats'
      },
      500
    )
  }
}
