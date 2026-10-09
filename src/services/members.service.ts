import { supabase } from '../lib/supabaseClient'
import type { Member, MemberStatus, Pupitre } from '../types/database.types'

export interface MemberFilters {
  search?: string
  status?: MemberStatus | 'ALL'
  pupitre?: Pupitre | 'ALL'
}

export const membersService = {
  async getAll(filters: MemberFilters = {}) {
    let query = supabase
      .from('members')
      .select('*')
      .order('last_name', { ascending: true })

    if (filters.status && filters.status !== 'ALL') {
      query = query.eq('status', filters.status)
    }

    if (filters.pupitre && filters.pupitre !== 'ALL') {
      query = query.eq('pupitre', filters.pupitre)
    }

    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`
      query = query.or(
        `first_name.ilike.${term},last_name.ilike.${term},member_code.ilike.${term}`
      )
    }

    const { data, error } = await query
    if (error) throw error
    return data as Member[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Member
  },

  async getByQrToken(qrToken: string) {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('qr_token', qrToken)
      .eq('status', 'ACTIVE')
      .maybeSingle()

    if (error) throw error
    return data as Member | null
  },

  async create(member: {
    member_code: string
    first_name: string
    last_name: string
    pupitre?: Pupitre | null
    phone?: string | null
    status?: MemberStatus
  }) {
    const { data, error } = await supabase
      .from('members')
      .insert(member)
      .select()
      .single()

    if (error) throw error
    return data as Member
  },

  async update(id: string, updates: Partial<Member>) {
    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Member
  },

  async deactivate(id: string) {
    return this.update(id, { status: 'INACTIVE' })
  },

  async reactivate(id: string) {
    return this.update(id, { status: 'ACTIVE' })
  },

  async regenerateQrToken(id: string) {
    const newToken = crypto.randomUUID()
    return this.update(id, { qr_token: newToken })
  },

  async importCsv(rows: Array<{
    member_code: string
    first_name: string
    last_name: string
    pupitre?: string
    phone?: string
    status?: string
  }>) {
    const payload = rows.map((row) => ({
      member_code: row.member_code.trim(),
      first_name: row.first_name.trim(),
      last_name: row.last_name.trim(),
      pupitre: (row.pupitre?.trim() as Pupitre) || null,
      phone: row.phone?.trim() || null,
      status: (row.status?.trim().toUpperCase() as MemberStatus) || 'ACTIVE',
    }))

    const { data, error } = await supabase
      .from('members')
      .upsert(payload, { onConflict: 'member_code' })
      .select()

    if (error) throw error
    return data as Member[]
  },

  async getAttendanceStats(memberId: string) {
    const { count: presentCount } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)

    const { count: totalSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['OPEN', 'CLOSED'])

    const rate =
      totalSessions && totalSessions > 0
        ? Math.round(((presentCount || 0) / totalSessions) * 1000) / 10
        : 0

    return {
      present: presentCount || 0,
      total: totalSessions || 0,
      rate,
    }
  },
}