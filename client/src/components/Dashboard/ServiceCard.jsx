import { CheckCircle, XCircle, Clock, Wifi, Cloud, Server, AlertTriangle } from 'lucide-react'

// Use displayName when accessed via domain, name when localhost
function getServiceName(service) {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  return isLocalhost ? service?.name : (service?.displayName || service?.name)
}

function StatusBadge({ status, type, responseTime }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-700 border-green-300'
      case 'degraded': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'unhealthy': return 'bg-red-100 text-red-700 border-red-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle size={12} />
      case 'degraded': return <AlertTriangle size={12} />
      case 'unhealthy': return <XCircle size={12} />
      default: return null
    }
  }

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor(status)}`}>
      {type === 'local' ? <Server size={12} /> : <Cloud size={12} />}
      <span>{type === 'local' ? 'Local' : 'AWS'}</span>
      {getStatusIcon(status)}
      {responseTime && <span className="text-gray-500">({responseTime}ms)</span>}
    </div>
  )
}

export default function ServiceCard({ service, uptime, avgResponseTime }) {
  const serviceName = getServiceName(service)

  // Determine overall status
  const hasLocal = service?.local || service?.port
  const hasAws = service?.aws || service?.awsUrl
  const localStatus = service?.local?.status || service?.status
  const awsStatus = service?.aws?.status

  // Overall status logic
  let overallStatus = service?.status || 'unknown'
  if (service?.local && service?.aws) {
    // Both available - healthy if either is healthy
    overallStatus = (service.local.status === 'healthy' || service.aws.status === 'healthy')
      ? 'healthy'
      : (service.local.status === 'degraded' || service.aws.status === 'degraded')
        ? 'degraded'
        : 'unhealthy'
  }

  const isHealthy = overallStatus === 'healthy'
  const isDegraded = overallStatus === 'degraded'

  const getBorderColor = () => {
    if (isHealthy) return 'border-green-200 bg-green-50'
    if (isDegraded) return 'border-yellow-200 bg-yellow-50'
    return 'border-red-200 bg-red-50'
  }

  const getMainIcon = () => {
    if (isHealthy) return <CheckCircle className="text-green-600" size={28} />
    if (isDegraded) return <AlertTriangle className="text-yellow-600" size={28} />
    return <XCircle className="text-red-600" size={28} />
  }

  return (
    <div className={`p-5 rounded-xl border-2 transition-all ${getBorderColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-lg">{serviceName || 'Unknown'}</h3>
        {getMainIcon()}
      </div>

      <div className="space-y-2 text-sm">
        {/* Status badges for local and AWS */}
        <div className="flex flex-wrap gap-2 mb-3">
          {service?.local && (
            <StatusBadge
              type="local"
              status={service.local.status}
              responseTime={service.local.responseTime}
            />
          )}
          {service?.aws && (
            <StatusBadge
              type="aws"
              status={service.aws.status}
              responseTime={service.aws.responseTime}
            />
          )}
          {!service?.local && !service?.aws && service?.type && (
            <StatusBadge
              type={service.type}
              status={service.status}
              responseTime={service.responseTime}
            />
          )}
        </div>

        {/* Port info */}
        {service?.port && (
          <div className="flex items-center gap-2 text-gray-600">
            <Wifi size={14} />
            <span>Port {service.port}</span>
          </div>
        )}

        {/* AWS URL info */}
        {(service?.awsUrl || service?.aws?.awsUrl) && (
          <div className="flex items-center gap-2 text-gray-600">
            <Cloud size={14} />
            <span className="text-xs truncate max-w-[200px]" title={service.awsUrl || service.aws?.awsUrl}>
              {(service.awsUrl || service.aws?.awsUrl)?.replace('https://', '').split('/')[0]}
            </span>
          </div>
        )}

        {/* Response time */}
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={14} />
          <span>
            {service?.responseTime || service?.local?.responseTime || service?.aws?.responseTime
              ? `${service.responseTime || service.local?.responseTime || service.aws?.responseTime}ms`
              : 'N/A'}
            {avgResponseTime && ` (avg: ${avgResponseTime}ms)`}
          </span>
        </div>

        {/* Uptime bar */}
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
