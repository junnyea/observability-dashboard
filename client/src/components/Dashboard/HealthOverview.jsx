import ServiceCard from './ServiceCard'
import { useEnv } from '../../context/EnvContext'

export default function HealthOverview({ services, uptime }) {
  const { selectedEnv } = useEnv()
  const serviceList = Object.values(services || {})
  const envKey = selectedEnv.toLowerCase() // 'dev' or 'prod'

  if (serviceList.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading service status...
      </div>
    )
  }

  // Count healthy services for selected environment
  const healthyCount = serviceList.filter(s => {
    const envStatus = s[envKey]?.status
    return envStatus === 'healthy' || envStatus === 'not_configured'
  }).length
  const totalCount = serviceList.length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Service Health
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
          {healthyCount}/{totalCount} Healthy
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {serviceList.map(service => (
          <ServiceCard
            key={service.name}
            service={service}
            envData={service[envKey]}
            uptime={uptime?.[service.name]?.[envKey]}
            selectedEnv={selectedEnv}
          />
        ))}
      </div>
    </div>
  )
}
