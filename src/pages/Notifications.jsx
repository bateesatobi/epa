import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Button,
  CircularProgress,
  Avatar,
} from '@mui/material'
import {
  CheckCircle,
  Undo,
  Delete,
  Visibility,
  NotificationsActive,
  NotificationsNone,
  MarkEmailRead,
  MarkEmailUnread,
  Refresh,
  Inbox,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-toastify'
import { notificationsAPI } from '../services/api'

const tabOptions = [
  { value: 0, label: 'All', icon: <Inbox fontSize="small" /> },
  { value: 1, label: 'Unread', icon: <MarkEmailUnread fontSize="small" /> },
  { value: 2, label: 'Read', icon: <MarkEmailRead fontSize="small" /> },
]

const typeColorMap = {
  alert: 'error',
  warning: 'warning',
  error: 'error',
  info: 'info',
  success: 'success',
}

const Notifications = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [tabValue, setTabValue] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const focusNotificationId = location.state?.notificationId

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const statusParam =
        tabValue === 1 ? 'unread' : tabValue === 2 ? 'read' : undefined
      const response = await notificationsAPI.list({ status: statusParam, limit: 100 })
      setNotifications(response.items || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [tabValue, refreshKey])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [tabValue, refreshKey])

  useEffect(() => {
    if (focusNotificationId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`notification-${focusNotificationId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('highlight')
          setTimeout(() => element.classList.remove('highlight'), 1500)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [focusNotificationId, notifications])

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue)
  }

  const triggerGlobalRefresh = () => {
    window.dispatchEvent(new Event('notifications:updated'))
  }

  const handleMarkRead = async (notification) => {
    try {
      await notificationsAPI.markRead(notification.id)
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item
        )
      )
      toast.success('Notification marked as read')
      triggerGlobalRefresh()
    } catch (error) {
      console.error(error)
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkUnread = async (notification) => {
    try {
      await notificationsAPI.markUnread(notification.id)
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: false, read_at: null } : item
        )
      )
      toast.success('Notification marked as unread')
      triggerGlobalRefresh()
    } catch (error) {
      console.error(error)
      toast.error('Failed to mark notification as unread')
    }
  }

  const handleDelete = async (notification) => {
    try {
      await notificationsAPI.delete(notification.id)
      setNotifications((prev) => prev.filter((item) => item.id !== notification.id))
      toast.success('Notification deleted')
      triggerGlobalRefresh()
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete notification')
    }
  }

  const handleView = async (notification) => {
    if (!notification.is_read) {
      await handleMarkRead(notification)
    }

    if (notification.resource_type === 'shipment' && notification.resource_id) {
      navigate(`/shipments/${notification.resource_id}`)
    } else if (notification.resource_type === 'report') {
      navigate('/reports')
    } else {
      toast.info('No linked resource for this notification')
    }
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      toast.success('All notifications marked as read')
      handleRefresh()
      triggerGlobalRefresh()
    } catch (error) {
      console.error(error)
      toast.error('Failed to mark all notifications as read')
    }
  }

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  )

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            variant="rounded"
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'primary.light',
              color: 'primary.dark',
              boxShadow: '0 10px 24px rgba(25,118,210,0.25)',
            }}
          >
            <NotificationsActive />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
              Notifications Center
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stay on top of operational alerts, approvals, and system updates
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh notifications feed" arrow>
            <Button variant="outlined" startIcon={<Refresh />} onClick={handleRefresh}>
              Refresh
            </Button>
          </Tooltip>
          <Tooltip title="Mark every notification as read" arrow>
            <span>
              <Button variant="contained" startIcon={<MarkEmailRead />} onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                Mark all read
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }} variant="scrollable" allowScrollButtonsMobile>
        {tabOptions.map((tab) => (
          <Tab
            key={tab.value}
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ display: 'flex', alignItems: 'center', color: tab.value === tabValue ? 'primary.main' : 'text.secondary' }}>
                  {tab.icon}
                </Box>
                <Typography variant="body2" fontWeight={tab.value === tabValue ? 600 : 500}>
                  {tab.label}
                </Typography>
                {tab.value === 1 && unreadCount > 0 && (
                  <Chip label={unreadCount} size="small" color="error" />
                )}
              </Stack>
            }
            value={tab.value}
          />
        ))}
      </Tabs>

      {loading ? (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(21,101,192,0.05) 0%, rgba(21,101,192,0.12) 100%)',
            borderRadius: 3,
          }}
        >
          <NotificationsNone sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" fontWeight="bold">
            {tabValue === 1 ? 'No unread notifications' : 'No notifications yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            You're all caught up. We'll keep you posted when new updates arrive.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={0}>
          {notifications.map((notification) => {
            const isUnread = !notification.is_read
            const typeColor = typeColorMap[notification.notification_type] || 'default'

            return (
              <Paper
                key={notification.id}
                id={`notification-${notification.id}`}
                elevation={0}
                sx={{
                  p: 0,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: isUnread ? 'action.hover' : 'background.paper',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: isUnread ? 'action.selected' : 'action.hover',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  },
                  '&.highlight': {
                    backgroundColor: 'primary.light',
                    animation: 'pulse 1.5s ease-in-out',
                  },
                  '@keyframes pulse': {
                    '0%, 100%': { backgroundColor: 'primary.light' },
                    '50%': { backgroundColor: 'primary.main', opacity: 0.8 },
                  },
                }}
                onClick={() => {
                  if (notification.resource_type && notification.resource_id) {
                    handleView(notification)
                  }
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    p: 2,
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Unread indicator dot */}
                  {isUnread && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        mt: 1.5,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {!isUnread && <Box sx={{ width: 8, flexShrink: 0 }} />}

                  {/* Main content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={isUnread ? 600 : 400}
                        sx={{
                          color: isUnread ? 'text.primary' : 'text.secondary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Chip
                        label={notification.notification_type}
                        size="small"
                        color={typeColor}
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 500,
                        }}
                      />
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                      }}
                    >
                      {notification.message}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.disabled">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Action buttons */}
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {notification.resource_type && notification.resource_id && (
                      <Tooltip title="View linked resource">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleView(notification)}
                          sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {notification.is_read ? (
                      <Tooltip title="Mark as unread">
                        <IconButton
                          size="small"
                          onClick={() => handleMarkUnread(notification)}
                          sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                        >
                          <Undo fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Mark as read">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleMarkRead(notification)}
                          sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete notification">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(notification)}
                        sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}

export default Notifications

