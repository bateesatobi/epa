import React, { useState } from 'react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { Alert, Button, CircularProgress, Link, Stack } from '@mui/material'
import { Phone } from '@mui/icons-material'
import FormTextField from '../../components/FormTextField'
import ClientAuthShell from '../../components/client/ClientAuthShell'
import { useClientAuth } from '../../contexts/ClientAuthContext'

export default function ClientLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useClientAuth()
  const [telephone, setTelephone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/client/consignments'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!telephone || !password) {
      setError('Please enter your phone number and password')
      return
    }
    setLoading(true)
    try {
      await login(telephone.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid telephone number or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ClientAuthShell
      title="Client Sign In"
      subtitle="Use your registered phone number and password to access your consignments."
      footer={
        <Stack spacing={1} alignItems="center" sx={{ mt: 3 }}>
          <Link component={RouterLink} to="/client/forgot-password" fontWeight={600}>
            Forgot password?
          </Link>
          <Link component={RouterLink} to="/client/register" fontWeight={600}>
            Create a new account
          </Link>
        </Stack>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <FormTextField
          label="Phone Number"
          type="tel"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          required
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
          disabled={loading}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ mt: 2, py: 1.5, fontWeight: 700 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
        </Button>
      </form>
    </ClientAuthShell>
  )
}
