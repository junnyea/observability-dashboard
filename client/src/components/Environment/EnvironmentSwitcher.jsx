import { useState, useEffect } from 'react'
import { Globe, Database, ChevronDown, Check, AlertCircle } from 'lucide-react'
import { getEnvironment, switchEnvironment, getDatabaseStatus } from '../../utils/api'

const envColors = {
  DEV: 'bg-green-100 text-green-800 border-green-300',
  STAGING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  HOTFIX: 'bg-orange-100 text-orange-800 border-orange-300',
  PROD: 'bg-red-100 text-red-800 border-red-300'
}

const envBadgeColors = {
  DEV: 'bg-green-500',
  STAGING: 'bg-yellow-500',
  HOTFIX: 'bg-orange-500',
  PROD: 'bg-red-500'
}

export default function EnvironmentSwitcher({ onEnvironmentChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [envData, setEnvData] = useState(null)
  const [dbStatus, setDbStatus] = useState(null)

  const fetchEnvironment = async () => {
    try {
      const [env, db] = await Promise.all([
        getEnvironment(),
        getDatabaseStatus()
      ])
      setEnvData(env)
      setDbStatus(db)
    } catch (error) {
      console.error('Failed to fetch environment:', error)
    }
  }

  useEffect(() => {
    fetchEnvironment()
  }, [])

  const handleSwitch = async (envKey) => {
    if (envKey === envData?.current) {
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      await switchEnvironment(envKey)
      await fetchEnvironment()
      if (onEnvironmentChange) {
        onEnvironmentChange(envKey)
      }
    } catch (error) {
      console.error('Failed to switch environment:', error)
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  if (!envData) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-500">
        <Globe size={16} />
        <span>Loading...</span>
      </div>
    )
  }

  const currentEnv = envData.current
  const colorClass = envColors[currentEnv] || envColors.DEV

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${colorClass} hover:opacity-90`}
      >
        <Globe size={16} />
        <span>{currentEnv}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">Switch Environment</h3>
              <p className="text-xs text-gray-500 mt-0.5">Select target environment</p>
            </div>

            <div className="p-2">
              {envData.available.map((env) => (
                <button
                  key={env.key}
                  onClick={() => handleSwitch(env.key)}
                  disabled={loading}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors ${
                    env.isCurrent
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${envBadgeColors[env.key]}`} />
                    <div>
                      <div className="font-medium text-sm text-gray-800">{env.key}</div>
                      <div className="text-xs text-gray-500">{env.name}</div>
                    </div>
                  </div>
                  {env.isCurrent && <Check size={16} className="text-green-600" />}
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
              <div className="flex items-center gap-2 text-xs">
                <Database size={14} className="text-gray-500" />
                <span className="text-gray-600">Database:</span>
                {dbStatus?.connected ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <Check size={12} />
                    Connected
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {dbStatus?.error || 'Not connected'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
