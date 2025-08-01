import { supabase } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'

// Типы для агентов
export interface SupabaseAgent {
  id?: string
  agent_id: string
  name: string
  description?: string
  model_config: {
    id: string
    provider: string
    [key: string]: unknown
  }
  system_instructions?: string[]
  tool_ids?: string[] // UUID массив в базе, но работаем как со строками
  user_id?: string // varchar(255) в базе
  company_id?: string
  agent_config: Record<string, unknown>
  is_public: boolean
  is_active: boolean
  photo?: string
  category?: string
  created_at?: string
  updated_at?: string

  // New fields added to match updated schema
  goal?: string
  expected_output?: string
  role?: string
}

// Типы для инструментов (соответствует новой схеме)
export interface SupabaseTool {
  id?: string // uuid primary key
  name: string // varchar(255) not null unique
  type: string // varchar(50) not null
  description: string // text not null
  configuration: Record<string, unknown> // jsonb not null default '{}'
  user_id?: string // uuid nullable
  company_id?: string // uuid nullable
  is_public: boolean // not null default false
  is_active: boolean // not null default true
  display_name?: string // text nullable
  category?: string // text nullable
  created_at?: string // timestamp not null default now()
  updated_at?: string // timestamp not null default now()
}

// Фильтры для запросов
export interface CrudFilters {
  company_id?: string
  user_id?: string
  is_public?: boolean
  is_active?: boolean
  category?: string
  search?: string
}

// Пагинация
export interface CrudPagination {
  limit?: number
  offset?: number
}

// Результат с пагинацией
export interface CrudListResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

/**
 * Универсальный клиент для CRUD операций через Supabase
 * Обрабатывает агентов и инструменты
 */
export class SupabaseCrudClient {
  private supabaseClient: typeof supabase

  constructor(
    serverMode = false,
    cookies?: {
      get: (name: string) => string | undefined
      set: (name: string, value: string) => void
      remove: (name: string) => void
    }
  ) {
    if (serverMode && cookies) {
      // Для серверных компонентов
      this.supabaseClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies }
      )
    } else {
      // Для клиентских компонентов
      this.supabaseClient = supabase
    }
  }

  /**
   * Получить текущего пользователя
   */
  async getCurrentUser() {
    const {
      data: { user },
      error
    } = await this.supabaseClient.auth.getUser()
    if (error) throw new Error(`Auth error: ${error.message}`)
    return user
  }

  /**
   * Получить company_id пользователя
   */
  async getUserCompanyId(userId: string): Promise<string | null> {
    const { data, error } = await this.supabaseClient.rpc('get_user_company', {
      p_user_id: userId
    })

    if (error) {
      console.warn('Failed to get user company:', error.message)
      return null
    }

    return data?.[0]?.id || null
  }

  // ==================== АГЕНТЫ ====================

  /**
   * Получить список агентов
   */
  async getAgents(
    filters?: CrudFilters,
    pagination?: CrudPagination
  ): Promise<CrudListResponse<SupabaseAgent>> {
    let query = this.supabaseClient
      .from('agents')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Применяем фильтры
    if (filters?.company_id) {
      // Агенты компании + публичные
      query = query.or(`company_id.eq.${filters.company_id},is_public.eq.true`)
    } else if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public)
    } else if (filters?.user_id) {
      // Агенты пользователя + публичные
      query = query.or(`user_id.eq.${filters.user_id},is_public.eq.true`)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      )
    }

    // Пагинация
    if (pagination?.limit) {
      query = query.limit(pagination.limit)
    }
    if (pagination?.offset) {
      query = query.range(
        pagination.offset,
        pagination.offset + (pagination.limit || 10) - 1
      )
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch agents: ${error.message}`)
    }

    return {
      data: data || [],
      total: count || 0,
      limit: pagination?.limit || 10,
      offset: pagination?.offset || 0
    }
  }

  /**
   * Получить агента по ID
   */
  async getAgent(agentId: string): Promise<SupabaseAgent | null> {
    const { data, error } = await this.supabaseClient
      .from('agents')
      .select('*')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch agent: ${error.message}`)
    }

    return data
  }

  /**
   * Создать агента
   */
  async createAgent(
    agentData: Omit<SupabaseAgent, 'id' | 'created_at' | 'updated_at'>
  ): Promise<SupabaseAgent> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Получаем company_id если не передан
    const companyId =
      agentData.company_id || (await this.getUserCompanyId(user.id))

    const insertData = {
      ...agentData,
      user_id: user.id,
      company_id: companyId,
      is_active: true
    }

    const { data, error } = await this.supabaseClient
      .from('agents')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505' && error.message.includes('agent_id')) {
        throw new Error('Agent with this ID already exists')
      }
      throw new Error(`Failed to create agent: ${error.message}`)
    }

    return data
  }

  /**
   * Обновить агента
   */
  async updateAgent(
    agentId: string,
    updates: Partial<
      Omit<SupabaseAgent, 'id' | 'agent_id' | 'user_id' | 'created_at'>
    >
  ): Promise<SupabaseAgent> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Проверяем права доступа
    const existingAgent = await this.getAgent(agentId)
    if (!existingAgent) {
      throw new Error('Agent not found')
    }

    if (existingAgent.user_id !== user.id && !existingAgent.is_public) {
      throw new Error('Access denied')
    }

    const { data, error } = await this.supabaseClient
      .from('agents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update agent: ${error.message}`)
    }

    return data
  }

  /**
   * Удалить агента (мягкое удаление)
   */
  async deleteAgent(agentId: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Проверяем права доступа
    const existingAgent = await this.getAgent(agentId)
    if (!existingAgent) {
      throw new Error('Agent not found')
    }

    if (existingAgent.user_id !== user.id) {
      throw new Error('Access denied')
    }

    const { error } = await this.supabaseClient
      .from('agents')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('agent_id', agentId)

    if (error) {
      throw new Error(`Failed to delete agent: ${error.message}`)
    }
  }

  // ==================== ИНСТРУМЕНТЫ ====================

  /**
   * Получить список инструментов
   */
  async getTools(
    filters?: CrudFilters,
    pagination?: CrudPagination
  ): Promise<CrudListResponse<SupabaseTool>> {
    let query = this.supabaseClient
      .from('tools')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Применяем фильтры
    if (filters?.company_id) {
      // Инструменты компании + публичные
      query = query.or(`company_id.eq.${filters.company_id},is_public.eq.true`)
    } else if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public)
    } else if (filters?.user_id) {
      // Инструменты пользователя + публичные
      query = query.or(`user_id.eq.${filters.user_id},is_public.eq.true`)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      )
    }

    // Пагинация
    if (pagination?.limit) {
      query = query.limit(pagination.limit)
    }
    if (pagination?.offset) {
      query = query.range(
        pagination.offset,
        pagination.offset + (pagination.limit || 10) - 1
      )
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch tools: ${error.message}`)
    }

    return {
      data: data || [],
      total: count || 0,
      limit: pagination?.limit || 10,
      offset: pagination?.offset || 0
    }
  }

  /**
   * Получить инструмент по ID или name
   */
  async getTool(toolIdOrName: string): Promise<SupabaseTool | null> {
    // Пробуем найти по ID (UUID), если не получается - по name
    let query = this.supabaseClient
      .from('tools')
      .select('*')
      .eq('is_active', true)

    // Проверяем, является ли строка UUID
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        toolIdOrName
      )

    if (isUUID) {
      query = query.eq('id', toolIdOrName)
    } else {
      query = query.eq('name', toolIdOrName)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch tool: ${error.message}`)
    }

    return data
  }

  /**
   * Создать инструмент
   */
  async createTool(
    toolData: Omit<SupabaseTool, 'id' | 'created_at' | 'updated_at'>
  ): Promise<SupabaseTool> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Получаем company_id если не передан
    const companyId =
      toolData.company_id || (await this.getUserCompanyId(user.id))

    const insertData = {
      ...toolData,
      user_id: user.id,
      company_id: companyId,
      is_active: true
    }

    const { data, error } = await this.supabaseClient
      .from('tools')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505' && error.message.includes('name')) {
        throw new Error('Tool with this name already exists')
      }
      throw new Error(`Failed to create tool: ${error.message}`)
    }

    return data
  }

  /**
   * Обновить инструмент
   */
  async updateTool(
    toolIdOrName: string,
    updates: Partial<Omit<SupabaseTool, 'id' | 'user_id' | 'created_at'>>
  ): Promise<SupabaseTool> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Проверяем права доступа
    const existingTool = await this.getTool(toolIdOrName)
    if (!existingTool) {
      throw new Error('Tool not found')
    }

    if (existingTool.user_id !== user.id && !existingTool.is_public) {
      throw new Error('Access denied')
    }

    // Используем ID для обновления (более надежно)
    const { data, error } = await this.supabaseClient
      .from('tools')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingTool.id)
      .eq('is_active', true)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update tool: ${error.message}`)
    }

    return data
  }

  /**
   * Удалить инструмент (мягкое удаление)
   */
  async deleteTool(toolIdOrName: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Проверяем права доступа
    const existingTool = await this.getTool(toolIdOrName)
    if (!existingTool) {
      throw new Error('Tool not found')
    }

    if (existingTool.user_id !== user.id) {
      throw new Error('Access denied')
    }

    // Используем ID для удаления (более надежно)
    const { error } = await this.supabaseClient
      .from('tools')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingTool.id)

    if (error) {
      throw new Error(`Failed to delete tool: ${error.message}`)
    }
  }

  // ==================== ПОИСК ====================

  /**
   * Поиск агентов
   */
  async searchAgents(
    searchQuery: string,
    filters?: CrudFilters,
    pagination?: CrudPagination
  ): Promise<CrudListResponse<SupabaseAgent>> {
    return this.getAgents({ ...filters, search: searchQuery }, pagination)
  }

  /**
   * Поиск инструментов
   */
  async searchTools(
    searchQuery: string,
    filters?: CrudFilters,
    pagination?: CrudPagination
  ): Promise<CrudListResponse<SupabaseTool>> {
    return this.getTools({ ...filters, search: searchQuery }, pagination)
  }
}

// Экспортируем singleton instances
export const supabaseCrud = new SupabaseCrudClient()

// Для серверных компонентов
export function createServerCrudClient(cookies: {
  get: (name: string) => string | undefined
  set: (name: string, value: string) => void
  remove: (name: string) => void
}) {
  return new SupabaseCrudClient(true, cookies)
}

// Хуки для использования в компонентах
export function useSupabaseCrud() {
  return supabaseCrud
}
