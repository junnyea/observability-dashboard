import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { formatHour } from '../../utils/formatters'

export default function RequestChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm">
        <div className="h-4 bg-gray-200 rounded w-48 mb-4" />
        <div className="h-[300px] bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  const chartData = data.map(item => ({
    ...item,
    hour: formatHour(item.hour)
  }))

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-4">Request Volume (Last 24 Hours)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={12} />
          <YAxis stroke="#9CA3AF" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="requests"
            stroke="#3B82F6"
            fill="url(#colorRequests)"
            name="Requests"
          />
          <Area
            type="monotone"
            dataKey="errors"
            stroke="#EF4444"
            fill="url(#colorErrors)"
            name="Errors"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
