import { Database, CheckCircle, XCircle, AlertTriangle, Settings, RefreshCw, ExternalLink } from 'lucide-react'
import { useEnv } from '../../context/EnvContext'

function DbStatusBadge({ status, responseTime }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'healthy':
        return { color: 'bg-green-100 text-green-700 border-green-300', icon: <CheckCircle size={14} /> }
      case 'unhealthy':
        return { color: 'bg-red-100 text-red-700 border-red-300', icon: <XCircle size={14} /> }
      case 'not_configured':
        return { color: 'bg-gray-100 text-gray-500 border-gray-300', icon: <Settings size={14} /> }
      default:
        return { color: 'bg-gray-100 text-gray-500 border-gray-300', icon: <AlertTriangle size={14} /> }
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

function DbServiceCard({ service }) {
  const getBorderColor = (status) => {
    switch (status) {
      case 'healthy': return 'border-green-200 bg-green-50'
      case 'unhealthy': return 'border-red-200 bg-red-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getMainIcon = (status) => {
    switch (status) {
      case 'healthy': return <Database className="text-green-600" size={24} />
      case 'unhealthy': return <Database className="text-red-600" size={24} />
      default: return <Database className="text-gray-400" size={24} />
    }
  }

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${getBorderColor(service?.status)}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-800">{service?.displayName || service?.name}</h3>
          <p className="text-xs text-gray-500">{service?.name}</p>
        </div>
        {getMainIcon(service?.status)}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
          <div className="flex items-center gap-2 text-gray-600">
            <Database size={14} />
            <span>DB Connection</span>
            {service?.url && (
              <a
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 transition-colors"
                title="Open health/db endpoint"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          <DbStatusBadge status={service?.status} responseTime={service?.responseTime} />
        </div>

        {service?.database && (
          <div className="text-xs text-gray-500 p-2 bg-white rounded-lg border border-gray-100">
            <div className="flex justify-between">
              <span>Database:</span>
              <span className="font-medium text-gray-700">{service.database.name}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Tables:</span>
              <span className="font-medium text-gray-700">{service.database.tableCount}</span>
            </div>
          </div>
        )}

        {service?.error && (
          <div className="text-xs text-red-500 p-2 bg-red-50 rounded-lg border border-red-100">
            {service.error}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DbHealthOverview({ dbHealth, loading }) {
  const { selectedEnv } = useEnv()
  const envKey = selectedEnv.toLowerCase()

  const envData = dbHealth?.[envKey]
  const services = envData?.services ? Object.values(envData.services) : []

  if (loading || services.length === 0) {
    return (
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Service to DB Health
          <span className={`ml-2 text-sm px-2 py-0.5 rounded ${
            'bg-blue-100 text-blue-700'
          }`}>
            {selectedEnv}
          </span>
        </h2>
        <div className="text-center py-8 text-gray-500 flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin" />
          Loading service DB health...
        </div>
      </div>
    )
  }

  const healthyCount = services.filter(s => s.status === 'healthy').length
  const totalCount = services.length

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Service to DB Health
          <span className={`ml-2 text-sm px-2 py-0.5 rounded ${
            'bg-blue-100 text-blue-700'
          }`}>
            {selectedEnv}
          </span>
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          healthyCount === totalCount
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {healthyCount}/{totalCount} Connected
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map(service => (
          <DbServiceCard key={service.name} service={service} />
        ))}
      </div>
    </div>
  )
}
