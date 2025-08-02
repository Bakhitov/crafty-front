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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ instanceId: string }> }
) {
  try {
    const params = await context.params
    const { searchParams } = new URL(request.url)

    // Передаем все query параметры (lines, level, etc.)
    const logParams: Record<string, string | number | boolean> = {}
    if (searchParams.get('lines')) {
      logParams.lines = parseInt(searchParams.get('lines')!)
    }
    if (searchParams.get('tail')) {
      logParams.tail = searchParams.get('tail') === 'true'
    }
    if (searchParams.get('level')) {
      logParams.level = searchParams.get('level')!
    }

    // Проксируем запрос к API мессенджера
    const logs = await messengerAPI.getInstanceLogs(
      params.instanceId,
      logParams
    )

    return createCorsResponse(logs)
  } catch (error) {
    console.error('Instance logs proxy error:', error)
    return createCorsErrorResponse(
      {
        error:
          error instanceof Error ? error.message : 'Failed to get instance logs'
      },
      500
    )
  }
}
