import React, { useState, useEffect, useMemo } from 'react'
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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Stack,
  Tooltip,
  Autocomplete,
  TextField,
  Paper,
  Button,
  CircularProgress,
  Skeleton,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  LocalShipping,
  TrendingUp,
  CheckCircle,
  Warning,
  Refresh,
  PendingActions,
  DirectionsBoatFilled,
  TaskAlt,
  Timeline,
  Insights,
  PeopleAlt,
  DonutLarge,
  Business,
  FilterList,
  Clear,
  Assessment,
  Inbox,
  HourglassEmpty,
} from '@mui/icons-material'
import { reportsAPI, shipmentsAPI, clientsAPI } from '../services/api'
import { toast } from 'react-toastify'
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

const StatCard = ({ title, value, icon, color, subtitle, trend, onClick, loading, description }) => (
  <Card
    sx={{
      height: '100%',
      background: `linear-gradient(135deg, ${alpha(color === 'primary' ? '#1976d2' : color === 'success' ? '#2e7d32' : color === 'warning' ? '#ed6c02' : color === 'error' ? '#d32f2f' : '#2196f3', 0.12)} 0%, ${alpha(color === 'primary' ? '#1976d2' : color === 'success' ? '#2e7d32' : color === 'warning' ? '#ed6c02' : color === 'error' ? '#d32f2f' : '#2196f3', 0.04)} 100%)`,
      border: `1px solid ${alpha(color === 'primary' ? '#1976d2' : color === 'success' ? '#2e7d32' : color === 'warning' ? '#ed6c02' : color === 'error' ? '#d32f2f' : '#2196f3', 0.25)}`,
      borderRadius: 3,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
      overflow: 'hidden',
      opacity: loading ? 0.7 : 1,
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, ${color === 'primary' ? '#1976d2' : color === 'success' ? '#2e7d32' : color === 'warning' ? '#ed6c02' : color === 'error' ? '#d32f2f' : '#2196f3'}, ${alpha(color === 'primary' ? '#1976d2' : color === 'success' ? '#2e7d32' : color === 'warning' ? '#ed6c02' : color === 'error' ? '#d32f2f' : '#2196f3', 0.5)})`,
      },
      '&:hover': onClick && !loading ? {
        transform: 'translateY(-6px)',
        boxShadow: `0 12px 24px ${alpha(color === 'primary' ? '#1976d2' : color === 'success' ? '#2e7d32' : color === 'warning' ? '#ed6c02' : color === 'error' ? '#d32f2f' : '#2196f3', 0.25)}`,
      } : {},
    }}
    onClick={onClick}
  >
    <CardContent sx={{ p: 3 }}>
      {loading ? (
        <Box display="flex" alignItems="center" justifyContent="center" sx={{ minHeight: 100 }}>
          <CircularProgress size={32} sx={{ color: `${color}.main` }} />
        </Box>
      ) : (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ flex: 1 }}>
              <Typography 
                color="textSecondary" 
                gutterBottom 
                variant="body2" 
                fontWeight={600}
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem', mb: 1 }}
              >
                {title}
              </Typography>
              <Typography 
                variant="h3" 
                component="div" 
                fontWeight="bold" 
                sx={{ mb: 0.5, lineHeight: 1.2 }}
              >
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontSize: '0.875rem' }}>
                  {subtitle}
                </Typography>
              )}
              {description && (
                <Tooltip title={description} arrow placement="top">
                  <Typography 
                    variant="caption" 
                    color="textSecondary" 
                    sx={{ 
                      mt: 0.5, 
                      fontSize: '0.7rem',
                      opacity: 0.7,
                      display: 'block',
                      cursor: 'help'
                    }}
                  >
                    ℹ️ What does this mean?
                  </Typography>
                </Tooltip>
              )}
            </Box>
            <Box
              sx={{
                backgroundColor: alpha(color === 'primary' ? '#1976d2' : color === 'success' ? '#2e7d32' : color === 'warning' ? '#ed6c02' : color === 'error' ? '#d32f2f' : '#2196f3', 0.15),
                borderRadius: 2.5,
                p: 1.5,
                color: `${color}.main`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ml: 2,
              }}
            >
              {icon}
            </Box>
          </Box>
        </>
      )}
    </CardContent>
  </Card>
)

const SecondaryStatCard = ({ label, value, color, icon }) => (
  <Card
    sx={{
      height: '100%',
      borderRadius: 3,
      border: '1px solid rgba(25, 118, 210, 0.1)',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(12, 38, 92, 0.12)',
        borderColor: alpha(color || '#1976d2', 0.3),
      },
    }}
  >
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: 2.5,
          background: alpha(color || '#1976d2', 0.12),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color || 'primary.main',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" color="textSecondary" gutterBottom fontWeight={500}>
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
  const [selectedClient, setSelectedClient] = useState(null)
  const [clients, setClients] = useState([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)

  // Fetch clients on mount
  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [refreshKey, selectedClient])

  const fetchClients = async () => {
    try {
      setClientsLoading(true)
      const data = await clientsAPI.list({ status: 'approved', limit: 1000 })
      setClients(data.items || [])
    } catch (error) {
      console.error('Failed to load clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setClientsLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setIsFiltering(!!selectedClient)
      const clientId = selectedClient?.id || null
      const params = clientId ? { client_id: clientId } : {}
      
      const [
        kpisData,
        activityData,
        fieldStaffData,
        overdueData,
        timelineData,
        shipmentsData,
        alertsData,
      ] = await Promise.all([
        reportsAPI.getKPIs(params),
        reportsAPI.getActivityAnalytics(params),
        reportsAPI.getFieldStaffAnalytics(params),
        reportsAPI.getOverdueAnalytics(params),
        reportsAPI.getTimelineAnalytics(30, params),
        shipmentsAPI.list({ limit: 10, ...(clientId && { client_id: clientId }) }),
        reportsAPI.getControlRoomAlerts(params),
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
      setIsFiltering(false)
    }
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    toast.info('Refreshing data...')
  }

  const handleClientChange = (event, newValue) => {
    setSelectedClient(newValue)
    setIsFiltering(true)
    setRefreshKey(prev => prev + 1)
  }

  const clearClientFilter = () => {
    setSelectedClient(null)
    setRefreshKey(prev => prev + 1)
  }

  // Check if client has no data
  const hasNoData = selectedClient && kpis && kpis.total_shipments === 0 && !loading

  // Show skeleton loader only on initial load, not on refresh
  const isInitialLoad = loading && !kpis

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

  // Real timeline data from API - Monthly view
  const monthlyData = timelineAnalytics?.timeline?.map((item) => {
    const date = new Date(item.date)
    const dayLabel = format(date, 'MMM dd')
    return {
      day: dayLabel,
      shipments: item.shipments || 0,
      assignments: item.assignments || 0,
      completed: item.completed || 0,
    }
  }) || []

  return (
    <Box>
      {/* Loading Indicator when filtering */}
      {isFiltering && (
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
                Loading client data...
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Fetching analytics for {selectedClient?.company_name || selectedClient?.name}
              </Typography>
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
      )}

      {/* Empty State when client has no data */}
      {hasNoData && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
            borderRadius: 3,
            border: '2px dashed rgba(25, 118, 210, 0.2)',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <Inbox sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
          </Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            No Data Available
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 500, mx: 'auto' }}>
            {selectedClient?.company_name || selectedClient?.name} doesn't have any consignments or activity data yet.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={clearClientFilter}
            sx={{ mt: 1 }}
          >
            View All Clients
          </Button>
        </Paper>
      )}

      {/* Header Section with Client Filter */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)',
          borderRadius: 3,
          border: '1px solid rgba(25, 118, 210, 0.1)',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, rgba(25,118,210,0.2) 0%, rgba(8,38,90,0.3) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.main',
                  boxShadow: '0 4px 12px rgba(25,118,210,0.2)',
                }}
              >
                <Insights sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 0.5 }}>
                  Cockpit Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedClient 
                    ? `Viewing data for ${selectedClient.company_name || selectedClient.name}`
                    : 'Real-time insights and performance metrics across all clients'
                  }
                </Typography>
              </Box>
            </Stack>
          </Box>
          
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            {/* Client Filter */}
            <Autocomplete
              options={clients}
              getOptionLabel={(option) => option.company_name || option.name || ''}
              value={selectedClient}
              onChange={handleClientChange}
              loading={clientsLoading}
              sx={{ minWidth: 300 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter by Client"
                  placeholder="All Clients"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <FilterList sx={{ mr: 1, color: 'text.secondary' }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
                  <Business sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body1" fontWeight={500}>
                      {option.company_name || option.name}
                    </Typography>
                    {option.email && (
                      <Typography variant="caption" color="text.secondary">
                        {option.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            />
            
            {selectedClient && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Clear />}
                onClick={clearClientFilter}
                sx={{ minWidth: 'auto' }}
              >
                Clear Filter
              </Button>
            )}
            
            <Tooltip title="Refresh analytics" arrow>
              <IconButton 
                onClick={handleRefresh} 
                color="primary" 
                sx={{ 
                  boxShadow: '0 4px 12px rgba(25,118,210,0.2)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(25,118,210,0.3)',
                  }
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Paper>

      {/* Key Performance Indicators */}
      {!hasNoData && (
        <>
      {/* Section Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Assessment color="primary" />
          Consignment Overview
        </Typography>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4, opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Consignments"
            value={kpis?.total_shipments || 0}
            icon={<LocalShipping sx={{ fontSize: 28 }} />}
            color="primary"
            loading={isFiltering}
            description="The total number of consignments in the system. This includes all consignments regardless of their current status or stage in the clearance process."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completion Rate"
            value={`${completionRate.toFixed(1)}%`}
            icon={<CheckCircle sx={{ fontSize: 28 }} />}
            color="success"
            subtitle={`${kpis?.completed_assignments || 0} of ${kpis?.total_assignments || 0} assignments`}
            loading={isFiltering}
            description="The percentage of clearance activity assignments that have been successfully completed. A higher rate indicates better operational efficiency and workflow management."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Progress"
            value={kpis?.in_transit || 0}
            icon={<TrendingUp sx={{ fontSize: 28 }} />}
            color="info"
            subtitle="Active activities"
            loading={isFiltering}
            description="The number of consignments currently undergoing active clearance activities. This represents your current workload and operational capacity utilization."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Consignments"
            value={kpis?.overdue_shipments || 0}
            icon={<Warning sx={{ fontSize: 28 }} />}
            color={kpis?.overdue_shipments > 0 ? 'error' : 'success'}
            subtitle="Exceeding 9 days"
            loading={isFiltering}
            description="Consignments that have been in the system for more than 9 days without reaching release/exit status. These require immediate attention to prevent service delays."
          />
        </Grid>
      </Grid>

      {/* Section Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TaskAlt color="primary" />
          Activity Status
        </Typography>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4, position: 'relative' }}>
        {/* Subtle loading overlay */}
        {loading && !isInitialLoad && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              borderRadius: 3,
            }}
          >
            <CircularProgress size={40} />
          </Box>
        )}
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

      {/* Section Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Timeline color="primary" />
          Analytics & Trends
        </Typography>
      </Box>
      
      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                <Timeline color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Monthly Activity Trends
                </Typography>
              </Stack>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={monthlyData}>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="day" stroke="#666" />
                  <YAxis stroke="#666" />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="shipments" stroke="#1976d2" fillOpacity={1} fill="url(#colorShipments)" name="New Consignments" strokeWidth={2} />
                  <Area type="monotone" dataKey="assignments" stroke="#0288d1" fillOpacity={1} fill="url(#colorAssignments)" name="New Assignments" strokeWidth={2} />
                  <Area type="monotone" dataKey="completed" stroke="#2e7d32" fillOpacity={1} fill="url(#colorCompleted)" name="Completed Activities" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <DonutLarge color="primary" />
                Activity Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={activityStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {activityStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DirectionsBoatFilled color="primary" />
          Recent Activity & Performance
        </Typography>
      </Box>
      
      {/* Recent Activity and Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <DirectionsBoatFilled color="primary" />
                  Recent Consignments
                </Typography>
                <Chip label={`${shipments.length} active`} size="small" color="primary" />
              </Box>
              <List sx={{ p: 0 }}>
                {shipments.slice(0, 5).map((shipment, index) => (
                  <React.Fragment key={shipment.id}>
                    <ListItem
                      onClick={() => navigate(`/shipments/${shipment.id}`)}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        backgroundColor: alpha('#1976d2', 0.03),
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha('#1976d2', 0.1),
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
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.5 }}>
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
                {shipments.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No consignments found
                    </Typography>
                  </Box>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
                  Performance Metrics
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" mb={1.5}>
                      <Typography variant="body2" fontWeight={500}>Activity Completion Rate</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {completionRate.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={completionRate}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: alpha('#1976d2', 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: completionRate >= 80 ? 'success.main' : completionRate >= 60 ? 'warning.main' : 'error.main',
                          borderRadius: 5,
                        },
                      }}
                    />
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" mb={1.5}>
                      <Typography variant="body2" fontWeight={500}>Field Staff Performance</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {fieldStaffAnalytics?.avg_completion_rate?.toFixed(1) || 0}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={fieldStaffAnalytics?.avg_completion_rate || 0}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: alpha('#1976d2', 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: (fieldStaffAnalytics?.avg_completion_rate || 0) >= 80 ? 'success.main' : 'info.main',
                          borderRadius: 5,
                        },
                      }}
                    />
                  </Box>
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1.5}>
                      <Typography variant="body2" fontWeight={500}>Overdue Consignments</Typography>
                      <Typography variant="body2" fontWeight="bold" color={kpis?.overdue_shipments > 0 ? 'error.main' : 'success.main'}>
                        {kpis?.overdue_shipments || 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={kpis?.overdue_shipments > 0 ? 100 : 0}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: alpha('#1976d2', 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: kpis?.overdue_shipments > 0 ? 'error.main' : 'success.main',
                          borderRadius: 5,
                        },
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              background: 'linear-gradient(135deg, rgba(21,101,192,0.1) 0%, rgba(21,101,192,0.05) 100%)',
              border: '1px solid rgba(21,101,192,0.15)',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
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
                            backgroundColor: alpha('#1565c0', 0.06),
                            '&:hover': {
                              backgroundColor: alpha('#1565c0', 0.12),
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
                              {severityColor === 'error' ? <Warning /> : severityColor === 'warning' ? <Warning /> : <CheckCircle />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
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
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {alert.summary}
                              </Typography>
                            }
                          />
                        </ListItem>
                      </React.Fragment>
                    )
                  })}
                  {alerts.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No alerts at this time
                      </Typography>
                    </Box>
                  )}
                </List>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
        </>
      )}
    </Box>
  )
}

export default Dashboard
