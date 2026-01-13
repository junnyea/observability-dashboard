import { useHealthStream } from '../hooks/useWebSocket'
import { useMetricsSummary, useServiceDbHealth } from '../hooks/useHealth'
import HealthOverview from '../components/Dashboard/HealthOverview'
import DbHealthOverview from '../components/Dashboard/DbHealthOverview'
import MetricsOverview from '../components/Metrics/MetricsOverview'
import { RefreshCw } from 'lucide-react'

export default function DashboardPage() {
  const { status, connected } = useHealthStream()
  const { data: summary, loading: summaryLoading } = useMetricsSummary()
  const { data: dbHealth, loading: dbHealthLoading } = useServiceDbHealth()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
            connected
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            {connected ? 'Live' : 'Disconnected'}
          </span>
          {connected && (
            <RefreshCw size={14} className="text-green-600 animate-spin" style={{ animationDuration: '3s' }} />
          )}
        </div>
      </div>

      <HealthOverview
        services={status.services}
        uptime={status.uptime}
        avgResponseTime={status.avgResponseTime}
      />

      <DbHealthOverview
        dbHealth={dbHealth}
        loading={dbHealthLoading}
      />

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Metrics Summary</h2>
        <MetricsOverview summary={summary} loading={summaryLoading} />
      </div>
    </div>
  )
}
