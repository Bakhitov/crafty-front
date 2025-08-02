import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { handleOptionsRequest, createCorsResponse } from '@/lib/cors'

// OPTIONS handler for preflight requests
export async function OPTIONS() {
  return handleOptionsRequest()
}

// Интерфейс для создания агента
interface CreateAgentRequest {
  agent_id: string
  name: string
  description?: string
  model_config?: {
    id: string
    provider: string
    temperature?: number
    max_tokens?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
    stop?: string[]
    seed?: number
    timeout?: number
    max_retries?: number
  }
  system_instructions?: string[]
  tool_ids?: string[]
  agent_config?: Record<string, unknown>
  is_public?: boolean
  photo?: string
  category?: string

  // New fields added to match updated schema
  goal?: string
  expected_output?: string
  role?: string
}

// Интерфейс для обновления агента (используется в других файлах)
// interface UpdateAgentRequest extends Partial<CreateAgentRequest> {}

// GET /api/v1/agents - получить всех агентов
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {},
          remove() {}
        }
      }
    )

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const isPublic = searchParams.get('is_public')
    const category = searchParams.get('category')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    let query = supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Фильтрация по доступности
    if (companyId) {
      // Получаем агентов компании + публичные агенты
      query = query.or(`company_id.eq.${companyId},is_public.eq.true`)
    } else if (isPublic === 'true') {
      // Только публичные агенты
      query = query.eq('is_public', true)
    } else {
      // Агенты пользователя + публичные (когда нет company_id)
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`)
    }

    // Дополнительные фильтры
    if (category) {
      query = query.eq('category', category)
    }

    // Пагинация
    if (limit) {
      query = query.limit(parseInt(limit))
    }
    if (offset) {
      query = query.range(
        parseInt(offset),
        parseInt(offset) + parseInt(limit || '10') - 1
      )
    }

    const { data: agents, error } = await query

    if (error) {
      console.error('Agents API GET error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch agents', details: error.message },
        { status: 500 }
      )
    }

    return createCorsResponse({
      success: true,
      agents: agents || [],
      total: agents?.length || 0
    })
  } catch (error) {
    console.error('Agents API GET unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/agents - создать нового агента
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {},
          remove() {}
        }
      }
    )

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateAgentRequest = await request.json()

    // Валидация обязательных полей
    if (!body.agent_id || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields: agent_id, name' },
        { status: 400 }
      )
    }

    // Получаем company_id пользователя
    const { data: companies } = await supabase.rpc('get_user_company', {
      p_user_id: user.id
    })

    const companyId = companies?.[0]?.id

    // Подготавливаем данные для вставки
    const agentData = {
      agent_id: body.agent_id,
      name: body.name,
      description: body.description || null,
      model_config: body.model_config || { id: 'gpt-4o', provider: 'openai' },
      system_instructions: body.system_instructions || [],
      tool_ids: body.tool_ids || [],
      user_id: user.id,
      company_id: companyId || null,
      agent_config: body.agent_config || {},
      is_public: body.is_public || false,
      photo: body.photo || null,
      category: body.category || null,
      goal: body.goal || null,
      expected_output: body.expected_output || null,
      role: body.role || null
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .insert(agentData)
      .select()
      .single()

    if (error) {
      console.error('Agents API POST error:', error)

      // Проверяем на дублирование agent_id
      if (error.code === '23505' && error.message.includes('agent_id')) {
        return NextResponse.json(
          { error: 'Agent with this ID already exists' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create agent', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      agent,
      message: 'Agent created successfully'
    })
  } catch (error) {
    console.error('Agents API POST unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
