import React, { useCallback, useMemo, useState, useEffect } from 'react'
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
} from '@mui/icons-material'
import HubIcon from '@mui/icons-material/Hub'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import WidgetsIcon from '@mui/icons-material/Widgets'
import TimelineIcon from '@mui/icons-material/Timeline'
import BarChartIcon from '@mui/icons-material/BarChart'
import { useAuth } from '../contexts/AuthContext'
import { notificationsAPI } from '../services/api'
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
    path: '/',
  },
  {
    text: 'Consignments', 
    icon: <ShipmentsIcon />, 
    path: '/shipments',
  },
    ],
  },
  {
    title: 'Controls',
    caption: 'Governance & performance',
    icon: <SecurityOutlinedIcon fontSize="small" />, 
    items: [
  { 
    text: 'Compliance', 
    icon: <ComplianceIcon />, 
    path: '/compliance',
  },
  { 
    text: 'Reports', 
    icon: <ReportsIcon />, 
    path: '/reports',
      },
      {
        text: 'Field Staff Performance',
        icon: <BarChartIcon />,
        path: '/field-staff-performance',
      },
      {
        text: 'Notifications',
        icon: <Notifications />,
        path: '/notifications',
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
        path: '/users',
      },
      {
        text: 'Depots',
        icon: <Warehouse />,
        path: '/depots',
      },
      {
        text: 'Clearance Activities',
        icon: <TimelineIcon />,
        path: '/clearance-activities',
      },
    ],
  },
]

const flattenedMenu = navigationSections.flatMap((section) => section.items)

const isPathActive = (currentPath, targetPath) => {
  if (targetPath === '/') {
    return currentPath === '/'
  }
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
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
  const { user, logout } = useAuth()
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null)
  const [unreadNotifications, setUnreadNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  const drawerWidth = sidebarExpanded ? drawerWidthExpanded : drawerWidthCollapsed

  const handleSidebarToggle = () => {
    const newState = !sidebarExpanded
    setSidebarExpanded(newState)
    localStorage.setItem('sidebarExpanded', JSON.stringify(newState))
  }

  const activeItem = useMemo(
    () => flattenedMenu.find((item) => isPathActive(location.pathname, item.path)) ?? flattenedMenu[0],
    [location.pathname]
  )
  const notificationsMenuOpen = Boolean(notificationsAnchorEl)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationsAPI.getUnreadCount()
      setUnreadCount(data.count || 0)
    } catch (error) {
      console.error('Failed to load unread count', error)
    }
  }, [])

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true)
      const data = await notificationsAPI.getUnread()
      setUnreadNotifications(Array.isArray(data) ? data : [])
      // Don't update count here - it's limited to 10 items, use fetchUnreadCount() instead
    } catch (error) {
      console.error('Failed to load notifications', error)
    } finally {
      setNotificationsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    fetchUnreadNotifications()
  }, [fetchUnreadCount, fetchUnreadNotifications])

  useEffect(() => {
    const handler = () => {
      fetchUnreadCount()
      fetchUnreadNotifications()
    }
    window.addEventListener('notifications:updated', handler)
    return () => window.removeEventListener('notifications:updated', handler)
  }, [fetchUnreadCount, fetchUnreadNotifications])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount()
      fetchUnreadNotifications()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [fetchUnreadCount, fetchUnreadNotifications])

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget)
    fetchUnreadNotifications()
  }

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null)
  }

  const handleNotificationsViewAll = () => {
    handleNotificationsClose()
    navigate('/notifications')
  }

  const handleNotificationsMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      setUnreadNotifications([])
      setUnreadCount(0) // Update count immediately
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
        setUnreadNotifications((prev) => prev.filter((item) => item.id !== notification.id))
        // Update count when a notification is marked as read
        setUnreadCount((prev) => Math.max(0, prev - 1))
        window.dispatchEvent(new Event('notifications:updated'))
      }
    } catch (error) {
      console.error('Failed to update notification', error)
    }

    if (notification.resource_type === 'shipment' && notification.resource_id) {
      navigate(`/shipments/${notification.resource_id}`)
    } else {
      navigate('/notifications', { state: { notificationId: notification.id } })
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
        backgroundColor: '#350D36', // Slack's dark purple background
        color: 'white',
      }}
    >
      {/* Logo Section - Slack-style header */}
      <Box
        sx={{
          backgroundColor: '#350D36',
          color: 'white',
          p: sidebarExpanded ? 2 : 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarExpanded ? 'flex-start' : 'center',
          gap: sidebarExpanded ? 1.5 : 0,
          minHeight: 60,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            width: sidebarExpanded ? 'auto' : 36,
            height: 36,
          }}
        >
          {sidebarExpanded ? (
            <EPALogo width={100} height={32} variant="white" sx={{ maxWidth: '100%' }} />
          ) : (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                background: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'rgba(255,255,255,0.15)',
                },
                overflow: 'hidden',
              }}
            >
              <EPALogo width={28} height={28} variant="white" sx={{ maxWidth: '100%' }} />
            </Box>
          )}
        </Box>
        {sidebarExpanded && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.8, 
                fontSize: '0.65rem', 
                display: 'block',
                fontWeight: 500,
                letterSpacing: '0.5px',
              }}
            >
              EPA COCKPIT
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Expand/Collapse Button - Slack-style */}
      <IconButton
        onClick={handleSidebarToggle}
        sx={{
          position: 'absolute',
          top: 60,
          right: -14,
          zIndex: 1300,
          width: 28,
          height: 28,
          backgroundColor: 'white',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          color: '#350D36',
          '&:hover': {
            backgroundColor: '#f5f5f5',
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
        {navigationSections.map((section, sectionIndex) => (
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
            {section.items.map((item, itemIndex) => {
              const isSelected = isPathActive(location.pathname, item.path)
              return (
                <Tooltip 
                  key={item.text} 
                  title={!sidebarExpanded ? item.text : ''} 
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
                        {React.cloneElement(item.icon, { 
                          fontSize: sidebarExpanded ? 'small' : 'medium',
                          sx: { fontSize: sidebarExpanded ? '20px' : '22px' }
                        })}
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

          {/* Search Bar */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              position: 'relative',
              borderRadius: 2,
              backgroundColor: alpha('#1e3c72', 0.06),
              '&:hover': {
                backgroundColor: alpha('#1e3c72', 0.1),
              },
              width: { md: '300px', lg: '400px' },
              mr: 2,
              transition: 'all 0.2s',
            }}
          >
            <Box
              sx={{
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
            <InputBase
              placeholder="Search consignments, users..."
              sx={{
                flex: 1,
                color: 'text.primary',
                '& .MuiInputBase-input': {
                  padding: '8px 8px 8px 0',
                  fontSize: '0.9rem',
                },
              }}
            />
          </Box>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton 
              color="inherit" 
              onClick={handleNotificationsOpen}
              sx={{ 
                mr: 1,
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: alpha('#1e3c72', 0.08),
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
            <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </MenuItem>
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
              backgroundColor: '#350D36',
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
              backgroundColor: '#350D36',
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


