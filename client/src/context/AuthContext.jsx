import React, { createContext, useContext, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => { try { return JSON.parse(localStorage.getItem('clms_user')) } catch { return null } })
  const [token, setToken] = useState(() => localStorage.getItem('clms_token'))

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('clms_token', res.data.token)
    localStorage.setItem('clms_user', JSON.stringify(res.data.user))
    setToken(res.data.token)
    setUser(res.data.user)
    return res.data.user
  }

  async function register(data) {
    const res = await api.post('/auth/register', data)
    localStorage.setItem('clms_token', res.data.token)
    localStorage.setItem('clms_user', JSON.stringify(res.data.user))
    setToken(res.data.token)
    setUser(res.data.user)
    return res.data.user
  }

  function logout() {
    localStorage.removeItem('clms_token')
    localStorage.removeItem('clms_user')
    setToken(null)
    setUser(null)
  }

  async function refreshUser() {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
      localStorage.setItem('clms_user', JSON.stringify(res.data))
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, refreshUser, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
