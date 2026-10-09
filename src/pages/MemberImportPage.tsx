import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { membersService } from '../services/members.service'

export default function MemberImportPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parseCsv = (text: string) => {
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const rows = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: any = {}
      headers.forEach((h, idx) => {
        row[h] = values[idx] || ''
      })
      if (row.member_code && row.first_name && row.last_name) {
        rows.push(row)
      }
    }
    return rows
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = parseCsv(text)
      setPreview(rows.slice(0, 10))
    }
    reader.readAsText(f)
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setError(null)
    setResult(null)

    try {
      const text = await file.text()
      const rows = parseCsv(text)

      if (rows.length === 0) {
        setError('Aucune ligne valide trouvée dans le fichier')
        setImporting(false)
        return
      }

      const data = await membersService.importCsv(rows)
      setResult(`${data.length} membre(s) importé(s) / mis à jour avec succès`)
      setTimeout(() => navigate('/members'), 2000)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'import')
    } finally {
      setImporting(false)
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
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Import CSV</h1>
        <p className="text-slate-500 text-sm mb-6">
          Format attendu : member_code, first_name, last_name, pupitre, phone, status
        </p>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />
        </div>

        {preview.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-700 mb-2">
              Aperçu ({preview.length} premières lignes)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">Prénom</th>
                    <th className="py-2 pr-4">Nom</th>
                    <th className="py-2 pr-4">Pupitre</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 pr-4">{row.member_code}</td>
                      <td className="py-2 pr-4">{row.first_name}</td>
                      <td className="py-2 pr-4">{row.last_name}</td>
                      <td className="py-2 pr-4">{row.pupitre || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
            {result}
          </div>
        )}

        {preview.length > 0 && !result && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {importing ? 'Import en cours...' : `Importer ${preview.length}+ membres`}
          </button>
        )}
      </div>
    </div>
  )
}