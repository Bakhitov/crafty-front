import { supabase } from './supabase'
import { APIAgent } from '@/types/playground'

// Интерфейс для создания агента
export interface CreateAgentData {
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

// Тип для обновления агента
export type UpdateAgentData = Partial<CreateAgentData>

// Интерфейс для фильтров агентов
export interface AgentFilters {
  company_id?: string
  is_public?: boolean
  category?: string
  limit?: number
  offset?: number
}

// Интерфейс для поиска агентов
export interface SearchAgentParams {
  query: string
  category?: string
  company_id?: string
  limit?: number
  offset?: number
}

// Утилиты для работы с агентами в Supabase
export class SupabaseAgentsAPI {
  // Получить всех агентов с фильтрацией
  static async getAgents(filters?: AgentFilters): Promise<APIAgent[]> {
    let query = supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Применяем фильтры
    if (filters?.company_id) {
      // Агенты компании + публичные
      query = query.or(`company_id.eq.${filters.company_id},is_public.eq.true`)
    } else if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    // Пагинация
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1
      )
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch agents: ${error.message}`)
    }

    return data || []
  }

  // Получить конкретного агента
  static async getAgent(agentId: string): Promise<APIAgent | null> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Агент не найден
      }
      throw new Error(`Failed to fetch agent: ${error.message}`)
    }

    return data
  }

  // Получить публичных агентов
  static async getPublicAgents(
    filters?: Omit<AgentFilters, 'company_id' | 'is_public'>
  ): Promise<APIAgent[]> {
    return this.getAgents({ ...filters, is_public: true })
  }

  // Получить агентов компании
  static async getCompanyAgents(
    companyId: string,
    filters?: Omit<AgentFilters, 'company_id'>
  ): Promise<APIAgent[]> {
    let query = supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1
      )
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch company agents: ${error.message}`)
    }

    return data || []
  }

  // Получить доступных агентов для компании (агенты компании + публичные)
  static async getAccessibleAgents(
    companyId: string,
    filters?: Omit<AgentFilters, 'company_id'>
  ): Promise<APIAgent[]> {
    return this.getAgents({ ...filters, company_id: companyId })
  }

  // Поиск агентов
  static async searchAgents(params: SearchAgentParams): Promise<APIAgent[]> {
    let query = supabase.from('agents').select('*').eq('is_active', true)

    // Поиск по названию и описанию
    query = query.or(
      `name.ilike.%${params.query}%,description.ilike.%${params.query}%`
    )

    // Фильтрация по доступности
    if (params.company_id) {
      query = query.or(`company_id.eq.${params.company_id},is_public.eq.true`)
    }

    if (params.category) {
      query = query.eq('category', params.category)
    }

    // Сортировка по релевантности
    query = query.order('name', { ascending: true })

    // Пагинация
    if (params.limit) {
      query = query.limit(params.limit)
    }
    if (params.offset) {
      query = query.range(
        params.offset,
        params.offset + (params.limit || 10) - 1
      )
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to search agents: ${error.message}`)
    }

    return data || []
  }

  // Создать нового агента
  static async createAgent(agentData: CreateAgentData): Promise<APIAgent> {
    // Получаем текущего пользователя
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Получаем company_id пользователя
    const { data: companies } = await supabase.rpc('get_user_company', {
      p_user_id: user.id
    })

    const companyId = companies?.[0]?.id

    const insertData = {
      ...agentData,
      user_id: user.id,
      company_id: companyId || null,
      model_config: agentData.model_config || {
        id: 'gpt-4o',
        provider: 'openai'
      },
      system_instructions: agentData.system_instructions || [],
      tool_ids: agentData.tool_ids || [],
      agent_config: agentData.agent_config || {},
      is_public: agentData.is_public || false
    }

    const { data, error } = await supabase
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

  // Обновить агента
  static async updateAgent(
    agentId: string,
    updates: UpdateAgentData
  ): Promise<APIAgent> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('agent_id', agentId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Agent not found')
      }
      throw new Error(`Failed to update agent: ${error.message}`)
    }

    return data
  }

  // Удалить агента (мягкое удаление)
  static async deleteAgent(agentId: string): Promise<void> {
    const { error } = await supabase
      .from('agents')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('agent_id', agentId)

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Agent not found')
      }
      throw new Error(`Failed to delete agent: ${error.message}`)
    }
  }

  // Проверить доступ к агенту
  static async checkAgentAccess(agentId: string): Promise<boolean> {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    const agent = await this.getAgent(agentId)

    if (!agent) {
      return false
    }

    // Публичные агенты доступны всем
    if (agent.is_public) {
      return true
    }

    // Владелец имеет доступ
    if (agent.user_id === user.id) {
      return true
    }

    // Проверяем доступ через компанию
    if (agent.company_id) {
      const { data: companies } = await supabase.rpc('get_user_company', {
        p_user_id: user.id
      })

      return (
        companies?.some(
          (company: { id: string }) => company.id === agent.company_id
        ) || false
      )
    }

    return false
  }

  // Получить категории агентов
  static async getAgentCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('category')
      .eq('is_active', true)
      .not('category', 'is', null)

    if (error) {
      throw new Error(`Failed to fetch agent categories: ${error.message}`)
    }

    // Извлекаем уникальные категории
    const categories = [
      ...new Set(
        data
          ?.map((item: { category?: string }) => item.category)
          .filter(Boolean) as string[]
      )
    ]
    return categories.sort()
  }
}

// Экспортируем для удобства
export const supabaseAgents = SupabaseAgentsAPI
