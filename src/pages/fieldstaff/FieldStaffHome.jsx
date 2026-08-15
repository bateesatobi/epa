import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Chip,
  Button,
  CircularProgress,
} from '@mui/material'
import {
  Assignment,
  LocalShipping,
  Description,
  Notifications,
  Person,
  ArrowForward,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useAdminNotifications } from '../../hooks/useNotifications'
import { useMyAssignments, uniqueConsignmentsFromAssignments } from '../../hooks/useFieldStaff'
import FieldStaffPageHeader from '../../components/fieldstaff/FieldStaffPageHeader'
import { useQuery } from '@tanstack/react-query'
import { consignmentRequestsAPI } from '../../services/api'
import { fieldStaffKeys } from '../../hooks/useFieldStaff'

const shortcuts = [
  {
    id: 'assignments',
    title: 'Assignments',
    subtitle: 'Active tasks',
    icon: Assignment,
    path: '/dashboard/field-staff/assignments',
    color: '#01A3DA',
    bg: 'rgba(1, 163, 218, 0.12)',
  },
  {
    id: 'consignments',
    title: 'Consignments',
    subtitle: 'Your shipment work',
    icon: LocalShipping,
    path: '/dashboard/field-staff/consignments',
    color: '#6366F1',
    bg: 'rgba(99, 102, 241, 0.12)',
  },
  {
    id: 'incoming',
    title: 'Consignment Requests',
    subtitle: 'Approved, awaiting setup',
    icon: Description,
    path: '/dashboard/field-staff/incoming',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    subtitle: 'Updates & alerts',
    icon: Notifications,
    path: '/dashboard/notifications',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
  },
  {
    id: 'profile',
    title: 'Profile',
    subtitle: 'Account settings',
    icon: Person,
    path: '/dashboard/field-staff/profile',
    color: '#64748B',
    bg: 'rgba(100, 116, 139, 0.12)',
  },
]

export default function FieldStaffHome() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { unreadCount } = useAdminNotifications()
  const { data: assignments = [], isLoading: assignmentsLoading } = useMyAssignments({
    activeOnly: true,
  })
  const consignments = useMemo(
    () => uniqueConsignmentsFromAssignments(assignments),
    [assignments]
  )
  const { data: incoming = [], isLoading: incomingLoading } = useQuery({
    queryKey: fieldStaffKeys.incoming(),
    queryFn: async () => {
      const data = await consignmentRequestsAPI.incoming()
      return Array.isArray(data) ? data : []
    },
    staleTime: 30_000,
  })

  const firstName = (user?.full_name || user?.username || 'Field Staff').split(' ')[0]

  const badgeFor = (id) => {
    if (id === 'assignments') return assignments.length || undefined
    if (id === 'consignments') return consignments.length || undefined
    if (id === 'incoming') return incoming.length || undefined
    if (id === 'notifications') return unreadCount || undefined
    return undefined
  }

  return (
    <Box sx={{ pb: 4 }}>
      <FieldStaffPageHeader
        title={`Hello, ${firstName}`}
        subtitle="Your field operations dashboard — same workflows as the mobile Field Staff app."
        chipLabel={
          assignmentsLoading
            ? 'Loading…'
            : `${assignments.length} active assignment${assignments.length === 1 ? '' : 's'}`
        }
      />

      <Paper
        elevation={0}
        onClick={() => navigate('/dashboard/field-staff/incoming')}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
          color: 'white',
          transition: 'transform 0.15s ease',
          '&:hover': { transform: 'translateY(-2px)' },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.9, fontWeight: 700 }}>
              Featured
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              Consignment requests
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {incomingLoading
                ? 'Loading approved requests…'
                : `${incoming.length} approved request${incoming.length === 1 ? '' : 's'} awaiting review`}
            </Typography>
          </Box>
          <Button
            endIcon={<ArrowForward />}
            sx={{ color: 'white', fontWeight: 800, bgcolor: 'rgba(255,255,255,0.15)' }}
          >
            Open
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        {shortcuts.map((item) => {
          const Icon = item.icon
          const badge = badgeFor(item.id)
          return (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Paper
                elevation={0}
                onClick={() => navigate(item.path)}
                sx={{
                  p: 2.5,
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: item.color,
                    boxShadow: `0 8px 24px ${item.bg}`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: item.bg,
                      color: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1" fontWeight={800} noWrap>
                        {item.title}
                      </Typography>
                      {badge != null && (
                        <Chip
                          size="small"
                          label={badge > 99 ? '99+' : badge}
                          sx={{
                            height: 20,
                            fontWeight: 800,
                            fontSize: '0.65rem',
                            bgcolor: item.color,
                            color: '#fff',
                          }}
                        />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {item.id === 'notifications' && unreadCount > 0
                        ? `${unreadCount} unread`
                        : item.subtitle}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          )
        })}
      </Grid>

      {(assignmentsLoading || incomingLoading) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}
    </Box>
  )
}
