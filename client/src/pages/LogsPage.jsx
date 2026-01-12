import { useState, useEffect } from 'react'
import { useLogStream } from '../hooks/useWebSocket'
import LogViewer from '../components/Logs/LogViewer'
import LogControls from '../components/Logs/LogControls'
import { Wifi, WifiOff } from 'lucide-react'

const SERVICES = ['config-svc', 'tenant-svc', 'checkin-svc']

export default function LogsPage() {
  const { logs, connected, paused, subscribe, filter, clear, togglePause } = useLogStream()
  const [activeServices, setActiveServices] = useState(SERVICES)
  const [search, setSearch] = useState('')

  // Subscribe to services when selection changes
  useEffect(() => {
    subscribe(activeServices)
  }, [activeServices, subscribe])

  // Apply search filter
  useEffect(() => {
    filter({ search, level: 'all' })
  }, [search, filter])

  const handleServiceToggle = (service) => {
    setActiveServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }

  // Filter logs client-side for immediate feedback
  const filteredLogs = logs.filter(log => {
    if (!activeServices.includes(log.service)) return false
    if (search && !log.raw.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Live Logs</h1>
        <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
          connected
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <LogControls
        paused={paused}
        onTogglePause={togglePause}
        onClear={clear}
        activeServices={activeServices}
        onServiceToggle={handleServiceToggle}
        search={search}
        onSearchChange={setSearch}
        logCount={filteredLogs.length}
      />

      <LogViewer logs={filteredLogs} autoScroll={!paused} />

      {paused && (
        <div className="mt-2 text-center text-sm text-yellow-600 bg-yellow-50 py-2 rounded-lg">
          Log streaming paused. Click Resume to continue.
        </div>
      )}
    </div>
  )
}
