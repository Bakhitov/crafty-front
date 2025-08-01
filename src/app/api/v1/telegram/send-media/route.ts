import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { port, instanceId, chatId, source, caption, agent_id } = body

    console.log('Telegram Media API received:', {
      port,
      instanceId,
      chatId,
      source,
      caption,
      agent_id
    })

    // Валидация входных данных
    if (!port || !instanceId || !chatId || !source) {
      console.log('Telegram Media API validation failed:', {
        port: !!port,
        instanceId: !!instanceId,
        chatId: !!chatId,
        source: !!source
      })
      return NextResponse.json(
        { error: 'Missing required fields: port, instanceId, chatId, source' },
        { status: 400 }
      )
    }

    // Проксируем запрос к Telegram API
    const telegramApiUrl = `http://13.61.141.6:${port}/api/v1/telegram/send-media`

    const requestPayload: {
      chatId: string
      source: string
      caption?: string
      agent_id?: string
      session_id?: string
    } = {
      chatId: chatId,
      source: source
    }

    if (caption) {
      requestPayload.caption = caption
    }

    // Добавляем agent_id если передан (для сообщений с интерфейса)
    if (agent_id) {
      requestPayload.agent_id = agent_id
    }

    // Используем chatId как session_id для уникальных сессий в Agno
    requestPayload.session_id = `telegram_${chatId}`

    console.log('Telegram Media API sending to:', telegramApiUrl)
    console.log('Telegram Media API payload:', requestPayload)

    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${instanceId}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log('Telegram Media API error response:', {
        status: response.status,
        errorData
      })
      return NextResponse.json(
        {
          error:
            errorData.message ||
            `HTTP ${response.status}: Failed to send media`,
          status: response.status
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Telegram Media API proxy error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
