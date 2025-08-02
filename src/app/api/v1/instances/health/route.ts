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
    const health = await messengerAPI.checkHealth()

    return createCorsResponse({
      success: true,
      health
    })
  } catch (error) {
    console.error('Instance health proxy error:', error)
    return createCorsErrorResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check instance health'
      },
      500
    )
  }
}
