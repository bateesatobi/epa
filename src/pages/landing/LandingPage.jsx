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
  Paper,
  Divider,
  alpha,
} from '@mui/material'
import {
  LocalShipping,
  Shield,
  NotificationsActive,
  Assignment,
  ArrowForward,
  VerifiedUser,
  SupportAgent,
  Dashboard,
  Groups,
  FactCheck,
  Login as LoginIcon,
} from '@mui/icons-material'
import EPALogo from '../../components/EPALogo'

const BRAND = {
  primary: '#01A3DA',
  dark: '#0178A3',
  ink: '#1A2027',
}

const features = [
  {
    icon: LocalShipping,
    title: 'Consignment control',
    description: 'Create, track, and manage shipments with depot routing, assignments, and clearance history.',
  },
  {
    icon: Shield,
    title: 'Compliance oversight',
    description: 'Review uploaded documents, raise structured queries, and monitor clearance activity stages.',
  },
  {
    icon: NotificationsActive,
    title: 'Operational alerts',
    description: 'Stay informed on client submissions, query replies, and field staff updates in real time.',
  },
  {
    icon: SupportAgent,
    title: 'Client coordination',
    description: 'Review consignment requests, query clients for missing information, and promote approvals to live consignments.',
  },
]

const roles = [
  {
    label: 'Administrator',
    description: 'Full platform access — users, depots, requests, consignments, and reporting.',
    color: BRAND.primary,
  },
  {
    label: 'Reporting officer',
    description: 'Review compliance, manage requests, and oversee operational reporting.',
    color: '#6366F1',
  },
  {
    label: 'Field staff',
    description: 'Execute clearance activities, respond to assignments, and update shipment status in the field.',
    color: '#10B981',
  },
]

const workflow = [
  { step: '01', title: 'Review requests', detail: 'Clients submit consignment requests with documents and expected arrival dates.' },
  { step: '02', title: 'Query & approve', detail: 'Raise structured queries, approve or reject submissions, and notify clients.' },
  { step: '03', title: 'Convert & assign', detail: 'Promote approved requests to consignments and assign clearance activities to field staff.' },
  { step: '04', title: 'Track clearance', detail: 'Monitor progress, documents, and compliance until delivery is complete.' },
]

function SectionHeader({ overline, title, subtitle, align = 'center' }) {
  return (
    <Box sx={{ textAlign: align, mb: { xs: 4, md: 5 }, maxWidth: align === 'center' ? 720 : 'none', mx: align === 'center' ? 'auto' : 0 }}>
      {overline ? (
        <Typography
          variant="overline"
          sx={{ color: BRAND.primary, fontWeight: 800, letterSpacing: 1.6, display: 'block', mb: 1 }}
        >
          {overline}
        </Typography>
      ) : null}
      <Typography variant="h4" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <Box sx={{ bgcolor: '#FAFBFC', minHeight: '100vh' }}>
      {/* Nav */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1.25, minHeight: { xs: 64, md: 72 } }}>
            <EPALogo height={44} />
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip
                label="Staff only"
                size="small"
                sx={{ fontWeight: 700, display: { xs: 'none', sm: 'flex' } }}
              />
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                endIcon={<ArrowForward />}
                sx={{ fontWeight: 700, px: 2.5, borderRadius: 2 }}
              >
                Admin sign in
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${BRAND.ink} 0%, #0F172A 45%, ${BRAND.dark} 100%)`,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -120,
            right: -80,
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(BRAND.primary, 0.22)} 0%, transparent 70%)`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: -60,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 7, md: 10 } }}>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                icon={<Dashboard sx={{ color: 'white !important' }} />}
                label="EPA Operations Portal"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontWeight: 700,
                  mb: 2.5,
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              />
              <Typography
                variant="h2"
                fontWeight={800}
                sx={{
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  lineHeight: 1.12,
                  letterSpacing: '-0.02em',
                  mb: 2,
                }}
              >
                Enterprise operational cockpit for EPA staff
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.88,
                  fontWeight: 400,
                  mb: 4,
                  maxWidth: 560,
                  lineHeight: 1.65,
                  fontSize: { xs: '1rem', md: '1.125rem' },
                }}
              >
                Manage consignments, review client requests, coordinate compliance, and assign field teams — all from one secure dashboard.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Button
                  size="large"
                  variant="contained"
                  startIcon={<LoginIcon />}
                  onClick={() => navigate('/login')}
                  sx={{
                    bgcolor: BRAND.primary,
                    fontWeight: 700,
                    px: 3.5,
                    py: 1.35,
                    borderRadius: 2,
                    '&:hover': { bgcolor: BRAND.dark },
                  }}
                >
                  Sign in to dashboard
                </Button>
                <Typography variant="body2" sx={{ opacity: 0.65, maxWidth: 260, lineHeight: 1.5 }}>
                  Use your EPA platform email and password. Client accounts use the separate client portal.
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Stack spacing={2.5}>
                  {[
                    { icon: FactCheck, label: 'Consignment requests', value: 'Review · Query · Approve' },
                    { icon: LocalShipping, label: 'Live consignments', value: 'Assign · Track · Clear' },
                    { icon: Groups, label: 'Team coordination', value: 'Admin · Officers · Field staff' },
                  ].map((item) => (
                    <Stack key={item.label} direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          bgcolor: alpha(BRAND.primary, 0.18),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <item.icon sx={{ color: BRAND.primary }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.25 }}>
                          {item.value}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 9 } }}>
        <SectionHeader
          overline="Platform capabilities"
          title="Built for operations teams"
          subtitle="Everything administrators and field staff need to govern consignments, compliance, and client coordination in one place."
        />
        <Grid container spacing={3}>
          {features.map((f) => (
            <Grid item xs={12} sm={6} md={3} key={f.title}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  bgcolor: '#fff',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(1, 163, 218, 0.12)',
                    borderColor: alpha(BRAND.primary, 0.35),
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: alpha(BRAND.primary, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    <f.icon sx={{ color: BRAND.primary }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontSize: '1.05rem' }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                    {f.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Workflow */}
      <Box sx={{ bgcolor: '#fff', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg" sx={{ py: { xs: 7, md: 9 } }}>
          <SectionHeader
            overline="Standard workflow"
            title="From client request to cleared consignment"
            subtitle="The portal supports the full lifecycle — from the moment a client submits a request through field clearance and delivery."
          />
          <Grid container spacing={2.5}>
            {workflow.map((item, index) => (
              <Grid item xs={12} sm={6} md={3} key={item.step}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      color: alpha(BRAND.primary, 0.9),
                      fontWeight: 900,
                      letterSpacing: 1.2,
                      fontSize: '0.75rem',
                    }}
                  >
                    Step {item.step}
                  </Typography>
                  <Typography variant="h6" fontWeight={800} sx={{ mt: 0.5, mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                    {item.detail}
                  </Typography>
                  {index < workflow.length - 1 ? (
                    <Box
                      sx={{
                        display: { xs: 'none', md: 'block' },
                        position: 'absolute',
                        top: '50%',
                        right: -12,
                        width: 24,
                        height: 2,
                        bgcolor: alpha(BRAND.primary, 0.25),
                      }}
                    />
                  ) : null}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Roles */}
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 9 } }}>
        <SectionHeader
          overline="Access levels"
          title="Who uses this portal"
          subtitle="Role-based access ensures each team member sees the tools and data relevant to their responsibilities."
        />
        <Grid container spacing={3}>
          {roles.map((role) => (
            <Grid item xs={12} md={4} key={role.label}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderTop: `4px solid ${role.color}`,
                }}
              >
                <Typography variant="h6" fontWeight={800} gutterBottom>
                  {role.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                  {role.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA */}
      <Container maxWidth="lg" sx={{ pb: { xs: 7, md: 9 } }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.dark} 100%)`,
            color: '#fff',
          }}
        >
          <Grid container alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ p: { xs: 4, md: 5 } }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <VerifiedUser sx={{ fontSize: 32, opacity: 0.95 }} />
                  <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.4, opacity: 0.9 }}>
                    Secure staff access
                  </Typography>
                </Stack>
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  Ready to open the operations dashboard?
                </Typography>
                <Typography sx={{ opacity: 0.92, maxWidth: 520, lineHeight: 1.65 }}>
                  Sign in with your authorized EPA credentials. If you need access, contact your system administrator.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ px: { xs: 4, md: 3 }, pb: { xs: 4, md: 0 }, textAlign: { xs: 'left', md: 'center' } }}>
                <Button
                  size="large"
                  variant="contained"
                  startIcon={<Assignment />}
                  onClick={() => navigate('/login')}
                  sx={{
                    bgcolor: '#fff',
                    color: BRAND.dark,
                    fontWeight: 800,
                    px: 3.5,
                    py: 1.35,
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#F0F9FF' },
                  }}
                >
                  Go to admin login
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: BRAND.ink, color: '#fff', py: 4 }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={3}
          >
            <Box>
              <EPALogo variant="white" height={40} />
              <Typography variant="body2" sx={{ opacity: 0.65, mt: 1.5, maxWidth: 320, lineHeight: 1.6 }}>
                EPA Carriers & Logistics — internal operations portal for authorized staff.
              </Typography>
            </Box>
            <Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', md: 'block' }, borderColor: 'rgba(255,255,255,0.12)' }} />
            <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
              <Typography variant="caption" sx={{ opacity: 0.5 }}>
                © {new Date().getFullYear()} EPA Carriers & Logistics
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                size="small"
                endIcon={<ArrowForward />}
                sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}
              >
                Admin login
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
