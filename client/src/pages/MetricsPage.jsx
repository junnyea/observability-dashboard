import { useMetricsSummary, useHourlyMetrics, useTopEndpoints } from '../hooks/useHealth'
import MetricsOverview from '../components/Metrics/MetricsOverview'
import RequestChart from '../components/Metrics/RequestChart'
import EndpointTable from '../components/Metrics/EndpointTable'
import { DollarSign, Cloud, Cpu, Database } from 'lucide-react'

// AWS Pricing (ap-southeast-1 region - approximate)
const AWS_PRICING = {
  apiGateway: 3.50,      // per million requests
  lambda: 0.20,          // per million invocations
  lambdaCompute: 0.0000166667, // per GB-second (128MB = 0.125GB)
  avgLambdaDuration: 200, // ms (estimated average)
  dataTransfer: 0.09,    // per GB (first 10TB)
  avgResponseSize: 2,    // KB (estimated)
}

function calculateAWSCost(requests) {
  if (!requests || requests === 0) return { total: 0, breakdown: {} }

  const millions = requests / 1000000

  // API Gateway cost
  const apiGatewayCost = millions * AWS_PRICING.apiGateway

  // Lambda invocation cost
  const lambdaInvocationCost = millions * AWS_PRICING.lambda

  // Lambda compute cost (128MB memory, ~200ms avg duration)
  const gbSeconds = requests * (AWS_PRICING.avgLambdaDuration / 1000) * 0.125
  const lambdaComputeCost = gbSeconds * AWS_PRICING.lambdaCompute

  // Data transfer cost (estimated 2KB per response)
  const dataTransferGB = (requests * AWS_PRICING.avgResponseSize) / (1024 * 1024)
  const dataTransferCost = dataTransferGB * AWS_PRICING.dataTransfer

  const total = apiGatewayCost + lambdaInvocationCost + lambdaComputeCost + dataTransferCost

  return {
    total,
    breakdown: {
      apiGateway: apiGatewayCost,
      lambdaInvocation: lambdaInvocationCost,
      lambdaCompute: lambdaComputeCost,
      dataTransfer: dataTransferCost
    }
  }
}

function formatCost(cost) {
  if (cost < 0.01) return '< $0.01'
  return `$${cost.toFixed(2)}`
}

export default function MetricsPage() {
  const { data: summary, loading: summaryLoading } = useMetricsSummary()
  const { data: hourlyData, loading: hourlyLoading } = useHourlyMetrics()
  const { data: endpoints, loading: endpointsLoading } = useTopEndpoints()

  // Calculate AWS costs
  const todayCost = calculateAWSCost(summary.today || 0)
  const weekCost = calculateAWSCost(summary.week || 0)
  const monthlyEstimate = calculateAWSCost((summary.week || 0) * 4.3) // Rough monthly estimate

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

      {/* AWS Cost Estimation */}
      <div className="mt-6 bg-gradient-to-br from-orange-50 to-yellow-50 p-5 rounded-xl shadow-sm border border-orange-100">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="text-orange-600" size={20} />
          <h3 className="font-semibold text-gray-800">AWS Cost Estimation (PROD)</h3>
          <span className="text-xs text-gray-500 ml-auto">ap-southeast-1 region</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg border border-orange-100">
            <div className="text-sm text-gray-500 mb-1">Today's Estimated Cost</div>
            <div className="text-2xl font-bold text-orange-600">{formatCost(todayCost.total)}</div>
            <div className="text-xs text-gray-400">{summary.today?.toLocaleString() || 0} requests</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-orange-100">
            <div className="text-sm text-gray-500 mb-1">7-Day Cost</div>
            <div className="text-2xl font-bold text-orange-600">{formatCost(weekCost.total)}</div>
            <div className="text-xs text-gray-400">{summary.week?.toLocaleString() || 0} requests</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-orange-100">
            <div className="text-sm text-gray-500 mb-1">Monthly Estimate</div>
            <div className="text-2xl font-bold text-orange-600">{formatCost(monthlyEstimate.total)}</div>
            <div className="text-xs text-gray-400">Based on 7-day average</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-orange-100">
          <div className="text-sm font-medium text-gray-700 mb-3">Cost Breakdown (Monthly Estimate)</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Cloud size={14} className="text-blue-500" />
              <span className="text-gray-600">API Gateway:</span>
              <span className="font-medium">{formatCost(monthlyEstimate.breakdown.apiGateway || 0)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-purple-500" />
              <span className="text-gray-600">Lambda:</span>
              <span className="font-medium">{formatCost((monthlyEstimate.breakdown.lambdaInvocation || 0) + (monthlyEstimate.breakdown.lambdaCompute || 0))}</span>
            </div>
            <div className="flex items-center gap-2">
              <Database size={14} className="text-green-500" />
              <span className="text-gray-600">Data Transfer:</span>
              <span className="font-medium">{formatCost(monthlyEstimate.breakdown.dataTransfer || 0)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              * Excludes RDS, S3, CloudWatch
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
