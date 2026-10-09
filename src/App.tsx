import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import MembersPage from './pages/MembersPage'
import MemberDetailPage from './pages/MemberDetailPage'
import MemberCreatePage from './pages/MemberCreatePage'
import MemberImportPage from './pages/MemberImportPage'
import SessionsPage from './pages/SessionsPage'

function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Tableau de bord</h1>
      <p className="text-slate-500">Bienvenue dans Kanton’ny Fanantenana — Présences & Assiduité</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Membres actifs</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">—</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Séances</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">—</p>
        </div>
      </div>
    </div>
  )
}

function ScannerPage() {
  return <div className="text-xl font-semibold text-slate-900">Scanner QR (prochaine étape)</div>
}

function StatsPage() {
  return <div className="text-xl font-semibold text-slate-900">Statistiques (prochaine étape)</div>
}

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route
            path="scanner"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RESPONSABLE']}>
                <ScannerPage />
              </ProtectedRoute>
            }
          />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="members/new" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <MemberCreatePage />
            </ProtectedRoute>
          } />
          <Route path="members/import" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <MemberImportPage />
            </ProtectedRoute>
          } />
          <Route path="members/:id" element={<MemberDetailPage />} />
          <Route path="stats" element={<StatsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}