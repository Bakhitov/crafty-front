import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// GET /api/v1/agents/search - поиск агентов
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
    const query = searchParams.get('query')
    const category = searchParams.get('category')
    const companyId = searchParams.get('company_id')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    let dbQuery = supabase.from('agents').select('*').eq('is_active', true)

    // Поиск по названию и описанию
    dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)

    // Фильтрация по доступности
    if (companyId) {
      // Проверяем доступ к компании
      const { data: companies } = await supabase.rpc('get_user_company', {
        p_user_id: user.id
      })

      const hasAccess = companies?.some(
        (company: { id: string }) => company.id === companyId
      )

      if (hasAccess) {
        // Агенты компании + публичные
        dbQuery = dbQuery.or(`company_id.eq.${companyId},is_public.eq.true`)
      } else {
        // Только публичные агенты
        dbQuery = dbQuery.eq('is_public', true)
      }
    } else {
      // Агенты пользователя + публичные
      dbQuery = dbQuery.or(`user_id.eq.${user.id},is_public.eq.true`)
    }

    // Фильтрация по категории
    if (category) {
      dbQuery = dbQuery.eq('category', category)
    }

    // Сортировка по релевантности (сначала точные совпадения по названию)
    dbQuery = dbQuery.order('name', { ascending: true })

    // Пагинация
    if (limit) {
      dbQuery = dbQuery.limit(parseInt(limit))
    }
    if (offset) {
      dbQuery = dbQuery.range(
        parseInt(offset),
        parseInt(offset) + parseInt(limit || '10') - 1
      )
    }

    const { data: agents, error } = await dbQuery

    if (error) {
      console.error('Search Agents API error:', error)
      return NextResponse.json(
        { error: 'Failed to search agents', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      agents: agents || [],
      total: agents?.length || 0,
      query
    })
  } catch (error) {
    console.error('Search Agents API unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
