import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { to: '/', label: 'Accueil', icon: '🏠' },
    { to: '/scanner', label: 'Scanner', icon: '📷', roles: ['ADMIN', 'RESPONSABLE'] },
    { to: '/sessions', label: 'Séances', icon: '📅' },
    { to: '/members', label: 'Choristes', icon: '👥' },
    { to: '/stats', label: 'Stats', icon: '📊' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
              KF
            </div>
            <span className="font-semibold text-slate-900 hidden sm:block">
              Kanton’ny Fanantenana
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:block">
              {profile?.full_name}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
              {profile?.role}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-slate-800 transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 safe-area-pb">
        <div className="max-w-5xl mx-auto flex justify-around">
          {navItems.map((item) => {
            if (item.roles && profile && !item.roles.includes(profile.role)) {
              return null
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center py-3 px-3 text-xs font-medium transition ${
                    isActive
                      ? 'text-emerald-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`
                }
              >
                <span className="text-xl mb-0.5">{item.icon}</span>
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}