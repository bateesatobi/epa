import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Box, Typography, Button, Paper } from '@mui/material'
import { Home, ArrowBack, ErrorOutline } from '@mui/icons-material'

const NotFound = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Check if we're in a protected route
  const isProtectedRoute = location.pathname !== '/login' && 
                          location.pathname !== '/client-login' && 
                          location.pathname !== '/client-register'

  return (
    <Box sx={{ width: '100%', py: 8 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            py: 8,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)',
              border: '1px solid rgba(25, 118, 210, 0.1)',
              maxWidth: 600,
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(211, 47, 47, 0.05) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <ErrorOutline sx={{ fontSize: 64, color: 'error.main' }} />
            </Box>
            
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              404
            </Typography>
            
            <Typography variant="h5" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
              Page Not Found
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
              The page you're looking for doesn't exist or has been moved. 
              Please check the URL or navigate back to the dashboard.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              {isProtectedRoute && (
                <Button
                  variant="contained"
                  startIcon={<Home />}
                  onClick={() => navigate('/')}
                  size="large"
                  sx={{ minWidth: 160 }}
                >
                  Go to Dashboard
                </Button>
              )}
              <Button
                variant={isProtectedRoute ? "outlined" : "contained"}
                startIcon={<ArrowBack />}
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1)
                  } else {
                    navigate(isProtectedRoute ? '/' : '/login')
                  }
                }}
                size="large"
                sx={{ minWidth: 160 }}
              >
                Go Back
              </Button>
            </Box>
          </Paper>
        </Box>
    </Box>
  )
}

export default NotFound

