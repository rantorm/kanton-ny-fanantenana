import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { sessionsService } from '../services/sessions.service'
import type { Session } from '../types/database.types'
import { useAuth } from '../hooks/useAuth'

export default function SessionsPage() {
  const { isResponsable } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const loadSessions = async () => {
    setLoading(true)
    try {
      const data = await sessionsService.getAll()
      setSessions(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-slate-100 text-slate-600',
      OPEN: 'bg-emerald-50 text-emerald-700',
      CLOSED: 'bg-blue-50 text-blue-700',
      CANCELLED: 'bg-red-50 text-red-600',
    }
    const labels: Record<string, string> = {
      DRAFT: 'Brouillon',
      OPEN: 'Ouverte',
      CLOSED: 'Fermée',
      CANCELLED: 'Annulée',
    }
    return (
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    )
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Répétitions</h1>
          <p className="text-slate-500 text-sm mt-1">{sessions.length} séance(s)</p>
        </div>

        {isResponsable && (
          <Link
            to="/sessions/new"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
          >
            + Nouvelle séance
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Chargement...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Aucune séance pour le moment</div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Link
              key={session.id}
              to={`/sessions/${session.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-300 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-slate-900">{session.title}</div>
                  <div className="text-sm text-slate-500 mt-1 capitalize">
                    {formatDate(session.session_date)}
                  </div>
                  {(session.start_time || session.end_time) && (
                    <div className="text-sm text-slate-400 mt-0.5">
                      {session.start_time?.slice(0, 5)}
                      {session.end_time && ` — ${session.end_time.slice(0, 5)}`}
                    </div>
                  )}
                </div>
                <div>{statusBadge(session.status)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}