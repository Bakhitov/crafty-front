import { NextRequest } from 'next/server'
import {
  handleOptionsRequest,
  createHealthResponse,
  createCorsErrorResponse
} from '@/lib/cors'

// OPTIONS handler for preflight requests
export async function OPTIONS() {
  return handleOptionsRequest()
}

export async function GET(request: NextRequest) {
  try {
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

    // Делаем server-side запрос к health endpoint (без CORS ограничений)
    const healthUrl = `${endpoint}/v1/health`

    console.log(`Health proxy: Checking ${healthUrl}`)

    try {
      // Создаем AbortController для таймаута
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 секунд

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Crafty-Health-Proxy/1.0',
          Accept: 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const responseData: {
        status: number
        ok: boolean
        endpoint: string
        timestamp: string
        headers: Record<string, string>
        body?: unknown
      } = {
        status: response.status,
        ok: response.ok,
        endpoint: healthUrl,
        timestamp: new Date().toISOString(),
        headers: Object.fromEntries(response.headers.entries())
      }

      // Пытаемся получить тело ответа если это JSON
      try {
        if (
          response.headers.get('content-type')?.includes('application/json')
        ) {
          const body = await response.text()
          if (body) {
            responseData.body = JSON.parse(body)
          }
        }
      } catch (bodyError) {
        console.warn('Failed to parse response body:', bodyError)
        // Игнорируем ошибки парсинга тела ответа
      }

      return createHealthResponse(responseData)
    } catch (fetchError) {
      console.warn(`Health proxy failed for ${healthUrl}:`, fetchError)

      let errorMessage = 'Unknown error'
      let errorCode = 'UNKNOWN_ERROR'

      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Request timeout'
          errorCode = 'TIMEOUT'
        } else if (fetchError.message.includes('fetch')) {
          errorMessage = 'Network error or CORS issue'
          errorCode = 'NETWORK_ERROR'
        } else {
          errorMessage = fetchError.message
          errorCode = 'FETCH_ERROR'
        }
      }

      return createHealthResponse({
        status: 503,
        ok: false,
        endpoint: healthUrl,
        error: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Health proxy error:', error)
    return createCorsErrorResponse(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    )
  }
}
