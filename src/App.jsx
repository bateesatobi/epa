import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ClientAuthProvider } from './contexts/ClientAuthContext'
import { queryClient } from './config/queryClient'
import { Box, CircularProgress } from '@mui/material'

import ClientPortalRedirect from './components/client/ClientPortalRedirect'

// Landing
import LandingPage from './pages/landing/LandingPage'

// Staff portal
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
import ConsignmentRequests from './pages/ConsignmentRequests'
import NotFound from './pages/NotFound'

let ReactQueryDevtools = null
if (process.env.NODE_ENV === 'development') {
  try {
    ReactQueryDevtools = require('@tanstack/react-query-devtools').ReactQueryDevtools
  } catch (e) {}
}

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
      {/* Public marketing */}
      <Route path="/" element={<LandingPage />} />

      {/* Client portal — canonical app is epa-client; redirect all /client/* routes */}
      <Route path="/client/*" element={<ClientPortalRedirect />} />
      <Route path="/client-login" element={<Navigate to="/client/login" replace />} />
      <Route path="/client-register" element={<Navigate to="/client/register" replace />} />
      <Route path="/client-dashboard" element={<Navigate to="/client/consignments" replace />} />

      {/* Staff auth */}
      <Route path="/login" element={<Login />} />

      {/* Staff portal (protected) */}
      <Route
        path="/dashboard"
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
        <Route path="consignment-requests" element={<ConsignmentRequests />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Legacy staff root redirect */}
      <Route path="/users" element={<Navigate to="/dashboard/users" replace />} />
      <Route path="/shipments/*" element={<Navigate to="/dashboard/shipments" replace />} />
      <Route path="/compliance/*" element={<Navigate to="/dashboard/compliance" replace />} />
      <Route path="/notifications" element={<Navigate to="/dashboard/notifications" replace />} />
      <Route path="/reports" element={<Navigate to="/dashboard/reports" replace />} />
      <Route path="/feedback" element={<Navigate to="/dashboard/feedback" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ClientAuthProvider>
          <AppRoutes />
        </ClientAuthProvider>
      </AuthProvider>
      {process.env.NODE_ENV === 'development' && ReactQueryDevtools && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

export default App
