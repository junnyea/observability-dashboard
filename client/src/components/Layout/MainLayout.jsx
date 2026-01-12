import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ScrollText, BarChart3, Activity, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function MainLayout({ children }) {
  const { user, logout } = useAuth()

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-600" size={28} />
            <h1 className="text-xl font-bold text-gray-800">Bulwark Observability</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <NavLink to="/" className={navLinkClass}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/logs" className={navLinkClass}>
                <ScrollText size={18} />
                <span>Logs</span>
              </NavLink>
              <NavLink to="/metrics" className={navLinkClass}>
                <BarChart3 size={18} />
                <span>Metrics</span>
              </NavLink>
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <span className="text-sm text-gray-600">{user?.username}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  )
}
