import React, { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Alert, Button, CircularProgress, Link } from '@mui/material'
import { Email } from '@mui/icons-material'
import FormTextField from '../../components/FormTextField'
import ClientAuthShell from '../../components/client/ClientAuthShell'
import { clientPortalAPI } from '../../services/clientPortalApi'

export default function ClientForgotPassword() {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await clientPortalAPI.forgotPassword(identifier.trim())
      navigate('/client/reset-password', {
        state: { identifier: identifier.trim(), token: res.token || '' },
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request password reset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ClientAuthShell
      title="Reset Password"
      subtitle="Enter your registered email or phone number. We'll help you set a new password."
      footer={
        <Link component={RouterLink} to="/client/login" fontWeight={600} sx={{ mt: 3, display: 'block', textAlign: 'center' }}>
          Back to sign in
        </Link>
      }
    >
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <FormTextField
          label="Email or Phone Number"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          startAdornment={<Email fontSize="small" sx={{ color: 'text.secondary' }} />}
        />
        <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 2, py: 1.5, fontWeight: 700 }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Token'}
        </Button>
      </form>
    </ClientAuthShell>
  )
}
