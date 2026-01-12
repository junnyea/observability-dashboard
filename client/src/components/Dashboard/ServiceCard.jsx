import { CheckCircle, XCircle, Clock, Wifi } from 'lucide-react'

// Use displayName when accessed via domain, name when localhost
function getServiceName(service) {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  return isLocalhost ? service?.name : (service?.displayName || service?.name)
}

export default function ServiceCard({ service, uptime, avgResponseTime }) {
  const isHealthy = service?.status === 'healthy'
  const serviceName = getServiceName(service)

  return (
    <div
      className={`p-5 rounded-xl border-2 transition-all ${
        isHealthy
          ? 'border-green-200 bg-green-50'
          : 'border-red-200 bg-red-50'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-lg">{serviceName || 'Unknown'}</h3>
        {isHealthy ? (
          <CheckCircle className="text-green-600" size={28} />
        ) : (
          <XCircle className="text-red-600" size={28} />
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Wifi size={14} />
          <span>Port {service?.port}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={14} />
          <span>
            {service?.responseTime ? `${service.responseTime}ms` : 'N/A'}
            {avgResponseTime && ` (avg: ${avgResponseTime}ms)`}
          </span>
        </div>

        {uptime !== undefined && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Uptime</span>
              <span>{uptime}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${uptime >= 99 ? 'bg-green-500' : uptime >= 95 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${uptime}%` }}
              />
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400 mt-2">
          Last check: {service?.lastCheck ? new Date(service.lastCheck).toLocaleTimeString() : 'Never'}
        </div>
      </div>
    </div>
  )
}
