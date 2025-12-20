import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Stack,
  Avatar,
  Tooltip,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  Assessment,
  Download,
  TrendingUp,
  Insights,
  AutoGraph,
  DateRange,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline,
  People,
  Warning,
  CheckCircle,
  Schedule,
  Refresh,
} from '@mui/icons-material'
import { reportsAPI } from '../services/api'
import { toast } from 'react-toastify'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0', '#0288d1', '#388e3c']

const Reports = () => {
  const [kpis, setKpis] = useState(null)
  const [activityAnalytics, setActivityAnalytics] = useState(null)
  const [fieldStaffAnalytics, setFieldStaffAnalytics] = useState(null)
  const [overdueAnalytics, setOverdueAnalytics] = useState(null)
  const [timelineAnalytics, setTimelineAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [tabValue, setTabValue] = useState(0)
  const [timelineDays, setTimelineDays] = useState(30)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const [
        kpisData,
        activityData,
        fieldStaffData,
        overdueData,
        timelineData,
      ] = await Promise.all([
        reportsAPI.getKPIs(),
        reportsAPI.getActivityAnalytics(),
        reportsAPI.getFieldStaffAnalytics(),
        reportsAPI.getOverdueAnalytics(),
        reportsAPI.getTimelineAnalytics(timelineDays),
      ])
      setKpis(kpisData)
      setActivityAnalytics(activityData)
      setFieldStaffAnalytics(fieldStaffData)
      setOverdueAnalytics(overdueData)
      setTimelineAnalytics(timelineData)
    } catch (error) {
      console.error('Failed to load reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateDaily = async () => {
    try {
      const report = await reportsAPI.generateDaily(reportDate)
      toast.success('Daily report generated successfully')
    } catch (error) {
      toast.error('Failed to generate report')
    }
  }

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue)
  }

  const handleRefresh = () => {
    fetchReports()
    toast.info('Refreshing reports...')
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  // Prepare chart data
  const activityStatusDistribution = kpis
    ? [
        { name: 'Pending', value: kpis.pending || 0, fill: '#ed6c02' },
        { name: 'In Progress', value: kpis.in_transit || 0, fill: '#1976d2' },
        { name: 'Completed', value: kpis.delivered || 0, fill: '#2e7d32' },
      ]
    : []

  const activityChartData = activityAnalytics?.activities?.map((activity) => ({
    name: activity.activity_name,
    completed: activity.completed,
    in_progress: activity.in_progress,
    pending: activity.pending,
    completion_rate: activity.completion_rate,
  })) || []

  // Activity completion overview
  const totalPending = activityAnalytics?.activities?.reduce((sum, a) => sum + (a.pending || 0), 0) || 0
  const totalInProgress = activityAnalytics?.activities?.reduce((sum, a) => sum + (a.in_progress || 0), 0) || 0
  const totalCompleted = activityAnalytics?.activities?.reduce((sum, a) => sum + (a.completed || 0), 0) || 0
  const activityDistributionData = [
    { name: 'Completed', value: totalCompleted, fill: '#2e7d32' },
    { name: 'In Progress', value: totalInProgress, fill: '#1976d2' },
    { name: 'Pending', value: totalPending, fill: '#ed6c02' },
  ]

  const timelineChartData = timelineAnalytics?.timeline || []

  const topPerformers = fieldStaffAnalytics?.staff_performance
    ?.sort((a, b) => b.completion_rate - a.completion_rate)
    .slice(0, 5) || []

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            variant="rounded"
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'info.light',
              color: 'info.dark',
              boxShadow: '0 10px 24px rgba(3,169,244,0.25)',
            }}
          >
            <Insights />
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 0 }}>
              Reports & Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive operational insights and performance metrics
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                    Total Consignments
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                    {kpis?.total_shipments || 0}
                  </Typography>
                </Box>
                <Assessment sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                    Completion Rate
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                    {kpis?.completion_rate?.toFixed(1) || 0}%
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                    Total Assignments
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                    {kpis?.total_assignments || 0}
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                    Overdue Shipments
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
                    {kpis?.overdue_shipments || 0}
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" icon={<BarChartIcon />} iconPosition="start" />
          <Tab label="Activities" icon={<PieChartIcon />} iconPosition="start" />
          <Tab label="Field Staff" icon={<People />} iconPosition="start" />
          <Tab label="Timeline" icon={<Timeline />} iconPosition="start" />
          <Tab label="Overdue" icon={<Warning />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                  <PieChartIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Activity Status Distribution
                  </Typography>
                </Stack>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={activityDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {activityDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, background: 'linear-gradient(135deg, rgba(33,150,243,0.1) 0%, rgba(21,101,192,0.25) 100%)' }}>
              <CardContent>
                <Stack spacing={3}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Assessment />
                    <Typography variant="h6" fontWeight="bold">
                      Key Metrics
                    </Typography>
                  </Stack>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Activities
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {activityAnalytics?.total_activities || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Active clearance activities
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Activity Status Breakdown
                    </Typography>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">Completed</Typography>
                        <Chip label={totalCompleted} size="small" color="success" />
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">In Progress</Typography>
                        <Chip label={totalInProgress} size="small" color="primary" />
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">Pending</Typography>
                        <Chip label={totalPending} size="small" color="warning" />
                      </Stack>
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Overall Completion Rate
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LinearProgress
                        variant="determinate"
                        value={kpis?.completion_rate || 0}
                        sx={{ flex: 1, height: 8, borderRadius: 4 }}
                        color="success"
                      />
                      <Typography variant="h6" fontWeight="bold">
                        {kpis?.completion_rate?.toFixed(1) || 0}%
                      </Typography>
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Overdue Consignments
                    </Typography>
                    <Chip
                      label={kpis?.overdue_shipments || 0}
                      color={kpis?.overdue_shipments > 0 ? 'error' : 'success'}
                      icon={<Warning />}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && activityAnalytics && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                  <PieChartIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Activity Performance Overview
                  </Typography>
                </Stack>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={activityChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="completed" stackId="a" fill="#2e7d32" name="Completed" />
                    <Bar dataKey="in_progress" stackId="a" fill="#1976d2" name="In Progress" />
                    <Bar dataKey="pending" stackId="a" fill="#ed6c02" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Activity Details
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Activity</TableCell>
                        <TableCell align="center">Total</TableCell>
                        <TableCell align="center">Completed</TableCell>
                        <TableCell align="center">In Progress</TableCell>
                        <TableCell align="center">Pending</TableCell>
                        <TableCell align="center">Completion Rate</TableCell>
                        <TableCell align="center">Avg. Time (hrs)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activityAnalytics.activities?.map((activity) => (
                        <TableRow key={activity.activity_id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {activity.activity_name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={activity.total} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={activity.completed} size="small" color="success" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={activity.in_progress} size="small" color="primary" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={activity.pending} size="small" color="warning" />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ minWidth: 100 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <LinearProgress
                                  variant="determinate"
                                  value={activity.completion_rate}
                                  sx={{ flex: 1, height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="body2" sx={{ minWidth: 45 }}>
                                  {activity.completion_rate}%
                                </Typography>
                              </Stack>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {activity.avg_completion_time_hours ? (
                              <Typography variant="body2">
                                {activity.avg_completion_time_hours.toFixed(1)}h
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && fieldStaffAnalytics && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                  <People color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Top Performers
                  </Typography>
                </Stack>
                <Stack spacing={2}>
                  {topPerformers.map((staff, index) => (
                    <Paper key={staff.user_id} sx={{ p: 2, borderRadius: 2 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {staff.user_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {staff.total_assignments} assignments
                          </Typography>
                        </Box>
                        <Box sx={{ minWidth: 150 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <LinearProgress
                              variant="determinate"
                              value={staff.completion_rate}
                              sx={{ flex: 1, height: 8, borderRadius: 4 }}
                              color="success"
                            />
                            <Typography variant="body2" fontWeight={600} sx={{ minWidth: 45 }}>
                              {staff.completion_rate}%
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                  <TrendingUp color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Field Staff Summary
                  </Typography>
                </Stack>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Field Staff
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {fieldStaffAnalytics.total_staff || 0}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Average Completion Rate
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LinearProgress
                        variant="determinate"
                        value={fieldStaffAnalytics.avg_completion_rate || 0}
                        sx={{ flex: 1, height: 10, borderRadius: 5 }}
                        color="primary"
                      />
                      <Typography variant="h6" fontWeight="bold">
                        {fieldStaffAnalytics.avg_completion_rate?.toFixed(1) || 0}%
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && timelineAnalytics && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Timeline color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                      Timeline Analytics
                    </Typography>
                  </Stack>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Period</InputLabel>
                    <Select
                      value={timelineDays}
                      label="Period"
                      onChange={(e) => {
                        setTimelineDays(e.target.value)
                        reportsAPI.getTimelineAnalytics(e.target.value).then(setTimelineAnalytics)
                      }}
                    >
                      <MenuItem value={7}>Last 7 days</MenuItem>
                      <MenuItem value={30}>Last 30 days</MenuItem>
                      <MenuItem value={90}>Last 90 days</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={timelineChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="shipments" stackId="1" stroke="#1976d2" fill="#1976d2" name="Consignments" />
                    <Area type="monotone" dataKey="assignments" stackId="2" stroke="#2e7d32" fill="#2e7d32" name="Assignments" />
                    <Area type="monotone" dataKey="completed" stackId="3" stroke="#ed6c02" fill="#ed6c02" name="Completed" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 4 && overdueAnalytics && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                  <Warning color="error" />
                  <Typography variant="h6" fontWeight="bold">
                    Overdue Consignments ({overdueAnalytics.total_overdue || 0})
                  </Typography>
                </Stack>
                {overdueAnalytics.overdue_shipments?.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Consignment Number</TableCell>
                          <TableCell>Route</TableCell>
                          <TableCell>Days in System</TableCell>
                          <TableCell>Days Overdue</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {overdueAnalytics.overdue_shipments.map((shipment) => (
                          <TableRow key={shipment.shipment_id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600} color="error">
                                {shipment.shipment_number}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {shipment.origin} → {shipment.destination}
                            </TableCell>
                            <TableCell>
                              <Chip label={`${shipment.days_in_system} days`} color="warning" size="small" />
                            </TableCell>
                            <TableCell>
                              <Chip label={`${shipment.days_overdue} days`} color="error" size="small" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box textAlign="center" py={4}>
                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No overdue consignments
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      All consignments are within the 9-day limit
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Generate Report Section */}
      <Box sx={{ mt: 3 }}>
        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoGraph color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Generate Daily Report
                </Typography>
              </Stack>
              <Tooltip title="Export PDF summary for stakeholders" arrow>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleGenerateDaily}
                >
                  Generate Report
                </Button>
              </Tooltip>
            </Stack>
            <Box display="flex" gap={2} alignItems="center" sx={{ mt: 3 }}>
              <TextField
                type="date"
                label="Report Date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                <DateRange />
                <Typography variant="caption">
                  Select the day you need a consolidated operations summary for.
                </Typography>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default Reports
