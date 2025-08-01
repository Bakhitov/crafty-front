import { NextRequest, NextResponse } from 'next/server'

// Импортируем кэш из middleware (нужно будет экспортировать его)
// Поскольку middleware кэш находится в другом модуле, используем глобальную переменную
declare global {
  var middlewareCompanyCache:
    | Map<string, { data: unknown; timestamp: number }>
    | undefined
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Инвалидируем кэш компании в middleware
    if (type === 'company') {
      const cacheKey = `company-${userId}`
      let invalidated = false

      // Если глобальный кэш существует, очищаем его
      if (global.middlewareCompanyCache) {
        const deleted = global.middlewareCompanyCache.delete(cacheKey)
        if (deleted) {
          invalidated = true
        }

        // Дополнительно: очищаем весь кэш если нужно полное обновление
        if (body.clearAll) {
          global.middlewareCompanyCache.clear()
          invalidated = true
        }

        if (process.env.NODE_ENV === 'development') {
          console.log(
            `Invalidated middleware cache for key: ${cacheKey}, success: ${invalidated}`
          )
        }
      }

      return NextResponse.json({
        success: true,
        invalidated,
        message: `Cache invalidated for ${type}:${userId}`
      })
    }

    return NextResponse.json({
      success: true,
      message: `Cache invalidated for ${type}:${userId}`
    })
  } catch (error) {
    console.error('Cache invalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    )
  }
}
