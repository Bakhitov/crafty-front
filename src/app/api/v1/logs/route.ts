import { NextRequest, NextResponse } from 'next/server'

// Тип для уровня логов
type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug'

// Интерфейс для ответа с логами
interface LogsResponse {
  success: boolean
  logs: string[]
  total: number
  filtered: number
  params: {
    tail: number
    level?: LogLevel
  }
}

// Функция для получения логов (заглушка, в реальности будет читать из файлов логов)
async function getInstanceManagerLogs(
  tail: number,
  level?: LogLevel
): Promise<string[]> {
  // Здесь будет реальная логика чтения логов из файлов или базы данных
  // Пока возвращаем заглушку с примерами логов
  const mockLogs = [
    `[${new Date().toISOString()}] [ERROR] Failed to connect to instance abc123`,
    `[${new Date().toISOString()}] [WARN] Instance def456 high memory usage detected`,
    `[${new Date().toISOString()}] [INFO] Instance ghi789 started successfully`,
    `[${new Date().toISOString()}] [HTTP] GET /api/v1/instances - 200`,
    `[${new Date().toISOString()}] [DEBUG] Processing instance health check`,
    `[${new Date().toISOString()}] [INFO] System resources updated`,
    `[${new Date().toISOString()}] [ERROR] Database connection timeout`,
    `[${new Date().toISOString()}] [WARN] Port 3001 already in use`,
    `[${new Date().toISOString()}] [HTTP] POST /api/v1/instances - 201`,
    `[${new Date().toISOString()}] [DEBUG] Instance manager heartbeat`
  ]

  let filteredLogs = mockLogs

  // Фильтрация по уровню
  if (level) {
    filteredLogs = mockLogs.filter((log) =>
      log.toLowerCase().includes(`[${level.toLowerCase()}]`)
    )
  }

  // Ограничение количества записей
  return filteredLogs.slice(-tail)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Получение параметров
    const tailParam = searchParams.get('tail')
    const levelParam = searchParams.get('level') as LogLevel | null

    // Валидация параметров
    const tail = tailParam
      ? Math.max(1, Math.min(10000, parseInt(tailParam)))
      : 100
    const level =
      levelParam &&
      ['error', 'warn', 'info', 'http', 'debug'].includes(levelParam)
        ? levelParam
        : undefined

    if (tailParam && isNaN(parseInt(tailParam))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid tail parameter. Must be a number between 1 and 10000.'
        },
        { status: 400 }
      )
    }

    if (
      levelParam &&
      !['error', 'warn', 'info', 'http', 'debug'].includes(levelParam)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid level parameter. Must be one of: error, warn, info, http, debug.'
        },
        { status: 400 }
      )
    }

    // Получение логов
    const logs = await getInstanceManagerLogs(tail, level)

    const response: LogsResponse = {
      success: true,
      logs,
      total: logs.length,
      filtered: logs.length,
      params: {
        tail,
        ...(level && { level })
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching logs'
      },
      { status: 500 }
    )
  }
}
