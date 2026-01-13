import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ScrollText, BarChart3, Activity, LogOut, Database, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEnv } from '../../context/EnvContext'
import { useState, useEffect } from 'react'
import { api } from '../../utils/api'

function EnvDropdown() {
  const { selectedEnv, setSelectedEnv } = useEnv()
  const [isOpen, setIsOpen] = useState(false)

  const envConfig = {
    DEV: { label: 'Development', color: 'bg-green-100 text-green-700 border-green-300' },
    PROD: { label: 'Production', color: 'bg-red-100 text-red-700 border-red-300' }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${envConfig[selectedEnv].color}`}
      >
        <span>{selectedEnv}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-2">
              {Object.entries(envConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedEnv(key)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors ${
                    selectedEnv === key ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${key === 'DEV' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium text-sm">{key}</span>
                  </div>
                  <span className="text-xs text-gray-500">{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function MainLayout({ children }) {
  const { user, logout } = useAuth()
  const [dbStatus, setDbStatus] = useState(null)

  useEffect(() => {
    const checkDb = async () => {
      try {
        const res = await api.get('/database')
        setDbStatus(res.data)
      } catch (e) {
        setDbStatus({ connected: false })
      }
    }
    checkDb()
  }, [])

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
              <EnvDropdown />
              <div className="flex items-center gap-1.5 text-xs">
                <Database size={14} className={dbStatus?.connected ? 'text-green-500' : 'text-red-500'} />
                <span className="text-gray-500">DB</span>
              </div>
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
