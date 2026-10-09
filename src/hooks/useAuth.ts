import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Profile, UserRole } from '../types/database.types'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  role: UserRole | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    role: null,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({ ...prev, session, user: session?.user ?? null }))
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setState(prev => ({ ...prev, loading: false }))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }))

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setState(prev => ({
            ...prev,
            profile: null,
            role: null,
            loading: false,
          }))
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erreur chargement profil:', error)
      setState(prev => ({ ...prev, loading: false }))
      return
    }

    setState(prev => ({
      ...prev,
      profile: data,
      role: data?.role ?? null,
      loading: false,
    }))
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    ...state,
    signIn,
    signOut,
    isAdmin: state.role === 'ADMIN',
    isResponsable: state.role === 'RESPONSABLE' || state.role === 'ADMIN',
    isLecteur: state.role === 'LECTEUR',
  }
}