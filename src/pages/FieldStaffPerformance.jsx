import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Stack,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  TrendingUp,
  Assignment,
  CheckCircle,
  PlayArrow,
  Schedule,
  Cancel,
  Person,
  BarChart,
  Visibility,
  ExpandMore,
  Close,
} from '@mui/icons-material'
import { usersAPI } from '../services/api'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { PageSkeleton, LoadingOverlay } from '../components/LoadingStates'

function hoursToDays(hours) {
  if (hours == null || hours === undefined) return null
  return (hours / 24).toFixed(1)
}

function durationFromTimestamps(startedAt, completedAt) {
  if (!startedAt || !completedAt) return { hours: null, days: null }
  const hours = (new Date(completedAt) - new Date(startedAt)) / (1000 * 3600)
  if (hours < 0) return { hours: null, days: null }
  return {
    hours: hours.toFixed(1),
    days: (hours / 24).toFixed(1),
  }
}

const FieldStaffPerformance = () => {
  const [selectedStaffId, setSelectedStaffId] = useState(null)
  const [shipmentDetails, setShipmentDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const { data = null, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['fieldStaffPerformance'],
    queryFn: async () => {
      const response = await usersAPI.getFieldStaffPerformance()
      return response
    },
    staleTime: 5 * 60 * 1000,
  })

  const error = queryError ? (queryError.response?.data?.detail || 'Failed to load performance data') : null

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={3}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Error Loading Performance Data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
        </Paper>
      </Box>
    )
  }

  if (!data || !data.staff || data.staff.length === 0) {
    return (
      <Box p={3}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No Field Staff Performance Data Available
          </Typography>
        </Paper>
      </Box>
    )
  }

  const { staff, summary } = data

  // Sort staff by completion rate (descending)
  const sortedStaff = [...staff].sort((a, b) => b.completion_rate - a.completion_rate)

  const getCompletionRateColor = (rate) => {
    if (rate >= 80) return 'success'
    if (rate >= 60) return 'warning'
    return 'error'
  }

  const handleViewShipmentDetails = async (userId) => {
    setSelectedStaffId(userId)
    setDetailsDialogOpen(true)
    setLoadingDetails(true)
    try {
      const details = await usersAPI.getStaffPerformanceByShipment(userId)
      setShipmentDetails(details)
    } catch (err) {
      console.error('Failed to load shipment details:', err)
      setShipmentDetails(null)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false)
    setSelectedStaffId(null)
    setShipmentDetails(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in_progress':
        return 'primary'
      case 'pending':
        return 'warning'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle fontSize="small" />
      case 'in_progress':
        return <PlayArrow fontSize="small" />
      case 'pending':
        return <Schedule fontSize="small" />
      case 'cancelled':
        return <Cancel fontSize="small" />
      default:
        return null
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Field Staff Performance
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Overall performance metrics for field staff activities across all shipments
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Staff
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {summary.total_staff}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <Assignment />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Assignments
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {summary.total_assignments}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {summary.total_completed}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {summary.overall_completion_rate}%
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">
            Staff Performance Details
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Staff Member</TableCell>
                <TableCell align="center">Total</TableCell>
                <TableCell align="center">Completed</TableCell>
                <TableCell align="center">In Progress</TableCell>
                <TableCell align="center">Pending</TableCell>
                <TableCell align="center">Completion Rate</TableCell>
                <TableCell align="center">Avg. Time (hrs)</TableCell>
                <TableCell align="center">Avg. Time (days)</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedStaff.map((member) => (
                <TableRow key={member.user_id} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {member.user_name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {member.user_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.user_email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={member.total_assignments} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={member.completed}
                      size="small"
                      color="success"
                      icon={<CheckCircle fontSize="small" />}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={member.in_progress}
                      size="small"
                      color="primary"
                      icon={<PlayArrow fontSize="small" />}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={member.pending}
                      size="small"
                      color="warning"
                      icon={<Schedule fontSize="small" />}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ minWidth: 100 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinearProgress
                          variant="determinate"
                          value={member.completion_rate}
                          sx={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              bgcolor:
                                member.completion_rate >= 80
                                  ? 'success.main'
                                  : member.completion_rate >= 60
                                  ? 'warning.main'
                                  : 'error.main',
                            },
                          }}
                        />
                        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 45 }}>
                          {member.completion_rate}%
                        </Typography>
                      </Stack>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {member.average_completion_time_hours ? (
                      <Typography variant="body2">
                        {member.average_completion_time_hours.toFixed(1)}h
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {member.average_completion_time_hours ? (
                      <Typography variant="body2">
                        {hoursToDays(member.average_completion_time_hours)}d
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Performance by Shipment">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewShipmentDetails(member.user_id)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Shipment Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Performance by Shipment
              </Typography>
              {shipmentDetails && (
                <Typography variant="body2" color="text.secondary">
                  {shipmentDetails.user_name} • {shipmentDetails.total_shipments} Shipment{shipmentDetails.total_shipments !== 1 ? 's' : ''}
                </Typography>
              )}
            </Box>
            <IconButton onClick={handleCloseDetailsDialog} size="small">
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : shipmentDetails && shipmentDetails.shipments.length > 0 ? (
            <Box>
              {shipmentDetails.shipments.map((shipment, index) => (
                <Accordion key={shipment.shipment_id} defaultExpanded={index === 0}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', pr: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {shipment.shipment_number}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {shipment.origin} → {shipment.destination}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          label={`${shipment.completed_activities} Completed`}
                          size="small"
                          color="success"
                          icon={<CheckCircle fontSize="small" />}
                        />
                        <Chip
                          label={`${shipment.in_progress_activities} In Progress`}
                          size="small"
                          color="primary"
                          icon={<PlayArrow fontSize="small" />}
                        />
                        <Chip
                          label={`${shipment.pending_activities} Pending`}
                          size="small"
                          color="warning"
                          icon={<Schedule fontSize="small" />}
                        />
                      </Stack>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Activity</TableCell>
                            <TableCell align="center">Status</TableCell>
                            <TableCell>Substate</TableCell>
                            <TableCell>Assigned</TableCell>
                            <TableCell>Started</TableCell>
                            <TableCell>Completed</TableCell>
                            <TableCell align="center">Duration (hrs)</TableCell>
                            <TableCell align="center">Duration (days)</TableCell>
                            <TableCell>Last Updated</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {shipment.activities.map((activity) => {
                            const duration = durationFromTimestamps(activity.started_at, activity.completed_at)
                            return (
                            <TableRow key={activity.activity_id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {activity.activity_name}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={activity.status}
                                  size="small"
                                  color={getStatusColor(activity.status)}
                                  icon={getStatusIcon(activity.status)}
                                />
                              </TableCell>
                              <TableCell>
                                {activity.substate ? (
                                  <Chip label={activity.substate} size="small" variant="outlined" />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    —
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {activity.assigned_at ? (
                                  <Typography variant="body2" fontSize="0.75rem">
                                    {format(new Date(activity.assigned_at), 'MMM dd, yyyy HH:mm')}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    —
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {activity.started_at ? (
                                  <Typography variant="body2" fontSize="0.75rem">
                                    {format(new Date(activity.started_at), 'MMM dd, yyyy HH:mm')}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    —
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {activity.completed_at ? (
                                  <Typography variant="body2" fontSize="0.75rem">
                                    {format(new Date(activity.completed_at), 'MMM dd, yyyy HH:mm')}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    —
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {duration.hours != null ? (
                                  <Typography variant="body2" fontSize="0.75rem">
                                    {duration.hours}h
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    —
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {duration.days != null ? (
                                  <Typography variant="body2" fontSize="0.75rem">
                                    {duration.days}d
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    —
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {activity.last_updated_at ? (
                                  <Tooltip title={`Last updated by ${shipmentDetails.user_name}`}>
                                    <Typography variant="body2" fontSize="0.75rem" color="primary.main" fontWeight={500}>
                                      {format(new Date(activity.last_updated_at), 'MMM dd, yyyy HH:mm')}
                                    </Typography>
                                  </Tooltip>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    —
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No shipment data available for this staff member
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default FieldStaffPerformance

