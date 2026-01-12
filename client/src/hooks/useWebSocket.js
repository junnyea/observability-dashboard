import { useEffect, useState, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

function getToken() {
  return localStorage.getItem('obv-token')
}

export function useLogStream() {
  const [logs, setLogs] = useState([])
  const [connected, setConnected] = useState(false)
  const [paused, setPaused] = useState(false)
  const socketRef = useRef(null)
  const pausedRef = useRef(paused)
  const lastLogCountRef = useRef(0)

  // Keep pausedRef in sync
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  // Fetch initial/recent logs via REST API
  useEffect(() => {
    const fetchRecentLogs = async () => {
      const token = getToken()
      if (!token) return

      try {
        const res = await axios.get(`${API_URL}/api/logs/recent?lines=100`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data && res.data.length > 0) {
          setLogs(prev => {
            // Only update if we have new logs
            if (res.data.length !== lastLogCountRef.current) {
              lastLogCountRef.current = res.data.length
              return res.data
            }
            return prev
          })
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err.message)
      }
    }

    fetchRecentLogs()
    // Poll every 2 seconds as fallback
    const interval = setInterval(fetchRecentLogs, 2000)
    return () => clearInterval(interval)
  }, [])

  // Also try WebSocket for real-time updates
  useEffect(() => {
    const token = getToken()
    if (!token) return

    const socket = io(`${API_URL}/logs`, {
      transports: ['websocket', 'polling'],
      auth: { token }
    })

    socket.on('connect', () => {
      console.log('Connected to log stream')
      setConnected(true)
    })

    socket.on('connect_error', (err) => {
      console.error('Log stream connection error:', err.message)
      setConnected(false)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from log stream')
      setConnected(false)
    })

    socket.on('log', (logEntry) => {
      if (!pausedRef.current) {
        setLogs(prev => {
          const newLogs = [...prev, logEntry]
          return newLogs.slice(-1000)
        })
      }
    })

    socket.on('tailer-error', (error) => {
      console.error('Log tailer error:', error)
    })

    socketRef.current = socket

    return () => {
      socket.close()
    }
  }, [])

  const subscribe = useCallback((services) => {
    socketRef.current?.emit('subscribe', services)
  }, [])

  const filter = useCallback((filters) => {
    socketRef.current?.emit('filter', filters)
  }, [])

  const clear = useCallback(() => {
    setLogs([])
  }, [])

  const togglePause = useCallback(() => {
    setPaused(p => !p)
  }, [])

  return { logs, connected, paused, subscribe, filter, clear, togglePause }
}

export function useHealthStream() {
  const [status, setStatus] = useState({ services: {}, uptime: {}, avgResponseTime: {} })
  const [connected, setConnected] = useState(false)

  // Fetch initial data via REST API
  useEffect(() => {
    const fetchInitialHealth = async () => {
      const token = getToken()
      if (!token) return

      try {
        const res = await axios.get(`${API_URL}/api/health`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setStatus(res.data)
      } catch (err) {
        console.error('Failed to fetch initial health:', err.message)
      }
    }

    fetchInitialHealth()
    // Poll every 5 seconds as fallback
    const interval = setInterval(fetchInitialHealth, 5000)
    return () => clearInterval(interval)
  }, [])

  // Also try WebSocket for real-time updates
  useEffect(() => {
    const token = getToken()
    if (!token) return

    const socket = io(`${API_URL}/health`, {
      transports: ['websocket', 'polling'],
      auth: { token }
    })

    socket.on('connect', () => {
      console.log('Connected to health stream')
      setConnected(true)
    })

    socket.on('connect_error', (err) => {
      console.error('Health stream connection error:', err.message)
      setConnected(false)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socket.on('status', (data) => {
      setStatus(data)
    })

    return () => {
      socket.close()
    }
  }, [])

  return { status, connected }
}
