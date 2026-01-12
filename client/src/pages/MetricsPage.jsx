import { useMetricsSummary, useHourlyMetrics, useTopEndpoints } from '../hooks/useHealth'
import MetricsOverview from '../components/Metrics/MetricsOverview'
import RequestChart from '../components/Metrics/RequestChart'
import EndpointTable from '../components/Metrics/EndpointTable'

export default function MetricsPage() {
  const { data: summary, loading: summaryLoading } = useMetricsSummary()
  const { data: hourlyData, loading: hourlyLoading } = useHourlyMetrics()
  const { data: endpoints, loading: endpointsLoading } = useTopEndpoints()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Metrics</h1>
        <span className="text-sm text-gray-500">
          Auto-refreshes every 30 seconds
        </span>
      </div>

      <MetricsOverview summary={summary} loading={summaryLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RequestChart data={hourlyData} loading={hourlyLoading} />
        <EndpointTable data={endpoints} loading={endpointsLoading} />
      </div>

      <div className="mt-6 bg-white p-5 rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">7-Day Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">
              {summary.week?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-500">Total Requests</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {summary.weekErrors?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-500">Total Errors</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {summary.weekErrorRate || 0}%
            </div>
            <div className="text-sm text-gray-500">Error Rate</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {summary.week ? Math.round(summary.week / 7).toLocaleString() : 0}
            </div>
            <div className="text-sm text-gray-500">Avg Daily Requests</div>
          </div>
        </div>
      </div>
    </div>
  )
}
