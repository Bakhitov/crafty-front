import { NextRequest, NextResponse } from 'next/server'

// Интерфейс для ответа с последними логами
interface LatestLogsResponse {
  success: boolean
  logs: string[]
  count: number
  timestamp: string
  params: {
    lines: number
  }
}

// Функция для получения последних логов
async function getLatestInstanceManagerLogs(lines: number): Promise<string[]> {
  // В реальной реализации здесь будет чтение последних записей из файлов логов
  // или из базы данных с сортировкой по времени
  const currentTime = new Date()
  const mockLatestLogs = []

  for (let i = lines; i > 0; i--) {
    const logTime = new Date(currentTime.getTime() - i * 30000) // каждые 30 секунд
    const logTypes = ['INFO', 'WARN', 'ERROR', 'HTTP', 'DEBUG']
    const logType = logTypes[Math.floor(Math.random() * logTypes.length)]

    const messages = [
      'Instance health check completed',
      'Processing new message request',
      'Database connection established',
      'Memory usage within normal range',
      'API request processed successfully',
      'Background task completed',
      'System metrics updated',
      'Cache refreshed',
      'Webhook received',
      'Instance status synchronized'
    ]

    const message = messages[Math.floor(Math.random() * messages.length)]
    mockLatestLogs.push(`[${logTime.toISOString()}] [${logType}] ${message}`)
  }

  return mockLatestLogs.reverse() // Возвращаем в хронологическом порядке
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Получение параметров
    const linesParam = searchParams.get('lines')
    const lines = linesParam
      ? Math.max(1, Math.min(1000, parseInt(linesParam)))
      : 50

    // Валидация параметров
    if (linesParam && isNaN(parseInt(linesParam))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid lines parameter. Must be a number between 1 and 1000.'
        },
        { status: 400 }
      )
    }

    // Получение последних логов
    const logs = await getLatestInstanceManagerLogs(lines)

    const response: LatestLogsResponse = {
      success: true,
      logs,
      count: logs.length,
      timestamp: new Date().toISOString(),
      params: {
        lines
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching latest logs:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching latest logs'
      },
      { status: 500 }
    )
  }
}
