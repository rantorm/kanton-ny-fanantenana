import { supabase } from '../lib/supabaseClient'
import type { Session, SessionStatus } from '../types/database.types'

export const sessionsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('session_date', { ascending: false })

    if (error) throw error
    return data as Session[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Session
  },

  async getOpen() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('status', 'OPEN')
      .order('session_date', { ascending: false })

    if (error) throw error
    return data as Session[]
  },

  async create(session: {
    title: string
    session_date: string
    start_time?: string | null
    end_time?: string | null
    notes?: string | null
    created_by?: string | null
  }) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ ...session, status: 'DRAFT' })
      .select()
      .single()

    if (error) throw error
    return data as Session
  },

  async update(id: string, updates: Partial<Session>) {
    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Session
  },

  async open(id: string) {
    return this.update(id, { status: 'OPEN' })
  },

  async close(id: string) {
    return this.update(id, { status: 'CLOSED' })
  },

  async cancel(id: string) {
    return this.update(id, { status: 'CANCELLED' })
  },

  async getAttendanceCount(sessionId: string) {
    const { count, error } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)

    if (error) throw error
    return count || 0
  },
}