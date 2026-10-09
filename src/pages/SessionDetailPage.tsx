import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { sessionsService } from '../services/sessions.service'
import type { Session } from '../types/database.types'
import { useAuth } from '../hooks/useAuth'

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isResponsable, isAdmin } = useAuth()

  const [session, setSession] = useState<Session | null>(null)
  const [presentCount, setPresentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    loadSession()
  }, [id])

  const loadSession = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await sessionsService.getById(id)
      setSession(data)
      const count = await sessionsService.getAttendanceCount(id)
      setPresentCount(count)
    } catch (err) {
      console.error(err)
      setError('Impossible de charger la séance')
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = async () => {
    if (!id || !confirm('Ouvrir le pointage pour cette séance ?')) return
    setActionLoading(true)
    try {
      const updated = await sessionsService.open(id)
      setSession(updated)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleClose = async () => {
    if (!id || !confirm('Fermer le pointage ? Plus aucune présence ne pourra être enregistrée.')) return
    setActionLoading(true)
    try {
      const updated = await sessionsService.close(id)
      setSession(updated)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!id || !confirm('Annuler cette séance ?')) return
    setActionLoading(true)
    try {
      const updated = await sessionsService.cancel(id)
      setSession(updated)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Chargement...</div>
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Séance introuvable</p>
        <Link to="/sessions" className="text-emerald-600 hover:underline">Retour</Link>
      </div>
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

  const statusStyles: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600',
    OPEN: 'bg-emerald-50 text-emerald-700',
    CLOSED: 'bg-blue-50 text-blue-700',
    CANCELLED: 'bg-red-50 text-red-600',
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'Brouillon',
    OPEN: 'Ouverte',
    CLOSED: 'Fermée',
    CANCELLED: 'Annulée',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/sessions')} className="text-slate-500 hover:text-slate-800">
          ← Retour
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{session.title}</h1>
            <p className="text-slate-500 mt-1 capitalize">{formatDate(session.session_date)}</p>
            {(session.start_time || session.end_time) && (
              <p className="text-slate-400 text-sm mt-0.5">
                {session.start_time?.slice(0, 5)}
                {session.end_time && ` — ${session.end_time.slice(0, 5)}`}
              </p>
            )}
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[session.status]}`}>
            {statusLabels[session.status]}
          </span>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Compteur présents */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-slate-500">Présents enregistrés</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{presentCount}</p>
        </div>

        {session.notes && (
          <div className="mb-6">
            <p className="text-sm text-slate-500 mb-1">Notes</p>
            <p className="text-slate-700">{session.notes}</p>
          </div>
        )}

        {/* Actions */}
        {isResponsable && (
          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
            {session.status === 'DRAFT' && (
              <button
                onClick={handleOpen}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
              >
                Ouvrir le pointage
              </button>
            )}

            {session.status === 'OPEN' && (
              <>
                <Link
                  to={`/scanner?session=${session.id}`}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
                >
                  Scanner des badges
                </Link>
                <button
                  onClick={handleClose}
                  disabled={actionLoading}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  Fermer le pointage
                </button>
              </>
            )}

            {(session.status === 'DRAFT' || (session.status === 'OPEN' && isAdmin)) && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-xl text-sm font-medium border border-red-200 disabled:opacity-50"
              >
                Annuler la séance
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}