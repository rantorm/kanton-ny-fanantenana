import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { membersService, type MemberFilters } from '../services/members.service'
import type { Member, MemberStatus, Pupitre } from '../types/database.types'
import { useAuth } from '../hooks/useAuth'

export default function MembersPage() {
  const { isAdmin } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<MemberFilters>({
    search: '',
    status: 'ACTIVE',
    pupitre: 'ALL',
  })

  const loadMembers = async () => {
    setLoading(true)
    try {
      const data = await membersService.getAll(filters)
      setMembers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [filters])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Choristes</h1>
          <p className="text-slate-500 text-sm mt-1">
            {members.length} membre{members.length > 1 ? 's' : ''}
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <Link
              to="/members/import"
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition"
            >
              Import CSV
            </Link>
            <Link
              to="/members/new"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
            >
              + Ajouter
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <input
          type="search"
          placeholder="Rechercher (nom, prénom, code...)"
          value={filters.search || ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <div className="flex gap-3 flex-wrap">
          <select
            value={filters.status || 'ALL'}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value as MemberStatus | 'ALL' })
            }
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actifs</option>
            <option value="INACTIVE">Inactifs</option>
            <option value="SUSPENDED">Suspendus</option>
          </select>

          <select
            value={filters.pupitre || 'ALL'}
            onChange={(e) =>
              setFilters({ ...filters, pupitre: e.target.value as Pupitre | 'ALL' })
            }
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          >
            <option value="ALL">Tous les pupitres</option>
            <option value="Soprano">Soprano</option>
            <option value="Alto">Alto</option>
            <option value="Ténor">Ténor</option>
            <option value="Basse">Basse</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Chargement...</div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Aucun membre trouvé</div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <Link
              key={member.id}
              to={`/members/${member.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-300 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">
                    {member.first_name} {member.last_name}
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    {member.member_code}
                    {member.pupitre && ` · ${member.pupitre}`}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      member.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : member.status === 'INACTIVE'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {member.status === 'ACTIVE'
                      ? 'Actif'
                      : member.status === 'INACTIVE'
                      ? 'Inactif'
                      : 'Suspendu'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}