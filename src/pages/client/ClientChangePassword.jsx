import React, { useState } from 'react'
import { Alert, Button, Card, CardContent, CircularProgress, Typography } from '@mui/material'
import FormTextField from '../../components/FormTextField'
import { clientPortalAPI } from '../../services/clientPortalApi'
import { showSuccessAlert } from '../../utils/alerts'

export default function ClientChangePassword() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (next !== confirm) {
      setError('New passwords do not match')
      return
    }
    if (next.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await clientPortalAPI.changePassword(current, next)
      showSuccessAlert('Success', 'Password updated successfully')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card sx={{ maxWidth: 520, borderRadius: 3, border: '1px solid #E9ECEF' }} elevation={0}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Change Password
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Keep your account secure with a strong, unique password.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <FormTextField label="Current Password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          <FormTextField label="New Password" type="password" value={next} onChange={(e) => setNext(e.target.value)} required />
          <FormTextField label="Confirm New Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <Button type="submit" variant="contained" disabled={loading} sx={{ mt: 2, fontWeight: 700 }}>
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Update Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
