import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// GET /api/v1/agents/public - получить публичных агентов
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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    let query = supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true)
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
      console.error('Public Agents API error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch public agents', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      agents: agents || [],
      total: agents?.length || 0
    })
  } catch (error) {
    console.error('Public Agents API unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
