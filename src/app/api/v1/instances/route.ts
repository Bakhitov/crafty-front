import { NextRequest, NextResponse } from 'next/server'
import { messengerAPI } from '@/lib/messengerApi'
import {
  ProviderType,
  InstanceListResponse,
  RealInstanceResponse
} from '@/types/messenger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const status = searchParams.get('status')
    const companyId = searchParams.get('company_id')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Получаем все инстансы без фильтрации по company_id
    const response: InstanceListResponse = await messengerAPI.getInstances({
      provider: provider as ProviderType,
      status: status || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
      // Убираем company_id из этого запроса, будем фильтровать сами
    })

    // Применяем фильтрацию на уровне нашего API
    if (companyId && Array.isArray(response.instances)) {
      response.instances = response.instances.filter(
        (
          instance: RealInstanceResponse & {
            is_public?: boolean
            company_id?: string
          }
        ) => {
          // Если инстанс публичный (is_public: true), показываем всем
          if (instance.is_public === true) {
            return true
          }
          // Иначе показываем только инстансы той же компании
          return instance.company_id === companyId
        }
      )

      // Обновляем total после фильтрации
      response.total = response.instances.length
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
