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

    // Проксируем запрос к API мессенджера для получения ошибок
    const errors = await messengerAPI.getInstanceErrors(params.instanceId)

    return createCorsResponse(errors)
  } catch (error) {
    console.error('Instance errors proxy error:', error)
    return createCorsErrorResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get instance errors'
      },
      500
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ instanceId: string }> }
) {
  try {
    const params = await context.params

    // Проксируем запрос к API мессенджера для очистки ошибок
    await messengerAPI.clearInstanceErrors(params.instanceId)

    return createCorsResponse({
      success: true,
      message: 'Instance errors cleared'
    })
  } catch (error) {
    console.error('Instance clear errors proxy error:', error)
    return createCorsErrorResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to clear instance errors'
      },
      500
    )
  }
}
