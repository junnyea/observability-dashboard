import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('obv-token'))
  const [loading, setLoading] = useState(true)

  // Set axios default header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      localStorage.setItem('obv-token', token)
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('obv-token')
    }
  }, [token])

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await axios.get(`${API_URL}/api/auth/verify`)
        if (res.data.valid) {
          setUser(res.data.user)
        } else {
          setToken(null)
          setUser(null)
        }
      } catch (err) {
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [])

  const login = async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { username, password })
      if (res.data.success) {
        setToken(res.data.token)
        setUser(res.data.user)
        return { success: true }
      }
      return { success: false, message: 'Login failed' }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed'
      }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
