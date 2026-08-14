import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Menu as MenuIcon,
  LocalShippingOutlined,
  ShieldOutlined,
  NotificationsOutlined,
  PersonOutline,
  HelpOutline,
  Logout,
  LockOutlined,
} from '@mui/icons-material'
import EPALogo from '../EPALogo'
import { useClientAuth } from '../../contexts/ClientAuthContext'
import { clientPortalAPI } from '../../services/clientPortalApi'

const DRAWER_WIDTH = 260

const navItems = [
  { label: 'Consignments', path: '/client/consignments', icon: LocalShippingOutlined },
  { label: 'My Requests', path: '/client/consignments/requests', icon: LocalShippingOutlined },
  { label: 'Compliance', path: '/client/compliance', icon: ShieldOutlined },
  { label: 'Notifications', path: '/client/notifications', icon: NotificationsOutlined, badge: true },
  { label: 'Profile', path: '/client/profile', icon: PersonOutline },
  { label: 'Support', path: '/client/support', icon: HelpOutline },
]

export default function ClientLayout() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const { client, logout } = useClientAuth()

  useEffect(() => {
    clientPortalAPI
      .getUnreadCount()
      .then((data) => setUnreadCount(data.count ?? data ?? 0))
      .catch(() => {})
  }, [location.pathname])

  const initials = client?.name
    ? client.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'CL'

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          px: 2.5,
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #01A3DA 0%, #0178A3 100%)',
        }}
      >
        <EPALogo variant="white" height={44} />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', mt: 1, display: 'block' }}>
          Client Portal
        </Typography>
      </Box>
      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path)
          const Icon = item.icon
          return (
            <ListItemButton
              key={item.path}
              selected={active}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  '& .MuiListItemIcon-root': { color: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.badge ? (
                  <Badge badgeContent={unreadCount} color="error" max={99}>
                    <Icon fontSize="small" />
                  </Badge>
                ) : (
                  <Icon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: 14 }}
              />
            </ListItemButton>
          )
        })}
      </List>
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          Signed in as
        </Typography>
        <Typography variant="body2" fontWeight={600} noWrap>
          {client?.name}
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: '#fff',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1, fontSize: { xs: '1rem', sm: '1.15rem' } }}>
            {navItems.find((i) => location.pathname.startsWith(i.path))?.label || 'Client Portal'}
          </Typography>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>{initials}</Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem
              onClick={() => {
                setAnchorEl(null)
                navigate('/client/profile')
              }}
            >
              <PersonOutline fontSize="small" sx={{ mr: 1 }} /> Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null)
                navigate('/client/change-password')
              }}
            >
              <LockOutlined fontSize="small" sx={{ mr: 1 }} /> Change Password
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                logout()
                navigate('/client/login')
              }}
            >
              <Logout fontSize="small" sx={{ mr: 1 }} /> Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
          p: { xs: 2, sm: 3 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
