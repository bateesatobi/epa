import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Stack,
  Avatar,
  Divider,
  Chip,
} from '@mui/material'
import { Business, Email, Phone, Badge, Logout, Lock, HelpOutline } from '@mui/icons-material'
import { useClientAuth } from '../../contexts/ClientAuthContext'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" py={1.5}>
      <Icon color="primary" fontSize="small" />
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="body1" fontWeight={500}>
          {value || '—'}
        </Typography>
      </Box>
    </Stack>
  )
}

export default function ClientProfile() {
  const { client, logout } = useClientAuth()
  const navigate = useNavigate()

  const initials = client?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #01A3DA 0%, #0178A3 100%)',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'rgba(255,255,255,0.25)', fontSize: 28 }}>
          {initials}
        </Avatar>
        <Typography variant="h5" fontWeight={800}>
          {client?.name}
        </Typography>
        <Chip label="Consignee / Client" size="small" sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E9ECEF' }} elevation={0}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Account Details
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <InfoRow icon={Badge} label="Full Name" value={client?.name} />
              <InfoRow icon={Email} label="Email" value={client?.email} />
              <InfoRow icon={Phone} label="Telephone" value={client?.telephone} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E9ECEF' }} elevation={0}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Business Information
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <InfoRow icon={Business} label="Company" value={client?.company_name} />
              <InfoRow icon={Badge} label="TIN" value={client?.tin} />
              <InfoRow icon={Business} label="Status" value={client?.status} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="outlined" startIcon={<Lock />} onClick={() => navigate('/client/change-password')}>
              Change Password
            </Button>
            <Button variant="outlined" startIcon={<HelpOutline />} onClick={() => navigate('/client/support')}>
              Support
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Logout />}
              onClick={() => {
                logout()
                navigate('/client/login')
              }}
            >
              Sign Out
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
