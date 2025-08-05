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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: agentId, sessionId } = await params
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')

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

    // Получаем body запроса
    let requestBody
    try {
      requestBody = await request.json()
    } catch {
      return createCorsErrorResponse(
        {
          error: 'Invalid JSON body',
          details: 'Request body must be valid JSON'
        },
        400
      )
    }

    // Формируем URL для переименования сессии
    const renameUrl = new URL(
      `/v1/agents/${agentId}/sessions/${sessionId}/rename`,
      endpoint
    )

    try {
      // Создаем AbortController для таймаута
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 секунд

      const response = await fetch(renameUrl.toString(), {
        method: 'POST',
        headers: {
          'User-Agent': 'Crafty-Agno-Proxy/1.0',
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(requestBody),
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
          responseData = {
            success: true,
            message: 'Session renamed successfully'
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse rename response body:', parseError)
        responseData = {
          success: response.ok,
          message: 'Session rename response'
        }
      }

      if (!response.ok) {
        console.warn(`Session rename proxy failed for ${renameUrl}:`, {
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
              'Failed to rename session'
          },
          response.status
        )
      }

      return createCorsResponse(responseData)
    } catch (fetchError) {
      console.warn(`Session rename proxy failed for ${renameUrl}:`, fetchError)

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
    console.error('Session rename proxy error:', error)
    return createCorsErrorResponse(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    )
  }
}
