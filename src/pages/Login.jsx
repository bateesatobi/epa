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
  Grid,
  Stack,
  Divider,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  Login as LoginIcon,
  Business,
  Security,
  Dashboard,
  LocalShipping,
  VerifiedUser,
  Assessment,
  Speed,
  TrendingUp,
  Shield,
  CheckCircle,
  Analytics,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { showSuccessAlert, showErrorAlert, showLoadingAlert, closeAlert } from '../utils/alerts'
import FormTextField from '../components/FormTextField'
import EPALogo from '../components/EPALogo'

const FeatureItem = ({ icon, title, description }) => (
  <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: alpha('#fff', 0.1),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 48,
        height: 48,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'white', mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: alpha('#fff', 0.8) }}>
        {description}
      </Typography>
    </Box>
  </Stack>
)

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
    const loadingAlert = showLoadingAlert('Logging in...', 'Please wait')

    try {
      const result = await login(email, password)
      if (result.success) {
        closeAlert()
        await showSuccessAlert('Welcome!', 'Login successful')
        navigate('/')
      } else {
        closeAlert()
        setError(result.error || 'Login failed')
        showErrorAlert('Login Failed', result.error || 'Invalid credentials')
      }
    } catch (err) {
      closeAlert()
      setError('An error occurred. Please try again.')
      showErrorAlert('Login Failed', 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: '#f5f7fa',
      }}
    >
      {/* Left Side - Content */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '200%',
            height: '200%',
            top: '-50%',
            right: '-50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'float 20s infinite linear',
            '@keyframes float': {
              '0%': { transform: 'translate(0, 0)' },
              '100%': { transform: 'translate(50px, 50px)' },
            },
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            p: 6,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          {/* Logo and Title */}
          <Box sx={{ mb: 6 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: alpha('#fff', 0.2),
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <EPALogo width={120} height={60} variant="white" />
              </Box>
              <Box>
                <Typography variant="h3" component="h1" fontWeight="bold" sx={{ color: 'white', mb: 0.5 }}>
                  EPA-COCKPIT
                </Typography>
                <Typography variant="body1" sx={{ color: alpha('#fff', 0.9) }}>
                  Freight Management System
                </Typography>
              </Box>
            </Stack>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 500, mb: 1 }}>
              Welcome to Your Command Center
            </Typography>
            <Typography variant="body1" sx={{ color: alpha('#fff', 0.85), maxWidth: '90%', lineHeight: 1.8 }}>
              Streamline your freight operations with real-time tracking, compliance management, and comprehensive analytics all in one powerful platform.
            </Typography>
          </Box>

          <Divider sx={{ my: 4, borderColor: alpha('#fff', 0.2) }} />

          {/* Features */}
          <Box>
            <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
              Key Features
            </Typography>
            <FeatureItem
              icon={<Dashboard sx={{ fontSize: 24, color: 'white' }} />}
              title="Real-Time Dashboard"
              description="Monitor all operations at a glance with live updates and KPIs"
            />
            <FeatureItem
              icon={<LocalShipping sx={{ fontSize: 24, color: 'white' }} />}
              title="Consignment Management"
              description="Track and manage consignments from origin to destination seamlessly"
            />
            <FeatureItem
              icon={<VerifiedUser sx={{ fontSize: 24, color: 'white' }} />}
              title="Compliance Tracking"
              description="Ensure regulatory compliance with automated documentation and checks"
            />
            <FeatureItem
              icon={<Analytics sx={{ fontSize: 24, color: 'white' }} />}
              title="Advanced Analytics"
              description="Make data-driven decisions with comprehensive reports and insights"
            />
          </Box>

          {/* Stats or Trust Indicators */}
          <Box sx={{ mt: 'auto', pt: 4 }}>
            <Stack direction="row" spacing={4}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Shield sx={{ fontSize: 20, color: alpha('#fff', 0.9) }} />
                  <Typography variant="body2" sx={{ color: alpha('#fff', 0.9), fontWeight: 500 }}>
                    Secure & Reliable
                  </Typography>
                </Stack>
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Speed sx={{ fontSize: 20, color: alpha('#fff', 0.9) }} />
                  <Typography variant="body2" sx={{ color: alpha('#fff', 0.9), fontWeight: 500 }}>
                    High Performance
                  </Typography>
                </Stack>
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckCircle sx={{ fontSize: 20, color: alpha('#fff', 0.9) }} />
                  <Typography variant="body2" sx={{ color: alpha('#fff', 0.9), fontWeight: 500 }}>
                    Enterprise Ready
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Right Side - Login Form */}
      <Box
        sx={{
          flex: { xs: 1, lg: 0.6 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 4, md: 6 },
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
              borderRadius: 4,
              background: 'white',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* Mobile Logo */}
            <Box sx={{ display: { xs: 'block', lg: 'none' }, textAlign: 'center', mb: 4 }}>
              <Stack direction="column" spacing={2} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
                <EPALogo width={120} height={60} />
                <Box>
                  <Typography variant="h5" component="h1" fontWeight="bold">
                    EPA-COCKPIT
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Freight Management System
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Desktop Header */}
            <Box sx={{ display: { xs: 'none', lg: 'block' }, mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sign in to access your admin cockpit
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {loading && (
              <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />
            )}

            <form onSubmit={handleSubmit}>
              <FormTextField
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                disabled={loading}
                sx={{ mb: 2.5 }}
              />
              <FormTextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                sx={{
                  mt: 1,
                  mb: 3,
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                  },
                }}
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </Button>
            </form>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <Security sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Secure login with encrypted credentials
                </Typography>
              </Stack>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  )
}

export default Login




