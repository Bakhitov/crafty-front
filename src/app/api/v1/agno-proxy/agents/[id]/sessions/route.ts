import { NextRequest } from 'next/server'
import {
  handleOptionsRequest,
  createCorsResponse,
  createCorsErrorResponse
} from '@/lib/cors'

// OPTIONS handler for preflight requests
export async function OPTIONS() {
  return handleOptionsRequest()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')
    const userId = searchParams.get('user_id')

    if (!endpoint) {
      return createCorsErrorResponse(
        {
          error: 'Missing endpoint parameter',
          details: 'Please provide an endpoint parameter in the query string'
        },
        400
      )
    }

    if (!agentId) {
      return createCorsErrorResponse(
        {
          error: 'Missing agent ID',
          details: 'Agent ID is required in the URL path'
        },
        400
      )
    }

    // Валидация URL
    try {
      new URL(endpoint)
    } catch {
      return createCorsErrorResponse(
        {
          error: 'Invalid endpoint URL',
          details: 'The provided endpoint is not a valid URL'
        },
        400
      )
    }

    // Формируем URL для получения сессий агента
    const sessionsUrl = new URL(`/v1/agents/${agentId}/sessions`, endpoint)

    // Добавляем user_id как query параметр если передан
    if (userId) {
      sessionsUrl.searchParams.append('user_id', userId)
    }

    console.log(`Agno sessions proxy: Fetching sessions from ${sessionsUrl}`)

    try {
      // Создаем AbortController для таймаута
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 секунд

      const response = await fetch(sessionsUrl.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'Crafty-Agno-Proxy/1.0',
          Accept: 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Пытаемся получить тело ответа
      let responseData
      try {
        const body = await response.text()
        if (body) {
          responseData = JSON.parse(body)
        } else {
          responseData = []
        }
      } catch (parseError) {
        console.warn('Failed to parse sessions response body:', parseError)
        responseData = []
      }

      if (!response.ok) {
        console.warn(`Sessions proxy failed for ${sessionsUrl}:`, {
          status: response.status,
          statusText: response.statusText,
          body: responseData
        })

        return createCorsErrorResponse(
          {
            error: `Agno API Error: ${response.status} ${response.statusText}`,
            details:
              responseData?.error ||
              responseData?.message ||
              'Unknown error from Agno API'
          },
          response.status
        )
      }

      return createCorsResponse(responseData)
    } catch (fetchError) {
      console.warn(`Sessions proxy failed for ${sessionsUrl}:`, fetchError)

      let errorMessage = 'Unknown error'
      let errorCode = 'UNKNOWN_ERROR'

      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Request timeout'
          errorCode = 'TIMEOUT'
        } else if (fetchError.message.includes('fetch')) {
          errorMessage = 'Network error or connection failed'
          errorCode = 'NETWORK_ERROR'
        } else {
          errorMessage = fetchError.message
          errorCode = 'FETCH_ERROR'
        }
      }

      return createCorsErrorResponse(
        {
          error: errorMessage,
          code: errorCode,
          details: 'Failed to connect to Agno API server'
        },
        503
      )
    }
  } catch (error) {
    console.error('Sessions proxy error:', error)
    return createCorsErrorResponse(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    )
  }
}
