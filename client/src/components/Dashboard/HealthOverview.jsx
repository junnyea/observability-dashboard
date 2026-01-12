import ServiceCard from './ServiceCard'

export default function HealthOverview({ services, uptime, avgResponseTime }) {
  const serviceList = Object.values(services || {})

  if (serviceList.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading service status...
      </div>
    )
  }

  const healthyCount = serviceList.filter(s => s.status === 'healthy').length
  const totalCount = serviceList.length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Service Health</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          healthyCount === totalCount
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {healthyCount}/{totalCount} Healthy
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {serviceList.map(service => (
          <ServiceCard
            key={service.name}
            service={service}
            uptime={uptime?.[service.name]}
            avgResponseTime={avgResponseTime?.[service.name]}
          />
        ))}
      </div>
    </div>
  )
}
