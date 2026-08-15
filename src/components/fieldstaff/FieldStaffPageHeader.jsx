import React from 'react'
import { Box, Paper, Stack, Typography, Chip, Button } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

/** Shared header for Field Staff panel pages (mirrors mobile ScreenHero). */
export default function FieldStaffPageHeader({
  overline = 'Field Staff',
  title,
  subtitle,
  action,
  showBack = false,
  backTo = '/dashboard/field-staff',
  chipLabel,
}) {
  const navigate = useNavigate()

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        mb: 3,
        borderRadius: 4,
        background: 'linear-gradient(135deg, #0A192F 0%, #1A2A4A 100%)',
        color: 'white',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box sx={{ minWidth: 0 }}>
          {showBack && (
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(backTo)}
              sx={{ color: 'rgba(255,255,255,0.85)', mb: 1, fontWeight: 700, px: 0 }}
            >
              Back
            </Button>
          )}
          <Typography
            variant="overline"
            sx={{ opacity: 0.75, fontWeight: 700, letterSpacing: 1.4, display: 'block' }}
          >
            {overline}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 1, maxWidth: 640, lineHeight: 1.6 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {chipLabel ? (
            <Chip
              label={chipLabel}
              sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white', fontWeight: 700 }}
            />
          ) : null}
          {action}
        </Stack>
      </Stack>
    </Paper>
  )
}
