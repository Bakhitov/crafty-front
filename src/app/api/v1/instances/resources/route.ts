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
    const resources = await messengerAPI.getSystemResources()

    return createCorsResponse({
      success: true,
      resources
    })
  } catch (error) {
    console.error('System resources proxy error:', error)
    return createCorsErrorResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get system resources'
      },
      500
    )
  }
}
