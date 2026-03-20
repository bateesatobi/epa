import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { queryClient } from './config/queryClient'

// Conditionally import DevTools (only in development)
let ReactQueryDevtools = null
if (process.env.NODE_ENV === 'development') {
  try {
    ReactQueryDevtools = require('@tanstack/react-query-devtools').ReactQueryDevtools
  } catch (e) {
    // DevTools not installed, that's okay
  }
}
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'
import Users from './pages/Users'
import Shipments from './pages/Shipments'
import ShipmentDetail from './pages/ShipmentDetail'
import Compliance from './pages/Compliance'
import ComplianceDetail from './pages/ComplianceDetail'
import Reports from './pages/Reports'
import FieldStaffPerformance from './pages/FieldStaffPerformance'
import Notifications from './pages/Notifications'
import Feedback from './pages/Feedback'
import ShipmentClearanceHistoryPage from './pages/ShipmentClearanceHistoryPage'
import Depots from './pages/Depots'
import ClearanceActivities from './pages/ClearanceActivities'
import ClientRegistration from './pages/ClientRegistration'
import ClientLogin from './pages/ClientLogin'
import ClientDashboard from './pages/ClientDashboard'
import NotFound from './pages/NotFound'
import { Box, CircularProgress } from '@mui/material'

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/client-register" element={<ClientRegistration />} />
      <Route path="/client-login" element={<ClientLogin />} />
      <Route path="/client-dashboard" element={<ClientDashboard />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="shipments" element={<Shipments />} />
        <Route path="shipments/:shipmentId" element={<ShipmentDetail />} />
        <Route path="shipments/:shipmentId/clearance-history" element={<ShipmentClearanceHistoryPage />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="compliance/:shipmentId" element={<ComplianceDetail />} />
        <Route path="reports" element={<Reports />} />
        <Route path="field-staff-performance" element={<FieldStaffPerformance />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="depots" element={<Depots />} />
        <Route path="clearance-activities" element={<ClearanceActivities />} />
        {/* Unmatched sub-routes show NotFound */}
        <Route path="*" element={<NotFound />} />
      </Route>
      {/* Completely unmatched top-level routes redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
      {/* React Query DevTools - only shows in development */}
      {process.env.NODE_ENV === 'development' && ReactQueryDevtools && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

export default App

