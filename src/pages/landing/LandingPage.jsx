import React from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Box, Button, Stack, Typography, keyframes } from '@mui/material'
import { ArrowForward } from '@mui/icons-material'
import { EPA_COMPANY } from '../../constants/epaCompany'

const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(28px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const kenBurns = keyframes`
  from {
    transform: scale(1.06);
  }
  to {
    transform: scale(1);
  }
`

const softPulse = keyframes`
  0%, 100% {
    opacity: 0.55;
  }
  50% {
    opacity: 0.85;
  }
`

const fonts = {
  display: '"Instrument Serif", "Times New Roman", serif',
  body: '"Manrope", "Helvetica Neue", sans-serif',
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100dvh',
        height: '100dvh',
        overflow: 'hidden',
        color: '#F7F4EF',
        fontFamily: fonts.body,
      }}
    >
      {/* Full-bleed hero image — object-fit cover so it fills without distortion */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
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
            objectPosition: 'center center',
            display: 'block',
            animation: `${kenBurns} 18s ease-out forwards`,
            transformOrigin: 'center center',
          }}
        />
      </Box>

      {/* Atmospheric overlays */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(105deg, rgba(8, 18, 28, 0.92) 0%, rgba(8, 18, 28, 0.72) 42%, rgba(8, 18, 28, 0.35) 100%),
            linear-gradient(180deg, rgba(8, 18, 28, 0.35) 0%, transparent 28%, rgba(8, 18, 28, 0.55) 100%)
          `,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 50% at 18% 70%, rgba(1, 163, 218, 0.18), transparent 60%)',
          animation: `${softPulse} 7s ease-in-out infinite`,
          pointerEvents: 'none',
        }}
      />

      {/* Top bar — brand only */}
      <Box
        component="header"
        sx={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          px: { xs: 2.5, sm: 4, md: 6 },
          pt: { xs: 2.5, md: 3.5 },
        }}
      >
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.5,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <Box
            component="img"
            src="/epa-logo.png"
            alt=""
            onError={(e) => {
              e.currentTarget.src = '/logo.png'
            }}
            sx={{ height: { xs: 40, md: 48 }, width: 'auto', objectFit: 'contain' }}
          />
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography
              sx={{
                fontFamily: fonts.body,
                fontWeight: 800,
                letterSpacing: '0.14em',
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                lineHeight: 1.2,
                color: '#F7F4EF',
              }}
            >
              {EPA_COMPANY.shortName}
            </Typography>
            <Typography
              sx={{
                fontFamily: fonts.body,
                fontWeight: 500,
                fontSize: '0.68rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                opacity: 0.72,
                lineHeight: 1.2,
              }}
            >
              Operations
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Hero content — brand, headline, sentence, CTAs */}
      <Box
        component="main"
        sx={{
          position: 'relative',
          zIndex: 2,
          height: 'calc(100% - 88px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          px: { xs: 2.5, sm: 4, md: 6 },
          pb: { xs: 4, sm: 5, md: 6.5 },
          maxWidth: 920,
        }}
      >
        <Typography
          component="p"
          sx={{
            fontFamily: fonts.display,
            fontSize: { xs: 'clamp(2.75rem, 12vw, 5.5rem)', md: 'clamp(4rem, 7.5vw, 6.25rem)' },
            lineHeight: 0.92,
            letterSpacing: '-0.02em',
            mb: { xs: 2, md: 2.5 },
            animation: `${fadeUp} 0.9s cubic-bezier(0.22, 1, 0.36, 1) both`,
          }}
        >
          {EPA_COMPANY.name}
        </Typography>

        <Typography
          component="h1"
          sx={{
            fontFamily: fonts.body,
            fontWeight: 600,
            fontSize: { xs: '1.05rem', sm: '1.2rem', md: '1.35rem' },
            letterSpacing: '0.02em',
            lineHeight: 1.35,
            width: 'min(34ch, 100%)',
            color: 'rgba(247, 244, 239, 0.94)',
            mb: 1.5,
            animation: `${fadeUp} 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both`,
          }}
        >
          Secure operations portal for consignments, compliance, and field coordination.
        </Typography>

        <Typography
          sx={{
            fontFamily: fonts.body,
            fontWeight: 400,
            fontSize: { xs: '0.92rem', md: '1rem' },
            lineHeight: 1.6,
            width: 'min(42ch, 100%)',
            color: 'rgba(247, 244, 239, 0.72)',
            mb: { xs: 3.5, md: 4 },
            animation: `${fadeUp} 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.22s both`,
          }}
        >
          Authorized EPA staff only. Sign in to manage requests, assignments, and clearance in one place.
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{
            animation: `${fadeUp} 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.32s both`,
          }}
        >
          <Button
            size="large"
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={() => navigate('/login')}
            sx={{
              fontFamily: fonts.body,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'none',
              borderRadius: 0,
              px: 3.25,
              py: 1.4,
              bgcolor: '#01A3DA',
              color: '#fff',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#018FBF',
                boxShadow: 'none',
              },
            }}
          >
            Admin sign in
          </Button>
          <Button
            size="large"
            variant="outlined"
            component={RouterLink}
            to="/staff-login"
            sx={{
              fontFamily: fonts.body,
              fontWeight: 600,
              letterSpacing: '0.03em',
              textTransform: 'none',
              borderRadius: 0,
              px: 3,
              py: 1.35,
              color: '#F7F4EF',
              borderColor: 'rgba(247, 244, 239, 0.45)',
              '&:hover': {
                borderColor: '#F7F4EF',
                bgcolor: 'rgba(255,255,255,0.06)',
              },
            }}
          >
            Field staff sign in
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
