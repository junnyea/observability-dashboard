import { CheckCircle, XCircle, Clock, Server, Cloud, AlertTriangle, Settings } from 'lucide-react'

function StatusBadge({ status, responseTime }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'healthy':
        return { color: 'bg-green-100 text-green-700 border-green-300', icon: <CheckCircle size={14} /> }
      case 'degraded':
        return { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: <AlertTriangle size={14} /> }
      case 'unhealthy':
        return { color: 'bg-red-100 text-red-700 border-red-300', icon: <XCircle size={14} /> }
      case 'not_configured':
        return { color: 'bg-gray-100 text-gray-500 border-gray-300', icon: <Settings size={14} /> }
      default:
        return { color: 'bg-gray-100 text-gray-500 border-gray-300', icon: null }
    }
  }

  const config = getStatusConfig(status)

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${config.color}`}>
      {config.icon}
      <span className="capitalize">{status?.replace('_', ' ') || 'Unknown'}</span>
      {responseTime && <span className="text-gray-500">({responseTime}ms)</span>}
    </div>
  )
}

export default function ServiceCard({ service, envData, uptime, selectedEnv }) {
  const getBorderColor = (status) => {
    switch (status) {
      case 'healthy': return 'border-green-200 bg-green-50'
      case 'degraded': return 'border-yellow-200 bg-yellow-50'
      case 'unhealthy': return 'border-red-200 bg-red-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getMainIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="text-green-600" size={28} />
      case 'degraded': return <AlertTriangle className="text-yellow-600" size={28} />
      case 'unhealthy': return <XCircle className="text-red-600" size={28} />
      default: return <Settings className="text-gray-400" size={28} />
    }
  }

  const hasLocal = envData?.local
  const hasAws = envData?.aws

  return (
    <div className={`p-5 rounded-xl border-2 transition-all ${getBorderColor(envData?.status)}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-800 text-lg">{service?.displayName || service?.name}</h3>
          <p className="text-xs text-gray-500">{service?.name}</p>
        </div>
        {getMainIcon(envData?.status)}
      </div>

      <div className="space-y-3 text-sm">
        {/* Local status (DEV only) */}
        {hasLocal && (
          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 text-gray-600">
              <Server size={16} />
              <span>Local :{envData.local.port}</span>
            </div>
            <StatusBadge status={envData.local.status} responseTime={envData.local.responseTime} />
          </div>
        )}

        {/* AWS status */}
        {hasAws && (
          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 text-gray-600">
              <Cloud size={16} />
              <span>AWS {selectedEnv}</span>
            </div>
            <StatusBadge status={envData.aws.status} responseTime={envData.aws.responseTime} />
          </div>
        )}

        {/* No endpoints configured */}
        {!hasLocal && (!hasAws || envData.aws.status === 'not_configured') && (
          <div className="text-center py-2 text-gray-400 text-xs">
            No endpoints configured for {selectedEnv}
          </div>
        )}

        {/* Uptime */}
        {uptime !== undefined && (
          <div className="pt-3 border-t border-gray-200">
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

        {envData?.local?.lastCheck && (
          <div className="text-xs text-gray-400 text-center">
            Last check: {new Date(envData.local.lastCheck || envData.aws?.lastCheck).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  )
}
