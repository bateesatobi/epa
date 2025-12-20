import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  LinearProgress,
  CircularProgress,
} from '@mui/material'
import { Phone, Business } from '@mui/icons-material'
import FormTextField from '../components/FormTextField'
import { clientsAPI } from '../services/api'
import {
  showSuccessAlert,
  showErrorAlert,
  showLoadingAlert,
  closeAlert,
} from '../utils/alerts'

const ClientLogin = () => {
  const navigate = useNavigate()
  const [telephone, setTelephone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!telephone || !password) {
      showErrorAlert('Validation Error', 'Please enter both telephone number and password')
      return
    }
    
    setLoading(true)
    const loadingAlert = showLoadingAlert('Logging in...', 'Please wait')

    try {
      const result = await clientsAPI.login(telephone, password)
      // Store client token
      localStorage.setItem('client_token', result.access_token)
      localStorage.setItem('client_data', JSON.stringify(result.client))
      closeAlert()
      await showSuccessAlert('Welcome!', 'Login successful')
      navigate('/client-dashboard')
    } catch (err) {
      closeAlert()
      setError(err.response?.data?.detail || 'Login failed')
      showErrorAlert('Login Failed', err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'white',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <EPALogo width={150} height={75} />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Client Login
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Login with your telephone number
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
          )}

          <form onSubmit={handleSubmit}>
            <FormTextField
              label="Telephone Number"
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              required
              autoComplete="tel"
              autoFocus
              disabled={loading}
              startAdornment={<Phone fontSize="small" sx={{ color: 'text.secondary' }} />}
              placeholder="+256700000000"
            />
            <FormTextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Phone />}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Not registered?{' '}
            <Button
              variant="text"
              size="small"
              onClick={() => navigate('/client-register')}
              sx={{ textTransform: 'none' }}
            >
              Register here
            </Button>
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}

export default ClientLogin



