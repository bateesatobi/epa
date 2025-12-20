import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  AlertTitle,
  Avatar,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Timeline as TimelineIcon,
  CheckCircle,
  PlayArrow,
  HourglassEmpty,
  SkipNext,
  Pause,
  Person,
  AccessTime,
  Description,
  Edit,
} from '@mui/icons-material'
import { format, formatDistanceToNow } from 'date-fns'
import { shipmentsAPI, clearanceActivitiesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import FormDialog from './FormDialog'
import FormSelect from './FormSelect'
import FormTextField from './FormTextField'
import { showSuccessAlert, showErrorAlert, showLoadingAlert, closeAlert } from '../utils/alerts'

// Custom Timeline components using core MUI (no @mui/lab dependency)
const Timeline = ({ children, position = 'right' }) => (
  <Box sx={{ position: 'relative', pl: 3 }}>
    {children}
  </Box>
)

const TimelineItem = ({ children }) => (
  <Box sx={{ position: 'relative', mb: 3, '&:last-child': { mb: 0 } }}>
    {children}
  </Box>
)

const TimelineSeparator = ({ children }) => (
  <Box sx={{ position: 'absolute', left: -24, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    {children}
  </Box>
)

const TimelineConnector = () => (
  <Box sx={{ flex: 1, width: 2, bgcolor: 'divider', my: 0.5 }} />
)

const TimelineDot = ({ children, color = 'primary', variant = 'filled' }) => {
  const getColorValue = (colorName) => {
    const colorMap = {
      success: { main: '#2e7d32', contrastText: '#fff' },
      primary: { main: '#1976d2', contrastText: '#fff' },
      warning: { main: '#ed6c02', contrastText: '#fff' },
      error: { main: '#d32f2f', contrastText: '#fff' },
      grey: { main: '#9e9e9e', contrastText: '#fff' },
      default: { main: '#9e9e9e', contrastText: '#fff' },
    }
    return colorMap[color] || colorMap.primary
  }

  const colorValue = getColorValue(color)

  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: variant === 'filled' ? colorValue.main : 'transparent',
        border: variant === 'outlined' ? `2px solid` : 'none',
        borderColor: variant === 'outlined' ? colorValue.main : 'transparent',
        color: variant === 'filled' ? colorValue.contrastText : colorValue.main,
        zIndex: 1,
      }}
    >
      {children}
    </Box>
  )
}

const TimelineContent = ({ children, sx }) => (
  <Box sx={{ pl: 4, ...sx }}>
    {children}
  </Box>
)

const getClearanceStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in_progress':
      return 'info'
    case 'pending':
      return 'warning'
    case 'skipped':
      return 'default'
    case 'on_hold':
      return 'error'
    default:
      return 'default'
  }
}

const getClearanceStatusIcon = (status) => {
  switch (status) {
    case 'completed':
      return <CheckCircle fontSize="small" />
    case 'in_progress':
      return <PlayArrow fontSize="small" />
    case 'pending':
      return <HourglassEmpty fontSize="small" />
    case 'skipped':
      return <SkipNext fontSize="small" />
    case 'on_hold':
      return <Pause fontSize="small" />
    default:
      return null
  }
}

const normaliseStatusLabel = (status) => {
  if (!status) return 'Unknown'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

const ShipmentClearanceHistory = ({ shipmentId, shipmentNumber }) => {
  const { user } = useAuth()
  const [clearanceHistory, setClearanceHistory] = useState([])
  const [clearanceActivities, setClearanceActivities] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openStatusDialog, setOpenStatusDialog] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [statusForm, setStatusForm] = useState({
    status: 'in_progress',
    substate: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Check if user is admin
  const isAdmin = user?.roles?.some(role => role.name === 'admin') || false

  useEffect(() => {
    if (shipmentId) {
      fetchData()
    }
  }, [shipmentId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [historyData, activitiesData, assignmentsData] = await Promise.all([
        shipmentsAPI.getClearanceHistory(shipmentId).catch(() => []),
        clearanceActivitiesAPI.list({ is_active: true }).catch(() => []),
        shipmentsAPI.listClearanceActivityAssignments(shipmentId).catch(() => []),
      ])
      setClearanceHistory(Array.isArray(historyData) ? historyData : [])
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : [])
      // Sort activities by priority (ascending) to show in correct order
      const sortedActivities = Array.isArray(activitiesData) 
        ? [...activitiesData].sort((a, b) => (a.priority || 0) - (b.priority || 0))
        : []
      setClearanceActivities(sortedActivities)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load clearance history')
    } finally {
      setLoading(false)
    }
  }

  // Group history by activity (must be defined first)
  const groupedHistory = clearanceHistory.reduce((acc, entry) => {
    const activityId = entry.clearance_activity_id
    if (!acc[activityId]) {
      acc[activityId] = []
    }
    acc[activityId].push(entry)
    return acc
  }, {})

  // Group assignments by activity
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const activityId = assignment.clearance_activity_id
    if (!acc[activityId]) {
      acc[activityId] = []
    }
    acc[activityId].push(assignment)
    return acc
  }, {})

  // Get activity status - check history first, then assignments
  const getActivityStatus = (activityId) => {
    const entries = groupedHistory[activityId] || []
    if (entries.length > 0) {
      const latest = entries[entries.length - 1]
      return latest.status
    }
    
    // If no history, check assignments (prioritize: completed > in_progress > pending)
    const activityAssignments = groupedAssignments[activityId] || []
    if (activityAssignments.length > 0) {
      // Find the most relevant assignment (prioritize completed, then in_progress, then pending)
      const completed = activityAssignments.find(a => a.status === 'completed')
      if (completed) return 'completed'
      const inProgress = activityAssignments.find(a => a.status === 'in_progress')
      if (inProgress) return 'in_progress'
      const pending = activityAssignments.find(a => a.status === 'pending')
      if (pending) return 'pending'
    }
    
    return 'not_started'
  }
  
  // Get activity data - from history or assignments
  const getActivityData = (activityId) => {
    const entries = groupedHistory[activityId] || []
    if (entries.length > 0) {
      return entries[entries.length - 1]
    }
    
    // If no history, get from assignments (prioritize: completed > in_progress > pending)
    const activityAssignments = groupedAssignments[activityId] || []
    if (activityAssignments.length > 0) {
      // Find the most relevant assignment (prioritize completed, then in_progress, then pending)
      const completed = activityAssignments.find(a => a.status === 'completed')
      const inProgress = activityAssignments.find(a => a.status === 'in_progress')
      const pending = activityAssignments.find(a => a.status === 'pending')
      const assignment = completed || inProgress || pending || activityAssignments[0]
      
      return {
        clearance_activity_id: activityId,
        clearance_activity_name: assignment.clearance_activity_name,
        status: assignment.status, // Use the actual assignment status
        substate: null,
        started_at: assignment.started_at || assignment.assigned_at,
        completed_at: assignment.completed_at,
        updated_by: assignment.user_id,
        updater_name: assignment.user_name,
        updater_email: assignment.user_email,
        notes: assignment.notes,
        time_spent_minutes: null,
        created_at: assignment.assigned_at,
      }
    }
    
    return null
  }

  // Calculate progress based on activities in order
  const calculateProgress = () => {
    if (!clearanceActivities.length) return 0
    // Count how many activities (in priority order) have been completed
    let completedCount = 0
    for (const activity of clearanceActivities) {
      const activityStatus = getActivityStatus(activity.id)
      if (activityStatus === 'completed') {
        completedCount++
      } else {
        // Stop counting once we hit an incomplete activity (activities must be completed in order)
        break
      }
    }
    return Math.round((completedCount / clearanceActivities.length) * 100)
  }

  // Get current activity (first incomplete activity in priority order)
  const getCurrentActivity = () => {
    // Find the first activity that is not completed (in priority order)
    for (const activity of clearanceActivities) {
      const activityStatus = getActivityStatus(activity.id)
      const activityData = getActivityData(activity.id)
      
      if (activityStatus === 'in_progress' || activityStatus === 'pending') {
        return {
          name: activity.name,
          substate: activityData?.substate || null,
          started: activityData?.started_at || activityData?.assigned_at || null,
        }
      } else if (activityStatus === 'not_started') {
        // Return the first not-started activity
        return {
          name: activity.name,
          substate: null,
          started: null,
        }
      }
    }
    // All activities completed
    const lastActivity = clearanceActivities[clearanceActivities.length - 1]
    const lastData = getActivityData(lastActivity?.id)
    return {
      name: lastActivity?.name || 'All Activities',
      substate: lastData?.substate || null,
      started: lastData?.started_at || null,
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    )
  }

  const handleOpenStatusDialog = (activity) => {
    const activityData = getActivityData(activity.id)
    setSelectedActivity(activity)
    setStatusForm({
      status: activityData?.status === 'completed' ? 'completed' : activityData?.status === 'in_progress' ? 'in_progress' : 'in_progress',
      substate: activityData?.substate || '',
      notes: activityData?.notes || '',
    })
    setOpenStatusDialog(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedActivity || !shipmentId) return

    setSubmitting(true)
    const loadingAlert = showLoadingAlert('Updating Status...', 'Please wait')

    try {
      await shipmentsAPI.updateClearanceStatus(shipmentId, {
        clearance_activity_id: selectedActivity.id,
        status: statusForm.status,
        substate: statusForm.substate || null,
        notes: statusForm.notes || null,
      })
      
      closeAlert()
      await showSuccessAlert('Success!', 'Clearance status updated successfully')
      setOpenStatusDialog(false)
      setStatusForm({ status: 'in_progress', substate: '', notes: '' })
      setSelectedActivity(null)
      await fetchData() // Refresh data
    } catch (error) {
      closeAlert()
      showErrorAlert('Update Failed', error.response?.data?.detail || 'Failed to update clearance status')
    } finally {
      setSubmitting(false)
    }
  }

  const progress = calculateProgress()
  const currentActivity = getCurrentActivity()

  return (
    <Box>
      {/* Progress Overview */}
      <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <TimelineIcon sx={{ fontSize: 40 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                Clearance Progress
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Shipment: {shipmentNumber || shipmentId}
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold">
              {progress}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                bgcolor: 'white',
              },
            }}
          />
          {currentActivity && (
            <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
              Current Activity: <strong>{currentActivity.name}</strong>
              {currentActivity.substate && ` (${currentActivity.substate})`}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Activities Timeline */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 8px 20px rgba(30, 60, 114, 0.08)' }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <TimelineIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Clearance Activities Timeline
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Detailed progression through all clearance stages
        </Typography>

        <Divider sx={{ my: 2 }} />

        {clearanceActivities.length === 0 ? (
          <Alert severity="info">
            <AlertTitle>No Clearance Activities</AlertTitle>
            Clearance activities need to be configured in the system.
          </Alert>
        ) : (
          <Timeline position="right" sx={{ '&::before': { flex: 0 } }}>
            {clearanceActivities.map((activity, index) => {
              const activityStatus = getActivityStatus(activity.id)
              const activityData = getActivityData(activity.id)
              const isCompleted = activityStatus === 'completed'
              const isInProgress = activityStatus === 'in_progress'
              const isPending = activityStatus === 'pending'
              const isNotStarted = activityStatus === 'not_started'

              return (
                <TimelineItem key={activity.id}>
                  <TimelineSeparator>
                    <TimelineDot
                      color={
                        isCompleted
                          ? 'success'
                          : isInProgress
                          ? 'primary'
                          : isPending
                          ? 'warning'
                          : isNotStarted
                          ? 'grey'
                          : 'warning'
                      }
                      variant={isCompleted ? 'filled' : 'outlined'}
                    >
                      {isCompleted ? (
                        <CheckCircle fontSize="small" />
                      ) : isInProgress ? (
                        <PlayArrow fontSize="small" />
                      ) : isPending ? (
                        <HourglassEmpty fontSize="small" />
                      ) : (
                        <HourglassEmpty fontSize="small" />
                      )}
                    </TimelineDot>
                    {index < clearanceActivities.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent sx={{ py: '12px', px: 2 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        borderLeft: 4,
                        borderColor:
                          isCompleted
                            ? 'success.main'
                            : isInProgress
                            ? 'primary.main'
                            : isPending
                            ? 'warning.main'
                            : isNotStarted
                            ? 'grey.400'
                            : 'warning.main',
                        bgcolor: (isInProgress || isPending) ? 'action.hover' : 'background.paper',
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {activity.name}
                            </Typography>
                            <Chip
                              label={`Priority ${activity.priority}`}
                              size="small"
                              variant="outlined"
                              color="default"
                            />
                            {isAdmin && (
                              <Tooltip title="Update Activity Status">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenStatusDialog(activity)}
                                  sx={{ ml: 'auto' }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                          {activity.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {activity.description}
                            </Typography>
                          )}
                          {activity.substates && activity.substates.length > 0 && (
                            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
                              {activity.substates.map((substate, idx) => (
                                <Chip
                                  key={idx}
                                  label={substate}
                                  size="small"
                                  variant="outlined"
                                  color="info"
                                />
                              ))}
                            </Stack>
                          )}

                          {activityData && (
                            <Box sx={{ mt: 2 }}>
                              <Stack spacing={1}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Chip
                                    label={normaliseStatusLabel(activityData.status)}
                                    size="small"
                                    color={getClearanceStatusColor(activityData.status)}
                                    icon={getClearanceStatusIcon(activityData.status)}
                                  />
                                  {activityData.substate && (
                                    <Chip label={activityData.substate} size="small" variant="outlined" />
                                  )}
                                  {isPending && (
                                    <Chip label="Assigned" size="small" variant="outlined" color="warning" />
                                  )}
                                </Stack>
                                {activityData.updater_name && (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Person fontSize="small" color="action" />
                                    <Typography variant="caption" color="text.secondary">
                                      {isPending ? 'Assigned to' : 'Updated by'}: {activityData.updater_name}
                                      {activityData.updater_email && ` (${activityData.updater_email})`}
                                    </Typography>
                                  </Stack>
                                )}
                                {activityData.started_at && (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <AccessTime fontSize="small" color="action" />
                                    <Typography variant="caption" color="text.secondary">
                                      {isPending ? 'Assigned' : 'Started'}: {format(new Date(activityData.started_at), 'MMM dd, yyyy HH:mm')}
                                      {activityData.started_at &&
                                        ` (${formatDistanceToNow(new Date(activityData.started_at), { addSuffix: true })})`}
                                    </Typography>
                                  </Stack>
                                )}
                                {activityData.completed_at && (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <CheckCircle fontSize="small" color="success" />
                                    <Typography variant="caption" color="text.secondary">
                                      Completed: {format(new Date(activityData.completed_at), 'MMM dd, yyyy HH:mm')}
                                    </Typography>
                                  </Stack>
                                )}
                                {activityData.time_spent_minutes !== null && (
                                  <Typography variant="caption" color="text.secondary">
                                    Time spent: {activityData.time_spent_minutes} minutes
                                  </Typography>
                                )}
                                {activityData.notes && (
                                  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1 }}>
                                    <Description fontSize="small" color="action" />
                                    <Typography variant="caption" color="text.secondary">
                                      Notes: {activityData.notes}
                                    </Typography>
                                  </Stack>
                                )}
                              </Stack>
                            </Box>
                          )}

                          {isNotStarted && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Not started yet
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              )
            })}
          </Timeline>
        )}
      </Paper>

      {/* Detailed History Log */}
      {clearanceHistory.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 8px 20px rgba(30, 60, 114, 0.08)', mt: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <AccessTime color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Detailed History Log
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Complete chronological log of all clearance activity updates
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={2}>
            {clearanceHistory
              .sort((a, b) => {
                // First sort by activity priority (from activities list)
                const activityA = clearanceActivities.find(act => act.id === a.clearance_activity_id)
                const activityB = clearanceActivities.find(act => act.id === b.clearance_activity_id)
                const priorityA = activityA?.priority || 999
                const priorityB = activityB?.priority || 999
                
                if (priorityA !== priorityB) {
                  return priorityA - priorityB
                }
                // If same priority, sort by start time
                return new Date(a.started_at) - new Date(b.started_at)
              })
              .map((entry) => (
                <Paper
                  key={entry.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    borderLeft: 4,
                    borderColor: getClearanceStatusColor(entry.status),
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {entry.clearance_activity_name}
                        </Typography>
                        {entry.substate && (
                          <Chip label={entry.substate} size="small" variant="outlined" sx={{ width: 'fit-content' }} />
                        )}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={0.5} alignItems="flex-end">
                        <Chip
                          label={normaliseStatusLabel(entry.status)}
                          size="small"
                          color={getClearanceStatusColor(entry.status)}
                          icon={getClearanceStatusIcon(entry.status)}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(entry.started_at), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </Stack>
                    </Grid>
                    {entry.updater_name && (
                      <Grid item xs={12} sm={6}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                            {entry.updater_name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" color="text.secondary">
                            {entry.updater_name}
                            {entry.updater_email && ` (${entry.updater_email})`}
                          </Typography>
                        </Stack>
                      </Grid>
                    )}
                    {(entry.time_spent_minutes !== null || entry.completed_at) && (
                      <Grid item xs={12} sm={6}>
                        <Stack spacing={0.5} alignItems="flex-end">
                          {entry.time_spent_minutes !== null && (
                            <Typography variant="body2" color="text.secondary">
                              Time spent: {entry.time_spent_minutes} minutes
                            </Typography>
                          )}
                          {entry.completed_at && (
                            <Typography variant="caption" color="text.secondary">
                              Completed: {format(new Date(entry.completed_at), 'MMM dd, yyyy HH:mm')}
                            </Typography>
                          )}
                        </Stack>
                      </Grid>
                    )}
                    {entry.notes && (
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                          "{entry.notes}"
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              ))}
          </Stack>
        </Paper>
      )}

      {clearanceHistory.length === 0 && clearanceActivities.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <AlertTitle>No Clearance History</AlertTitle>
          Clearance activities will appear here as the shipment progresses through the clearance process.
        </Alert>
      )}

      {/* Update Clearance Status Dialog (Admin Only) */}
      {isAdmin && (
        <FormDialog
          open={openStatusDialog}
          onClose={() => {
            setOpenStatusDialog(false)
            setStatusForm({ status: 'in_progress', substate: '', notes: '' })
            setSelectedActivity(null)
          }}
          title={`Update Status: ${selectedActivity?.name || ''}`}
          onSubmit={handleUpdateStatus}
          submitText="Update Status"
          loading={submitting}
          maxWidth="sm"
        >
          <Alert severity="info" sx={{ mb: 2 }}>
            Update the clearance status for this activity. This will update both the history and assignment.
          </Alert>
          <FormSelect
            label="Status"
            value={statusForm.status}
            onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
            ]}
            required
            disabled={submitting}
          />
          {selectedActivity?.substates && selectedActivity.substates.length > 0 && (
            <FormSelect
              label="Substate (Optional)"
              value={statusForm.substate}
              onChange={(e) => setStatusForm({ ...statusForm, substate: e.target.value })}
              options={[
                { value: '', label: 'None' },
                ...selectedActivity.substates.map(s => ({ value: s, label: s })),
              ]}
              disabled={submitting}
            />
          )}
          <FormTextField
            label="Notes (Optional)"
            value={statusForm.notes}
            onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
            multiline
            rows={3}
            disabled={submitting}
            placeholder="Add any notes about this status update..."
          />
        </FormDialog>
      )}
    </Box>
  )
}

export default ShipmentClearanceHistory

