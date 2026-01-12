import { formatNumber } from '../../utils/formatters'

const methodColors = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
  PATCH: 'bg-purple-100 text-purple-700'
}

export default function EndpointTable({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm">
        <div className="h-4 bg-gray-200 rounded w-48 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-4">Top Endpoints (Last 24 Hours)</h3>
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No endpoint data available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Endpoint</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Method</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Count</th>
              </tr>
            </thead>
            <tbody>
              {data.map((endpoint, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <code className="text-sm text-gray-800">
                      {endpoint.module_name || 'Unknown'}
                    </code>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${methodColors[endpoint.method] || 'bg-gray-100 text-gray-700'}`}>
                      {endpoint.method || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-medium text-gray-800">
                      {formatNumber(parseInt(endpoint.count))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
