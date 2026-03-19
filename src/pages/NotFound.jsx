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
    <Box sx={{ width: '100%', py: 8, bgcolor: '#FFFFFF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box
          sx={{
            textAlign: 'center',
            p: 4,
            maxWidth: 500,
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '24px',
              bgcolor: 'rgba(0,0,0,0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 4,
              border: '1px solid #F0F0F0'
            }}
          >
            <ErrorOutline sx={{ fontSize: 48, color: '#000' }} />
          </Box>
          
          <Typography variant="h2" sx={{ fontWeight: 800, color: '#01A3DA', mb: 1, letterSpacing: '-0.02em' }}>
            404
          </Typography>
          
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#000', mb: 2 }}>
            Protocol Gap Detected
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 5, fontWeight: 500, lineHeight: 1.6 }}>
            The requested coordinate does not exist within the current operational grid. 
            Please verify the URL or return to the central command deck.
          </Typography>
          
          <Stack direction="row" spacing={2} justifyContent="center">
            {isProtectedRoute && (
              <Button
                variant="contained"
                disableElevation
                startIcon={<Home />}
                onClick={() => navigate('/')}
                sx={{ 
                  borderRadius: 2, textTransform: 'none', fontWeight: 600,
                  bgcolor: '#01A3DA', px: 3, py: 1.2,
                  '&:hover': { bgcolor: '#0088b8' }
                }}
              >
                Go to Dashboard
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1)
                } else {
                  navigate(isProtectedRoute ? '/' : '/login')
                }
              }}
              sx={{ 
                borderRadius: 2, textTransform: 'none', fontWeight: 600,
                borderColor: '#EEEEEE', color: '#000', px: 3,
                '&:hover': { borderColor: '#000', bgcolor: 'transparent' }
              }}
            >
              Go Back
            </Button>
          </Stack>
        </Box>
    </Box>
  )
}

export default NotFound

