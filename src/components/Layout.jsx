import React, { useMemo, useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  Chip,
  Tooltip,
  ListSubheader,
  LinearProgress,
  Stack,
  CircularProgress,
  Button,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalShipping as ShipmentsIcon,
  VerifiedUser as ComplianceIcon,
  Assessment as ReportsIcon,
  Logout,
  Notifications,
  Search,
  Settings,
  Person,
  BusinessCenter,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  ChatBubbleOutline as ChatIcon,
  SupportAgent as SupportIcon,
  Assignment,
  Home as HomeIcon,
  Inbox as InboxIcon,
} from '@mui/icons-material'
import HubIcon from '@mui/icons-material/Hub'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import WidgetsIcon from '@mui/icons-material/Widgets'
import TimelineIcon from '@mui/icons-material/Timeline'
import BarChartIcon from '@mui/icons-material/BarChart'
import { useAuth } from '../contexts/AuthContext'
import { notificationsAPI, consignmentRequestsAPI, shipmentsAPI } from '../services/api'
import { useAdminNotifications } from '../hooks/useNotifications'
import { navigateFromAdminNotification, getSidebarAlertCounts, formatAlertCount } from '../utils/notificationNavigation'
import { useQuery } from '@tanstack/react-query'
import { fieldStaffKeys } from '../hooks/useFieldStaff'
import { formatDistanceToNow } from 'date-fns'
import EPALogo from './EPALogo'

const drawerWidthExpanded = 260
const drawerWidthCollapsed = 64

const navigationSections = [
  {
    title: 'Command Center',
    caption: 'Real-time operations cockpit',
    icon: <HubIcon fontSize="small" />, 
    items: [
      { 
        text: 'Cockpit', 
        icon: <DashboardIcon />, 
        path: '/dashboard',
        roles: ['admin', 'reporting-officer']
      },
      {
        text: 'Consignments', 
        icon: <ShipmentsIcon />, 
        path: '/dashboard/shipments',
        roles: ['admin', 'reporting-officer'],
        badgeKey: 'consignments',
        extraBadges: [
          { key: 'consignmentQueries', tone: 'query', label: 'queries' },
          { key: 'consignmentFeedback', tone: 'feedback', label: 'feedback' },
        ],
      },
      {
        text: 'Consignment Requests',
        icon: <Assignment />,
        path: '/dashboard/consignment-requests',
        roles: ['admin', 'reporting-officer'],
        badgeKey: 'requests',
        extraBadges: [
          { key: 'requestQueries', tone: 'query', label: 'queries' },
        ],
      },
    ],
  },
  {
    title: 'Controls',
    caption: 'Governance & performance',
    icon: <SecurityOutlinedIcon fontSize="small" />, 
    items: [
      { 
        text: 'Checklist', 
        icon: <ComplianceIcon />, 
        path: '/dashboard/compliance',
        roles: ['admin', 'reporting-officer']
      },
      { 
        text: 'Reports', 
        icon: <ReportsIcon />, 
        path: '/dashboard/reports',
        roles: ['admin', 'reporting-officer']
      },
      {
        text: 'Field Staff Performance',
        icon: <BarChartIcon />,
        path: '/dashboard/field-staff-performance',
        roles: ['admin']
      },
    ],
  },
  {
    title: 'Service & Communication',
    caption: 'Client support & interactions',
    icon: <SupportIcon fontSize="small" />,
    items: [
      {
        text: 'Feedback & Support',
        icon: <ChatIcon />,
        path: '/dashboard/feedback',
        roles: ['admin', 'reporting-officer'],
        badgeKey: 'feedback',
      },
      {
        text: 'Notifications',
        icon: <Notifications />,
        path: '/dashboard/notifications',
        roles: ['admin', 'reporting-officer'],
        badgeKey: 'notifications',
      },
    ],
  },
  {
    title: 'Resources',
    caption: 'People & governance roles',
    icon: <WidgetsIcon fontSize="small" />, 
    items: [
      {
        text: 'Users',
        icon: <PeopleIcon />,
        path: '/dashboard/users',
        roles: ['admin']
      },
      {
        text: 'ICD/BOND',
        icon: <Warehouse />,
        path: '/dashboard/depots',
        roles: ['admin', 'reporting-officer']
      },
      {
        text: 'Clearance Activities',
        icon: <TimelineIcon />,
        path: '/dashboard/clearance-activities',
        roles: ['admin', 'reporting-officer']
      },
    ],
  },
]

/** Field staff sidebar — mirrors the mobile Field Staff app tabs & shortcuts. */
const fieldStaffNavigationSections = [
  {
    title: 'Field Work',
    caption: 'Your daily operations',
    icon: <HomeIcon fontSize="small" />,
    items: [
      {
        text: 'Home',
        icon: <HomeIcon />,
        path: '/dashboard/field-staff',
        roles: ['field-staff', 'admin'],
        exact: true,
      },
      {
        text: 'Assignments',
        icon: <Assignment />,
        path: '/dashboard/field-staff/assignments',
        roles: ['field-staff', 'admin'],
        badgeKey: 'assignments',
      },
      {
        text: 'Consignments',
        icon: <ShipmentsIcon />,
        path: '/dashboard/field-staff/consignments',
        roles: ['field-staff', 'admin'],
        badgeKey: 'consignments',
      },
      {
        text: 'Requests',
        icon: <InboxIcon />,
        path: '/dashboard/field-staff/incoming',
        roles: ['field-staff', 'admin'],
        badgeKey: 'incoming',
      },
    ],
  },
  {
    title: 'Account',
    caption: 'Alerts & profile',
    icon: <Person fontSize="small" />,
    items: [
      {
        text: 'Notifications',
        icon: <Notifications />,
        path: '/dashboard/notifications',
        roles: ['field-staff', 'admin'],
        badgeKey: 'notifications',
      },
      {
        text: 'Profile',
        icon: <Person />,
        path: '/dashboard/field-staff/profile',
        roles: ['field-staff', 'admin'],
      },
    ],
  },
]

const isPathActive = (currentPath, targetPath, exact = false) => {
  if (targetPath === '/') {
    return currentPath === '/'
  }
  if (exact) {
    return currentPath === targetPath
  }
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}

const checkRoleAccess = (itemRoles, userRoles) => {
  if (!itemRoles || itemRoles.length === 0) return true
  if (!userRoles || userRoles.length === 0) return false
  return itemRoles.some(role => userRoles.some(uRole => uRole.name === role))
}

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    // Load from localStorage, default to false (collapsed)
    const saved = localStorage.getItem('sidebarExpanded')
    return saved ? JSON.parse(saved) : false
  })
  const [anchorEl, setAnchorEl] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isFieldStaff, isAdmin, isReportingOfficer } = useAuth()
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null)
  const {
    unreadCount,
    unreadNotifications,
    unreadLoading: notificationsLoading,
    refetchUnread,
    invalidate: invalidateNotifications,
  } = useAdminNotifications()

  const useFieldStaffNav = isFieldStaff && !isAdmin && !isReportingOfficer

  const { data: myAssignments = [] } = useQuery({
    queryKey: fieldStaffKeys.assignments(),
    queryFn: () => shipmentsAPI.getMyAssignments(),
    enabled: useFieldStaffNav || isAdmin,
    staleTime: 30_000,
  })
  const { data: incomingRequests = [] } = useQuery({
    queryKey: fieldStaffKeys.incoming(),
    queryFn: async () => {
      const data = await consignmentRequestsAPI.incoming()
      return Array.isArray(data) ? data : []
    },
    enabled: useFieldStaffNav || isAdmin,
    staleTime: 30_000,
  })

  const activeAssignmentCount = useMemo(
    () => myAssignments.filter((a) => String(a.status || '').toLowerCase() !== 'completed').length,
    [myAssignments]
  )
  const myConsignmentCount = useMemo(() => {
    const ids = new Set()
    for (const a of myAssignments) {
      const id = a.shipment_id || a.id
      if (id) ids.add(id)
    }
    return ids.size
  }, [myAssignments])

  const sidebarAlerts = useMemo(() => {
    const base = getSidebarAlertCounts(unreadNotifications, unreadCount)
    return {
      ...base,
      assignments: activeAssignmentCount,
      consignments: useFieldStaffNav ? myConsignmentCount : base.consignments,
      incoming: incomingRequests.length,
    }
  }, [
    unreadNotifications,
    unreadCount,
    activeAssignmentCount,
    myConsignmentCount,
    incomingRequests,
    useFieldStaffNav,
  ])

  const drawerWidth = sidebarExpanded ? drawerWidthExpanded : drawerWidthCollapsed

  const handleSidebarToggle = () => {
    const newState = !sidebarExpanded
    setSidebarExpanded(newState)
    localStorage.setItem('sidebarExpanded', JSON.stringify(newState))
  }

  const filteredSections = useMemo(() => {
    const source = useFieldStaffNav ? fieldStaffNavigationSections : navigationSections
    return source
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => checkRoleAccess(item.roles, user?.roles)),
      }))
      .filter((section) => section.items.length > 0)
  }, [user, useFieldStaffNav])

  const flattenedMenu = useMemo(() => {
    return filteredSections.flatMap((section) => section.items)
  }, [filteredSections])

  const activeItem = useMemo(
    () =>
      flattenedMenu.find((item) => isPathActive(location.pathname, item.path, item.exact)) ??
      flattenedMenu[0],
    [location.pathname, flattenedMenu]
  )
  const notificationsMenuOpen = Boolean(notificationsAnchorEl)

  useEffect(() => {
    const handler = () => invalidateNotifications()
    window.addEventListener('notifications:updated', handler)
    return () => window.removeEventListener('notifications:updated', handler)
  }, [invalidateNotifications])

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget)
    refetchUnread()
  }

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null)
  }

  const handleNotificationsViewAll = () => {
    handleNotificationsClose()
    navigate('/dashboard/notifications')
  }

  const handleNotificationsMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      invalidateNotifications()
      window.dispatchEvent(new Event('notifications:updated'))
    } catch (error) {
      console.error('Failed to mark notifications as read', error)
    } finally {
      handleNotificationsClose()
    }
  }

  const handleNotificationSelect = async (notification) => {
    handleNotificationsClose()
    try {
      if (!notification.is_read) {
        await notificationsAPI.markRead(notification.id)
        invalidateNotifications()
        window.dispatchEvent(new Event('notifications:updated'))
      }
    } catch (error) {
      console.error('Failed to update notification', error)
    }

    if (!navigateFromAdminNotification(navigate, notification)) {
      navigate('/dashboard/notifications', { state: { notificationId: notification.id } })
    }
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const drawer = (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        backgroundColor: '#0A192F', // Deep professional corporate blue
        color: '#FFFFFF',
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          backgroundColor: '#061020', // Darker navy for header
          color: '#FFFFFF',
          p: sidebarExpanded ? 2.5 : 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarExpanded ? 'flex-start' : 'center',
          gap: sidebarExpanded ? 2 : 0,
          minHeight: 70,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            width: sidebarExpanded ? '100%' : 44,
            height: 48,
          }}
        >
          {sidebarExpanded ? (
            <EPALogo width={160} height={48} variant="white" sx={{ maxWidth: '100%' }} />
          ) : (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 1.5,
                background: 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                },
                overflow: 'hidden',
              }}
            >
              <EPALogo width={32} height={32} variant="white" sx={{ maxWidth: '100%' }} />
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Expand/Collapse Button - Slack-style */}
        <IconButton
          onClick={handleSidebarToggle}
          sx={{
            position: 'absolute',
            top: 55,
            right: -14,
            zIndex: 1300,
            width: 28,
            height: 28,
            backgroundColor: '#FFFFFF',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            color: '#0A192F',
            '&:hover': {
              backgroundColor: '#F8F9FA',
              transform: 'scale(1.08)',
            },
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {sidebarExpanded ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
      </IconButton>
      
      {/* Navigation Menu - Slack-style */}
      <List
        sx={{
          flexGrow: 1,
          pt: 1,
          px: sidebarExpanded ? 1 : 0.5,
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '3px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.3)',
            },
          },
        }}
      >
        {filteredSections.map((section, sectionIndex) => (
          <Box key={section.title} sx={{ mb: sidebarExpanded ? 2.5 : 1.5 }}>
            {sidebarExpanded && (
              <ListSubheader
                disableSticky
                sx={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.5)',
                  px: 2,
                  py: 1.25,
                  background: 'transparent',
                  lineHeight: 1.2,
                }}
              >
                {section.title}
              </ListSubheader>
            )}
            {section.items.map((item) => {
              const isSelected = isPathActive(location.pathname, item.path, item.exact)
              const alertCount = item.badgeKey ? (sidebarAlerts[item.badgeKey] || 0) : 0
              const extraBadgeItems = (item.extraBadges || [])
                .map((badge) => ({
                  ...badge,
                  count: sidebarAlerts[badge.key] || 0,
                  display: formatAlertCount(sidebarAlerts[badge.key] || 0),
                }))
                .filter((badge) => badge.display)
              const visibleBadges = extraBadgeItems.length
                ? extraBadgeItems
                : (formatAlertCount(alertCount)
                  ? [{ display: formatAlertCount(alertCount), tone: 'query', title: 'unread' }]
                  : [])
              const collapsedLabel = formatAlertCount(
                alertCount || extraBadgeItems.reduce((sum, badge) => sum + badge.count, 0)
              )
              const tooltipDetail = extraBadgeItems.length
                ? [
                    collapsedLabel ? `${collapsedLabel} unread` : null,
                    extraBadgeItems.map((badge) => `${badge.display} ${badge.label}`).join(', '),
                  ].filter(Boolean).join(' · ')
                : (collapsedLabel ? `${collapsedLabel} unread` : '')
              const tooltipTitle = !sidebarExpanded
                ? (tooltipDetail ? `${item.text} (${tooltipDetail})` : item.text)
                : ''
              const navIcon = React.cloneElement(item.icon, { 
                fontSize: sidebarExpanded ? 'small' : 'medium',
                sx: { fontSize: sidebarExpanded ? '20px' : '22px' }
              })
              return (
                <Tooltip 
                  key={item.text} 
                  title={tooltipTitle} 
                  placement="right"
                  arrow
                  PopperProps={{
                    sx: {
                      '& .MuiTooltip-tooltip': {
                        backgroundColor: '#1a1a1a',
                        color: 'white',
                        fontSize: '0.75rem',
                        padding: '6px 10px',
                        borderRadius: '4px',
                      },
                      '& .MuiTooltip-arrow': {
                        color: '#1a1a1a',
                      },
                    },
                  }}
                >
                  <ListItem 
                    disablePadding 
                    sx={{ 
                      mb: 0.25, 
                      px: sidebarExpanded ? 1 : 0.5,
                    }}
                  >
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => {
                        navigate(item.path)
                        setMobileOpen(false)
                      }}
                      sx={{
                        borderRadius: sidebarExpanded ? '6px' : '8px',
                        py: 1,
                        px: sidebarExpanded ? 1.5 : 1,
                        justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                        minHeight: 36,
                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                        backgroundColor: isSelected 
                          ? 'rgba(255, 255, 255, 0.15)' 
                          : 'transparent',
                        color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.7)',
                        position: 'relative',
                        '&::before': isSelected ? {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '3px',
                          height: '20px',
                          backgroundColor: 'white',
                          borderRadius: '0 2px 2px 0',
                        } : {},
                        '&:hover': {
                          backgroundColor: isSelected 
                            ? 'rgba(255, 255, 255, 0.2)' 
                            : 'rgba(255, 255, 255, 0.08)',
                          color: 'white',
                          transform: 'translateX(2px)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          color: 'white',
                          fontWeight: 600,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '& .MuiListItemIcon-root': {
                            color: 'white',
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: sidebarExpanded ? 28 : 'auto',
                          color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.7)',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                          fontSize: '20px',
                        }}
                      >
                        {collapsedLabel && !sidebarExpanded ? (
                          <Badge
                            badgeContent={collapsedLabel}
                            color="error"
                            overlap="circular"
                            sx={{
                              '& .MuiBadge-badge': {
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                minWidth: 16,
                                height: 16,
                                px: 0.4,
                                right: -2,
                                top: 2,
                                bgcolor: '#ef4444',
                                color: '#fff',
                              },
                            }}
                          >
                            {navIcon}
                          </Badge>
                        ) : (
                          navIcon
                        )}
                      </ListItemIcon>
                      {sidebarExpanded && (
                        <ListItemText 
                          primary={item.text.toUpperCase()}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: isSelected ? 600 : 400,
                            letterSpacing: '0.2px',
                            sx: {
                              transition: 'font-weight 0.15s ease',
                            },
                          }}
                        />
                      )}
                      {sidebarExpanded && visibleBadges.map((badge) => (
                        <Chip
                          key={`${item.text}-${badge.tone}-${badge.display}`}
                          size="small"
                          label={badge.display}
                          sx={{
                            ml: 0.5,
                            height: 18,
                            minWidth: 18,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            bgcolor: badge.tone === 'feedback' ? '#f59e0b' : '#ef4444',
                            color: badge.tone === 'feedback' ? '#111' : '#fff',
                            '& .MuiChip-label': { px: 0.75 },
                          }}
                        />
                      ))}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              )
            })}
          </Box>
        ))}
      </List>
      
      {/* Footer Section - Slack-style */}
      {sidebarExpanded && (
        <Box
          sx={{
            p: 1.5,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1,
              py: 0.75,
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <BusinessCenter sx={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)' }} />
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              EPA Carriers
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.3s ease, margin 0.3s ease',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, minHeight: '70px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              color: 'text.primary',
            }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Spacer to push items to the right */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton 
              color="inherit" 
              onClick={handleNotificationsOpen}
              sx={{ 
                mr: 1,
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                },
              }}
            >
              <Badge 
                badgeContent={unreadCount > 0 ? unreadCount : null} 
                color="error"
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.7rem',
                    minWidth: '18px',
                    height: '18px',
                    padding: '0 4px',
                  },
                }}
              >
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={notificationsAnchorEl}
            open={notificationsMenuOpen}
            onClose={handleNotificationsClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1.5,
                width: 360,
                maxWidth: '90vw',
                borderRadius: 2,
                boxShadow: '0 12px 32px rgba(14, 30, 64, 0.25)',
              },
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                Notifications
              </Typography>
              <Button
                size="small"
                onClick={handleNotificationsMarkAllRead}
                disabled={!unreadCount}
              >
                Mark all read
              </Button>
            </Box>
            <Divider />
            {notificationsLoading ? (
              <Box
                sx={{
                  px: 2,
                  py: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                }}
              >
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Loading notifications...
                </Typography>
              </Box>
            ) : unreadNotifications.length === 0 ? (
              <Box sx={{ px: 2, py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  You're all caught up! No unread notifications.
                </Typography>
              </Box>
            ) : (
              unreadNotifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => handleNotificationSelect(notification)}
                  sx={{
                    alignItems: 'flex-start',
                    gap: 1.5,
                    py: 1.5,
                    whiteSpace: 'normal',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
            <Divider />
            <MenuItem onClick={handleNotificationsViewAll}>
              <ListItemText primary="View all notifications" />
            </MenuItem>
          </Menu>

          {/* Date */}
          <Chip
            label={new Date().toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
            size="small"
            sx={{
              mr: 2,
              display: { xs: 'none', sm: 'flex' },
              backgroundColor: alpha('#1e3c72', 0.06),
              color: 'text.secondary',
              fontWeight: 500,
            }}
          />

          {/* User Menu */}
          <Tooltip title={user?.email || 'User'}>
            <IconButton 
              onClick={handleMenuOpen} 
              sx={{ 
                p: 0,
                border: '2px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                },
                transition: 'all 0.2s',
              }}
            >
              <Avatar 
                src={
                  user?.user_photo
                    ? user.user_photo.startsWith('data:')
                      ? user.user_photo
                      : `data:image/jpeg;base64,${user.user_photo}`
                    : undefined
                }
                sx={{ 
                  bgcolor: user?.user_photo ? 'transparent' : 'primary.main',
                  width: 40,
                  height: 40,
                  fontWeight: 600,
                }}
              >
                {!user?.user_photo && (user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A')}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 220,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                borderRadius: 2,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {user?.full_name || 'Admin User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
              <ListItemIcon>
                <Logout fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: '#0A192F', // Deep Blue overriding original inline color
              borderRight: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              overflowX: 'hidden',
              borderRight: 'none',
              backgroundColor: '#0A192F', // Deep Blue overriding original inline color
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '56px', sm: '70px' },
          backgroundColor: '#f8f9fa',
          minHeight: 'calc(100vh - 70px)',
          transition: 'width 0.3s ease',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default Layout


