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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params
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

    // Формируем URL для запуска агента
    const runsUrl = new URL(`/v1/agents/${agentId}/runs`, endpoint)

    console.log(`Agno runs proxy: Forwarding request to ${runsUrl}`)

    try {
      // Получаем тело запроса
      let requestBody
      const contentType = request.headers.get('content-type')

      if (contentType?.includes('multipart/form-data')) {
        // Для FormData передаем как есть
        requestBody = await request.formData()
      } else if (contentType?.includes('application/json')) {
        // Для JSON парсим и передаем как string
        const json = await request.json()
        requestBody = JSON.stringify(json)
      } else {
        // Fallback - пытаемся получить как текст
        requestBody = await request.text()
      }

      // Создаем AbortController для таймаута
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 минут для долгих запросов

      // Подготавливаем заголовки для проксирования
      const proxyHeaders: Record<string, string> = {
        'User-Agent': 'Crafty-Agno-Proxy/1.0'
      }

      // Копируем важные заголовки из оригинального запроса
      if (contentType) {
        proxyHeaders['Content-Type'] = contentType
      }

      // Копируем заголовки авторизации если есть
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        proxyHeaders['Authorization'] = authHeader
      }

      const response = await fetch(runsUrl.toString(), {
        method: 'POST',
        headers: proxyHeaders,
        body: requestBody,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Проверяем, является ли ответ streaming
      const isStreaming =
        response.headers.get('content-type')?.includes('text/plain') ||
        response.headers.get('content-type')?.includes('text/event-stream') ||
        response.headers.get('transfer-encoding') === 'chunked'

      if (isStreaming) {
        // Для streaming ответов передаем поток напрямую с CORS заголовками
        console.log(
          'Agno runs proxy: Streaming response detected, forwarding stream'
        )

        const headers = new Headers()

        // Добавляем CORS заголовки
        headers.set('Access-Control-Allow-Origin', '*')
        headers.set(
          'Access-Control-Allow-Methods',
          'GET, POST, PUT, DELETE, OPTIONS, HEAD'
        )
        headers.set(
          'Access-Control-Allow-Headers',
          'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-Forwarded-For'
        )
        headers.set('Access-Control-Expose-Headers', 'Content-Length, X-JSON')
        headers.set('Access-Control-Max-Age', '86400')
        headers.set('Access-Control-Allow-Credentials', 'true')

        // Копируем важные заголовки из оригинального ответа
        const originalContentType = response.headers.get('content-type')
        if (originalContentType) {
          headers.set('Content-Type', originalContentType)
        }

        const transferEncoding = response.headers.get('transfer-encoding')
        if (transferEncoding) {
          headers.set('Transfer-Encoding', transferEncoding)
        }

        // Возвращаем streaming response
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        })
      } else {
        // Для обычных ответов парсим JSON и добавляем CORS заголовки
        console.log('Agno runs proxy: Regular response detected, parsing JSON')

        let responseData
        try {
          const body = await response.text()
          if (body) {
            responseData = JSON.parse(body)
          } else {
            responseData = null
          }
        } catch (parseError) {
          console.warn('Failed to parse runs response body:', parseError)
          responseData = { error: 'Failed to parse response from Agno API' }
        }

        if (!response.ok) {
          console.warn(`Runs proxy failed for ${runsUrl}:`, {
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
      }
    } catch (fetchError) {
      console.warn(`Runs proxy failed for ${runsUrl}:`, fetchError)

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
    console.error('Runs proxy error:', error)
    return createCorsErrorResponse(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    )
  }
}
