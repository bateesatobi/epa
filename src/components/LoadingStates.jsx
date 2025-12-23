import React from 'react'
import { Box, Skeleton, CircularProgress, Paper, Stack, Typography, LinearProgress, Grid } from '@mui/material'
import { alpha } from '@mui/material/styles'

/**
 * Skeleton loader for stat cards
 */
export const SkeletonStatCard = () => (
  <Paper
    sx={{
      borderRadius: 3,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      p: 3,
      height: '100%',
    }}
  >
    <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="60%" height={48} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 2 }} />
  </Paper>
)

/**
 * Skeleton loader for table rows
 */
export const SkeletonTableRow = ({ columns = 5 }) => (
  <>
    {Array.from({ length: columns }).map((_, index) => (
      <Skeleton key={index} variant="text" width="100%" height={40} />
    ))}
  </>
)

/**
 * Skeleton loader for data table
 */
export const SkeletonDataTable = ({ rows = 5, columns = 5 }) => (
  <Box>
    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton variant="text" width={200} height={32} />
      <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
    </Box>
    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
      <Skeleton variant="rectangular" width={200} height={40} sx={{ borderRadius: 1 }} />
      <Skeleton variant="rectangular" width={150} height={40} sx={{ borderRadius: 1 }} />
    </Box>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
        ))}
      </Box>
    ))}
  </Box>
)

/**
 * Skeleton loader for card content
 */
export const SkeletonCard = ({ height = 200 }) => (
  <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', p: 3 }}>
    <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: 2 }} />
  </Paper>
)

/**
 * Loading overlay that doesn't hide content
 */
export const LoadingOverlay = ({ message, children }) => (
  <Box sx={{ position: 'relative' }}>
    {children}
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        borderRadius: 2,
        backdropFilter: 'blur(2px)',
      }}
    >
      <CircularProgress size={40} sx={{ mb: 2 }} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  </Box>
)

/**
 * Full page skeleton loader
 */
export const PageSkeleton = ({ showHeader = true, showTable = true }) => (
  <Box>
    {showHeader && (
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width="40%" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" height={24} />
      </Box>
    )}
    {showTable ? (
      <SkeletonDataTable rows={8} columns={6} />
    ) : (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <SkeletonStatCard />
          </Grid>
        ))}
      </Grid>
    )}
  </Box>
)

/**
 * Loading banner for filtering/refreshing
 */
export const LoadingBanner = ({ message, subtitle }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      mb: 2,
      background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
      borderRadius: 2,
      border: '1px solid rgba(25, 118, 210, 0.2)',
    }}
  >
    <Stack direction="row" alignItems="center" spacing={2}>
      <CircularProgress size={24} sx={{ color: 'primary.main' }} />
      <Box>
        <Typography variant="body1" fontWeight={600} color="primary.main">
          {message || 'Loading...'}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
    <LinearProgress
      sx={{
        mt: 1.5,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
      }}
    />
  </Paper>
)

/**
 * Inline loading spinner
 */
export const InlineLoader = ({ size = 24, message }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
    <CircularProgress size={size} />
    {message && (
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    )}
  </Box>
)


