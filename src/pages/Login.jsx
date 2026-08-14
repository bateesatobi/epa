import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Button,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  LinearProgress,
  Stack,
  Divider,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  Login as LoginIcon,
  Security,
  LocalShipping,
  VerifiedUser,
  Dashboard as DashboardIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { showSuccessAlert, showErrorAlert, showLoadingAlert, closeAlert } from '../utils/alerts'
import FormTextField from '../components/FormTextField'
import EPALogo from '../components/EPALogo'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      showErrorAlert('Validation Error', 'Please enter both email and password')
      return
    }
    
    setLoading(true)
    const loadingAlert = showLoadingAlert('Authenticating...', 'Accessing secure terminal')

    try {
      const result = await login(email, password)
      if (result.success) {
        closeAlert()
        await showSuccessAlert('Welcome!', 'Login successful')
        navigate('/dashboard')
      } else {
        closeAlert()
        setError(result.error || 'Login failed')
        showErrorAlert('Access Denied', result.error || 'Invalid credentials provided')
      }
    } catch (err) {
      closeAlert()
      setError('An error occurred. Please try again.')
      showErrorAlert('System Error', 'Unable to establish secure connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Structural Decorative Elements - Minimalist */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(1, 163, 218, 0.03) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 0, 0, 0.02) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      {/* Main Content Container */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 4, md: 8 }}
          alignItems="center"
          sx={{ width: '100%', py: 8 }}
        >
          {/* Left Side: Brand & Mission */}
          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            <Box sx={{ mb: 4, display: 'inline-block' }}>
              <EPALogo width={180} height={60} />
            </Box>
            <Typography 
              variant="h2" 
              fontWeight={800} 
              sx={{ 
                color: '#000000', 
                mb: 2, 
                letterSpacing: '-1px',
                lineHeight: 1.1 
              }}
            >
              Enterprise <br />
              <Typography component="span" variant="inherit" sx={{ color: '#01A3DA' }}>
                Operational Cockpit
              </Typography>
            </Typography>
            <Typography variant="h6" sx={{ color: '#444', fontWeight: 400, mb: 4, maxWidth: 500 }}>
              The definitive command center for freight logistics and compliance governance.
            </Typography>

            {/* Value Indicators */}
            <Stack spacing={2} sx={{ display: { xs: 'none', md: 'block' } }}>
              {[
                { icon: <DashboardIcon sx={{ color: '#01A3DA' }} />, text: 'Real-time operational intelligence' },
                { icon: <LocalShipping sx={{ color: '#01A3DA' }} />, text: 'Seamless consignment tracking' },
                { icon: <VerifiedUser sx={{ color: '#01A3DA' }} />, text: 'Rigorous compliance governance' },
              ].map((item, index) => (
                <Stack key={index} direction="row" spacing={2} alignItems="center">
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 1, 
                    bgcolor: 'rgba(1, 163, 218, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.icon}
                  </Box>
                  <Typography variant="body1" fontWeight={500} color="#333">
                    {item.text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Right Side: Login Terminal */}
          <Box sx={{ flex: 0.8, width: '100%', maxWidth: 450 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, md: 6 },
                borderRadius: 4,
                bgcolor: '#FFFFFF',
                border: '1px solid',
                borderColor: '#E9ECEF',
                boxShadow: '0 24px 48px rgba(0,0,0,0.06)',
              }}
            >
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight={700} color="#000" gutterBottom>
                  Admin Access
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please authenticate to enter the cockpit.
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: '#FFF5F5' }}>
                  {error}
                </Alert>
              )}

              {loading && (
                <LinearProgress sx={{ mb: 3, borderRadius: 1, bgcolor: '#E9ECEF', '& .MuiLinearProgress-bar': { bgcolor: '#01A3DA' } }} />
              )}

              <form onSubmit={handleSubmit}>
                <FormTextField
                  label="Network ID (Email)"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  sx={{ mb: 3 }}
                />
                <FormTextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  sx={{ mb: 4 }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.8,
                    borderRadius: 2,
                    bgcolor: '#000000',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: '#333333',
                      transform: 'translateY(-1px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Enter Dashboard'
                  )}
                </Button>
              </form>

              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                  <Security sx={{ fontSize: 16, color: '#01A3DA' }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    Secure 256-bit encrypted session
                  </Typography>
                </Stack>
              </Box>
            </Paper>
            
            <Typography variant="caption" sx={{ mt: 3, display: 'block', textAlign: 'center', color: '#AAA' }}>
              &copy; {new Date().getFullYear()} EPA Logistics. All rights reserved.
            </Typography>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}

export default Login




