import React, { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { NotificationsOutlined, MarkEmailRead } from '@mui/icons-material'
import { format } from 'date-fns'
import { clientPortalAPI } from '../../services/clientPortalApi'
import { showSuccessAlert } from '../../utils/alerts'

export default function ClientNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = () => {
    setLoading(true)
    clientPortalAPI
      .listNotifications({ limit: 100 })
      .then((data) => setNotifications(data.items || data || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'critical') return n.type === 'urgent' || n.priority === 'high'
    return true
  })

  const markRead = async (id) => {
    await clientPortalAPI.markNotificationRead(id)
    load()
  }

  const markAllRead = async () => {
    await clientPortalAPI.markAllNotificationsRead()
    showSuccessAlert('Done', 'All notifications marked as read')
    load()
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #01A3DA 0%, #0178A3 100%)',
          color: '#fff',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="overline" fontWeight={700}>
              ACTIVITY CENTER
            </Typography>
            <Typography variant="h4" fontWeight={800}>
              Notifications
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<MarkEmailRead />}
            onClick={markAllRead}
            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
            variant="outlined"
          >
            Mark all read
          </Button>
        </Stack>
      </Box>

      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, v) => v && setFilter(v)}
        size="small"
        sx={{ mb: 3 }}
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="unread">Unread</ToggleButton>
        <ToggleButton value="critical">Critical</ToggleButton>
      </ToggleButtonGroup>

      <Stack spacing={2}>
        {filtered.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <NotificationsOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">All caught up!</Typography>
          </Card>
        ) : (
          filtered.map((n) => (
            <Card
              key={n.id}
              sx={{
                borderRadius: 3,
                border: '1px solid #E9ECEF',
                bgcolor: n.is_read ? '#fff' : 'primary.light',
                cursor: 'pointer',
              }}
              onClick={() => !n.is_read && markRead(n.id)}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography fontWeight={700}>{n.title}</Typography>
                  {!n.is_read && <Chip label="New" size="small" color="primary" />}
                </Stack>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {n.message}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {n.created_at ? format(new Date(n.created_at), 'PPp') : ''}
                </Typography>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
    </Box>
  )
}
