import React from 'react'
import { Box, Container, Paper, Typography, Link as MuiLink } from '@mui/material'
import { Link } from 'react-router-dom'
import EPALogo from '../EPALogo'

export default function ClientAuthShell({ title, subtitle, children, footer }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(160deg, #0178A3 0%, #01A3DA 45%, #E6F5FC 100%)',
      }}
    >
      <Box sx={{ py: 2, px: 3 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <EPALogo variant="white" height={48} />
        </Link>
      </Box>
      <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', alignItems: 'center', pb: 4 }}>
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, width: '100%' }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {subtitle}
            </Typography>
          )}
          {children}
          {footer}
        </Paper>
      </Container>
      <Box sx={{ textAlign: 'center', pb: 3 }}>
        <MuiLink component={Link} to="/" underline="hover" color="primary.dark" fontWeight={600}>
          ← Back to home
        </MuiLink>
      </Box>
    </Box>
  )
}
