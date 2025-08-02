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

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // Проксируем запрос к API мессенджера для создания инстанса
    let response

    // Route to appropriate creation method based on provider
    switch (payload.provider) {
      case 'whatsappweb':
        response = await messengerAPI.createWhatsAppWebInstance(payload)
        break
      case 'telegram':
        response = await messengerAPI.createTelegramInstance(payload)
        break
      case 'whatsapp-official':
        response = await messengerAPI.createWhatsAppOfficialInstance(payload)
        break
      case 'discord':
        response = await messengerAPI.createDiscordInstance(payload)
        break
      case 'slack':
        response = await messengerAPI.createSlackInstance(payload)
        break
      case 'messenger':
        response = await messengerAPI.createMessengerInstance(payload)
        break
      default:
        throw new Error(`Unsupported provider: ${payload.provider}`)
    }

    return createCorsResponse({
      success: true,
      instance: response
    })
  } catch (error) {
    console.error('Instance creation proxy error:', error)
    return createCorsErrorResponse(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create instance'
      },
      500
    )
  }
}
