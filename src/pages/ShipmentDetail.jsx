import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Tab,
  Tabs,
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
  IconButton,
  alpha,
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
  ChatBubbleOutline,
  Reply,
  DeleteOutline,
  Send,
  Download,
  Lock,
} from '@mui/icons-material'
import { format, formatDistanceToNow } from 'date-fns'
import { shipmentsAPI, complianceAPI, clearanceActivitiesAPI, commentsAPI } from '../services/api'
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
  showConfirmDialog,
} from '../utils/alerts'
import ShipmentQueries from '../components/ShipmentQueries'
import ResourceAlertBadges from '../components/ResourceAlertBadges'
import { useUnreadNotifications } from '../hooks/useNotifications'
import { indexResourceAlerts } from '../utils/notificationNavigation'
import { downloadConsignmentReport } from '../utils/consignmentReport'
import {
  formatShipmentStatusLabel,
  isMissionClosed,
  isMissionTerminal,
} from '../utils/shipmentStatus'

const STATUS_STEPS = ['pending', 'in_transit', 'at_customs', 'awaiting_release', 'delivered', 'closed']

const getStatusColor = (status) => {
  switch (status) {
    case 'delivered':
      return 'success'
    case 'closed':
      return 'default'
    case 'in_transit':
      return 'info'
    case 'pending':
      return 'warning'
    case 'cancelled':
      return 'error'
    case 'awaiting_release':
    case 'at_customs':
      return 'secondary'
    case 'on_hold':
      return 'warning'
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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isAdmin, isStaff } = useAuth()
  const [shipment, setShipment] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [complianceSummary, setComplianceSummary] = useState(null)
  const [clearanceHistory, setClearanceHistory] = useState([])
  const [clearanceActivities, setClearanceActivities] = useState([])
  const [activityAssignments, setActivityAssignments] = useState([])
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [openStatusDialog, setOpenStatusDialog] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [statusForm, setStatusForm] = useState({
    status: 'in_progress',
    substate: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [downloadingReport, setDownloadingReport] = useState(false)
  const { data: unreadNotifications = [] } = useUnreadNotifications()
  const unreadForShipment = useMemo(
    () => indexResourceAlerts(unreadNotifications)[Number(shipmentId)] || { queries: 0, feedback: 0 },
    [unreadNotifications, shipmentId]
  )

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

      const [
        shipmentData, 
        timelineData, 
        complianceData, 
        clearanceHistoryData, 
        activitiesData, 
        assignmentsData,
        commentsData
      ] = await Promise.all([
        shipmentsAPI.get(shipmentId),
        shipmentsAPI.getTimeline(shipmentId).catch(() => []),
        complianceAPI.getSummary(shipmentId).catch(() => null),
        shipmentsAPI.getClearanceHistory(shipmentId).catch(() => []),
        clearanceActivitiesAPI.list({ is_active: true }).catch(() => []),
        shipmentsAPI.listClearanceActivityAssignments(shipmentId).catch(() => []),
        commentsAPI.listByShipment(shipmentId).catch(() => []),
      ])

      setShipment(shipmentData)
      setTimeline(Array.isArray(timelineData) ? timelineData : [])
      setComplianceSummary(complianceData)
      setClearanceHistory(Array.isArray(clearanceHistoryData) ? clearanceHistoryData : [])
      setClearanceActivities(Array.isArray(activitiesData) ? activitiesData : [])
      setActivityAssignments(Array.isArray(assignmentsData) ? assignmentsData : [])
      setComments(Array.isArray(commentsData) ? commentsData : [])
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

  useEffect(() => {
    if (loading || !shipment) return
    const tab = searchParams.get('tab')
    const targetId =
      tab === 'queries' ? 'shipment-queries' : tab === 'comments' ? 'shipment-comments' : null
    if (!targetId) return
    const timer = setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
    return () => clearTimeout(timer)
  }, [loading, shipment, searchParams])

  const handleDownloadReport = async () => {
    if (!shipmentId) return
    setDownloadingReport(true)
    const toastId = toast.loading('Preparing consignment package…')
    try {
      const { filename, missingCount } = await downloadConsignmentReport({
        shipmentId,
        shipment,
        clearanceHistory,
        assignments: activityAssignments,
        generatedBy: user?.full_name || user?.name || user?.email || '',
        onProgress: (msg) => toast.update(toastId, { render: msg, isLoading: true }),
      })
      toast.update(toastId, {
        render: missingCount
          ? `Downloaded ${filename} (${missingCount} document(s) missing from server — see _MISSING_DOCUMENTS.txt)`
          : `Downloaded package ${filename}`,
        type: missingCount ? 'warning' : 'success',
        isLoading: false,
        autoClose: 5000,
      })
    } catch (err) {
      toast.update(toastId, {
        render: err.response?.data?.detail || err.message || 'Failed to download package',
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      })
    } finally {
      setDownloadingReport(false)
    }
  }

  const handleCloseMission = async () => {
    if (!shipmentId || !shipment) return
    if (isMissionTerminal(shipment.status)) {
      showErrorAlert('Unavailable', 'This mission is already closed or cancelled')
      return
    }
    const result = await showConfirmDialog(
      'Close Mission',
      'Close this consignment mission? Clients and field staff will see Mission closed, and operational updates will stop.',
      'Yes, Close Mission'
    )
    if (!result.isConfirmed) return
    showLoadingAlert('Closing mission...')
    try {
      await shipmentsAPI.closeMission(shipmentId, 'Closed from shipment cockpit')
      closeAlert()
      await showSuccessAlert('Closed', 'Mission has been closed')
      fetchShipment(false)
    } catch (error) {
      closeAlert()
      showErrorAlert('Failed', error.response?.data?.detail || 'Could not close mission')
    }
  }

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
    if (!isStaff) {
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

  const handlePostComment = async () => {
    if (!newComment.trim() || !shipment) return

    setSubmitting(true)
    try {
      await commentsAPI.create(shipment.id, {
        content: newComment,
        parent_id: replyTo ? replyTo.id : null
      })
      setNewComment('')
      setReplyTo(null)
      toast.success('Comment posted')
      await fetchShipment(false)
    } catch (error) {
      toast.error('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await commentsAPI.delete(commentId)
      toast.success('Comment deleted')
      await fetchShipment(false)
    } catch (error) {
      toast.error('Failed to delete comment')
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
      } else {
        // Stop counting once we hit a not-started activity
        break
      }
    }

    const total = sortedActivities.length
    // Calculate percentage: 100% for completed, 50% for in-progress
    const percentage = total > 0 
      ? Math.round(((completedCount + (inProgressCount * 0.5)) / total) * 100) 
      : 0

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
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error || !shipment) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
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
    <Box sx={{ pb: 6 }}>
      {/* Premium Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center">
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate(-1)}
            variant="text"
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            Back
          </Button>
          <Avatar
            variant="rounded"
            sx={{
              width: 56,
              height: 56,
              bgcolor: 'primary.light',
              color: 'primary.main',
              borderRadius: 2,
            }}
          >
            <LocalShipping sx={{ fontSize: 32 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              {shipment.shipment_number}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Shipment Tracking & Governance Cockpit
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label={formatShipmentStatusLabel(shipment.status).toUpperCase()}
              color={getStatusColor(shipment.status)}
              sx={{ 
                fontWeight: 700, 
                px: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            />
            {isAdmin && !isMissionTerminal(shipment.status) && (
              <Button
                variant="contained"
                color="inherit"
                startIcon={<Lock />}
                onClick={handleCloseMission}
                sx={{ fontWeight: 800, bgcolor: '#0A192F', color: '#fff', '&:hover': { bgcolor: '#152A4A' } }}
              >
                Close mission
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={
                downloadingReport ? <CircularProgress size={16} color="inherit" /> : <Download />
              }
              onClick={handleDownloadReport}
              disabled={downloadingReport}
              sx={{ fontWeight: 700 }}
            >
              Download package
            </Button>
            <Tooltip title="Refresh data">
              <IconButton 
                onClick={() => fetchShipment(false)} 
                disabled={refreshing}
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <Refresh fontSize="small" className={refreshing ? 'rotate-animation' : ''} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {isMissionClosed(shipment.status) && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }} icon={<Lock />}>
          <AlertTitle sx={{ fontWeight: 800 }}>Mission closed</AlertTitle>
          This consignment mission is closed
          {shipment.closed_at
            ? ` · ${format(new Date(shipment.closed_at), 'MMM dd, yyyy HH:mm')}`
            : ''}
          {shipment.closure_reason ? ` — ${shipment.closure_reason}` : ''}.
          No further operational updates are expected.
        </Alert>
      )}

      {/* Metrics Row - Reduces sidebar congestion */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#01A3DA', 0.1), color: '#01A3DA' }}>
                <Timeline />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>CLEARANCE PROGRESS</Typography>
                <Typography variant="h5" fontWeight={800}>{progressValue}%</Typography>
              </Box>
            </Stack>
            <LinearProgress 
              variant="determinate" 
              value={progressValue} 
              sx={{ mt: 2, height: 6, borderRadius: 3, bgcolor: '#E9ECEF', '& .MuiLinearProgress-bar': { bgcolor: '#01A3DA' } }} 
            />
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#4CAF50', 0.1), color: '#4CAF50' }}>
                <Inventory2 />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>COMPLIANCE DOCS</Typography>
                <Typography variant="h5" fontWeight={800}>{t1Forms.length + seals.length}</Typography>
              </Box>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {complianceSummary?.missing_count || 0} Action required
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#9C27B0', 0.1), color: '#9C27B0' }}>
                <Security />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>ACTIVE FIELD STAFF</Typography>
                <Typography variant="h5" fontWeight={800}>
                  {activityAssignments.filter(a => a.status === 'in_progress').length}
                </Typography>
              </Box>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {activityAssignments.length} Total assignments
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%', bgcolor: '#000000', color: '#FFFFFF' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#FFF', 0.1), color: '#FFF' }}>
                <ChatBubbleOutline />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: alpha('#FFF', 0.6) }} fontWeight={600}>QUERIES & FEEDBACK</Typography>
                <Typography variant="h5" fontWeight={800}>
                  {(shipment?.open_query_count || 0) + comments.length}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
              <ResourceAlertBadges
                queries={shipment?.open_query_count}
                feedback={comments.length}
                unreadQueries={unreadForShipment.queries}
                unreadFeedback={unreadForShipment.feedback}
                onQueryClick={() => document.getElementById('shipment-queries')?.scrollIntoView({ behavior: 'smooth' })}
                onFeedbackClick={() => document.getElementById('shipment-comments')?.scrollIntoView({ behavior: 'smooth' })}
              />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Main Details Section - Left (7/12) */}
        <Grid item xs={12} lg={7}>
          <Stack spacing={4}>
            {/* Shipment Basic Details */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: '#FFF' }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Description sx={{ color: '#01A3DA' }} /> MISSION SPECIFICATIONS
              </Typography>
              <Grid container spacing={3}>
                {detailItems.slice(0, 14).map((item, idx) => (
                  <Grid item xs={12} sm={6} key={idx}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F8F9FA', border: '1px solid transparent', '&:hover': { borderColor: 'divider', bgcolor: '#FFF' }, transition: 'all 0.2s' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}>
                        {item.label}
                      </Typography>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ color: 'primary.main', display: 'flex', opacity: 0.8 }}>
                          {item.icon}
                        </Box>
                        <Typography variant="body1" fontWeight={item.isActivityStatus ? 800 : 600} color="text.primary">
                          {item.value}
                        </Typography>
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Clearance History */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: '#FFF' }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AssignmentTurnedIn sx={{ color: '#01A3DA' }} /> CLEARANCE LOG
              </Typography>
              {clearanceHistory.length === 0 ? (
                <Alert severity="info" variant="outlined" sx={{ borderRadius: 3, borderStyle: 'dashed' }}>
                  No clearance history recorded yet.
                </Alert>
              ) : (
                <Stack spacing={2.5}>
                  {clearanceHistory.slice().reverse().map((entry) => (
                    <Box 
                      key={entry.id} 
                      sx={{ 
                        p: 3, 
                        borderRadius: 3, 
                        bgcolor: '#FFF', 
                        border: '1px solid', 
                        borderColor: 'divider',
                        position: 'relative',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateX(4px)', borderColor: 'primary.main' }
                      }}
                    >
                      <Stack direction="row" spacing={3} alignItems="flex-start">
                        <Box sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: '12px', 
                          bgcolor: entry.status === 'completed' ? alpha('#4CAF50', 0.1) : alpha('#01A3DA', 0.1),
                          color: entry.status === 'completed' ? '#4CAF50' : '#01A3DA',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {entry.status === 'completed' ? <Done /> : <PlayArrow />}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" justifyContent="space-between" mb={1}>
                            <Typography variant="subtitle1" fontWeight={800}>{entry.clearance_activity_name || 'Unknown Activity'}</Typography>
                            <Chip 
                              label={entry.status.toUpperCase()} 
                              size="small" 
                              sx={{ fontWeight: 800, fontSize: '0.65rem', borderRadius: 1 }} 
                            />
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: entry.notes ? 'normal' : 'italic' }}>
                            {entry.notes || 'No detailed log provided for this stage.'}
                          </Typography>
                          <Stack direction="row" spacing={3}>
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <PersonOutline fontSize="inherit" /> {entry.updater_name || 'System Operator'}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <AccessTime fontSize="inherit" /> {format(new Date(entry.started_at), 'MMM dd, yyyy • HH:mm')}
                            </Typography>
                          </Stack>
                        </Box>
                        {isStaff && (
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              const activity = clearanceActivities.find(a => a.id === entry.clearance_activity_id)
                              if (activity) handleOpenStatusDialog(activity)
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        </Grid>

        {/* Support Sections - Right (5/12) */}
        <Grid item xs={12} lg={5}>
          <Stack spacing={4}>
            {/* Tracking Timeline */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: '#F8F9FA' }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Timeline sx={{ color: '#01A3DA' }} /> MISSION TIMELINE
              </Typography>
              {timeline.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Awaiting initial tracking telemetry.
                </Typography>
              ) : (
                <Box sx={{ position: 'relative', pl: 3 }}>
                  <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, bgcolor: 'divider' }} />
                  <Stack spacing={4}>
                    {timeline.slice().reverse().map((event, idx) => (
                      <Box key={idx} sx={{ position: 'relative' }}>
                        <Box sx={{ 
                          position: 'absolute', 
                          left: -32, 
                          top: 4, 
                          width: 14, 
                          height: 14, 
                          borderRadius: '50%', 
                          bgcolor: idx === 0 ? 'primary.main' : 'divider',
                          border: '3px solid #F8F9FA',
                          zIndex: 1
                        }} />
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {normaliseStatusLabel(event.status)}
                          </Typography>
                          {event.location && (
                            <Typography variant="caption" color="primary.main" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <LocationOn fontSize="inherit" /> {event.location.toUpperCase()}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>{event.notes}</Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ mt: 1.5, display: 'block' }}>
                            {format(new Date(event.timestamp), 'MMM dd, HH:mm')}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>

            {/* Queries — structured official queries + shipment comments */}
            <Paper id="shipment-queries" elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: '#FFF', overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800}>
                      Queries
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Official structured queries for this consignment
                    </Typography>
                  </Box>
                  <ResourceAlertBadges
                    queries={shipment?.open_query_count}
                    unreadQueries={unreadForShipment.queries}
                  />
                </Stack>
              </Box>

              <Box sx={{ p: 3 }}>
                <ShipmentQueries 
                  shipmentId={shipmentId} 
                  isAdmin={isStaff} 
                  user={user} 
                />
              </Box>
            </Paper>

            {/* Field Staff Assignments - Moved to smaller card */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: '#FFF' }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security color="primary" sx={{ fontSize: 20 }} /> FIELD STAFF
              </Typography>
              {activityAssignments.length === 0 ? (
                <Typography variant="body2" color="text.disabled">No field staff active.</Typography>
              ) : (
                <Stack spacing={2}>
                  {activityAssignments.map((assignment) => (
                    <Box key={assignment.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F8F9FA' }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 800 }}>
                          {assignment.user_name?.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" fontWeight={800} display="block">{assignment.user_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{assignment.clearance_activity_name}</Typography>
                        </Box>
                        <Chip label={assignment.status} size="small" variant="outlined" sx={{ fontSize: '0.6rem', fontWeight: 900, height: 18 }} />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* Internal Comments & Feedback - Footing Section (Full Width) */}
      <Box sx={{ mt: 6 }}>
        <Paper id="shipment-comments" elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: '#000000', color: '#FFF' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
            <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ChatBubbleOutline sx={{ color: '#01A3DA' }} /> COMMUNICATION HUB
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={`${comments.length} Messages`} sx={{ bgcolor: alpha('#FFF', 0.1), color: '#FFF', fontWeight: 700 }} />
              <ResourceAlertBadges unreadFeedback={unreadForShipment.feedback} />
            </Stack>
          </Stack>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Box sx={{ maxHeight: 500, overflowY: 'auto', pr: 2 }}>
                {comments.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8, opacity: 0.5 }}>
                    <ChatBubbleOutline sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="body1">No internal logs or feedback recorded for this mission.</Typography>
                  </Box>
                ) : (
                  <Stack spacing={3}>
                    {comments.map((comment) => (
                      <Box key={comment.id} sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha('#FFF', 0.05), border: '1px solid', borderColor: alpha('#FFF', 0.1) }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Avatar 
                            src={comment.author?.photo} 
                            sx={{ width: 40, height: 40, bgcolor: comment.author?.role === 'client' ? 'secondary.main' : 'primary.main' }}
                          >
                            {comment.author?.name?.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" justifyContent="space-between" mb={1}>
                              <Typography variant="subtitle2" fontWeight={800}>
                                {comment.author?.name}
                                <Chip 
                                  label={comment.author?.role?.toUpperCase()} 
                                  size="small" 
                                  sx={{ ml: 1.5, height: 18, fontSize: '0.65rem', fontWeight: 900, bgcolor: alpha('#FFF', 0.1), color: '#FFF' }} 
                                />
                              </Typography>
                              <Typography variant="caption" sx={{ color: alpha('#FFF', 0.4) }}>
                                {formatDistanceToNow(new Date(comment.created_at))} ago
                              </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ lineHeight: 1.6, opacity: 0.9 }}>
                              {comment.content}
                            </Typography>
                            <Stack direction="row" spacing={2} mt={2}>
                              <Button 
                                size="small" 
                                startIcon={<Reply />} 
                                sx={{ color: '#01A3DA', fontWeight: 700, fontSize: '0.75rem' }}
                                onClick={() => setReplyTo(comment)}
                              >
                                REPLY
                              </Button>
                              {(isAdmin || (user && comment.user_id === user.id)) && (
                                <IconButton size="small" sx={{ color: alpha('#F44336', 0.6) }} onClick={() => handleDeleteComment(comment.id)}>
                                  <DeleteOutline fontSize="small" />
                                </IconButton>
                              )}
                            </Stack>
                          </Box>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ position: 'sticky', top: 24 }}>
                <Typography variant="body2" sx={{ mb: 2, color: alpha('#FFF', 0.6), fontWeight: 600 }}>
                  Log internal notes or mission feedback. These are visible to authorized personnel only.
                </Typography>
                {replyTo && (
                  <Alert 
                    severity="info" 
                    onClose={() => setReplyTo(null)}
                    sx={{ mb: 2, bgcolor: alpha('#01A3DA', 0.1), color: '#01A3DA', border: '1px solid', borderColor: alpha('#01A3DA', 0.2) }}
                  >
                    Replying to <strong>{replyTo.author?.name}</strong>
                  </Alert>
                )}
                <Stack spacing={2}>
                  <FormTextField
                    placeholder={replyTo ? "Draft a response..." : "Log a new mission update..."}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    disabled={submitting}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        bgcolor: alpha('#FFF', 0.05),
                        color: '#FFF',
                        '& fieldset': { borderColor: alpha('#FFF', 0.2) },
                        '&:hover fieldset': { borderColor: '#01A3DA' },
                      }
                    }}
                  />
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={handlePostComment}
                    disabled={!newComment.trim() || submitting}
                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
                    sx={{ py: 1.5, fontWeight: 800, bgcolor: '#01A3DA', '&:hover': { bgcolor: '#0087B5' } }}
                  >
                    {replyTo ? 'POST REPLY' : 'LOG UPDATE'}
                  </Button>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Update Status Dialog */}
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
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Update the clearance status for this activity. This will reflect in the history and tracking cockpit.
        </Alert>
        <Stack spacing={3}>
          <FormSelect
            label="Current Status"
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
              label="Activity Substate"
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
            label="Internal Notes"
            value={statusForm.notes}
            onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
            multiline
            rows={4}
            disabled={submitting}
            placeholder="Add operational notes or updates..."
          />
        </Stack>
      </FormDialog>
    </Box>
  )
}

export default ShipmentDetail
