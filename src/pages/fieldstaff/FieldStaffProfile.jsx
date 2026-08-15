import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Stack,
  Typography,
  Avatar,
  Button,
  TextField,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Divider,
} from '@mui/material'
import {
  Logout,
  Lock,
  EmailOutlined,
  PhoneOutlined,
  BadgeOutlined,
  PersonOutline,
  Visibility,
  VisibilityOff,
  ArrowBack,
  Shield,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import { authAPI } from '../../services/api'

function DetailRow({ icon: Icon, label, value }) {
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ py: 1.75 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: 'rgba(1, 163, 218, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ color: '#01A3DA', fontSize: 20 }} />
      </Box>
      <Box sx={{ minWidth: 0, pt: 0.25 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            display: 'block',
            mb: 0.25,
          }}
        >
          {label}
        </Typography>
        <Typography variant="body1" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
          {value || '—'}
        </Typography>
      </Box>
    </Stack>
  )
}

export default function FieldStaffProfile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const displayName = user?.full_name || user?.username || 'Field Staff'
  const roleLabels = useMemo(() => {
    const fromRoles = (user?.roles || []).map((r) => r.name).filter(Boolean)
    if (fromRoles.length) return fromRoles
    return ['field-staff']
  }, [user?.roles])

  const initials = useMemo(() => {
    const parts = String(displayName).trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return String(displayName).charAt(0).toUpperCase() || 'F'
  }, [displayName])

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Enter current and new password')
      return
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    setSaving(true)
    try {
      await authAPI.changePassword(currentPassword, newPassword)
      toast.success('Password updated')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/staff-login')
  }

  return (
    <Box sx={{ pb: { xs: 4, md: 6 }, maxWidth: 1100, mx: 'auto' }}>
      {/* Identity hero */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          mb: 3,
          background: 'linear-gradient(135deg, #0A192F 0%, #12253F 55%, #0E3A4F 100%)',
          color: '#fff',
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(1,163,218,0.28) 0%, transparent 70%)',
          }}
        />
        <Box sx={{ position: 'relative', p: { xs: 2.5, sm: 3.5, md: 4 } }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard/field-staff')}
            sx={{
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 700,
              px: 0,
              mb: 2.5,
              '&:hover': { bgcolor: 'transparent', color: '#fff' },
            }}
          >
            Back to home
          </Button>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 2.5, sm: 3 }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Box sx={{ position: 'relative' }}>
              <Avatar
                sx={{
                  width: { xs: 72, md: 88 },
                  height: { xs: 72, md: 88 },
                  bgcolor: '#01A3DA',
                  fontWeight: 800,
                  fontSize: { xs: '1.5rem', md: '1.85rem' },
                  border: '3px solid rgba(255,255,255,0.2)',
                }}
              >
                {initials}
              </Avatar>
              <Box
                sx={{
                  position: 'absolute',
                  right: -2,
                  bottom: -2,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: '#0A192F',
                  border: '2px solid rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield sx={{ fontSize: 14, color: '#01A3DA' }} />
              </Box>
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="overline"
                sx={{ opacity: 0.7, fontWeight: 700, letterSpacing: 1.4, display: 'block' }}
              >
                Staff account
              </Typography>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ fontSize: { xs: '1.45rem', md: '1.9rem' }, lineHeight: 1.2, mb: 1 }}
              >
                {displayName}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {roleLabels.map((role) => (
                  <Chip
                    key={role}
                    size="small"
                    label={String(role).replace(/-/g, ' ')}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Account details */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              height: '100%',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#fff',
            }}
          >
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>
              Account details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Information linked to your EPA staff login.
            </Typography>
            <Divider sx={{ mb: 0.5 }} />
            <DetailRow icon={PersonOutline} label="Full name" value={displayName} />
            <Divider />
            <DetailRow icon={EmailOutlined} label="Email address" value={user?.email} />
            <Divider />
            <DetailRow
              icon={PhoneOutlined}
              label="Telephone"
              value={user?.phone || user?.telephone}
            />
            <Divider />
            <DetailRow
              icon={BadgeOutlined}
              label="Designation"
              value={roleLabels.map((r) => String(r).replace(/-/g, ' ')).join(', ')}
            />
            {user?.username ? (
              <>
                <Divider />
                <DetailRow icon={BadgeOutlined} label="Username" value={user.username} />
              </>
            ) : null}
          </Paper>
        </Grid>

        {/* Security */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#fff',
              mb: 3,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: 'rgba(1, 163, 218, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock sx={{ color: '#01A3DA', fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  Change password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use a strong password you do not reuse elsewhere.
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={2} sx={{ mt: 2.5 }}>
              <TextField
                type={showCurrent ? 'text' : 'password'}
                label="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                fullWidth
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Toggle current password visibility"
                        onClick={() => setShowCurrent((v) => !v)}
                        edge="end"
                        size="small"
                      >
                        {showCurrent ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                type={showNew ? 'text' : 'password'}
                label="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                autoComplete="new-password"
                helperText="At least 8 characters"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Toggle new password visibility"
                        onClick={() => setShowNew((v) => !v)}
                        edge="end"
                        size="small"
                      >
                        {showNew ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                type={showConfirm ? 'text' : 'password'}
                label="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Toggle confirm password visibility"
                        onClick={() => setShowConfirm((v) => !v)}
                        edge="end"
                        size="small"
                      >
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box>
                <Button
                  variant="contained"
                  disabled={saving}
                  onClick={handleChangePassword}
                  sx={{
                    fontWeight: 800,
                    px: 3,
                    bgcolor: '#01A3DA',
                    '&:hover': { bgcolor: '#018FBF' },
                  }}
                >
                  {saving ? 'Updating…' : 'Update password'}
                </Button>
              </Box>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#fff',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  Session
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign out of the Field Staff portal on this device.
                </Typography>
              </Box>
              <Button
                color="error"
                variant="outlined"
                startIcon={<Logout />}
                onClick={handleLogout}
                sx={{ fontWeight: 800, flexShrink: 0 }}
              >
                Sign out
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
