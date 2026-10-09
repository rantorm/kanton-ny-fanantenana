import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { sessionsService } from '../services/sessions.service'
import { membersService } from '../services/members.service'
import { attendanceService, type RecordAttendanceResult } from '../services/attendance.service'
import type { Session, Member } from '../types/database.types'

type ScanFeedback = {
  type: 'success' | 'already' | 'error' | 'unknown'
  title: string
  subtitle?: string
  member?: Member
  time?: string
} | null

export default function ScannerPage() {
  const [searchParams] = useSearchParams()
  const sessionIdFromUrl = searchParams.get('session')

  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessionIdFromUrl)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [presentCount, setPresentCount] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [feedback, setFeedback] = useState<ScanFeedback>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScannedRef = useRef<string | null>(null)
  const processingRef = useRef(false)
  const feedbackTimeoutRef = useRef<number | null>(null)

  // Charger les séances ouvertes
  useEffect(() => {
    const load = async () => {
      try {
        const openSessions = await sessionsService.getOpen()
        setSessions(openSessions)

        if (sessionIdFromUrl) {
          const session = openSessions.find(s => s.id === sessionIdFromUrl)
          if (session) {
            setSelectedSessionId(session.id)
            setSelectedSession(session)
            const count = await sessionsService.getAttendanceCount(session.id)
            setPresentCount(count)
          }
        } else if (openSessions.length === 1) {
          setSelectedSessionId(openSessions[0].id)
          setSelectedSession(openSessions[0])
          const count = await sessionsService.getAttendanceCount(openSessions[0].id)
          setPresentCount(count)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [sessionIdFromUrl])

  // Quand on change de séance
  useEffect(() => {
    if (!selectedSessionId) return
    const session = sessions.find(s => s.id === selectedSessionId)
    setSelectedSession(session || null)
    if (session) {
      sessionsService.getAttendanceCount(session.id).then(setPresentCount)
    }
  }, [selectedSessionId, sessions])

  const showFeedback = useCallback((fb: ScanFeedback) => {
    setFeedback(fb)
    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current)
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback(null)
      lastScannedRef.current = null
    }, 2500)
  }, [])

  const processQrCode = useCallback(async (decodedText: string) => {
    if (processingRef.current) return
    if (lastScannedRef.current === decodedText) return
    if (!selectedSessionId) return

    processingRef.current = true
    lastScannedRef.current = decodedText

    try {
      // Format attendu : KF:v1:<uuid>  ou juste l'uuid
      let qrToken = decodedText.trim()
      if (qrToken.startsWith('KF:v1:')) {
        qrToken = qrToken.replace('KF:v1:', '')
      }

      // Recherche du membre
      const member = await membersService.getByQrToken(qrToken)

      if (!member) {
        showFeedback({
          type: 'unknown',
          title: 'Badge non reconnu',
          subtitle: 'Ce QR code ne correspond à aucun membre actif',
        })
        processingRef.current = false
        return
      }

      // Enregistrement via fonction PostgreSQL (anti-doublon atomique)
      const result: RecordAttendanceResult = await attendanceService.record(
        selectedSessionId,
        member.id,
        navigator.userAgent.slice(0, 100)
      )

      if (result.code === 'CREATED') {
        setPresentCount(prev => prev + 1)
        showFeedback({
          type: 'success',
          title: 'Présence enregistrée',
          member,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        })
      } else if (result.code === 'ALREADY_PRESENT') {
        const time = result.scanned_at
          ? new Date(result.scanned_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : ''
        showFeedback({
          type: 'already',
          title: 'Déjà pointé',
          subtitle: time
            ? `Pointé à ${time}${result.scanned_by_name ? ` par ${result.scanned_by_name}` : ''}`
            : 'Ce membre est déjà présent',
          member,
          time,
        })
      } else if (result.code === 'SESSION_CLOSED') {
        showFeedback({
          type: 'error',
          title: 'Pointage fermé',
          subtitle: 'Cette séance n\'accepte plus de présences',
        })
      } else {
        showFeedback({
          type: 'error',
          title: 'Erreur',
          subtitle: result.message || 'Impossible d\'enregistrer la présence',
        })
      }
    } catch (err: any) {
      console.error(err)
      showFeedback({
        type: 'error',
        title: 'Erreur',
        subtitle: err.message || 'Une erreur est survenue',
      })
    } finally {
      processingRef.current = false
    }
  }, [selectedSessionId, showFeedback])

  // Démarrage / arrêt du scanner
  useEffect(() => {
    if (!selectedSessionId || selectedSession?.status !== 'OPEN') {
      return
    }

    let html5QrCode: Html5Qrcode | null = null

    const startScanner = async () => {
      try {
        setCameraError(null)
        html5QrCode = new Html5Qrcode('qr-reader', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        })
        scannerRef.current = html5QrCode

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1,
          },
          (decodedText) => {
            processQrCode(decodedText)
          },
          () => {
            // erreur de scan ignorée (trop fréquente)
          }
        )
        setScanning(true)
      } catch (err: any) {
        console.error('Camera error:', err)
        setCameraError(
          err.message?.includes('Permission') || err.name === 'NotAllowedError'
            ? 'Autorisation caméra refusée. Veuillez autoriser l\'accès dans les réglages.'
            : 'Impossible d\'accéder à la caméra. Vérifiez les permissions.'
        )
        setScanning(false)
      }
    }

    startScanner()

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {})
      }
      scannerRef.current = null
      setScanning(false)
    }
  }, [selectedSessionId, selectedSession?.status, processQrCode])

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500">Chargement...</div>
    )
  }

  // Aucune séance ouverte
  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Scanner</h1>
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-600 mb-4">Aucune séance ouverte actuellement.</p>
          <Link
            to="/sessions"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            Voir les séances
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* En-tête + sélecteur de séance */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Scanner</h1>
        {selectedSession && (
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{presentCount} présents</p>
            <p className="text-xs text-slate-500">{selectedSession.title}</p>
          </div>
        )}
      </div>

      {sessions.length > 1 && (
        <select
          value={selectedSessionId || ''}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">Choisir une séance...</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} — {s.session_date}
            </option>
          ))}
        </select>
      )}

      {/* Zone caméra */}
      {selectedSessionId && selectedSession?.status === 'OPEN' ? (
        <div className="relative">
          <div
            id="qr-reader"
            className="w-full overflow-hidden rounded-2xl bg-black"
            style={{ minHeight: 320 }}
          />

          {/* Feedback overlay */}
          {feedback && (
            <div
              className={`absolute inset-x-4 top-4 rounded-2xl p-4 shadow-lg z-20 ${
                feedback.type === 'success'
                  ? 'bg-emerald-600 text-white'
                  : feedback.type === 'already'
                  ? 'bg-amber-500 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              <p className="font-semibold text-lg">{feedback.title}</p>
              {feedback.member && (
                <p className="mt-1">
                  {feedback.member.first_name} {feedback.member.last_name}
                  {feedback.member.pupitre && ` · ${feedback.member.pupitre}`}
                </p>
              )}
              {feedback.subtitle && (
                <p className="text-sm mt-1 opacity-90">{feedback.subtitle}</p>
              )}
              {feedback.time && feedback.type === 'success' && (
                <p className="text-sm mt-1 opacity-90">{feedback.time}</p>
              )}
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-2xl z-10">
              <div className="text-center text-white px-6">
                <p className="font-medium mb-2">Caméra indisponible</p>
                <p className="text-sm opacity-80">{cameraError}</p>
              </div>
            </div>
          )}

          {!scanning && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-2xl">
              <p className="text-white text-sm">Démarrage de la caméra...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-600">Sélectionnez une séance ouverte pour commencer à scanner.</p>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Présentez le badge devant la caméra. Le scan est automatique.
      </p>
    </div>
  )
}