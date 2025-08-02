import { NextRequest } from 'next/server'
import { handleOptionsRequest, createCorsResponse } from '@/lib/cors'

// OPTIONS handler for preflight requests
export async function OPTIONS() {
  return handleOptionsRequest()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')

    if (!endpoint) {
      return createCorsResponse(
        { error: 'Missing endpoint parameter' },
        { status: 400 }
      )
    }

    // Делаем server-side запрос к health endpoint (без CORS ограничений)
    const healthUrl = `${endpoint}/v1/health`

    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Crafty-Health-Proxy/1.0'
        },
        // Увеличиваем timeout для медленных серверов
        signal: AbortSignal.timeout(10000) // 10 секунд
      })

      return createCorsResponse({
        status: response.status,
        ok: response.ok,
        endpoint: healthUrl,
        timestamp: new Date().toISOString()
      })
    } catch (fetchError) {
      console.warn(`Health proxy failed for ${healthUrl}:`, fetchError)

      return createCorsResponse({
        status: 503,
        ok: false,
        endpoint: healthUrl,
        error:
          fetchError instanceof Error ? fetchError.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Health proxy error:', error)
    return createCorsResponse(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
