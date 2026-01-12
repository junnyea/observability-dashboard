import { Activity, AlertTriangle, TrendingUp, Calendar } from 'lucide-react'
import { formatNumber } from '../../utils/formatters'

export default function MetricsOverview({ summary, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      icon: Activity,
      label: "Today's Requests",
      value: formatNumber(summary.today || 0),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: AlertTriangle,
      label: "Today's Errors",
      value: formatNumber(summary.todayErrors || 0),
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: TrendingUp,
      label: 'Error Rate',
      value: `${summary.todayErrorRate || 0}%`,
      color: summary.todayErrorRate > 5 ? 'text-red-600' : 'text-green-600',
      bgColor: summary.todayErrorRate > 5 ? 'bg-red-50' : 'bg-green-50'
    },
    {
      icon: Calendar,
      label: '7-Day Requests',
      value: formatNumber(summary.week || 0),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className={`${card.bgColor} p-5 rounded-xl`}>
          <div className={`flex items-center gap-2 ${card.color} mb-2`}>
            <card.icon size={20} />
            <span className="text-sm font-medium">{card.label}</span>
          </div>
          <div className={`text-3xl font-bold ${card.color}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  )
}
