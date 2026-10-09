import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import MembersPage from './pages/MembersPage'

function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Tableau de bord</h1>
      <p className="text-slate-500">Bienvenue dans Kanton’ny Fanantenana</p>
    </div>
  )
}

function ScannerPage() {
  return <div className="text-xl font-semibold">Scanner QR (Étape 6)</div>
}

function SessionsPage() {
  return <div className="text-xl font-semibold">Séances (Étape 5)</div>
}

function StatsPage() {
  return <div className="text-xl font-semibold">Statistiques (Étape 8)</div>
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
          <Route path="stats" element={<StatsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}