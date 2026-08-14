import React from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Stack,
  Card,
  CardContent,
  Toolbar,
  Chip,
} from '@mui/material'
import {
  LocalShipping,
  Shield,
  NotificationsActive,
  Smartphone,
  Apple,
  Android,
  ArrowForward,
  VerifiedUser,
  SupportAgent,
} from '@mui/icons-material'
import EPALogo from '../../components/EPALogo'

const features = [
  {
    icon: LocalShipping,
    title: 'Track Consignments',
    description: 'Monitor your shipments in real time from origin to destination with full visibility.',
  },
  {
    icon: Shield,
    title: 'Compliance Centre',
    description: 'Upload and manage customs documents, T1, invoices, certificates of origin, and more.',
  },
  {
    icon: NotificationsActive,
    title: 'Instant Alerts',
    description: 'Receive notifications on clearance updates, document requests, and urgent actions.',
  },
  {
    icon: SupportAgent,
    title: 'Dedicated Support',
    description: 'Message the EPA team directly for help with your consignments and compliance.',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #E9ECEF' }}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <EPALogo height={44} />
          <Stack direction="row" spacing={1} alignItems="center">
            <Button component={RouterLink} to="/client/login" color="inherit" sx={{ fontWeight: 600 }}>
              Sign In
            </Button>
            <Button component={RouterLink} to="/client/register" variant="contained" endIcon={<ArrowForward />}>
              Register
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0178A3 0%, #01A3DA 50%, #4DC4F0 100%)',
          color: '#fff',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip label="Enterprise Operational Cockpit" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', mb: 2, fontWeight: 700 }} />
              <Typography variant="h2" fontWeight={800} sx={{ fontSize: { xs: '2rem', md: '3rem' }, lineHeight: 1.15, mb: 2 }}>
                Professional Logistics Governance for Consignees
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.92, fontWeight: 400, mb: 4, maxWidth: 560 }}>
                EPA Carriers & Logistics gives importers and exporters a secure portal to track consignments, submit compliance documents, and stay ahead of customs clearance.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  size="large"
                  variant="contained"
                  sx={{ bgcolor: '#fff', color: 'primary.dark', fontWeight: 700, px: 4, '&:hover': { bgcolor: '#F0F9FF' } }}
                  onClick={() => navigate('/client/register')}
                >
                  Create Client Account
                </Button>
                <Button
                  size="large"
                  variant="outlined"
                  sx={{ borderColor: '#fff', color: '#fff', fontWeight: 600, px: 4, '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
                  onClick={() => navigate('/client/login')}
                >
                  Client Sign In
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5} sx={{ textAlign: 'center' }}>
              <Box
                component="img"
                src="/epa-logo.png"
                alt="EPA Logistics"
                sx={{ maxWidth: 280, width: '80%', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))' }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Typography variant="h4" fontWeight={800} textAlign="center" gutterBottom>
          Everything you need in one portal
        </Typography>
        <Typography color="text.secondary" textAlign="center" sx={{ mb: 6, maxWidth: 560, mx: 'auto' }}>
          Mirror your mobile experience on the web — same account, same consignments, same compliance tools.
        </Typography>
        <Grid container spacing={3}>
          {features.map((f) => (
            <Grid item xs={12} sm={6} md={3} key={f.title}>
              <Card elevation={0} sx={{ height: '100%', border: '1px solid #E9ECEF', borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4, borderColor: 'primary.light' } }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <f.icon color="primary" />
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {f.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Mobile apps */}
      <Box sx={{ bgcolor: '#F8FAFC', py: { xs: 8, md: 10 } }}>
        <Container maxWidth="md">
          <Stack alignItems="center" spacing={3} textAlign="center">
            <Smartphone sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight={800}>
              Also available on mobile
            </Typography>
            <Typography color="text.secondary" maxWidth={480}>
              Download EPA Logistics on Android and iOS. Sign in with your phone number and manage consignments on the go.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Android />}
                sx={{ borderRadius: 3, px: 3, fontWeight: 600 }}
                href="https://play.google.com/store"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Play
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Apple />}
                sx={{ borderRadius: 3, px: 3, fontWeight: 600 }}
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                App Store
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Search for &quot;EPA Logistics&quot; · Package: com.epa.logistics
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* Trust */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Card sx={{ borderRadius: 4, background: 'linear-gradient(135deg, #01A3DA 0%, #0178A3 100%)', color: '#fff' }}>
          <CardContent sx={{ p: { xs: 4, md: 6 }, textAlign: 'center' }}>
            <VerifiedUser sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Account approval for your security
            </Typography>
            <Typography sx={{ opacity: 0.9, maxWidth: 520, mx: 'auto', mb: 3 }}>
              New client registrations are reviewed by the EPA team before activation. You will be notified once your account is approved.
            </Typography>
            <Button variant="contained" sx={{ bgcolor: '#fff', color: 'primary.dark', fontWeight: 700 }} onClick={() => navigate('/client/register')}>
              Register Now
            </Button>
          </CardContent>
        </Card>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1A1A1A', color: '#fff', py: 4 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <EPALogo variant="white" height={40} />
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              © {new Date().getFullYear()} EPA Carriers & Logistics. Enterprise Operational Cockpit.
            </Typography>
            <Button component={RouterLink} to="/login" size="small" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Staff Portal →
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
