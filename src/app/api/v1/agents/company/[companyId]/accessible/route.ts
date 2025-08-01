import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// GET /api/v1/agents/company/[companyId]/accessible - получить доступных агентов для компании
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
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

    const { companyId } = await params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Проверяем доступ к компании
    const { data: companies, error: companiesError } = await supabase.rpc(
      'get_user_company',
      {
        p_user_id: user.id
      }
    )

    if (companiesError) {
      console.error('Error getting user companies:', companiesError)
      return NextResponse.json(
        {
          error: 'Failed to get user companies',
          details: companiesError.message
        },
        { status: 500 }
      )
    }

    const hasAccess = companies?.some(
      (company: { id: string }) => company.id === companyId
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this company' },
        { status: 403 }
      )
    }

    // Получаем агентов компании + публичные агенты
    let query = supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .or(`company_id.eq.${companyId},is_public.eq.true`)
      .order('created_at', { ascending: false })

    // Фильтрация по категории
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
      console.error('Accessible Agents API error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch accessible agents', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      agents: agents || [],
      total: agents?.length || 0
    })
  } catch (error) {
    console.error('Accessible Agents API unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
