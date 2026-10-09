import { useEffect, useState, useRef } from 'react'
import { membersService } from '../services/members.service'
import {
  prepareBadges,
  downloadMemberQr,
  type BadgeData,
} from '../services/qr.service'
import type { Member } from '../types/database.types'
import { useAuth } from '../hooks/useAuth'

export default function BadgesPage() {
  const { isAdmin } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [badges, setBadges] = useState<BadgeData[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const data = await membersService.getAll({ status: 'ACTIVE' })
      setMembers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(members.map((m) => m.id)))
    }
  }

  const handleGenerate = async () => {
    if (selectedIds.size === 0) return
    setGenerating(true)
    try {
      const selected = members.filter((m) => selectedIds.has(m.id))
      const data = await prepareBadges(selected)
      setBadges(data)
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const handlePrint = () => {
    if (!printRef.current) return
    const printContents = printRef.current.innerHTML
    const win = window.open('', '_blank')
    if (!win) return

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Badges QR - Kanton’ny Fanantenana</title>
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: system-ui, -apple-system, sans-serif; }
          .sheet {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8mm;
          }
          .badge {
            border: 1.5px solid #0f172a;
            border-radius: 6px;
            padding: 8mm 6mm;
            text-align: center;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 70mm;
          }
          .badge-header {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.04em;
            color: #059669;
            text-transform: uppercase;
            margin-bottom: 3mm;
          }
          .badge-qr {
            width: 38mm;
            height: 38mm;
            margin: 2mm 0;
          }
          .badge-qr img {
            width: 100%;
            height: 100%;
          }
          .badge-code {
            font-size: 13px;
            font-weight: 700;
            margin-top: 2mm;
            color: #0f172a;
          }
          .badge-name {
            font-size: 12px;
            color: #334155;
            margin-top: 1mm;
          }
          .badge-pupitre {
            font-size: 10px;
            color: #64748b;
            margin-top: 1mm;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          ${printContents}
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `)
    win.document.close()
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12 text-slate-500">
        Accès réservé aux administrateurs
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Badges QR</h1>
        <p className="text-slate-500 text-sm mt-1">
          Générer et imprimer les badges des choristes
        </p>
      </div>

      {/* Sélection des membres */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={selectAll}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {selectedIds.size === members.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
          <span className="text-sm text-slate-500">
            {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <p className="text-center text-slate-500 py-6">Chargement...</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1">
            {members.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(m.id)}
                  onChange={() => toggleSelect(m.id)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-900">
                  {m.first_name} {m.last_name}
                </span>
                <span className="text-xs text-slate-400 ml-auto">{m.member_code}</span>
              </label>
            ))}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={selectedIds.size === 0 || generating}
          className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white py-2.5 rounded-xl text-sm font-medium transition"
        >
          {generating ? 'Génération en cours...' : `Générer ${selectedIds.size} badge(s)`}
        </button>
      </div>

      {/* Aperçu + actions */}
      {badges.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-900">
              Aperçu ({badges.length} badge{badges.length > 1 ? 's' : ''})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium"
              >
                Imprimer la planche
              </button>
            </div>
          </div>

          {/* Grille d'aperçu à l'écran */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {badges.map(({ member, qrDataUrl }) => (
              <div
                key={member.id}
                className="bg-white border border-slate-200 rounded-xl p-4 text-center"
              >
                <p className="text-xs font-bold text-emerald-600 tracking-wide uppercase mb-2">
                  Kanton’ny Fanantenana
                </p>
                <img
                  src={qrDataUrl}
                  alt={`QR ${member.member_code}`}
                  className="w-32 h-32 mx-auto"
                />
                <p className="font-semibold text-slate-900 mt-2 text-sm">
                  {member.member_code}
                </p>
                <p className="text-sm text-slate-600">
                  {member.first_name} {member.last_name}
                </p>
                {member.pupitre && (
                  <p className="text-xs text-slate-400 mt-0.5">{member.pupitre}</p>
                )}
                <button
                  onClick={() => downloadMemberQr(member)}
                  className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Télécharger PNG
                </button>
              </div>
            ))}
          </div>

          {/* Contenu caché pour l'impression */}
          <div className="hidden">
            <div ref={printRef}>
              {badges.map(({ member, qrDataUrl }) => (
                <div key={member.id} className="badge">
                  <div className="badge-header">Kanton’ny Fanantenana</div>
                  <div className="badge-qr">
                    <img src={qrDataUrl} alt="QR" />
                  </div>
                  <div className="badge-code">{member.member_code}</div>
                  <div className="badge-name">
                    {member.first_name} {member.last_name}
                  </div>
                  {member.pupitre && (
                    <div className="badge-pupitre">{member.pupitre}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}