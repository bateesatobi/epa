import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  clientPortalAPI,
  CLIENT_TOKEN_KEY,
  CLIENT_DATA_KEY,
  setClientSessionExpiredHandler,
} from '../services/clientPortalApi'
import { queryClient } from '../config/queryClient'

const ClientAuthContext = createContext(null)

function readStoredAuth() {
  try {
    const storedToken = localStorage.getItem(CLIENT_TOKEN_KEY)
    const storedClient = localStorage.getItem(CLIENT_DATA_KEY)
    if (storedToken && storedClient) {
      return { token: storedToken, client: JSON.parse(storedClient) }
    }
  } catch {
    localStorage.removeItem(CLIENT_TOKEN_KEY)
    localStorage.removeItem(CLIENT_DATA_KEY)
  }
  return { token: null, client: null }
}

export function ClientAuthProvider({ children }) {
  const stored = readStoredAuth()
  const [client, setClient] = useState(stored.client)
  const [token, setToken] = useState(stored.token)
  const [loading, setLoading] = useState(!!stored.token)
  const logoutRef = useRef(null)

  const logout = useCallback(() => {
    queryClient.clear()
    localStorage.removeItem(CLIENT_TOKEN_KEY)
    localStorage.removeItem(CLIENT_DATA_KEY)
    setToken(null)
    setClient(null)
  }, [])

  logoutRef.current = logout

  useEffect(() => {
    setClientSessionExpiredHandler(() => logoutRef.current?.())
    return () => setClientSessionExpiredHandler(null)
  }, [])

  useEffect(() => {
    if (!stored.token) {
      setLoading(false)
      return undefined
    }

    let cancelled = false

    clientPortalAPI
      .getUnreadCount()
      .catch((err) => {
        if (!cancelled && err.response?.status === 401) {
          logoutRef.current?.()
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (telephone, password) => {
    const result = await clientPortalAPI.login(telephone, password)
    localStorage.setItem(CLIENT_TOKEN_KEY, result.access_token)
    localStorage.setItem(CLIENT_DATA_KEY, JSON.stringify(result.client))
    setToken(result.access_token)
    setClient(result.client)
    return result
  }, [])

  const value = {
    client,
    token,
    loading,
    isAuthenticated: !!token && !!client,
    login,
    logout,
    setClient,
  }

  return (
    <ClientAuthContext.Provider value={value}>{children}</ClientAuthContext.Provider>
  )
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext)
  if (!ctx) throw new Error('useClientAuth must be used within ClientAuthProvider')
  return ctx
}
