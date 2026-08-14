import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  Map,
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

const StatCard = ({ title, value, icon, color, subtitle, loading, description, onClick }) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 4,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': onClick && !loading ? {
        transform: 'translateY(-4px)',
        borderColor: 'primary.main',
        boxShadow: '0 12px 24px rgba(0,0,0,0.05)',
      } : {},
    }}
    onClick={onClick}
  >
    <CardContent sx={{ p: 3 }}>
      {loading ? (
        <Box display="flex" alignItems="center" justifyContent="center" sx={{ minHeight: 80 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}
            >
              {title}
            </Typography>
            <Typography variant="h3" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.main',
              width: 48,
              height: 48,
              borderRadius: 2,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      )}
    </CardContent>
    {description && (
      <Box sx={{ px: 3, pb: 2 }}>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {description}
        </Typography>
      </Box>
    )}
  </Card>
)

const SecondaryStatCard = ({ label, value, icon }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      transition: 'all 0.2s ease',
      '&:hover': {
        bgcolor: '#F8F9FA',
        transform: 'scale(1.02)'
      }
    }}
  >
    <Box sx={{ color: 'primary.main' }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={800}>
        {value}
      </Typography>
    </Box>
  </Paper>
)

const Dashboard = () => {
  const navigate = useNavigate()
  const [selectedClient, setSelectedClient] = useState(null)
  const [isFiltering, setIsFiltering] = useState(false)

  // 1. Fetch Clients via React Query
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['dashboardClients'],
    queryFn: async () => {
      const data = await clientsAPI.list({ status: 'approved', limit: 1000 })
      return Array.isArray(data) ? data : (data?.items || [])
    },
    staleTime: 5 * 60 * 1000 // Cache for 5 mins
  })

  // 2. Fetch Dashboard Data
  const fetchDashboardData = async () => {
    setIsFiltering(!!selectedClient)
    const clientId = selectedClient?.id || null
    const params = clientId ? { client_id: clientId } : {}

    try {
      const [
        kpisData,
        activityData,
        fieldStaffData,
        timelineData,
        shipmentsData,
      ] = await Promise.all([
        reportsAPI.getKPIs(params),
        reportsAPI.getActivityAnalytics(params),
        reportsAPI.getFieldStaffAnalytics(params),
        reportsAPI.getTimelineAnalytics(30, params),
        shipmentsAPI.list({ limit: 5, ...(clientId && { client_id: clientId }) }),
      ])
      return {
        kpis: kpisData,
        activityAnalytics: activityData,
        fieldStaffAnalytics: fieldStaffData,
        timelineAnalytics: timelineData,
        shipments: Array.isArray(shipmentsData) ? shipmentsData : (shipmentsData?.items || [])
      }
    } finally {
      setIsFiltering(false)
    }
  }

  const { data: dashboardData, isLoading: dashboardLoading, refetch } = useQuery({
    queryKey: ['dashboardKey', selectedClient?.id],
    queryFn: fetchDashboardData,
    refetchInterval: 60000, // Background poll every minute
    onError: (error) => {
      toast.error('Failed to load dashboard data')
      console.error(error)
    }
  })

  const { kpis, activityAnalytics, fieldStaffAnalytics, timelineAnalytics, shipments = [] } = dashboardData || {}

  // Use either the hard loading state or the component specific loading
  const loading = dashboardLoading

  const handleRefresh = () => {
    refetch()
    toast.info('Refreshing metrics...')
  }

  const handleClientChange = (event, newValue) => {
    setSelectedClient(newValue)
  }

  const activityStatusData = useMemo(() => {
    const totalPending = activityAnalytics?.activities?.reduce((sum, a) => sum + (a.pending || 0), 0) || 0
    const totalInProgress = activityAnalytics?.activities?.reduce((sum, a) => sum + (a.in_progress || 0), 0) || 0
    const totalCompleted = activityAnalytics?.activities?.reduce((sum, a) => sum + (a.completed || 0), 0) || 0

    return [
      { name: 'Completed', value: totalCompleted, color: '#01A3DA' },
      { name: 'In Progress', value: totalInProgress, color: '#000000' },
      { name: 'Pending', value: totalPending, color: '#E9ECEF' },
    ]
  }, [activityAnalytics])

  const monthlyData = useMemo(() => {
    return timelineAnalytics?.timeline?.map((item) => ({
      day: format(new Date(item.date), 'MMM dd'),
      consignments: item.shipments || 0,
      completed: item.completed || 0,
    })) || []
  }, [timelineAnalytics])

  const hasNoData = selectedClient && kpis && kpis.total_shipments === 0 && !loading

  return (
    <Box sx={{ pb: 6 }}>
      {/* Premium Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #000000 0%, #1A2027 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={3}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Operational Cockpit
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8 }}>
                {selectedClient
                  ? `Performance metrics for ${selectedClient.company_name || selectedClient.name}`
                  : 'Real-time intelligence and fleet governance overview'
                }
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              <Autocomplete
                options={clients}
                getOptionLabel={(option) => option.company_name || option.name || ''}
                value={selectedClient}
                onChange={handleClientChange}
                loading={clientsLoading}
                sx={{
                  minWidth: 280,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                  '& .MuiSvgIcon-root': { color: 'white' }
                }}
                renderInput={(params) => <TextField {...params} label="Filter by Client" size="small" />}
              />
              <IconButton
                onClick={handleRefresh}
                sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
              >
                <Refresh />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
        {/* Subtle decorative element */}
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(1, 163, 218, 0.2) 0%, transparent 70%)',
            zIndex: 0
          }}
        />
      </Paper>

      {hasNoData ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '1px dashed', borderColor: 'divider' }}>
          <Inbox sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={700}>No Data Available</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            This client does not have any active consignments yet.
          </Typography>
          <Button variant="outlined" startIcon={<Clear />} onClick={() => setSelectedClient(null)}>
            Clear Filter
          </Button>
        </Paper>
      ) : (
        <Stack spacing={4}>
          {/* KPI Grid */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Consignments"
                value={kpis?.total_shipments || 0}
                icon={<LocalShipping />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Completion Rate"
                value={`${(kpis?.completion_rate || 0).toFixed(1)}%`}
                icon={<CheckCircle />}
                subtitle={`${kpis?.completed_assignments || 0} / ${kpis?.total_assignments || 0} tasks`}
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Live Missions"
                value={kpis?.in_transit || 0}
                icon={<TrendingUp />}
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Critical (Overdue)"
                value={kpis?.overdue_shipments || 0}
                icon={<Warning />}
                loading={loading}
                description={kpis?.overdue_shipments > 0 ? "Requires immediate intervention" : "All on schedule"}
              />
            </Grid>
          </Grid>

          {/* Secondary Stats */}
          <Grid container spacing={2}>
            {[
              { label: 'Field Staff', value: fieldStaffAnalytics?.total_staff || 0, icon: <PeopleAlt /> },
              { label: 'Active Gates', value: activityAnalytics?.total_activities || 0, icon: <Map /> },
              { label: 'Monthly Delta', value: `+${timelineAnalytics?.timeline?.slice(-1)[0]?.shipments || 0}`, icon: <TrendingUp /> },
              { label: 'Avg Lead Time', value: '4.2 Days', icon: <HourglassEmpty /> },
            ].map((stat, i) => (
              <Grid item xs={6} sm={3} key={i}>
                <SecondaryStatCard {...stat} />
              </Grid>
            ))}
          </Grid>

          {/* Analytics Section */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 4 }}>Fleet Performance (30 Days)</Typography>
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorConsignments" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#01A3DA" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#01A3DA" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="consignments"
                        stroke="#01A3DA"
                        strokeWidth={3}
                        fill="url(#colorConsignments)"
                        name="Volume"
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        stroke="#000000"
                        strokeWidth={3}
                        fill="transparent"
                        name="Throughput"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 4 }}>Activity Distribution</Typography>
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityStatusData}
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {activityStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {activityStatusData.map((item, i) => (
                    <Box key={i} display="flex" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                        <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{item.value}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Mission Log */}
          <Card elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight={800}>Recent Mission Log</Typography>
              <Button size="small" onClick={() => navigate('/dashboard/shipments')} sx={{ fontWeight: 700 }}>View All</Button>
            </Box>
            <List disablePadding>
              {shipments.map((shipment, i) => (
                <React.Fragment key={shipment.id}>
                  <ListItem
                    button
                    onClick={() => navigate(`/dashboard/shipments/${shipment.id}`)}
                    sx={{ px: 0, py: 2, borderRadius: 2, '&:hover': { bgcolor: alpha('#01A3DA', 0.05) } }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'background.default', color: 'primary.main', border: '1px solid', borderColor: 'divider' }}>
                        <DirectionsBoatFilled fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={shipment.shipment_number}
                      secondary={`${shipment.origin} → ${shipment.destination}`}
                      primaryTypographyProps={{ fontWeight: 700 }}
                    />
                    <Stack alignItems="flex-end" spacing={0.5}>
                      <Chip
                        label={shipment.status.replace('_', ' ').toUpperCase()}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: 'primary.light', color: 'primary.main' }}
                      />
                      <Typography variant="caption" color="text.disabled">
                        {format(new Date(shipment.created_at), 'MMM dd, HH:mm')}
                      </Typography>
                    </Stack>
                  </ListItem>
                  {i < shipments.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Card>
        </Stack>
      )}
    </Box>
  )
}

export default Dashboard
