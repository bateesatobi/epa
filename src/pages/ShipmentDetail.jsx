import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Divider,
  Stack,
  LinearProgress,
  Tooltip,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
} from '@mui/material'
import {
  ArrowBack,
  Refresh,
  LocationOn,
  LocalShipping,
  ConfirmationNumber,
  Flag,
  FlightTakeoff,
  PersonOutline,
  MailOutline,
  Phone,
  Inventory2,
  Description,
  EventAvailable,
  MonetizationOn,
  AccessTime,
  Security,
  AssignmentTurnedIn,
  Timeline,
  PlayArrow,
  Done,
  Schedule,
  Edit,
} from '@mui/icons-material'
import { format, formatDistanceToNow } from 'date-fns'
import { shipmentsAPI, complianceAPI, clearanceActivitiesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import { PageSkeleton, LoadingOverlay } from '../components/LoadingStates'
import FormDialog from '../components/FormDialog'
import FormSelect from '../components/FormSelect'
import FormTextField from '../components/FormTextField'
import {
  showSuccessAlert,
  showErrorAlert,
  showLoadingAlert,
  closeAlert,
} from '../utils/alerts'

const STATUS_STEPS = ['pending', 'in_transit', 'at_customs', 'awaiting_release', 'delivered']

const getStatusColor = (status) => {
  switch (status) {
    case 'delivered':
      return 'success'
    case 'in_transit':
      return 'info'
    case 'pending':
      return 'warning'
    case 'cancelled':
      return 'error'
    case 'awaiting_release':
    case 'at_customs':
      return 'secondary'
    default:
      return 'default'
  }
}

const normaliseStatusLabel = (status) => {
  if (!status) return 'Unknown'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

const ShipmentDetail = () => {
  const { shipmentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.roles?.some(role => role.name === 'admin') || false
  const [shipment, setShipment] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [complianceSummary, setComplianceSummary] = useState(null)
  const [clearanceHistory, setClearanceHistory] = useState([])
  const [clearanceActivities, setClearanceActivities] = useState([])
  const [activityAssignments, setActivityAssignments] = useState([])
  const [openStatusDialog, setOpenStatusDialog] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [statusForm, setStatusForm] = useState({
    status: 'in_progress',
    substate: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchShipment = async (showLoader = true) => {
    if (!shipmentId) {
      setError('Missing shipment id')
      return
    }

    try {
      if (showLoader) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      const [shipmentData, timelineData, complianceData, clearanceHistoryData, activitiesData, assignmentsData] = await Promise.all([
        shipmentsAPI.get(shipmentId),
        shipmentsAPI.getTimeline(shipmentId).catch(() => []),
        complianceAPI.getSummary(shipmentId).catch(() => null),
        shipmentsAPI.getClearanceHistory(shipmentId).catch(() => []),
        clearanceActivitiesAPI.list({ is_active: true }).catch(() => []),
        shipmentsAPI.listClearanceActivityAssignments(shipmentId).catch(() => []),
      ])

      setShipment(shipmentData)
      setTimeline(Array.isArray(timelineData) ? timelineData : [])
      setComplianceSummary(complianceData)
      setClearanceHistory(Array.isArray(clearanceHistoryData) ? clearanceHistoryData : [])
      setClearanceActivities(Array.isArray(activitiesData) ? activitiesData : [])
      setActivityAssignments(Array.isArray(assignmentsData) ? assignmentsData : [])
      setError(null)
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load shipment details'
      setError(message)
      toast.error(message)
    } finally {
      if (showLoader) {
        setLoading(false)
      } else {
        setRefreshing(false)
      }
    }
  }

  useEffect(() => {
    fetchShipment(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentId])

  // Get activities assigned to current user
  const myAssignments = useMemo(() => {
    if (!user || !activityAssignments.length) return []
    return activityAssignments.filter(
      assignment => assignment.user_id === user.id && 
      ['pending', 'in_progress'].includes(assignment.status)
    )
  }, [user, activityAssignments])

  const handleOpenStatusDialog = (activity) => {
    // For field staff, only allow updating their own assignments
    if (!isAdmin) {
      const assignment = myAssignments.find(a => a.clearance_activity_id === activity.id)
      if (!assignment) return
    }
    
    // For admins, allow updating any activity
    const assignment = activityAssignments.find(a => a.clearance_activity_id === activity.id)
    const activityData = clearanceHistory.find(h => h.clearance_activity_id === activity.id)
    
    setSelectedActivity(activity)
    setStatusForm({
      status: assignment?.status === 'completed' ? 'completed' : assignment?.status === 'in_progress' ? 'in_progress' : activityData?.status || 'in_progress',
      substate: activityData?.substate || assignment?.substate || '',
      notes: activityData?.notes || assignment?.notes || '',
    })
    setOpenStatusDialog(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedActivity || !shipment) return

    setSubmitting(true)
    const loadingAlert = showLoadingAlert('Updating Status...', 'Please wait')

    try {
      await shipmentsAPI.updateClearanceStatus(shipment.id, {
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
      await fetchShipment(false) // Refresh data
    } catch (error) {
      closeAlert()
      showErrorAlert('Update Failed', error.response?.data?.detail || 'Failed to update clearance status')
    } finally {
      setSubmitting(false)
    }
  }

  // Group history by activity (for progress calculation)
  const groupedHistoryByActivity = useMemo(() => {
    return (clearanceHistory || []).reduce((acc, entry) => {
      const activityId = entry.clearance_activity_id
      if (!acc[activityId]) {
        acc[activityId] = []
      }
      acc[activityId].push(entry)
      return acc
    }, {})
  }, [clearanceHistory])

  // Get activity status helper - check history first, then assignments
  const getActivityStatus = useCallback((activityId) => {
    // Check history first (most accurate)
    const entries = groupedHistoryByActivity[activityId] || []
    if (entries.length > 0) {
      const latest = entries[entries.length - 1]
      return latest.status
    }
    
    // If no history, check assignments
    const activityAssignments_filtered = activityAssignments.filter(
      a => a.clearance_activity_id === activityId
    )
    if (activityAssignments_filtered.length > 0) {
      // Prioritize: in_progress > pending > completed
      const inProgress = activityAssignments_filtered.find(a => a.status === 'in_progress')
      if (inProgress) return 'in_progress'
      const pending = activityAssignments_filtered.find(a => a.status === 'pending')
      if (pending) return 'pending'
      const completed = activityAssignments_filtered.find(a => a.status === 'completed')
      if (completed) return 'completed'
    }
    
    return 'not_started'
  }, [groupedHistoryByActivity, activityAssignments])

  // Calculate progress based on clearance activities (including in-progress)
  const progressData = useMemo(() => {
    if (!shipment || !clearanceActivities.length) {
      // Fallback to status-based progress if no clearance activities
      const currentIndex = STATUS_STEPS.indexOf(shipment?.status)
      if (currentIndex === -1) {
        return {
          completed: 0,
          inProgress: 0,
          total: 0,
          percentage: shipment?.status === 'cancelled' ? 0 : 10,
        }
      }
      return {
        completed: 0,
        inProgress: 0,
        total: 0,
        percentage: ((currentIndex + 1) / STATUS_STEPS.length) * 100,
      }
    }

    // Sort activities by priority
    const sortedActivities = [...clearanceActivities].sort((a, b) => (a.priority || 0) - (b.priority || 0))

    // Count completed and in-progress activities (don't count pending)
    let completedCount = 0
    let inProgressCount = 0
    
    for (const activity of sortedActivities) {
      const activityStatus = getActivityStatus(activity.id)
      if (activityStatus === 'completed') {
        completedCount++
      } else if (activityStatus === 'in_progress') {
        inProgressCount++
        // Continue counting all in-progress activities
      } else {
        // Stop counting once we hit a not-started or pending activity (activities must be done in order)
        break
      }
    }

    const total = sortedActivities.length
    // Calculate percentage: include only completed and in-progress activities
    const percentage = total > 0 ? Math.round(((completedCount + inProgressCount) / total) * 100) : 0

    return {
      completed: completedCount,
      inProgress: inProgressCount,
      total,
      percentage,
      completedPercent: total > 0 ? (completedCount / total) * 100 : 0,
      inProgressPercent: total > 0 ? (inProgressCount / total) * 100 : 0,
    }
  }, [shipment, clearanceActivities, getActivityStatus])

  const progressValue = progressData.percentage

  // Get current activity status for display (must be before conditional returns)
  const getCurrentActivityStatus = useMemo(() => {
    if (!shipment) return null
    
    // Determine current activity - prioritize shipment's current_clearance_activity_id, then assignments, then first activity
    let currentActivityId = shipment.current_clearance_activity_id
    let currentActivityName = shipment.current_clearance_activity_name
    let currentSubstate = shipment.current_clearance_substate
    
    // If no current activity from shipment, try to find from assignments (prioritize in_progress, then pending)
    if (!currentActivityId && activityAssignments.length > 0) {
      const inProgressAssignment = activityAssignments.find(a => a.status === 'in_progress')
      const pendingAssignment = activityAssignments.find(a => a.status === 'pending')
      const assignment = inProgressAssignment || pendingAssignment
      
      if (assignment) {
        currentActivityId = assignment.clearance_activity_id
        currentActivityName = assignment.clearance_activity_name
      }
    }
    
    // If still no activity, use first activity from clearance activities list
    if (!currentActivityId && clearanceActivities.length > 0) {
      const sortedActivities = [...clearanceActivities].sort((a, b) => (a.priority || 0) - (b.priority || 0))
      const firstActivity = sortedActivities[0]
      currentActivityId = firstActivity.id
      currentActivityName = firstActivity.name
    }
    
    if (!currentActivityId || !currentActivityName) return null
    
    // Determine status from history first (most accurate), then assignments
    let activityStatus = 'pending'
    
    // Check history first (most accurate)
    if (clearanceHistory.length > 0) {
      const activityHistory = clearanceHistory.filter(
        h => h.clearance_activity_id === currentActivityId
      )
      if (activityHistory.length > 0) {
        // Get the latest history entry
        const latest = activityHistory[activityHistory.length - 1]
        activityStatus = latest.status
      }
    }
    
    // If no history, check assignments
    if (activityStatus === 'pending' && activityAssignments.length > 0) {
      const activityAssignments_filtered = activityAssignments.filter(
        a => a.clearance_activity_id === currentActivityId
      )
      const inProgress = activityAssignments_filtered.find(a => a.status === 'in_progress')
      const completed = activityAssignments_filtered.find(a => a.status === 'completed')
      
      if (completed) activityStatus = 'completed'
      else if (inProgress) activityStatus = 'in_progress'
    }
    
    return {
      activityName: currentActivityName,
      substate: currentSubstate,
      status: activityStatus,
    }
  }, [shipment, activityAssignments, clearanceHistory, clearanceActivities])

  if (loading && !shipment) {
    return <PageSkeleton showHeader={true} showTable={false} />
  }

  if (error || !shipment) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/shipments')}
          sx={{ mb: 2 }}
        >
          Back to Shipments
        </Button>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Unable to load shipment
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {error || 'Unknown error occurred'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => fetchShipment(true)}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Paper>
      </Box>
    )
  }

  const detailItems = [
    { label: 'Shipment Number', value: shipment.shipment_number, icon: <ConfirmationNumber fontSize="small" /> },
    { 
      label: 'Status', 
      value: getCurrentActivityStatus 
        ? `${getCurrentActivityStatus.activityName}${getCurrentActivityStatus.substate ? ` - ${getCurrentActivityStatus.substate}` : ''}`
        : (clearanceActivities.length > 0 
            ? clearanceActivities.sort((a, b) => (a.priority || 0) - (b.priority || 0))[0]?.name || 'Not Started'
            : 'Not Started'), 
      icon: <Flag fontSize="small" />,
      isActivityStatus: !!getCurrentActivityStatus || clearanceActivities.length > 0,
      activityStatus: getCurrentActivityStatus?.status || 'not_started',
    },
    { label: 'Origin', value: shipment.origin, icon: <LocationOn fontSize="small" color="primary" /> },
    { label: 'Destination', value: shipment.destination, icon: <FlightTakeoff fontSize="small" color="primary" /> },
    { label: "Shipper's Name", value: shipment.shipper_name || '—', icon: <PersonOutline fontSize="small" /> },
    { label: 'Consignee Name', value: shipment.consignee_name, icon: <PersonOutline fontSize="small" /> },
    { label: 'Consignee Email', value: shipment.consignee_email || '—', icon: <MailOutline fontSize="small" /> },
    { label: 'Consignee Phone', value: shipment.consignee_phone || '—', icon: <Phone fontSize="small" /> },
    { label: 'Container Number', value: shipment.container_number || '—', icon: <Inventory2 fontSize="small" /> },
    { label: 'Cargo Description', value: shipment.cargo_description || '—', icon: <Description fontSize="small" /> },
    {
      label: 'Estimated Cost',
      value:
        shipment.estimated_cost !== null && shipment.estimated_cost !== undefined
          ? `UGX ${shipment.estimated_cost.toLocaleString()}`
          : '—',
      icon: <MonetizationOn fontSize="small" />,
    },
    {
      label: 'Created On',
      value: shipment.created_at ? format(new Date(shipment.created_at), 'MMM dd, yyyy HH:mm') : '—',
      icon: <AccessTime fontSize="small" />,
    },
    {
      label: 'Last Updated',
      value: shipment.updated_at ? format(new Date(shipment.updated_at), 'MMM dd, yyyy HH:mm') : '—',
      icon: <AccessTime fontSize="small" />,
    },
    {
      label: 'Current Clearance Activity',
      value: shipment.current_clearance_activity_name 
        ? `${shipment.current_clearance_activity_name}${shipment.current_clearance_substate ? ` - ${shipment.current_clearance_substate}` : ''}`
        : 'Not Started',
      icon: <Timeline fontSize="small" />,
    },
  ]

  const currentLocation = shipment.current_location || 'Not provided'
  const t1Forms = complianceSummary?.t1_forms || []
  const latestT1 = complianceSummary?.latest_t1_form
  const seals = complianceSummary?.seals || []
  const latestSeal = complianceSummary?.latest_seal

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Avatar
              variant="rounded"
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'primary.main',
                color: 'white',
                boxShadow: '0 4px 12px rgba(25,118,210,0.3)',
              }}
            >
              <LocalShipping />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                {shipment.shipment_number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Shipment Tracking & Details
              </Typography>
            </Box>
            <Chip
              label={normaliseStatusLabel(shipment.status)}
              color={getStatusColor(shipment.status)}
              sx={{ fontWeight: 600, height: 32 }}
            />
          </Stack>
          <Stack direction="row" spacing={1.5} flexShrink={0}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/shipments')}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Back
            </Button>
            <Tooltip title="Refresh shipment data">
              <span>
                <Button
                  startIcon={<Refresh />}
                  onClick={() => fetchShipment(false)}
                  variant="contained"
                  disabled={refreshing}
                  sx={{ borderRadius: 2 }}
                >
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Shipment Overview */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  color: 'white',
                }}
              >
                <LocalShipping fontSize="small" />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>
                Shipment Overview
              </Typography>
            </Box>

            {/* Progress Section */}
            <Box
              sx={{
                mb: 4,
                p: 2.5,
                borderRadius: 2,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                  Overall Progress
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {Math.round(progressValue)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'grey.300',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    background: progressData.completed > 0 && progressData.inProgress > 0
                      ? `linear-gradient(to right, #2e7d32 0%, #2e7d32 ${progressData.completedPercent}%, #0288d1 ${progressData.completedPercent}%, #0288d1 ${progressData.completedPercent + progressData.inProgressPercent}%)`
                      : progressData.completed > 0
                      ? '#2e7d32' // Green for completed only
                      : progressData.inProgress > 0
                      ? '#0288d1' // Blue for in-progress only
                      : 'grey.400', // Grey for no progress
                  },
                }}
              />
              {clearanceActivities.length > 0 && (
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                    Clearance Activities: {progressData.completed} completed, {progressData.inProgress} in progress of {progressData.total} total
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                    {[...clearanceActivities]
                      .sort((a, b) => (a.priority || 0) - (b.priority || 0))
                      .slice(0, 6)
                      .map((activity) => {
                        const status = getActivityStatus(activity.id)
                        const isCompleted = status === 'completed'
                        const isInProgress = status === 'in_progress'
                        return (
                          <Chip
                            key={activity.id}
                            label={activity.name}
                            size="small"
                            color={isCompleted ? 'success' : isInProgress ? 'primary' : 'default'}
                            variant={isCompleted ? 'filled' : 'outlined'}
                            sx={{
                              fontSize: '0.7rem',
                              height: 24,
                              fontWeight: isCompleted || isInProgress ? 600 : 400,
                            }}
                          />
                        )
                      })}
                    {clearanceActivities.length > 6 && (
                      <Chip
                        label={`+${clearanceActivities.length - 6}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 24 }}
                      />
                    )}
                  </Stack>
                </Box>
              )}
            </Box>

            {/* Details Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 2.5,
              }}
            >
              {detailItems.map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: 'primary.50',
                        color: 'primary.main',
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {item.label}
                      </Typography>
                      {item.label === 'Status' ? (
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          {item.isActivityStatus ? (
                            <>
                              <Chip
                                label={item.value}
                                size="small"
                                color={
                                  item.activityStatus === 'completed'
                                    ? 'success'
                                    : item.activityStatus === 'in_progress'
                                    ? 'primary'
                                    : 'warning'
                                }
                                sx={{ fontWeight: 600 }}
                              />
                              <Chip
                                label={item.activityStatus === 'completed' ? 'Completed' : item.activityStatus === 'in_progress' ? 'In Progress' : 'Pending'}
                                size="small"
                                variant="outlined"
                                color={
                                  item.activityStatus === 'completed'
                                    ? 'success'
                                    : item.activityStatus === 'in_progress'
                                    ? 'primary'
                                    : 'warning'
                                }
                              />
                            </>
                          ) : (
                            <Chip
                              label={item.value}
                              size="small"
                              color={getStatusColor(shipment.status)}
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="body1" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                          {item.value}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Box>

            {/* Activity Assignments Section */}
            {activityAssignments.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: 'primary.main',
                      color: 'white',
                    }}
                  >
                    <AssignmentTurnedIn fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>
                    Assigned Activities & Field Staff
                  </Typography>
                </Box>
                <Stack spacing={1.5}>
                  {(() => {
                    // Group assignments by activity and sort by priority
                    const assignmentsByActivity = activityAssignments.reduce((acc, assignment) => {
                      const activityId = assignment.clearance_activity_id
                      if (!acc[activityId]) {
                        acc[activityId] = []
                      }
                      acc[activityId].push(assignment)
                      return acc
                    }, {})

                    // Get activities with their priorities and sort
                    const activitiesWithAssignments = Object.keys(assignmentsByActivity)
                      .map(activityId => {
                        const activity = clearanceActivities.find(a => a.id === parseInt(activityId))
                        return {
                          activity,
                          activityId: parseInt(activityId),
                          assignments: assignmentsByActivity[activityId],
                          priority: activity?.priority || 999
                        }
                      })
                      .filter(item => item.activity) // Only include activities that exist
                      .sort((a, b) => a.priority - b.priority)

                    return activitiesWithAssignments.map(({ activity, assignments }) => (
                      <Paper
                        key={activity.id}
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderLeft: '4px solid',
                          borderLeftColor: 'primary.main',
                          bgcolor: 'background.paper',
                        }}
                      >
                        <Stack spacing={1.5}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                                {activity.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Priority {activity.priority}
                                {activity.description && ` • ${activity.description}`}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${assignments.length} ${assignments.length === 1 ? 'staff' : 'staff'}`}
                              size="small"
                              color="primary"
                              variant="filled"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                          <Divider sx={{ my: 1.5 }} />
                          <Stack spacing={1.5}>
                            {assignments.map((assignment) => (
                              <Box
                                key={assignment.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 2,
                                  borderRadius: 1.5,
                                  bgcolor: 'grey.50',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                    borderColor: 'primary.main',
                                  },
                                }}
                              >
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                                  <Avatar
                                    sx={{
                                      width: 36,
                                      height: 36,
                                      bgcolor: 'primary.main',
                                      color: 'white',
                                      fontSize: '0.875rem',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {assignment.user_name?.charAt(0)?.toUpperCase() || assignment.user_email?.charAt(0)?.toUpperCase() || '?'}
                                  </Avatar>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>
                                      {assignment.user_name || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                      {assignment.user_email}
                                    </Typography>
                                  </Box>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Chip
                                    label={assignment.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    size="small"
                                    color={
                                      assignment.status === 'completed'
                                        ? 'success'
                                        : assignment.status === 'in_progress'
                                        ? 'primary'
                                        : assignment.status === 'cancelled'
                                        ? 'error'
                                        : 'default'
                                    }
                                    sx={{ fontWeight: 600 }}
                                  />
                                  {user && assignment.user_id === user.id && 
                                   ['pending', 'in_progress'].includes(assignment.status) && (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="primary"
                                      onClick={() => handleOpenStatusDialog(activity)}
                                      sx={{ ml: 1 }}
                                    >
                                      Update
                                    </Button>
                                  )}
                                </Stack>
                              </Box>
                            ))}
                          </Stack>
                        </Stack>
                      </Paper>
                    ))
                  })()}
                </Stack>
              </Box>
            )}

            {/* My Assigned Activities - Status Update Section */}
            {myAssignments.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: 'warning.main',
                      color: 'white',
                    }}
                  >
                    <PlayArrow fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>
                    My Assigned Activities
                  </Typography>
                </Box>
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                  You have {myAssignments.length} active assignment{myAssignments.length > 1 ? 's' : ''}. 
                  Update the status as you work on each activity.
                </Alert>
                <Stack spacing={1.5}>
                  {myAssignments.map((assignment) => {
                    const activity = clearanceActivities.find(a => a.id === assignment.clearance_activity_id)
                    if (!activity) return null
                    
                    return (
                      <Paper
                        key={assignment.id}
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: 'warning.main',
                          bgcolor: 'warning.light',
                        }}
                      >
                        <Stack spacing={1.5}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                                {activity.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Priority {activity.priority}
                                {activity.description && ` • ${activity.description}`}
                              </Typography>
                            </Box>
                            <Chip
                              label={assignment.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              size="small"
                              color={assignment.status === 'in_progress' ? 'primary' : 'default'}
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                          <Divider />
                          <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={() => handleOpenStatusDialog(activity)}
                            startIcon={<PlayArrow />}
                            sx={{ mt: 1 }}
                          >
                            {assignment.status === 'pending' ? 'Start Activity' : 'Update Status'}
                          </Button>
                        </Stack>
                      </Paper>
                    )
                  })}
                </Stack>
              </Box>
            )}

            <Box>
              <Typography variant="body2" color="text.secondary">
                Current Location
              </Typography>
              <Typography variant="body1" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <LocationOn fontSize="small" color="primary" />
                {currentLocation}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Compliance Section */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack spacing={4}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'primary.main',
                        color: 'white',
                      }}
                    >
                      <AssignmentTurnedIn fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>
                      Transit Declaration · T1 Forms
                    </Typography>
                  </Box>
                  <Chip
                    label={`${t1Forms.length} ${t1Forms.length === 1 ? 'Form' : 'Forms'}`}
                    color={t1Forms.length ? 'primary' : 'default'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                {t1Forms.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No T1 forms have been submitted for this shipment yet. Generate a T1 to place the cargo under customs transit control.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {t1Forms.slice(0, 3).map((form) => (
                      <Paper
                        key={form.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          borderLeft: '4px solid',
                          borderColor:
                            form.status === 'approved'
                              ? 'success.main'
                              : form.status === 'submitted'
                              ? 'primary.main'
                              : form.status === 'rejected'
                              ? 'error.main'
                              : 'warning.main',
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {form.form_number}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {form.goods_description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {`Transporter: ${form.transporter_name} · ${formatDistanceToNow(new Date(form.created_at), {
                                addSuffix: true,
                              })}`}
                            </Typography>
                          </Box>
                          <Chip
                            label={form.status.replace('_', ' ').toUpperCase()}
                            size="small"
                            color={
                              form.status === 'approved'
                                ? 'success'
                                : form.status === 'submitted'
                                ? 'primary'
                                : form.status === 'rejected'
                                ? 'error'
                                : 'warning'
                            }
                          />
                        </Stack>
                      </Paper>
                    ))}
                    {t1Forms.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        Showing latest 3 of {t1Forms.length} T1 submissions.
                      </Typography>
                    )}
                    {latestT1 && (
                      <Typography variant="body2" color="text.secondary">
                        Last update: {format(new Date(latestT1.created_at), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>

              <Divider />

              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'secondary.main',
                        color: 'white',
                      }}
                    >
                      <Security fontSize="small" />
                    </Avatar>
                    <Typography variant="h6" fontWeight={700}>
                      Customs Seal Register
                    </Typography>
                  </Box>
                  <Chip
                    label={`${seals.length} ${seals.length === 1 ? 'Seal' : 'Seals'}`}
                    color={seals.length ? 'secondary' : 'default'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                {seals.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No seals recorded. Document seal issuance to secure the cargo before transit.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {seals.slice(0, 3).map((seal) => (
                      <Paper
                        key={seal.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          borderLeft: '4px solid',
                          borderColor: seal.is_tampered ? 'error.main' : 'secondary.main',
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {seal.seal_number}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {seal.seal_type || 'Standard seal'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {seal.applied_location
                                ? `${seal.applied_location} · ${formatDistanceToNow(new Date(seal.created_at), {
                                    addSuffix: true,
                                  })}`
                                : formatDistanceToNow(new Date(seal.created_at), { addSuffix: true })}
                            </Typography>
                          </Box>
                          <Chip
                            label={seal.is_tampered ? 'Tampered' : 'Intact'}
                            size="small"
                            color={seal.is_tampered ? 'error' : 'success'}
                            variant={seal.is_tampered ? 'filled' : 'outlined'}
                          />
                        </Stack>
                      </Paper>
                    ))}
                    {seals.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        Showing latest 3 of {seals.length} seal records.
                      </Typography>
                    )}
                    {latestSeal && (
                      <Typography variant="body2" color="text.secondary">
                        Latest seal update: {format(new Date(latestSeal.created_at), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Timeline Section */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  color: 'white',
                }}
              >
                <AccessTime fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Timeline & History
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Live audit trail of every status update, location ping, and operational note
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {timeline.length === 0 ? (
              <Box
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: 'grey.50',
                  border: '1px dashed',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No tracking events have been recorded yet.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {timeline
                  .slice()
                  .reverse()
                  .map((event, idx) => (
                    <Paper
                      key={`${event.timestamp}-${idx}`}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderLeft: '4px solid',
                        borderLeftColor:
                          event.status === 'delivered'
                            ? 'success.main'
                            : event.status === 'in_transit'
                            ? 'info.main'
                            : event.status === 'cancelled'
                            ? 'error.main'
                            : 'warning.main',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 2,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                            {normaliseStatusLabel(event.status)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTime fontSize="inherit" />
                            {event.timestamp ? format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm') : 'No timestamp'}
                          </Typography>
                        </Box>
                        <Chip
                          label={normaliseStatusLabel(event.status)}
                          size="small"
                          color={getStatusColor(event.status)}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      {event.location && (
                        <Box
                          sx={{
                            mt: 1.5,
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: 'grey.50',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <LocationOn fontSize="small" color="primary" />
                          <Typography variant="body2" fontWeight={500}>
                            {event.location}
                          </Typography>
                        </Box>
                      )}
                      {event.notes && (
                        <Typography variant="body2" sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: 'grey.50' }}>
                          {event.notes}
                        </Typography>
                      )}
                    </Paper>
                  ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Clearance History Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 8px 20px rgba(30, 60, 114, 0.08)' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <Timeline color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Clearance History
              </Typography>
              {shipment.current_clearance_activity_name && (
                <Chip
                  label={`Current: ${shipment.current_clearance_activity_name}${shipment.current_clearance_substate ? ` - ${shipment.current_clearance_substate}` : ''}`}
                  color="primary"
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Complete audit trail of clearance activities from validation to release.
            </Typography>

            <Divider sx={{ my: 2 }} />

            {clearanceHistory.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <AlertTitle>No Clearance History</AlertTitle>
                Clearance activities will appear here as the shipment progresses through the clearance process.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {clearanceHistory.map((entry, idx) => {
                  const isCompleted = entry.status === 'completed'
                  const isInProgress = entry.status === 'in_progress'
                  const isLast = idx === clearanceHistory.length - 1
                  
                  return (
                    <Paper
                      key={entry.id}
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        borderLeft: 4,
                        borderColor: isCompleted ? 'success.main' : isInProgress ? 'primary.main' : 'warning.main',
                        backgroundColor: isInProgress ? 'action.hover' : 'background.paper',
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Avatar
                          sx={{
                            bgcolor: isCompleted ? 'success.main' : isInProgress ? 'primary.main' : 'warning.main',
                            width: 40,
                            height: 40,
                          }}
                        >
                          {isCompleted ? <Done /> : isInProgress ? <PlayArrow /> : <Schedule />}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {entry.clearance_activity_name || 'Unknown Activity'}
                            </Typography>
                            <Chip
                              label={entry.status === 'completed' ? 'Completed' : entry.status === 'in_progress' ? 'In Progress' : 'Skipped'}
                              size="small"
                              color={isCompleted ? 'success' : isInProgress ? 'primary' : 'default'}
                              sx={{ height: 20 }}
                            />
                            {entry.substate && (
                              <Chip
                                label={entry.substate}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                            {isAdmin && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Edit />}
                                onClick={() => {
                                  const activity = clearanceActivities.find(a => a.id === entry.clearance_activity_id)
                                  if (activity) handleOpenStatusDialog(activity)
                                }}
                                sx={{ ml: 'auto' }}
                              >
                                Update
                              </Button>
                            )}
                          </Stack>
                          
                          <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PersonOutline fontSize="small" />
                              {entry.updater_name || 'Unknown User'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTime fontSize="small" />
                              Started: {format(new Date(entry.started_at), 'MMM dd, yyyy HH:mm')}
                            </Typography>
                            {entry.completed_at && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Done fontSize="small" />
                                Completed: {format(new Date(entry.completed_at), 'MMM dd, yyyy HH:mm')}
                              </Typography>
                            )}
                            {entry.time_spent_minutes && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Schedule fontSize="small" />
                                Time: {entry.time_spent_minutes} min
                              </Typography>
                            )}
                          </Stack>
                          
                          {entry.notes && (
                            <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                              {entry.notes}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Paper>
                  )
                })}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Update Clearance Status Dialog */}
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
          Update the clearance status for this activity. This will update both the history and your assignment.
        </Alert>
        <FormSelect
          label="Status"
          value={statusForm.status}
          onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
          options={isAdmin ? [
            { value: 'pending', label: 'Pending' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
          ] : [
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
    </Box>
  )
}

export default ShipmentDetail

