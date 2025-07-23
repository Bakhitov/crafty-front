import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { port, instanceId, chatId, message, agent_id } = body

    // Валидация входных данных
    if (!port || !instanceId || !chatId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: port, instanceId, chatId, message' },
        { status: 400 }
      )
    }

    // Проксируем запрос к Telegram API
    const telegramApiUrl = `http://13.61.141.6:${port}/api/v1/telegram/send`

    const requestPayload: {
      chatId: string
      message: string
      agent_id?: string
    } = {
      chatId: chatId,
      message: message
    }

    // Добавляем agent_id если передан (для сообщений с интерфейса)
    if (agent_id) {
      requestPayload.agent_id = agent_id
    }

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
      return NextResponse.json(
        {
          error:
            errorData.message ||
            `HTTP ${response.status}: Failed to send message`,
          status: response.status
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Telegram API proxy error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
