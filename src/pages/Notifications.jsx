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
import { useQueryClient } from '@tanstack/react-query'
import { useNotificationList, invalidateNotifications, notificationKeys } from '../hooks/useNotifications'
import {
  notificationCategory,
  notificationKindLabel,
  navigateFromAdminNotification,
  getAdminNotificationTarget,
} from '../utils/notificationNavigation'

const tabOptions = [
  { value: 0, label: 'All', icon: <Inbox fontSize="small" /> },
  { value: 1, label: 'Unread', icon: <MarkEmailUnread fontSize="small" /> },
  { value: 2, label: 'Read', icon: <MarkEmailRead fontSize="small" /> },
]

const categoryOptions = [
  { id: 'all', label: 'All types' },
  { id: 'queries', label: 'Queries' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'requests', label: 'Requests' },
  { id: 'consignments', label: 'Consignments' },
  { id: 'other', label: 'Other' },
]

const Notifications = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [tabValue, setTabValue] = useState(0)
  const [category, setCategory] = useState('all')
  const queryClient = useQueryClient()
  const focusNotificationId = location.state?.notificationId

  const { data: notifications = [], isLoading: loading, refetch: fetchNotifications } = useNotificationList(tabValue)

  const visibleNotifications = useMemo(() => {
    if (category === 'all') return notifications
    return notifications.filter((item) => notificationCategory(item) === category)
  }, [notifications, category])

  const categoryCounts = useMemo(() => {
    const counts = { all: notifications.length, queries: 0, feedback: 0, requests: 0, consignments: 0, other: 0 }
    for (const item of notifications) {
      const key = notificationCategory(item)
      counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }, [notifications])

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
      queryClient.setQueryData(notificationKeys.list(tabValue), (old) =>
        old ? old.map((item) =>
          item.id === notification.id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item
        ) : old
      )
      toast.success('Notification marked as read')
      invalidateNotifications(queryClient)
      triggerGlobalRefresh()
    } catch (error) {
      console.error(error)
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkUnread = async (notification) => {
    try {
      await notificationsAPI.markUnread(notification.id)
      queryClient.setQueryData(notificationKeys.list(tabValue), (old) =>
        old ? old.map((item) =>
          item.id === notification.id ? { ...item, is_read: false, read_at: null } : item
        ) : old
      )
      toast.success('Notification marked as unread')
      invalidateNotifications(queryClient)
      triggerGlobalRefresh()
    } catch (error) {
      console.error(error)
      toast.error('Failed to mark notification as unread')
    }
  }

  const handleDelete = async (notification) => {
    try {
      await notificationsAPI.delete(notification.id)
      queryClient.setQueryData(notificationKeys.list(tabValue), (old) => 
        old ? old.filter((item) => item.id !== notification.id) : old
      )
      toast.success('Notification deleted')
      invalidateNotifications(queryClient)
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

    if (!navigateFromAdminNotification(navigate, notification)) {
      toast.info('No linked resource for this notification')
    }
  }

  const handleRefresh = () => {
    fetchNotifications()
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

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        {categoryOptions.map((opt) => (
          <Chip
            key={opt.id}
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>{opt.label}</span>
                {categoryCounts[opt.id] > 0 && (
                  <Box component="span" sx={{ fontWeight: 800 }}>
                    {categoryCounts[opt.id]}
                  </Box>
                )}
              </Stack>
            }
            clickable
            color={category === opt.id ? 'primary' : 'default'}
            variant={category === opt.id ? 'filled' : 'outlined'}
            onClick={() => setCategory(opt.id)}
            sx={{ fontWeight: 700 }}
          />
        ))}
      </Stack>

      {loading && notifications.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : visibleNotifications.length === 0 ? (
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
          {visibleNotifications.map((notification) => {
            const isUnread = !notification.is_read

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
                  if (getAdminNotificationTarget(notification)) {
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
                        label={notificationKindLabel(notification)}
                        size="small"
                        color={
                          notificationKindLabel(notification) === 'Query'
                            ? 'error'
                            : notificationKindLabel(notification) === 'Feedback'
                              ? 'warning'
                              : 'default'
                        }
                        variant="outlined"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
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
                    {getAdminNotificationTarget(notification) && (
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

