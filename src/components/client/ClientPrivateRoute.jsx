import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useClientAuth } from '../../contexts/ClientAuthContext'

export default function ClientPrivateRoute({ children }) {
  const { isAuthenticated, loading } = useClientAuth()
  const location = useLocation()

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress color="primary" />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/client/login" state={{ from: location }} replace />
  }

  return children
}
