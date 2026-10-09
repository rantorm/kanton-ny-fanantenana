import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { membersService } from '../services/members.service'
import type { Pupitre, MemberStatus } from '../types/database.types'

export default function MemberCreatePage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    member_code: '',
    first_name: '',
    last_name: '',
    pupitre: '' as Pupitre | '',
    phone: '',
    status: 'ACTIVE' as MemberStatus,
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const member = await membersService.create({
        member_code: form.member_code.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        pupitre: form.pupitre || null,
        phone: form.phone.trim() || null,
        status: form.status,
      })
      navigate(`/members/${member.id}`)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/members')} className="text-slate-500 hover:text-slate-800">
          ← Retour
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-6">Nouveau choriste</h1>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code membre *</label>
              <input
                required
                value={form.member_code}
                onChange={(e) => setForm({ ...form, member_code: e.target.value })}
                placeholder="KF-0021"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pupitre</label>
              <select
                value={form.pupitre}
                onChange={(e) => setForm({ ...form, pupitre: e.target.value as Pupitre | '' })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">—</option>
                <option value="Soprano">Soprano</option>
                <option value="Alto">Alto</option>
                <option value="Ténor">Ténor</option>
                <option value="Basse">Basse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prénom *</label>
              <input
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
              <input
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="034 xx xxx xx"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as MemberStatus })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="ACTIVE">Actif</option>
                <option value="INACTIVE">Inactif</option>
                <option value="SUSPENDED">Suspendu</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Création...' : 'Créer le membre'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/members')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}