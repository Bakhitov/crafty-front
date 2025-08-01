import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      port,
      instanceId,
      number,
      message,
      source,
      caption,
      mediaType,
      agent_id
    } = body

    console.log('WhatsApp API received:', {
      port,
      instanceId,
      number,
      message,
      source,
      caption,
      mediaType,
      agent_id
    })

    // Валидация входных данных
    if (!port || !instanceId || !number) {
      console.log('WhatsApp API validation failed:', {
        port: !!port,
        instanceId: !!instanceId,
        number: !!number
      })
      return NextResponse.json(
        { error: 'Missing required fields: port, instanceId, number' },
        { status: 400 }
      )
    }

    // Проверяем тип сообщения
    const isMediaMessage = !!source
    const isTextMessage = !!message && !source

    if (!isMediaMessage && !isTextMessage) {
      return NextResponse.json(
        {
          error: 'Either message (for text) or source (for media) is required'
        },
        { status: 400 }
      )
    }

    // Проксируем запрос к WhatsApp API
    const whatsappApiUrl = `http://13.61.141.6:${port}/api/v1/send`

    const requestPayload: {
      number: string
      message?: string
      source?: string
      caption?: string
      mediaType?: string
      agent_id?: string
      session_id?: string
    } = {
      number: number
    }

    if (isTextMessage) {
      // Текстовое сообщение
      requestPayload.message = message
      requestPayload.mediaType = 'text'
    } else if (isMediaMessage) {
      // Медиа сообщение
      requestPayload.source = source
      requestPayload.mediaType = mediaType || 'document' // По умолчанию документ
      if (caption) {
        requestPayload.caption = caption
      }
    }

    // Добавляем agent_id если передан (для сообщений с интерфейса)
    if (agent_id) {
      requestPayload.agent_id = agent_id
    }

    // Используем номер телефона как session_id для уникальных сессий в Agno
    requestPayload.session_id = `whatsapp_${number}`

    console.log('WhatsApp API sending to:', whatsappApiUrl)
    console.log('WhatsApp API payload:', requestPayload)

    let response = await fetch(whatsappApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${instanceId}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    })

    // Если первый endpoint не работает, пробуем альтернативный
    if (!response.ok && response.status === 404) {
      const alternativeUrl = `http://13.61.141.6:${port}/api/v1/whatsapp/send`
      console.log('Trying alternative WhatsApp API endpoint:', alternativeUrl)

      response = await fetch(alternativeUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${instanceId}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      })
    }

    // Для WhatsApp игнорируем все ошибки и всегда возвращаем успех
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log('WhatsApp API error response (ignored):', {
        status: response.status,
        errorData,
        url: whatsappApiUrl
      })

      // Возвращаем успешный ответ даже при ошибке
      return NextResponse.json({
        success: true,
        message: 'WhatsApp command sent (errors ignored)',
        ignored_error: {
          status: response.status,
          error: errorData.error || errorData.message || 'Unknown error'
        }
      })
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('WhatsApp API proxy error (ignored):', error)
    // Даже при исключениях возвращаем успех для WhatsApp
    return NextResponse.json({
      success: true,
      message: 'WhatsApp command sent (errors ignored)',
      ignored_error: {
        error: error instanceof Error ? error.message : 'Internal server error'
      }
    })
  }
}
