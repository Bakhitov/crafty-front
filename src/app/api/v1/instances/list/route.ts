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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Передаем все query параметры (status, provider, etc.)
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    // Проксируем запрос к API мессенджера
    const instances = await messengerAPI.getInstances(params)

    return createCorsResponse(instances)
  } catch (error) {
    console.error('Instances list proxy error:', error)
    return createCorsErrorResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get instances list'
      },
      500
    )
  }
}
