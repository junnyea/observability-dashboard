import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
  baseURL: `${API_URL}/api`
})

export async function getHealth() {
  const res = await api.get('/health')
  return res.data
}

export async function getMetricsSummary() {
  const res = await api.get('/metrics/summary')
  return res.data
}

export async function getHourlyMetrics(hours = 24) {
  const res = await api.get(`/metrics/hourly?hours=${hours}`)
  return res.data
}

export async function getTopEndpoints(limit = 10) {
  const res = await api.get(`/metrics/top-endpoints?limit=${limit}`)
  return res.data
}

export async function getDashboardInfo() {
  const res = await api.get('/info')
  return res.data
}
