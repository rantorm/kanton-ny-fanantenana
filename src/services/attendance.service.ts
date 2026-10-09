import { supabase } from '../lib/supabaseClient'

export interface RecordAttendanceResult {
  success: boolean
  code: 'CREATED' | 'ALREADY_PRESENT' | 'SESSION_CLOSED' | 'SESSION_NOT_FOUND' | 'MEMBER_NOT_FOUND' | 'ERROR'
  message: string
  attendance_id?: string
  scanned_at?: string
  scanned_by?: string
  scanned_by_name?: string
  member?: {
    id: string
    first_name: string
    last_name: string
    member_code: string
    pupitre: string | null
  }
}

export const attendanceService = {
  /**
   * Enregistre une présence de façon sécurisée via la fonction PostgreSQL
   * Gère l'anti-doublon atomiquement
   */
  async record(sessionId: string, memberId: string, deviceId?: string): Promise<RecordAttendanceResult> {
    const { data, error } = await supabase.rpc('record_attendance', {
      p_session_id: sessionId,
      p_member_id: memberId,
      p_device_id: deviceId || null,
    })

    if (error) {
      console.error('record_attendance error:', error)
      return {
        success: false,
        code: 'ERROR',
        message: error.message || 'Erreur lors de l\'enregistrement',
      }
    }

    return data as RecordAttendanceResult
  },

  async getBySession(sessionId: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        member:members(id, first_name, last_name, member_code, pupitre),
        scanned_by_profile:profiles(full_name)
      `)
      .eq('session_id', sessionId)
      .order('scanned_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getByMember(memberId: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        session:sessions(id, title, session_date)
      `)
      .eq('member_id', memberId)
      .order('scanned_at', { ascending: false })

    if (error) throw error
    return data
  },
}