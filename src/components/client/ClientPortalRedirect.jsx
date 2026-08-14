import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Box, CircularProgress, Typography, Button } from '@mui/material'

/**
 * Redirects legacy embedded /client/* routes to the canonical epa-client portal.
 * Set VITE_CLIENT_PORTAL_URL (e.g. https://client.epacarriers.agency or http://localhost:5174).
 */
const CLIENT_PORTAL_URL = (import.meta.env.VITE_CLIENT_PORTAL_URL || '').replace(/\/$/, '')

export default function ClientPortalRedirect() {
  const location = useLocation()

  useEffect(() => {
    if (!CLIENT_PORTAL_URL) return
    const subPath = location.pathname.replace(/^\/client/, '') || '/consignments'
    const target = `${CLIENT_PORTAL_URL}${subPath}${location.search}${location.hash}`
    window.location.replace(target)
  }, [location])

  if (!CLIENT_PORTAL_URL) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
        gap={2}
        px={3}
        textAlign="center"
      >
        <Typography variant="h6" fontWeight={700}>
          Client portal has moved
        </Typography>
        <Typography variant="body2" color="text.secondary" maxWidth={420}>
          Configure <code>VITE_CLIENT_PORTAL_URL</code> on the admin app to point to the standalone
          client portal (epa-client). Until then, use the client app directly.
        </Typography>
        <Button variant="contained" href="http://localhost:5174" target="_blank" rel="noopener noreferrer">
          Open client portal
        </Button>
      </Box>
    )
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="40vh" gap={2}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Redirecting to client portal…
      </Typography>
    </Box>
  )
}
