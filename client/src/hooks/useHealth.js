import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

export function useHealth() {
  const [data, setData] = useState({ services: {}, uptime: {}, avgResponseTime: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHealth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/health`)
      setData(res.data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 5000)
    return () => clearInterval(interval)
  }, [])

  return { ...data, loading, error, refetch: fetchHealth }
}

export function useMetricsSummary() {
  const [data, setData] = useState({
    today: 0,
    todayErrors: 0,
    week: 0,
    weekErrors: 0,
    todayErrorRate: 0,
    weekErrorRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/metrics/summary`)
        setData(res.data)
      } catch (err) {
        console.error('Error fetching metrics summary:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
    const interval = setInterval(fetchSummary, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return { data, loading }
}

export function useHourlyMetrics() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHourly = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/metrics/hourly?hours=24`)
        setData(res.data)
      } catch (err) {
        console.error('Error fetching hourly metrics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHourly()
    const interval = setInterval(fetchHourly, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  return { data, loading }
}

export function useTopEndpoints() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/metrics/top-endpoints?limit=10`)
        setData(res.data)
      } catch (err) {
        console.error('Error fetching top endpoints:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEndpoints()
    const interval = setInterval(fetchEndpoints, 60000)
    return () => clearInterval(interval)
  }, [])

  return { data, loading }
}

export function useServiceDbHealth() {
  const [data, setData] = useState({ dev: null, prod: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDbHealth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/health/service-db`)
      setData(res.data)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching service DB health:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDbHealth()
    const interval = setInterval(fetchDbHealth, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  return { data, loading, error, refetch: fetchDbHealth }
}
