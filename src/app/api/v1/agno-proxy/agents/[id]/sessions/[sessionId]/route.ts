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
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: agentId, sessionId } = await params
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

    if (!agentId || !sessionId) {
      return createCorsErrorResponse(
        {
          error: 'Missing required parameters',
          details: 'Agent ID and session ID are required in the URL path'
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

    // Формируем URL для получения конкретной сессии
    const sessionUrl = new URL(
      `/v1/agents/${agentId}/sessions/${sessionId}`,
      endpoint
    )

    // Добавляем user_id как query параметр если передан
    if (userId) {
      sessionUrl.searchParams.append('user_id', userId)
    }

    console.log(`Agno session proxy: Fetching session from ${sessionUrl}`)

    try {
      // Создаем AbortController для таймаута
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 секунд

      const response = await fetch(sessionUrl.toString(), {
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
          responseData = null
        }
      } catch (parseError) {
        console.warn('Failed to parse session response body:', parseError)
        responseData = null
      }

      if (!response.ok) {
        console.warn(`Session proxy failed for ${sessionUrl}:`, {
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
      console.warn(`Session proxy failed for ${sessionUrl}:`, fetchError)

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
    console.error('Session proxy error:', error)
    return createCorsErrorResponse(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: agentId, sessionId } = await params
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

    if (!agentId || !sessionId) {
      return createCorsErrorResponse(
        {
          error: 'Missing required parameters',
          details: 'Agent ID and session ID are required in the URL path'
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

    // Формируем URL для удаления сессии
    const deleteUrl = new URL(
      `/v1/agents/${agentId}/sessions/${sessionId}`,
      endpoint
    )

    // Добавляем user_id как query параметр если передан
    if (userId) {
      deleteUrl.searchParams.append('user_id', userId)
    }

    console.log(`Agno session proxy: Deleting session at ${deleteUrl}`)

    try {
      // Создаем AbortController для таймаута
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 секунд

      const response = await fetch(deleteUrl.toString(), {
        method: 'DELETE',
        headers: {
          'User-Agent': 'Crafty-Agno-Proxy/1.0',
          Accept: 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Для DELETE запросов может не быть тела ответа
      let responseData = null
      try {
        const body = await response.text()
        if (body) {
          responseData = JSON.parse(body)
        }
      } catch {
        // Игнорируем ошибки парсинга для DELETE запросов
        console.log('No response body for DELETE request (expected)')
      }

      if (!response.ok) {
        console.warn(`Session delete proxy failed for ${deleteUrl}:`, {
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
              'Failed to delete session'
          },
          response.status
        )
      }

      return createCorsResponse({
        success: true,
        message: 'Session deleted successfully',
        sessionId,
        agentId
      })
    } catch (fetchError) {
      console.warn(`Session delete proxy failed for ${deleteUrl}:`, fetchError)

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
    console.error('Session delete proxy error:', error)
    return createCorsErrorResponse(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    )
  }
}
