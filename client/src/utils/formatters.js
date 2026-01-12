export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString()
}

export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString()
}

export function formatDateTime(isoString) {
  const date = new Date(isoString)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

export function formatHour(isoString) {
  const date = new Date(isoString)
  return date.getHours().toString().padStart(2, '0') + ':00'
}

export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

export function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
