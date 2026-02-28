// @system — Auth context: provides user, login, logout, register to the whole app
// Wrap your root component (or App) with <AuthProvider>.
// Consume with useAuthContext() in any component.

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/@system/api'




const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.get('/sessions/me')
      setUser(user)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const login = useCallback(async (email, password) => {
    const { user } = await api.post('/sessions', { email, password })
    setUser(user)
  }, [])

  const register = useCallback(async (name, email, password) => {
    await api.post('/users', { name, email, password })
    await login(email, password)
  }, [login])

  const logout = useCallback(async () => {
    await api.delete('/sessions')
    setUser(null)
  }, [])

  const updateUser = useCallback(async (fields) => {
    const { user: updated } = await api.patch('/users/me', fields)
    setUser(updated)
  }, [])

  const resendVerificationEmail = useCallback(async () => {
    await api.post('/users/email/verify/request', {})
  }, [])

  const completeOnboarding = useCallback(async (data) => {
    const { user: updated } = await api.post('/onboarding/complete', data ?? {})
    setUser(updated)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, login, register, logout, refresh, updateUser, resendVerificationEmail, completeOnboarding }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(){
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>')
  return ctx
}

