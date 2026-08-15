import React, { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  LinearProgress,
  Stack,
  Chip,
  Divider,
  IconButton,
} from '@mui/material'
import {
  Security,
  LocalShipping,
  Assignment,
  Sync,
  ArrowBack,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { showSuccessAlert, showErrorAlert, showLoadingAlert, closeAlert } from '../utils/alerts'
import FormTextField from '../components/FormTextField'
import EPALogo from '../components/EPALogo'

/**
 * Field Staff Portal login — mirrors mobile Staff Portal.
 * Uses POST /api/auth/field-staff/login (email and/or staff ID).
 */
export default function FieldStaffLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginFieldStaff } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()

    if (!trimmedEmail || !password) {
      showErrorAlert('Validation Error', 'Enter your work email and password')
      return
    }

    setLoading(true)
    const loadingAlert = showLoadingAlert('Signing in…', 'Opening Field Staff portal')

    try {
      const result = await loginFieldStaff({
        email: trimmedEmail,
        password,
      })
      if (result.success) {
        closeAlert()
        await showSuccessAlert('Welcome!', 'Field Staff portal ready')
        navigate('/dashboard/field-staff')
      } else {
        closeAlert()
        setError(result.error || 'Login failed')
        showErrorAlert('Access Denied', result.error || 'Invalid staff credentials')
      }
    } catch {
      closeAlert()
      setError('An error occurred. Please try again.')
      showErrorAlert('System Error', 'Unable to reach the Field Staff login service.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: '#0A192F',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        <Box
          component="img"
          src="/hero-logistics.jpg"
          alt=""
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '70% center',
            display: 'block',
          }}
        />
      </Box>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: `
            linear-gradient(115deg, rgba(10, 25, 47, 0.9) 0%, rgba(10, 25, 47, 0.75) 50%, rgba(10, 25, 47, 0.6) 100%),
            linear-gradient(180deg, rgba(10, 25, 47, 0.4) 0%, transparent 35%, rgba(10, 25, 47, 0.55) 100%)
          `,
        }}
      />

      <IconButton
        component={RouterLink}
        to="/"
        aria-label="Back to landing page"
        sx={{
          position: 'absolute',
          top: { xs: 16, md: 24 },
          left: { xs: 12, md: 24 },
          zIndex: 2,
          color: '#fff',
          bgcolor: 'rgba(255,255,255,0.08)',
          '&:hover': { bgcolor: 'rgba(1,163,218,0.25)' },
        }}
      >
        <ArrowBack />
      </IconButton>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 4, md: 8 }}
          alignItems="center"
          sx={{ width: '100%', py: 8 }}
        >
          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' }, color: '#fff' }}>
            <Box sx={{ mb: 3, display: 'inline-block' }}>
              <EPALogo variant="white" width={160} height={52} />
            </Box>
            <Chip
              label="Staff Portal"
              sx={{
                mb: 2,
                fontWeight: 800,
                bgcolor: 'rgba(1,163,218,0.2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
            <Typography
              variant="h2"
              fontWeight={800}
              sx={{
                mb: 2,
                letterSpacing: '-1px',
                lineHeight: 1.1,
                fontSize: { xs: '2rem', md: '2.75rem' },
              }}
            >
              Field Staff
              <br />
              <Typography component="span" variant="inherit" sx={{ color: '#01A3DA' }}>
                Portal
              </Typography>
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.78)', fontWeight: 400, mb: 4, maxWidth: 480 }}>
              Assignments, clearance tasks & field operations — same portal as the mobile Staff app.
            </Typography>

            <Stack spacing={2} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {[
                { icon: <Assignment sx={{ color: '#01A3DA' }} />, text: 'Your clearance assignments' },
                { icon: <Sync sx={{ color: '#01A3DA' }} />, text: 'Update activity status in the field' },
                { icon: <LocalShipping sx={{ color: '#01A3DA' }} />, text: 'Consignments & incoming requests' },
              ].map((item) => (
                <Stack key={item.text} direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      bgcolor: 'rgba(1,163,218,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="body1" fontWeight={500} color="rgba(255,255,255,0.9)">
                    {item.text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Box sx={{ flex: 0.85, width: '100%', maxWidth: 440 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3.5, md: 5 },
                borderRadius: 4,
                bgcolor: '#FFFFFF',
                boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={800} color="#0A192F" gutterBottom>
                  Field staff sign in
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use your EPA work email and password — same as the mobile Staff Portal.
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              {loading && (
                <LinearProgress
                  sx={{
                    mb: 2.5,
                    borderRadius: 1,
                    bgcolor: '#E9ECEF',
                    '& .MuiLinearProgress-bar': { bgcolor: '#01A3DA' },
                  }}
                />
              )}

              <form onSubmit={handleSubmit}>
                <FormTextField
                  label="Work email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  sx={{ mb: 2 }}
                  placeholder="you@epacarriers.agency"
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
                  sx={{
                    py: 1.7,
                    borderRadius: 2,
                    bgcolor: '#01A3DA',
                    fontWeight: 800,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': { bgcolor: '#0178A3' },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Enter Field Staff portal'}
                </Button>
              </form>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={1.5} alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Security sx={{ fontSize: 16, color: '#01A3DA' }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Field-staff endpoint · secure session
                  </Typography>
                </Stack>
                <Button
                  component={RouterLink}
                  to="/login"
                  size="small"
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                >
                  Admin / officer sign in →
                </Button>
                <Button
                  component={RouterLink}
                  to="/"
                  startIcon={<ArrowBack />}
                  size="small"
                  color="inherit"
                  sx={{ fontWeight: 600, textTransform: 'none', color: 'text.secondary' }}
                >
                  Back to landing
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
