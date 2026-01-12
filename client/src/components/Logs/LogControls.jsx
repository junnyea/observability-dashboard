import { Play, Pause, Trash2, Search } from 'lucide-react'

const SERVICES = ['config-svc', 'tenant-svc', 'checkin-svc']

const serviceDisplayNames = {
  'config-svc': 'bw-config-svc-dev',
  'tenant-svc': 'bw-tenant-svc-dev',
  'checkin-svc': 'bw-checkin-svc-dev'
}

function getServiceDisplayName(serviceName) {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  return isLocalhost ? serviceName : (serviceDisplayNames[serviceName] || serviceName)
}

export default function LogControls({
  paused,
  onTogglePause,
  onClear,
  activeServices,
  onServiceToggle,
  search,
  onSearchChange,
  logCount
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-4 bg-white p-4 rounded-lg shadow-sm">
      <div className="flex gap-2">
        <button
          onClick={onTogglePause}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
            paused
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors"
        >
          <Trash2 size={16} />
          Clear
        </button>
      </div>

      <div className="flex gap-3 border-l pl-4 border-gray-200">
        {SERVICES.map(svc => (
          <label key={svc} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeServices.includes(svc)}
              onChange={() => onServiceToggle(svc)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{getServiceDisplayName(svc)}</span>
          </label>
        ))}
      </div>

      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="text-sm text-gray-500">
        {logCount} logs
      </div>
    </div>
  )
}
