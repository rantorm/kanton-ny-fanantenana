import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { membersService } from '../services/members.service'
import type { Member, Pupitre, MemberStatus } from '../types/database.types'
import { useAuth } from '../hooks/useAuth'

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [member, setMember] = useState<Member | null>(null)
  const [stats, setStats] = useState<{ present: number; total: number; rate: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    member_code: '',
    pupitre: '' as Pupitre | '',
    phone: '',
    status: 'ACTIVE' as MemberStatus,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    loadMember()
  }, [id])

  const loadMember = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await membersService.getById(id)
      setMember(data)
      setForm({
        first_name: data.first_name,
        last_name: data.last_name,
        member_code: data.member_code,
        pupitre: data.pupitre || '',
        phone: data.phone || '',
        status: data.status,
      })
      const s = await membersService.getAttendanceStats(id)
      setStats(s)
    } catch (err) {
      console.error(err)
      setError('Impossible de charger le membre')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!id || !member) return
    setSaving(true)
    setError(null)
    try {
      const updated = await membersService.update(id, {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        member_code: form.member_code.trim(),
        pupitre: form.pupitre || null,
        phone: form.phone.trim() || null,
        status: form.status,
      })
      setMember(updated)
      setEditing(false)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!id || !member) return
    try {
      if (member.status === 'ACTIVE') {
        await membersService.deactivate(id)
      } else {
        await membersService.reactivate(id)
      }
      await loadMember()
    } catch (err) {
      console.error(err)
    }
  }

  const handleRegenerateQr = async () => {
    if (!id || !confirm('Régénérer le QR code ? L\'ancien badge ne fonctionnera plus.')) return
    try {
      const updated = await membersService.regenerateQrToken(id)
      setMember(updated)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Chargement...</div>
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Membre introuvable</p>
        <Link to="/members" className="text-emerald-600 hover:underline">Retour à la liste</Link>
      </div>
    )
  }

  const rateColor =
    !stats ? 'text-slate-500' :
    stats.rate >= 90 ? 'text-emerald-600' :
    stats.rate >= 75 ? 'text-lime-600' :
    stats.rate >= 60 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/members')} className="text-slate-500 hover:text-slate-800">
          ← Retour
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {member.first_name} {member.last_name}
            </h1>
            <p className="text-slate-500 mt-1">{member.member_code}</p>
          </div>
          {isAdmin && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Modifier
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                <input
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                <input
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code membre</label>
                <input
                  value={form.member_code}
                  onChange={(e) => setForm({ ...form, member_code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pupitre</label>
                <select
                  value={form.pupitre}
                  onChange={(e) => setForm({ ...form, pupitre: e.target.value as Pupitre | '' })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">—</option>
                  <option value="Soprano">Soprano</option>
                  <option value="Alto">Alto</option>
                  <option value="Ténor">Ténor</option>
                  <option value="Basse">Basse</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as MemberStatus })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="INACTIVE">Inactif</option>
                  <option value="SUSPENDED">Suspendu</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Pupitre</span>
                <p className="font-medium text-slate-900">{member.pupitre || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500">Téléphone</span>
                <p className="font-medium text-slate-900">{member.phone || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500">Statut</span>
                <p className="font-medium text-slate-900">{member.status}</p>
              </div>
              <div>
                <span className="text-slate-500">QR Token</span>
                <p className="font-mono text-xs text-slate-600 break-all">{member.qr_token}</p>
              </div>
            </div>

            {stats && (
              <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Assiduité</h3>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-semibold ${rateColor}`}>{stats.rate}%</span>
                  <span className="text-slate-500 text-sm">
                    ({stats.present} / {stats.total} séances)
                  </span>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleToggleStatus}
                  className="text-sm px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
                >
                  {member.status === 'ACTIVE' ? 'Désactiver' : 'Réactiver'}
                </button>
                <button
                  onClick={handleRegenerateQr}
                  className="text-sm px-4 py-2 rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Régénérer QR
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}