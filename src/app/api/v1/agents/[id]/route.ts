import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

interface UpdateAgentRequest {
  name?: string
  description?: string
  model_config?: {
    id?: string
    provider?: string
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
  is_active?: boolean
  photo?: string
  category?: string

  // New fields added to match updated schema
  goal?: string
  expected_output?: string
  role?: string
}

// GET /api/v1/agents/[id] - получить конкретного агента
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const agentId = id

    // Получаем агента
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
      }

      console.error('Agent API GET error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch agent', details: error.message },
        { status: 500 }
      )
    }

    // Проверяем доступ к агенту
    const hasAccess =
      agent.is_public ||
      agent.user_id === user.id ||
      (agent.company_id &&
        (await checkCompanyAccess(supabase, user.id, agent.company_id)))

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      agent
    })
  } catch (error) {
    console.error('Agent API GET unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/agents/[id] - обновить агента
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const agentId = id
    const body: UpdateAgentRequest = await request.json()

    // Сначала проверяем существование и права доступа
    const { data: existingAgent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
      }

      console.error('Agent API PUT fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch agent', details: fetchError.message },
        { status: 500 }
      )
    }

    // Проверяем права на редактирование (только владелец или админ компании)
    const canEdit =
      existingAgent.user_id === user.id ||
      (existingAgent.company_id &&
        (await checkCompanyAccess(supabase, user.id, existingAgent.company_id)))

    if (!canEdit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Подготавливаем данные для обновления
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    // Добавляем только переданные поля
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined)
      updateData.description = body.description
    if (body.model_config !== undefined) {
      // Мержим с существующей конфигурацией
      updateData.model_config = {
        ...existingAgent.model_config,
        ...body.model_config
      }
    }
    if (body.system_instructions !== undefined)
      updateData.system_instructions = body.system_instructions
    if (body.tool_ids !== undefined) updateData.tool_ids = body.tool_ids
    if (body.agent_config !== undefined) {
      // Мержим с существующей конфигурацией
      updateData.agent_config = {
        ...existingAgent.agent_config,
        ...body.agent_config
      }
    }
    if (body.is_public !== undefined) updateData.is_public = body.is_public
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.photo !== undefined) updateData.photo = body.photo
    if (body.category !== undefined) updateData.category = body.category
    if (body.goal !== undefined) updateData.goal = body.goal
    if (body.expected_output !== undefined)
      updateData.expected_output = body.expected_output
    if (body.role !== undefined) updateData.role = body.role

    // Обновляем агента
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update(updateData)
      .eq('agent_id', agentId)
      .select()
      .single()

    if (updateError) {
      console.error('Agent API PUT update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update agent', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      agent: updatedAgent,
      message: 'Agent updated successfully'
    })
  } catch (error) {
    console.error('Agent API PUT unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/agents/[id] - удалить агента (мягкое удаление)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const agentId = id

    // Сначала проверяем существование и права доступа
    const { data: existingAgent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
      }

      console.error('Agent API DELETE fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch agent', details: fetchError.message },
        { status: 500 }
      )
    }

    // Проверяем права на удаление (только владелец)
    if (existingAgent.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Мягкое удаление - устанавливаем is_active = false
    const { error: deleteError } = await supabase
      .from('agents')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('agent_id', agentId)
      .select()
      .single()

    if (deleteError) {
      console.error('Agent API DELETE update error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete agent', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Agent deleted successfully'
    })
  } catch (error) {
    console.error('Agent API DELETE unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Вспомогательная функция для проверки доступа к компании
async function checkCompanyAccess(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  companyId: string
): Promise<boolean> {
  try {
    const { data: companies } = await supabase.rpc('get_user_company', {
      p_user_id: userId
    })

    return (
      companies?.some((company: { id: string }) => company.id === companyId) ||
      false
    )
  } catch (error) {
    console.error('Error checking company access:', error)
    return false
  }
}
