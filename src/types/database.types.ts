export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'ADMIN' | 'RESPONSABLE' | 'LECTEUR'
export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type SessionStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED'
export type Pupitre = 'Soprano' | 'Alto' | 'Ténor' | 'Basse'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: UserRole
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: UserRole
          active?: boolean
        }
        Update: Partial<{
          full_name: string
          role: UserRole
          active: boolean
        }>
      }
      members: {
        Row: {
          id: string
          member_code: string
          first_name: string
          last_name: string
          pupitre: Pupitre | null
          phone: string | null
          status: MemberStatus
          qr_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          member_code: string
          first_name: string
          last_name: string
          pupitre?: Pupitre | null
          phone?: string | null
          status?: MemberStatus
          qr_token?: string
        }
        Update: Partial<{
          member_code: string
          first_name: string
          last_name: string
          pupitre: Pupitre | null
          phone: string | null
          status: MemberStatus
          qr_token: string
        }>
      }
      sessions: {
        Row: {
          id: string
          title: string
          session_date: string
          start_time: string | null
          end_time: string | null
          status: SessionStatus
          created_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          session_date: string
          start_time?: string | null
          end_time?: string | null
          status?: SessionStatus
          created_by?: string | null
          notes?: string | null
        }
        Update: Partial<{
          title: string
          session_date: string
          start_time: string | null
          end_time: string | null
          status: SessionStatus
          notes: string | null
        }>
      }
      attendance: {
        Row: {
          id: string
          session_id: string
          member_id: string
          scanned_at: string
          scanned_by: string | null
          device_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          session_id: string
          member_id: string
          scanned_by?: string | null
          device_id?: string | null
          status?: string
        }
        Update: Partial<{
          status: string
        }>
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Member = Database['public']['Tables']['members']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type Attendance = Database['public']['Tables']['attendance']['Row']