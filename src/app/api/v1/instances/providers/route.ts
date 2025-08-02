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
    const providers = await messengerAPI.getActiveProviders()

    return createCorsResponse({
      success: true,
      providers: providers.providers
    })
  } catch (error) {
    console.error('Active providers proxy error:', error)
    return createCorsErrorResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get active providers'
      },
      500
    )
  }
}
