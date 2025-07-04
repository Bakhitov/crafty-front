import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Создаем Supabase клиент для работы с базой данных
async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: '', ...options })
        }
      }
    }
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const endpoint = searchParams.get('endpoint')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    if (!endpoint) {
      return NextResponse.json(
        { error: 'endpoint is required' },
        { status: 400 }
      )
    }

    // 1. Получаем всех агентов из Agno API
    const agnoResponse = await fetch(`${endpoint}/v1/playground/agents`, {
      method: 'GET'
    })

    if (!agnoResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch agents from Agno' },
        { status: 500 }
      )
    }

    const allAgents = await agnoResponse.json()

    // 2. Получаем список ID агентов пользователя из схемы ai напрямую через SQL
    const supabase = await createSupabaseServerClient()
    const { data: userAgents, error } = await supabase.rpc(
      'get_user_agent_ids',
      {
        p_user_id: userId
      }
    )

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user agents from database' },
        { status: 500 }
      )
    }

    // 3. Создаем Set для быстрого поиска
    const userAgentIds = new Set(
      userAgents?.map((agent: { id: string }) => agent.id) || []
    )

    // 4. Фильтруем агентов из Agno API только для тех, что есть у пользователя в БД
    // Исключение: demo_agent доступен всем пользователям без проверки принадлежности
    const filteredAgents = allAgents.filter(
      (agent: { agent_id: string }) =>
        userAgentIds.has(agent.agent_id) || agent.agent_id === 'demo_agent'
    )

    return NextResponse.json(filteredAgents)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
