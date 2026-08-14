import React, { useState } from 'react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { Alert, Button, CircularProgress, Link } from '@mui/material'
import FormTextField from '../../components/FormTextField'
import ClientAuthShell from '../../components/client/ClientAuthShell'
import { clientPortalAPI } from '../../services/clientPortalApi'

export default function ClientResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const [token, setToken] = useState(location.state?.token || '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const identifier = location.state?.identifier

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!token || !password || !confirm) {
      setError('All fields are required')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await clientPortalAPI.resetPassword(token.trim(), password)
      navigate('/client/login', { state: { message: 'Password updated. Please sign in.' } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ClientAuthShell
      title="Set New Password"
      subtitle={
        identifier
          ? `Enter the reset token for ${identifier}, then choose a new password.`
          : 'Enter your reset token and new password.'
      }
      footer={
        <Link component={RouterLink} to="/client/login" fontWeight={600} sx={{ mt: 3, display: 'block', textAlign: 'center' }}>
          Back to sign in
        </Link>
      }
    >
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {token && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Reset token has been pre-filled from your request.
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <FormTextField label="Reset Token" value={token} onChange={(e) => setToken(e.target.value)} required />
        <FormTextField label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <FormTextField label="Confirm Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 2, py: 1.5, fontWeight: 700 }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
        </Button>
      </form>
    </ClientAuthShell>
  )
}
