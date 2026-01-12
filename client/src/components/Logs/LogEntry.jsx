const levelColors = {
  error: 'text-red-400',
  warn: 'text-yellow-400',
  info: 'text-blue-400',
  debug: 'text-gray-400'
}

const serviceColors = {
  'config-svc': 'text-purple-400',
  'tenant-svc': 'text-cyan-400',
  'checkin-svc': 'text-green-400'
}

const serviceDisplayNames = {
  'config-svc': 'bw-config-svc-dev',
  'tenant-svc': 'bw-tenant-svc-dev',
  'checkin-svc': 'bw-checkin-svc-dev'
}

function getServiceDisplayName(serviceName) {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  return isLocalhost ? serviceName : (serviceDisplayNames[serviceName] || serviceName)
}

export default function LogEntry({ log }) {
  const level = log.parsed?.level || 'info'
  const levelColor = levelColors[level] || 'text-gray-400'
  const serviceColor = serviceColors[log.service] || 'text-gray-400'
  const displayName = getServiceDisplayName(log.service)

  return (
    <div className="flex gap-2 py-0.5 hover:bg-gray-800 rounded px-1">
      <span className="text-gray-500 min-w-[80px] flex-shrink-0">
        {new Date(log.timestamp).toLocaleTimeString()}
      </span>
      <span className={`min-w-[140px] flex-shrink-0 ${serviceColor}`}>
        [{displayName}]
      </span>
      <span className={`min-w-[50px] flex-shrink-0 uppercase text-xs pt-0.5 ${levelColor}`}>
        {level}
      </span>
      <span className="text-gray-300 break-all whitespace-pre-wrap">
        {log.raw}
      </span>
    </div>
  )
}
