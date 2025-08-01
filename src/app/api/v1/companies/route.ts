import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    // Получаем сессию пользователя
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

    const userId = user.id

    // Запрос к таблице companies в схеме ai через SQL запрос
    const { data: companies, error } = await supabase.rpc('get_user_company', {
      p_user_id: userId
    })

    if (error) {
      console.error('Companies API: Database error:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        {
          error: 'Failed to fetch company',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json(
        { error: 'Company not found for this user' },
        { status: 404 }
      )
    }

    const company = companies[0]

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        is_active: company.is_active,
        user_ids: company.user_ids,
        restricted_at: company.restricted_at
      }
    })
  } catch (error) {
    console.error('Companies API: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Получаем сессию пользователя
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

    const userId = user.id
    const userEmail = user.email

    // Используем SQL функцию для создания компании
    const { data: company, error } = await supabase.rpc('create_user_company', {
      p_user_id: userId,
      p_user_email: userEmail
    })

    if (error) {
      console.error('Companies API POST: Database error:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        {
          error: 'Failed to create company',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    if (!company || company.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create or retrieve company' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      company: company[0],
      message: 'Company created successfully'
    })
  } catch (error) {
    console.error('Companies API POST: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
