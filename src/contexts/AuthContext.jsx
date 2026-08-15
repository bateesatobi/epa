import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()
AuthContext.displayName = 'AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchCurrentUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchCurrentUser = async () => {
    try {
      const userData = await authAPI.getCurrentUser(token)
      setUser(userData)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password)
      const { access_token } = response
      setToken(access_token)
      localStorage.setItem('token', access_token)
      localStorage.setItem('loginPortal', 'admin')
      const userData = await authAPI.getCurrentUser(access_token)
      setUser(userData)
      setLoading(false)
      const roles = userData?.roles || []
      const has = (name) => roles.some((r) => r.name === name)
      return {
        success: true,
        isAdmin: has('admin'),
        isReportingOfficer: has('reporting-officer'),
        isFieldStaff: has('field-staff'),
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      }
    }
  }

  const loginFieldStaff = async ({ email, userId, password }) => {
    try {
      const response = await authAPI.fieldStaffLogin({ email, userId, password })
      const { access_token, user: userFromLogin } = response
      setToken(access_token)
      localStorage.setItem('token', access_token)
      localStorage.setItem('loginPortal', 'field_staff')
      let userData = userFromLogin
      if (!userData) {
        userData = await authAPI.getCurrentUser(access_token)
      }
      setUser(userData)
      setLoading(false)
      const roles = userData?.roles || []
      const has = (name) => roles.some((r) => r.name === name)
      if (!has('field-staff')) {
        logout()
        return {
          success: false,
          error: 'This portal is only for field staff accounts.',
        }
      }
      return {
        success: true,
        isAdmin: has('admin'),
        isReportingOfficer: has('reporting-officer'),
        isFieldStaff: true,
      }
    } catch (error) {
      const detail = error.response?.data?.detail
      return {
        success: false,
        error:
          (typeof detail === 'string' && detail) ||
          (Array.isArray(detail) && detail[0]?.msg) ||
          'Field staff login failed',
      }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('loginPortal')
  }

  const isAdmin = user?.roles?.some((role) => role.name === 'admin') || false
  const isReportingOfficer = user?.roles?.some((role) => role.name === 'reporting-officer') || false
  const isFieldStaff = user?.roles?.some((role) => role.name === 'field-staff') || false
  const isStaff = isAdmin || isReportingOfficer || isFieldStaff

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    isAdmin,
    isReportingOfficer,
    isFieldStaff,
    isStaff,
    login,
    loginFieldStaff,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}




