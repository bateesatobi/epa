import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  Stack,
  Tooltip,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  LocalShipping,
  TrendingUp,
  CheckCircle,
  Schedule,
  Error,
  Warning,
  AttachMoney,
  People,
  Assessment,
  Notifications,
  MoreVert,
  ArrowUpward,
  ArrowDownward,
  Refresh,
  PendingActions,
  DirectionsBoatFilled,
  TaskAlt,
  Timeline,
  Insights,
  PeopleAlt,
  DonutLarge,
} from '@mui/icons-material'
import { reportsAPI, shipmentsAPI, usersAPI } from '../services/api'
import { toast } from 'react-toastify'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, subDays, startOfDay } from 'date-fns'

const StatCard = ({ title, value, icon, color, subtitle, trend, onClick }) => (
  <Card
    sx={{
      height: '100%',
      background: `linear-gradient(135deg, ${alpha(color === 'primary' ? '#1976d2' : color === 'success' ? '#2e7d32' : color === 'warning' ? '#ed6c02' : color === 'error' ? '#d32f2f' : '#2196f3', 0.1)} 0%, ${alpha(color === 'primary' ? '#1976d2' : color === 'success' ? '#2e7d32' : color === 'warning' ? '#ed6c02' : color === 'error' ? '#d32f2f' : '#2196f3', 0.05)} 100%)`,
      border: `1px solid ${alpha(color === 'primary' ? '#1976d2' : color === 'success' ? '#2e7d32' : color === 'warning' ? '#ed6c02' : color === 'error' ? '#d32f2f' : '#2196f3', 0.2)}`,
      transition: 'all 0.3s ease',
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? {
        transform: 'translateY(-4px)',
        boxShadow: 6,
      } : {},
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2" fontWeight="medium">
            {title}
          </Typography>
          <Typography variant="h3" component="div" fontWeight="bold" sx={{ mb: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
              {trend > 0 ? (
                <ArrowUpward sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
              ) : trend < 0 ? (
                <ArrowDownward sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
              ) : null}
              <Typography
                variant="caption"
                color={trend > 0 ? 'success.main' : trend < 0 ? 'error.main' : 'text.secondary'}
                fontWeight="medium"
              >
                {Math.abs(trend)}% vs last period
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.main`,
            borderRadius: 2,
            p: 1.5,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

const SecondaryStatCard = ({ label, value, color, icon }) => (
  <Card
    sx={{
      height: '100%',
      borderRadius: 3,
      border: '1px solid rgba(25, 118, 210, 0.08)',
      background: 'linear-gradient(135deg, rgba(8, 24, 68, 0.03) 0%, rgba(8, 24, 68, 0.06) 100%)',
      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 18px 30px rgba(12, 38, 92, 0.16)',
      },
    }}
  >
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: 2,
          background: alpha(color || '#1976d2', 0.15),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color || 'primary.main',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h4" fontWeight="bold" color={color ? undefined : 'text.primary'}>
          {value}
        </Typography>
      </Box>
    </CardContent>
  </Card>
)

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState(null)
  const [activityAnalytics, setActivityAnalytics] = useState(null)
  const [fieldStaffAnalytics, setFieldStaffAnalytics] = useState(null)
  const [overdueAnalytics, setOverdueAnalytics] = useState(null)
  const [timelineAnalytics, setTimelineAnalytics] = useState(null)
  const [shipments, setShipments] = useState([])
  const [alerts, setAlerts] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [refreshKey])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [
        kpisData,
        activityData,
        fieldStaffData,
        overdueData,
        timelineData,
        shipmentsData,
        alertsData,
      ] = await Promise.all([
        reportsAPI.getKPIs(),
        reportsAPI.getActivityAnalytics(),
        reportsAPI.getFieldStaffAnalytics(),
        reportsAPI.getOverdueAnalytics(),
        reportsAPI.getTimelineAnalytics(7), // Last 7 days for dashboard
        shipmentsAPI.list({ limit: 10 }),
        reportsAPI.getControlRoomAlerts(),
      ])
      setKpis(kpisData)
      setActivityAnalytics(activityData)
      setFieldStaffAnalytics(fieldStaffData)
      setOverdueAnalytics(overdueData)
      setTimelineAnalytics(timelineData)
      setShipments(shipmentsData.items || [])
      setAlerts(alertsData)
    } catch (error) {
      toast.error('Failed to load dashboard data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    toast.info('Refreshing data...')
  }

  if (loading && !kpis) {
    return (
      <Box>
        <LinearProgress />
      </Box>
    )
  }

  // Activity status distribution
  const totalPending = activityAnalytics?.activities?.reduce((sum, a) => sum + (a.pending || 0), 0) || 0
  const totalInProgress = activityAnalytics?.activities?.reduce((sum, a) => sum + (a.in_progress || 0), 0) || 0
  const totalCompleted = activityAnalytics?.activities?.reduce((sum, a) => sum + (a.completed || 0), 0) || 0
  
  const activityStatusData = [
    { name: 'Completed', value: totalCompleted, color: '#2e7d32' },
    { name: 'In Progress', value: totalInProgress, color: '#1976d2' },
    { name: 'Pending', value: totalPending, color: '#ed6c02' },
  ]

  const completionRate = kpis?.completion_rate || 0

  // Real timeline data from API
  const weeklyData = timelineAnalytics?.timeline?.map((item) => {
    const date = new Date(item.date)
    const dayName = format(date, 'EEE')
    return {
      day: dayName,
      shipments: item.shipments || 0,
      assignments: item.assignments || 0,
      completed: item.completed || 0,
    }
  }) || []

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(25,118,210,0.18) 0%, rgba(8,38,90,0.3) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
                boxShadow: 'inset 0 2px 6px rgba(12,42,104,0.25)',
              }}
            >
              <Insights sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h4" gutterBottom fontWeight="bold">
                Cockpit Overview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time insights and performance metrics
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Tooltip title="Refresh analytics" arrow>
          <IconButton onClick={handleRefresh} color="primary" sx={{ boxShadow: '0 8px 20px rgba(25,118,210,0.2)' }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Key Performance Indicators */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Consignments"
            value={kpis?.total_shipments || 0}
            icon={<LocalShipping sx={{ fontSize: 32 }} />}
            color="primary"
            trend={5.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completion Rate"
            value={`${completionRate.toFixed(1)}%`}
            icon={<CheckCircle sx={{ fontSize: 32 }} />}
            color="success"
            subtitle={`${kpis?.completed_assignments || 0} of ${kpis?.total_assignments || 0} assignments`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Progress"
            value={kpis?.in_transit || 0}
            icon={<TrendingUp sx={{ fontSize: 32 }} />}
            color="info"
            subtitle="Active activities"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Consignments"
            value={kpis?.overdue_shipments || 0}
            icon={<Warning sx={{ fontSize: 32 }} />}
            color={kpis?.overdue_shipments > 0 ? 'error' : 'success'}
            subtitle="Exceeding 9 days"
          />
        </Grid>
      </Grid>

      {/* Secondary Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SecondaryStatCard
            label="Pending Activities"
            value={totalPending}
            color="#ed6c02"
            icon={<PendingActions />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SecondaryStatCard
            label="Completed Activities"
            value={totalCompleted}
            color="#2e7d32"
            icon={<TaskAlt />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SecondaryStatCard
            label="Field Staff"
            value={fieldStaffAnalytics?.total_staff || 0}
            color="#0288d1"
            icon={<PeopleAlt />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SecondaryStatCard
            label="Total Activities"
            value={activityAnalytics?.total_activities || 0}
            color="#1976d2"
            icon={<Assessment />}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Timeline color="primary" />
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Last 7 Days Activity Trends
                </Typography>
              </Stack>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1976d2" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAssignments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0288d1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0288d1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2e7d32" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area type="monotone" dataKey="shipments" stroke="#1976d2" fillOpacity={1} fill="url(#colorShipments)" name="New Shipments" />
                  <Area type="monotone" dataKey="assignments" stroke="#0288d1" fillOpacity={1} fill="url(#colorAssignments)" name="New Assignments" />
                  <Area type="monotone" dataKey="completed" stroke="#2e7d32" fillOpacity={1} fill="url(#colorCompleted)" name="Completed Activities" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DonutLarge color="primary" />
                Activity Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={activityStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {activityStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity and Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DirectionsBoatFilled color="primary" />
                  Recent Consignments
                </Typography>
                <Chip label={`${shipments.length} active`} size="small" color="primary" />
              </Box>
              <List>
                {shipments.slice(0, 5).map((shipment, index) => (
                  <React.Fragment key={shipment.id}>
                    <ListItem
                      onClick={() => navigate(`/shipments/${shipment.id}`)}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        backgroundColor: alpha('#1976d2', 0.02),
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha('#1976d2', 0.08),
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: shipment.is_overdue
                              ? 'error.main'
                              : shipment.current_clearance_activity_name
                              ? 'info.main'
                              : 'warning.main',
                          }}
                        >
                          <LocalShipping />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography variant="body1" fontWeight="medium" color={shipment.is_overdue ? 'error.main' : 'inherit'}>
                              {shipment.shipment_number}
                            </Typography>
                            {shipment.is_overdue && (
                              <Chip label="Overdue" size="small" color="error" />
                            )}
                            {shipment.current_clearance_activity_name && (
                              <Chip
                                label={shipment.current_clearance_activity_name}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography variant="body2" color="text.secondary">
                              {shipment.origin} → {shipment.destination}
                            </Typography>
                            {shipment.days_in_system !== undefined && (
                              <Chip
                                label={`${shipment.days_in_system} days`}
                                size="small"
                                variant="outlined"
                                color={shipment.is_overdue ? 'error' : 'default'}
                              />
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                    {index < shipments.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Performance Metrics
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Activity Completion Rate</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {completionRate.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={completionRate}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha('#1976d2', 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: completionRate >= 80 ? 'success.main' : completionRate >= 60 ? 'warning.main' : 'error.main',
                        },
                      }}
                    />
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Field Staff Performance</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {fieldStaffAnalytics?.avg_completion_rate?.toFixed(1) || 0}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={fieldStaffAnalytics?.avg_completion_rate || 0}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha('#1976d2', 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: (fieldStaffAnalytics?.avg_completion_rate || 0) >= 80 ? 'success.main' : 'info.main',
                        },
                      }}
                    />
                  </Box>
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Overdue Consignments</Typography>
                      <Typography variant="body2" fontWeight="bold" color={kpis?.overdue_shipments > 0 ? 'error.main' : 'success.main'}>
                        {kpis?.overdue_shipments || 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={kpis?.overdue_shipments > 0 ? 100 : 0}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha('#1976d2', 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: kpis?.overdue_shipments > 0 ? 'error.main' : 'success.main',
                        },
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ background: 'linear-gradient(135deg, rgba(21,101,192,0.12) 0%, rgba(21,101,192,0.28) 100%)' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Command Center Alerts
                  </Typography>
                  <Chip label={`${alerts.length} live`} color="primary" size="small" />
                </Box>
                <List dense disablePadding>
                  {alerts.slice(0, 5).map((alert) => {
                    const severityColor =
                      alert.severity === 'critical'
                        ? 'error'
                        : alert.severity === 'high'
                        ? 'error'
                        : alert.severity === 'medium'
                        ? 'warning'
                        : alert.severity === 'low'
                        ? 'info'
                        : 'default'
                    return (
                      <React.Fragment key={alert.id}>
                        <ListItem
                          alignItems="flex-start"
                          sx={{
                            borderRadius: 2,
                            mb: 1,
                            backgroundColor: alpha('#1565c0', 0.08),
                            '&:hover': {
                              backgroundColor: alpha('#1565c0', 0.14),
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor:
                                  severityColor === 'error'
                                    ? 'error.main'
                                    : severityColor === 'warning'
                                    ? 'warning.main'
                                    : severityColor === 'info'
                                    ? 'info.main'
                                    : 'success.main',
                                color: 'white',
                              }}
                            >
                              {severityColor === 'error' ? <Error /> : severityColor === 'warning' ? <Warning /> : <TrendingUp />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography variant="body1" fontWeight="bold">
                                  {alert.title}
                                </Typography>
                                <Chip
                                  label={alert.severity.toUpperCase()}
                                  size="small"
                                  color={severityColor === 'default' ? 'default' : severityColor}
                                  sx={{ fontWeight: 600 }}
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {alert.summary}
                              </Typography>
                            }
                          />
                        </ListItem>
                      </React.Fragment>
                    )
                  })}
                </List>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard
