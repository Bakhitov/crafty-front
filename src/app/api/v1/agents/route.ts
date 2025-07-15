import { NextRequest, NextResponse } from 'next/server'
import { APIRoutes } from '@/api/routes'

// NOTE: All user-specific filtering and database look-ups have been removed.
// We now proxy the request directly to the Playground endpoint and
// return the full agents list from `${endpoint}/v1/agents/detailed`.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')

    if (!endpoint) {
      return NextResponse.json(
        { error: 'endpoint is required' },
        { status: 400 }
      )
    }
    // 1. Получаем всех агентов напрямую из `${endpoint}/v1/agents/detailed`
    const agnoResponse = await fetch(APIRoutes.GetPlaygroundAgents(endpoint), {
      method: 'GET'
    })

    if (!agnoResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch agents from Agno' },
        { status: 500 }
      )
    }

    const allAgents = await agnoResponse.json()
    // 2. Возвращаем полный список агентов без дополнительной фильтрации или обращения к БД
    return NextResponse.json(allAgents)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
