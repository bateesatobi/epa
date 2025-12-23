import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  AlertTitle,
  Autocomplete,
  Checkbox,
  Toolbar,
} from '@mui/material'
import {
  Add,
  Edit,
  Visibility,
  Cancel,
  CheckCircle,
  MoreVert,
  PendingActions,
  FlightTakeoff,
  DoneAll,
  ListAlt,
  Map,
  Phone,
  Inventory2,
  AssignmentTurnedIn,
  LocalPolice,
  Description,
  Assignment,
  People,
  PersonAdd,
  Delete,
  LocalShipping,
  Email,
  Business,
  LocationOn,
  Description as DescriptionIcon,
  DeleteSweep,
  Timeline,
  History,
} from '@mui/icons-material'
import { shipmentsAPI, usersAPI, clientsAPI, depotsAPI, clearanceActivitiesAPI } from '../services/api'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import DataTable from '../components/DataTable'
import FormDialog from '../components/FormDialog'
import FormTextField from '../components/FormTextField'
import FormSelect from '../components/FormSelect'
import { PageSkeleton, LoadingOverlay } from '../components/LoadingStates'
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmDialog,
  showLoadingAlert,
  closeAlert,
} from '../utils/alerts'

const Shipments = () => {
  const navigate = useNavigate()
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingShipment, setEditingShipment] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [formData, setFormData] = useState({
    client_id: '',
    origin: '',
    destination: '',
    shipper_name: '',
    consignee_name: '',
    consignee_email: '',
    consignee_phone: '',
    container_number: '',
    cargo_description: '',
    estimated_cost: '',
  })
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, shipment: null })
  const [openAssignmentsDialog, setOpenAssignmentsDialog] = useState(false)
  const [activityAssignments, setActivityAssignments] = useState([])
  const [fieldStaffUsers, setFieldStaffUsers] = useState([])
  const [clients, setClients] = useState([])
  const [depots, setDepots] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedShipments, setSelectedShipments] = useState([])
  const [clearanceActivities, setClearanceActivities] = useState([])
  const [activityCounts, setActivityCounts] = useState({ total: 0, by_activity: {} })
  const [assignmentFormData, setAssignmentFormData] = useState({
    user_id: '',
    clearance_activity_ids: [], // Changed to array for multiple selection
    notes: '',
  })

  useEffect(() => {
    fetchClearanceActivities()
    fetchFieldStaffUsers()
    fetchClients()
    fetchDepots()
    fetchActivityCounts()
  }, [])

  useEffect(() => {
    // Fetch shipments when tab changes or when activities are first loaded
    if (clearanceActivities.length > 0 || tabValue === 0) {
      fetchShipments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue, clearanceActivities.length])

  const fetchActivityCounts = async () => {
    try {
      const data = await shipmentsAPI.getClearanceActivityCounts()
      setActivityCounts(data)
    } catch (error) {
      console.error('Failed to fetch activity counts:', error)
    }
  }

  const fetchClearanceActivities = async () => {
    try {
      const data = await clearanceActivitiesAPI.list({ is_active: true })
      setClearanceActivities(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load clearance activities')
      setClearanceActivities([])
    }
  }
  
  const fetchClients = async () => {
    try {
      const data = await clientsAPI.list({ status: 'approved', limit: 100 })
      setClients(data.items || [])
    } catch (error) {
      console.error('Failed to load clients')
    }
  }

  const fetchDepots = async () => {
    try {
      const data = await depotsAPI.list({ is_active: true })
      // Handle both array response and object with items property
      const depotsList = Array.isArray(data) ? data : (data?.items || [])
      console.log('Loaded depots:', depotsList.length, 'depots')
      setDepots(depotsList)
    } catch (error) {
      console.error('Failed to load depots:', error)
      toast.error('Failed to load depots')
      setDepots([])
    }
  }

  const fetchFieldStaffUsers = async () => {
    try {
      const data = await usersAPI.list({ role: 'field-staff', limit: 100 })
      setFieldStaffUsers(data.items || [])
    } catch (error) {
      console.error('Failed to load field staff users')
    }
  }

  const fetchShipments = async () => {
    try {
      setLoading(true)
      // tabValue 0 = All, 1+ = specific clearance activity
      // Activities are sorted by priority, so tabValue 1 = first activity, tabValue 2 = second, etc.
      const sortedActivities = [...clearanceActivities].sort((a, b) => (a.priority || 0) - (b.priority || 0))
      const selectedActivityId = tabValue === 0 
        ? undefined 
        : (sortedActivities.length > 0 && sortedActivities[tabValue - 1] 
          ? sortedActivities[tabValue - 1].id 
          : undefined)
      
      const data = await shipmentsAPI.list({
        clearance_activity_id: selectedActivityId,
        limit: 50, // Reduced for faster loading
      })
      // Ensure latest shipments are at the top (sort by updated_at, then created_at)
      const sorted = (data.items || []).sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || 0)
        const dateB = new Date(b.updated_at || b.created_at || 0)
        return dateB - dateA // Descending order (newest first)
      })
      setShipments(sorted)
      
      // Refresh activity counts after fetching shipments
      fetchActivityCounts()
    } catch (error) {
      toast.error('Failed to load shipments')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = () => {
    setEditingShipment(null)
    setSelectedClient(null)
    setFormData({
      client_id: '',
      origin: '',
      destination: '',
      shipper_name: '',
      consignee_name: '',
      consignee_email: '',
      consignee_phone: '',
      container_number: '',
      cargo_description: '',
      estimated_cost: '',
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const normalizePayload = () => {
    // Build payload with only the fields expected by the backend schema
    const payload = {}
    
    // Handle client_id - use selectedClient if available, otherwise parse from formData
    if (selectedClient && selectedClient.id) {
      payload.client_id = selectedClient.id
    } else if (formData.client_id) {
      const parsed = parseInt(formData.client_id, 10)
      if (isNaN(parsed)) {
        throw new Error('Invalid client ID')
      }
      payload.client_id = parsed
    } else {
      throw new Error('Client is required')
    }
    
    // Required fields
    payload.origin = formData.origin ? formData.origin.trim() : ''
    payload.destination = formData.destination ? formData.destination.trim() : ''
    payload.consignee_name = formData.consignee_name ? formData.consignee_name.trim() : ''
    
    // Optional string fields - only include if they have values
    if (formData.invoice_number && formData.invoice_number.trim()) {
      payload.invoice_number = formData.invoice_number.trim()
    }
    if (formData.route && formData.route.trim()) {
      payload.route = formData.route.trim()
    }
    if (formData.shipper_name && formData.shipper_name.trim()) {
      payload.shipper_name = formData.shipper_name.trim()
    }
    if (formData.consignee_email && formData.consignee_email.trim()) {
      payload.consignee_email = formData.consignee_email.trim()
    }
    if (formData.consignee_phone && formData.consignee_phone.trim()) {
      payload.consignee_phone = formData.consignee_phone.trim()
    }
    if (formData.container_number && formData.container_number.trim()) {
      payload.container_number = formData.container_number.trim()
    }
    if (formData.cargo_description && formData.cargo_description.trim()) {
      payload.cargo_description = formData.cargo_description.trim()
    }
    
    // Numeric fields - only include if they have valid values
    if (formData.estimated_cost) {
      const cost = parseFloat(formData.estimated_cost)
      if (!isNaN(cost) && cost > 0) {
        payload.estimated_cost = cost
      }
    }
    if (formData.cargo_weight) {
      const weight = parseFloat(formData.cargo_weight)
      if (!isNaN(weight) && weight > 0) {
        payload.cargo_weight = weight
      }
    }
    if (formData.cargo_volume) {
      const volume = parseFloat(formData.cargo_volume)
      if (!isNaN(volume) && volume > 0) {
        payload.cargo_volume = volume
      }
    }
    if (formData.cargo_value) {
      const value = parseFloat(formData.cargo_value)
      if (!isNaN(value) && value > 0) {
        payload.cargo_value = value
      }
    }
    
    return payload
  }

  const handleSubmit = async () => {
    if (!editingShipment && !formData.client_id) {
      showErrorAlert('Validation Error', 'Please select a client')
      return
    }
    
    // Validate required fields (trim to check for empty strings)
    if (!formData.origin || !formData.origin.trim()) {
      showErrorAlert('Validation Error', 'Please select an origin depot')
      return
    }
    if (!formData.destination || !formData.destination.trim()) {
      showErrorAlert('Validation Error', 'Please select a destination depot')
      return
    }
    if (!formData.consignee_name || !formData.consignee_name.trim()) {
      showErrorAlert('Validation Error', 'Please enter the consignee name')
      return
    }

    setSubmitting(true)
    const loadingAlert = showLoadingAlert(
      editingShipment ? 'Updating Consignment...' : 'Creating Consignment...',
      'Please wait while we process your request'
    )

    let payload = null
    try {
      payload = normalizePayload()
      console.log('Shipment payload:', payload) // Debug log
      if (editingShipment) {
        // Update existing - don't change client_id
        delete payload.client_id
        await shipmentsAPI.update(editingShipment.id, payload)
        closeAlert()
        await showSuccessAlert('Success!', 'Consignment updated successfully')
      } else {
        // Create new
        await shipmentsAPI.create(payload)
        closeAlert()
        await showSuccessAlert('Success!', 'Consignment created successfully')
        window.dispatchEvent(new Event('notifications:updated'))
      }
      handleCloseDialog()
      setEditingShipment(null)
      fetchShipments()
    } catch (error) {
      closeAlert()
      const errorDetail = error.response?.data?.detail
      let errorMessage = 'Failed to save shipment'
      
      if (errorDetail) {
        if (typeof errorDetail === 'string') {
          errorMessage = errorDetail
        } else if (Array.isArray(errorDetail)) {
          // Pydantic validation errors
          errorMessage = errorDetail.map(err => `${err.loc?.join('.')}: ${err.msg}`).join(', ')
        } else if (errorDetail.message) {
          errorMessage = errorDetail.message
        }
      }
      
      console.error('Shipment creation error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        payload: payload,
        formData: formData
      })
      showErrorAlert('Operation Failed', errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleView = (shipment) => {
    navigate(`/shipments/${shipment.id}`)
  }

  const handleStatusUpdate = async (shipmentId, status) => {
    try {
      await shipmentsAPI.updateStatus(shipmentId, { status, notes: 'Status updated' })
      toast.success('Status updated')
      fetchShipments()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleCancel = async (shipmentId) => {
    const result = await showConfirmDialog(
      'Cancel Consignment',
      'Are you sure you want to cancel this consignment? This action cannot be undone.',
      'Yes, Cancel Consignment'
    )
    if (result.isConfirmed) {
      const loadingAlert = showLoadingAlert('Cancelling Consignment...', 'Please wait')
      try {
        await shipmentsAPI.cancel(shipmentId, 'Cancelled by admin')
        closeAlert()
        await showSuccessAlert('Consignment Cancelled', 'The consignment has been successfully cancelled')
        fetchShipments()
      } catch (error) {
        closeAlert()
        showErrorAlert('Failed', error.response?.data?.detail || 'Failed to cancel consignment')
      }
    }
  }

  const openActionsMenu = Boolean(actionMenu.anchorEl)

  const handleOpenActionsMenu = (event, shipment) => {
    event.stopPropagation()
    setActionMenu({ anchorEl: event.currentTarget, shipment })
  }

  const handleCloseActionsMenu = () => {
    setActionMenu({ anchorEl: null, shipment: null })
  }

  const getNextStatus = (currentStatus) => {
    if (currentStatus === 'pending') return 'in_transit'
    if (currentStatus === 'in_transit') return 'delivered'
    return null
  }

  const handleAdvanceStatus = async () => {
    if (!actionMenu.shipment) return
    const nextStatus = getNextStatus(actionMenu.shipment.status)
    if (!nextStatus) return
    await handleStatusUpdate(actionMenu.shipment.id, nextStatus)
    handleCloseActionsMenu()
  }

  const handleCancelShipment = async () => {
    if (!actionMenu.shipment) return
    handleCloseActionsMenu()
    handleCancel(actionMenu.shipment.id)
  }

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedShipments([...shipments])
    } else {
      setSelectedShipments([])
    }
  }

  const handleSelectShipment = (shipment, checked) => {
    if (checked) {
      setSelectedShipments([...selectedShipments, shipment])
    } else {
      setSelectedShipments(selectedShipments.filter(s => s.id !== shipment.id))
    }
  }

  const handleBatchDelete = async () => {
    if (selectedShipments.length === 0) {
      showErrorAlert('Selection Required', 'Please select at least one shipment')
      return
    }

    const result = await showConfirmDialog(
      'Delete Consignments',
      `Are you sure you want to delete ${selectedShipments.length} consignment(s)? This action cannot be undone.`,
      'Yes, Delete'
    )

    if (result.isConfirmed) {
      setSubmitting(true)
      const loadingAlert = showLoadingAlert('Deleting Consignments...', 'Please wait')

      try {
        const shipmentIds = selectedShipments.map(s => s.id)
        await shipmentsAPI.batchDelete(shipmentIds)
        closeAlert()
        await showSuccessAlert('Success!', `Successfully deleted ${selectedShipments.length} consignment(s)`)
        setSelectedShipments([])
        fetchShipments()
      } catch (error) {
        closeAlert()
        showErrorAlert('Failed', error.response?.data?.detail || 'Failed to delete consignments')
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleMenuView = () => {
    if (!actionMenu.shipment) return
    handleView(actionMenu.shipment)
    handleCloseActionsMenu()
  }

  const handleMenuEdit = () => {
    if (!actionMenu.shipment) return
    handleEdit(actionMenu.shipment)
    handleCloseActionsMenu()
  }

  const handleOpenAssignmentsDialog = async (shipment) => {
    setEditingShipment(shipment)
    try {
      const assignments = await shipmentsAPI.listClearanceActivityAssignments(shipment.id)
      setActivityAssignments(assignments || [])
    } catch (error) {
      console.error('Failed to load assignments:', error)
      setActivityAssignments([])
    }
    setAssignmentFormData({
      user_id: '',
      clearance_activity_ids: [],
      notes: '',
    })
    setOpenAssignmentsDialog(true)
  }

  const handleCreateAssignment = async () => {
    if (!assignmentFormData.user_id || !assignmentFormData.clearance_activity_ids || assignmentFormData.clearance_activity_ids.length === 0) {
      showErrorAlert('Missing Fields', 'Please select a user and at least one clearance activity')
      return
    }
    try {
      showLoadingAlert('Creating assignments...')
      // Use the new endpoint for assigning multiple activities to a single user
      const result = await shipmentsAPI.assignMultipleActivitiesToUser(editingShipment.id, {
        user_id: assignmentFormData.user_id,
        clearance_activity_ids: assignmentFormData.clearance_activity_ids,
        notes: assignmentFormData.notes || null,
      })
      closeAlert()
      if (result.skipped_count > 0) {
        showSuccessAlert(
          'Assignments Created',
          `Created ${result.created_count} assignment(s). ${result.skipped_count} duplicate(s) were skipped.`
        )
      } else {
        showSuccessAlert('Assignments Created', `Successfully assigned ${result.created_count} activity/activities to the field staff`)
      }
      const assignments = await shipmentsAPI.listClearanceActivityAssignments(editingShipment.id)
      setActivityAssignments(assignments || [])
      setAssignmentFormData({
        user_id: '',
        clearance_activity_ids: [],
        notes: '',
      })
    } catch (error) {
      closeAlert()
      showErrorAlert('Failed', error.response?.data?.detail || 'Failed to create assignments')
    }
  }

  const handleDeleteAssignment = async (assignmentId) => {
    const confirmed = await showConfirmDialog(
      'Delete Assignment',
      'Are you sure you want to delete this assignment?',
      'warning'
    )
    if (confirmed) {
      try {
        showLoadingAlert('Deleting assignment...')
        await shipmentsAPI.deleteClearanceActivityAssignment(assignmentId)
        closeAlert()
        showSuccessAlert('Assignment Deleted', 'The assignment has been removed')
        const assignments = await shipmentsAPI.listClearanceActivityAssignments(editingShipment.id)
        setActivityAssignments(assignments || [])
      } catch (error) {
        closeAlert()
        showErrorAlert('Failed', error.response?.data?.detail || 'Failed to delete assignment')
      }
    }
  }

  const handleUpdateAssignmentStatus = async (assignmentId, status) => {
    try {
      showLoadingAlert('Updating status...')
      await shipmentsAPI.updateClearanceActivityAssignment(assignmentId, { status })
      closeAlert()
      showSuccessAlert('Status Updated', 'Assignment status has been updated')
      const assignments = await shipmentsAPI.listClearanceActivityAssignments(editingShipment.id)
      setActivityAssignments(assignments || [])
    } catch (error) {
      closeAlert()
      showErrorAlert('Failed', error.response?.data?.detail || 'Failed to update status')
    }
  }

  const handleEdit = async (shipment) => {
    setEditingShipment(shipment)
    // Find the client object for the selected client
    const client = clients.find(c => c.id === shipment.client_id)
    setSelectedClient(client || null)
    setFormData({
      origin: shipment.origin || '',
      destination: shipment.destination || '',
      shipper_name: shipment.shipper_name || '',
      consignee_name: shipment.consignee_name || '',
      consignee_email: shipment.consignee_email || '',
      consignee_phone: shipment.consignee_phone || '',
      container_number: shipment.container_number || '',
      cargo_description: shipment.cargo_description || '',
      estimated_cost: shipment.estimated_cost || '',
    })
    setOpenDialog(true)
  }

  const handleExportExcel = async () => {
    try {
      // Export all shipments (no filter by activity for export)
      const response = await shipmentsAPI.exportExcel()
      
      // Decode base64 and download
      const byteCharacters = atob(response.data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], {
        type: response.mime_type,
      })
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = response.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Excel file downloaded successfully')
    } catch (error) {
      toast.error('Failed to export Excel file')
      console.error(error)
    }
  }

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
      default:
        return 'default'
    }
  }

  // Show skeleton on initial load
  if (loading && shipments.length === 0) {
    return <PageSkeleton showHeader={true} showTable={true} />
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            variant="rounded"
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'primary.light',
              color: 'primary.dark',
              boxShadow: '0 8px 20px rgba(25,118,210,0.25)',
            }}
          >
            <Map />
          </Avatar>
          <Box>
        <Typography variant="h4" fontWeight="bold">
          Consignment Management
        </Typography>
            <Typography variant="body2" color="text.secondary">
              Create, monitor, and action freight missions
            </Typography>
          </Box>
        </Stack>
        <Tooltip title="Create a new consignment" arrow>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenDialog}>
          New Consignment
        </Button>
        </Tooltip>
      </Box>

      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontWeight: 600,
            },
          }}
          variant="scrollable"
          allowScrollButtonsMobile
          scrollButtons="auto"
        >
          <Tab 
            icon={<ListAlt fontSize="small" />} 
            iconPosition="start" 
            label={
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25 }}>
                <Typography variant="body2" fontWeight={600}>
                  All Consignments
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  {activityCounts.total || shipments.length} total
                </Typography>
              </Box>
            }
            sx={{ px: 3, minWidth: 140 }}
          />
          {clearanceActivities
            .sort((a, b) => (a.priority || 0) - (b.priority || 0))
            .map((activity, index) => {
              // Use backend count for accurate statistics
              const activityShipmentCount = activityCounts.by_activity?.[activity.id] || 0
              
              return (
                <Tab
                  key={activity.id}
                  icon={<Timeline fontSize="small" />}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {activity.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {activityShipmentCount} consignment{activityShipmentCount !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  }
                  sx={{ px: 2, minWidth: 140 }}
                />
              )
            })}
        </Tabs>
      </Paper>

      {selectedShipments.length > 0 && (
        <Paper sx={{ mb: 2, p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <Toolbar sx={{ minHeight: '48px !important', px: '0 !important' }}>
            <Typography variant="body1" sx={{ flex: 1 }}>
              {selectedShipments.length} consignment(s) selected
            </Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteSweep />}
              onClick={handleBatchDelete}
              disabled={submitting}
              size="small"
            >
              Delete Selected
            </Button>
            <IconButton
              size="small"
              onClick={() => setSelectedShipments([])}
              sx={{ ml: 1, color: 'inherit' }}
            >
              <Cancel />
            </IconButton>
          </Toolbar>
        </Paper>
      )}

      <Box sx={{ position: 'relative' }}>
        {loading && shipments.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              borderRadius: 2,
              backdropFilter: 'blur(2px)',
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <DataTable
          columns={[
          {
            field: 'select',
            headerName: '',
            render: (row) => (
              <Checkbox
                checked={selectedShipments.some((s) => s.id === row.id)}
                onChange={(e) => {
                  e.stopPropagation()
                  handleSelectShipment(row, e.target.checked)
                }}
                size="small"
                onClick={(e) => e.stopPropagation()}
              />
            ),
          },
          {
            field: 'shipment_number',
            headerName: 'Consignment #',
            render: (row) => (
              <Stack direction="row" spacing={1} alignItems="center">
                {row.is_overdue && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'error.main',
                      flexShrink: 0,
                    }}
                  />
                )}
                <Typography 
                  variant="body2" 
                  fontWeight="medium"
                  sx={{ color: row.is_overdue ? 'error.main' : 'inherit' }}
                >
                  {row.shipment_number}
                </Typography>
              </Stack>
            ),
          },
          {
            field: 'days_in_system',
            headerName: 'Days',
            render: (row) => (
              <Chip
                label={`${row.days_in_system || 0} day${row.days_in_system !== 1 ? 's' : ''}`}
                size="small"
                color={row.is_overdue ? 'error' : row.days_in_system > 7 ? 'warning' : 'default'}
                variant={row.is_overdue ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: row.is_overdue ? 600 : 400,
                }}
              />
            ),
          },
          { field: 'origin', headerName: 'Origin' },
          { field: 'destination', headerName: 'Destination' },
          { field: 'shipper_name', headerName: "Shipper's Name" },
          { field: 'consignee_name', headerName: 'Consignee' },
          {
            field: 'status',
            headerName: 'Status',
            render: (row) => {
              // Display the current clearance activity as the status
              if (!row.current_clearance_activity_name) {
                return (
                  <Chip
                    label="Not Started"
                    size="small"
                    variant="outlined"
                    color="default"
                  />
                )
              }
              return (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Chip
                    label={row.current_clearance_activity_name}
                    size="small"
                    color="primary"
                    variant="filled"
                    sx={{ fontWeight: 600 }}
                  />
                  {row.current_clearance_substate && (
                    <Chip
                      label={row.current_clearance_substate}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', fontWeight: 500 }}
                    />
                  )}
                </Stack>
              )
            },
          },
          {
            field: 'created_at',
            headerName: 'Created',
            render: (row) =>
              row.created_at
                ? format(new Date(row.created_at), 'MMM dd, yyyy')
                : 'N/A',
          },
          {
            field: 'actions',
            headerName: 'Actions',
            align: 'right',
            render: (row) => (
              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                <Tooltip title="View Progress History">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/shipments/${row.id}/clearance-history`)
                    }}
                    color="primary"
                  >
                    <Timeline fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Shipment actions">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenActionsMenu(e, row)
                    }}
                    color="primary"
                  >
                    <MoreVert />
                  </IconButton>
                </Tooltip>
              </Box>
            ),
          },
        ]}
        data={shipments}
        loading={loading && shipments.length === 0}
        onRowClick={handleView}
        searchable
        exportable
        onExport={handleExportExcel}
        onRefresh={fetchShipments}
      />
      </Box>

      {/* Create/Edit Dialog */}
      <FormDialog
        open={openDialog}
        onClose={() => {
          handleCloseDialog()
          setEditingShipment(null)
        }}
        title={
          editingShipment ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <LocalShipping color="primary" />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Edit Consignment
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {editingShipment.shipment_number}
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Stack direction="row" spacing={2} alignItems="center">
              <LocalShipping color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Create New Consignment
              </Typography>
            </Stack>
          )
        }
        onSubmit={handleSubmit}
        submitText={editingShipment ? 'Update Consignment' : 'Create Consignment'}
        loading={submitting}
        maxWidth="md"
      >
        <Alert severity="info" sx={{ mb: 3 }}>
          {editingShipment
            ? 'Update the consignment information below. Client cannot be changed.'
            : 'Fill in the required information to create a new consignment. A client must be selected.'}
        </Alert>
        <Stack spacing={2.5}>
          <Autocomplete
            options={clients}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option
              return `${option.name} (${option.company_name}) - ID: ${option.id}`
            }}
            value={selectedClient}
            onChange={(event, newValue) => {
              setSelectedClient(newValue)
              if (newValue && !editingShipment) {
                // Auto-fill consignee fields when creating a new shipment
                setFormData({
                  ...formData,
                  client_id: newValue.id,
                  consignee_name: newValue.name || '',
                  consignee_email: newValue.email || '',
                  consignee_phone: (newValue.telephone && newValue.telephone.trim()) ? newValue.telephone.trim() : '',
                })
              } else if (newValue) {
                // When editing, only set client_id (don't auto-fill)
                setFormData({ ...formData, client_id: newValue.id })
              } else {
                // Clear fields when client is deselected
                setFormData({
                  ...formData,
                  client_id: '',
                  consignee_name: '',
                  consignee_email: '',
                  consignee_phone: '',
                })
              }
            }}
            disabled={!!editingShipment || submitting}
            filterOptions={(options, params) => {
              const { inputValue } = params
              const filtered = options.filter((option) => {
                const searchTerm = inputValue.toLowerCase()
                return (
                  option.name?.toLowerCase().includes(searchTerm) ||
                  option.company_name?.toLowerCase().includes(searchTerm) ||
                  String(option.id).includes(searchTerm) ||
                  option.email?.toLowerCase().includes(searchTerm)
                )
              })
              return filtered
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Client"
                required
                helperText={editingShipment ? 'Client cannot be changed' : 'Search by name, company, email, or ID'}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <Business fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'primary.main',
                  },
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'primary.light',
                      color: 'primary.dark',
                      fontSize: 14,
                    }}
                  >
                    {option.name?.charAt(0) || 'C'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.company_name} • ID: {option.id}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            noOptionsText="No clients found"
            loadingText="Loading clients..."
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Origin</InputLabel>
                <Select
                  value={formData.origin}
                  onChange={(e) =>
                    setFormData({ ...formData, origin: e.target.value })
                  }
                  disabled={submitting}
                  label="Origin"
                  autoFocus
                >
                  <MenuItem value="">
                    <em>Select origin depot</em>
                  </MenuItem>
                  <MenuItem disabled>
                    <Typography variant="caption" fontWeight="bold" color="primary">
                      Inland Depots
                    </Typography>
                  </MenuItem>
                  {depots && depots.length > 0 ? (
                    depots
                      .filter((d) => (d.category && d.category.toLowerCase() === 'inland'))
                      .map((depot) => (
                        <MenuItem key={`origin-inland-${depot.id}`} value={depot.name}>
                          {depot.name} {depot.location ? `- ${depot.location}` : ''}
                        </MenuItem>
                      ))
                  ) : (
                    <MenuItem disabled>Loading depots...</MenuItem>
                  )}
                  <MenuItem disabled>
                    <Typography variant="caption" fontWeight="bold" color="secondary">
                      Border Depots
                    </Typography>
                  </MenuItem>
                  {depots && depots.length > 0 ? (
                    depots
                      .filter((d) => (d.category && d.category.toLowerCase() === 'border'))
                      .map((depot) => (
                        <MenuItem key={`origin-border-${depot.id}`} value={depot.name}>
                          {depot.name} {depot.location ? `- ${depot.location}` : ''}
                        </MenuItem>
                      ))
                  ) : (
                    <MenuItem disabled>Loading depots...</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Destination</InputLabel>
                <Select
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                  disabled={submitting}
                  label="Destination"
                >
                  <MenuItem value="">
                    <em>Select destination depot</em>
                  </MenuItem>
                  <MenuItem disabled>
                    <Typography variant="caption" fontWeight="bold" color="primary">
                      Inland Depots
                    </Typography>
                  </MenuItem>
                  {depots && depots.length > 0 ? (
                    depots
                      .filter((d) => (d.category && d.category.toLowerCase() === 'inland'))
                      .map((depot) => (
                        <MenuItem key={`dest-inland-${depot.id}`} value={depot.name}>
                          {depot.name} {depot.location ? `- ${depot.location}` : ''}
                        </MenuItem>
                      ))
                  ) : (
                    <MenuItem disabled>Loading depots...</MenuItem>
                  )}
                  <MenuItem disabled>
                    <Typography variant="caption" fontWeight="bold" color="secondary">
                      Border Depots
                    </Typography>
                  </MenuItem>
                  {depots && depots.length > 0 ? (
                    depots
                      .filter((d) => (d.category && d.category.toLowerCase() === 'border'))
                      .map((depot) => (
                        <MenuItem key={`dest-border-${depot.id}`} value={depot.name}>
                          {depot.name} {depot.location ? `- ${depot.location}` : ''}
                        </MenuItem>
                      ))
                  ) : (
                    <MenuItem disabled>Loading depots...</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField
                label="Shipper's Name"
                value={formData.shipper_name}
                onChange={(e) =>
                  setFormData({ ...formData, shipper_name: e.target.value })
                }
                disabled={submitting}
                helperText="Name of the shipper/exporter (optional)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField
                label="Consignee Name"
                value={formData.consignee_name}
                onChange={(e) =>
                  setFormData({ ...formData, consignee_name: e.target.value })
                }
                required
                disabled={submitting}
                helperText="Name of the recipient"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField
                label="Consignee Email"
                type="email"
                value={formData.consignee_email}
                onChange={(e) =>
                  setFormData({ ...formData, consignee_email: e.target.value })
                }
                disabled={submitting}
                startAdornment={<Email fontSize="small" sx={{ color: 'text.secondary' }} />}
                helperText="Email address of the consignee (optional)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField
                label="Consignee Phone"
                type="tel"
                value={formData.consignee_phone}
                onChange={(e) =>
                  setFormData({ ...formData, consignee_phone: e.target.value })
                }
                placeholder="+256700000000"
                disabled={submitting}
                startAdornment={<Phone fontSize="small" sx={{ color: 'text.secondary' }} />}
                helperText="Include country code (e.g., +2567XXXXXXXX)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField
                label="Container Number"
                value={formData.container_number}
                onChange={(e) =>
                  setFormData({ ...formData, container_number: e.target.value })
                }
                disabled={submitting}
                helperText="Container/Unit number (optional)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField
                label="Estimated Cost (UGX)"
                type="number"
                value={formData.estimated_cost}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_cost: e.target.value })
                }
                disabled={submitting}
                helperText="Estimated shipping cost in UGX (optional)"
              />
            </Grid>
            <Grid item xs={12}>
              <FormTextField
                label="Cargo/Goods Description"
                multiline
                rows={3}
                value={formData.cargo_description}
                onChange={(e) =>
                  setFormData({ ...formData, cargo_description: e.target.value })
                }
                required
                disabled={submitting}
                startAdornment={<DescriptionIcon fontSize="small" sx={{ color: 'text.secondary', alignSelf: 'flex-start', mt: 1.5 }} />}
                helperText="Detailed description of the goods being shipped"
              />
            </Grid>
          </Grid>
        </Stack>
      </FormDialog>

      <Menu
        anchorEl={actionMenu.anchorEl}
        open={openActionsMenu}
        onClose={handleCloseActionsMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleMenuView}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View Details" secondary="Open shipment workspace" />
        </MenuItem>
        <MenuItem onClick={handleMenuEdit}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" secondary="Update shipment details" />
        </MenuItem>
        <MenuItem onClick={() => {
          if (actionMenu.shipment) {
            handleOpenAssignmentsDialog(actionMenu.shipment)
            handleCloseActionsMenu()
          }
        }}>
          <ListItemIcon>
            <Assignment fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Assign Clearance Activities" secondary="Assign field staff to clearance activities" />
        </MenuItem>
        <MenuItem onClick={() => {
          if (actionMenu.shipment) {
            navigate(`/shipments/${actionMenu.shipment.id}/clearance-history`)
            handleCloseActionsMenu()
          }
        }}>
          <ListItemIcon>
            <Timeline fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View Progress History" secondary="View clearance history and progress" />
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleCancelShipment}>
          <ListItemIcon>
            <Cancel fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Cancel Consignment" secondary="Stop and record cancellation" primaryTypographyProps={{ color: 'error.main' }} />
        </MenuItem>
      </Menu>

      {/* Clearance Activity Assignments Dialog */}
      <FormDialog
        open={openAssignmentsDialog}
        onClose={() => setOpenAssignmentsDialog(false)}
        title={`Clearance Activity Assignments - ${editingShipment?.shipment_number || ''}`}
        submitText=""
        cancelText="Close"
        maxWidth="md"
        showProgress={false}
      >
        <Box sx={{ mt: 1 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={500}>
              Assign field staff to clearance activities for this shipment. You can assign multiple activities to a single field staff member in one action.
            </Typography>
          </Alert>
          
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              bgcolor: 'primary.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'primary.200',
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'primary.dark' }}>
              Assign Activities to Field Staff
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a field staff member and one or more clearance activities to assign. A single field staff can be assigned multiple activities. Activities that are already assigned to other field staff will not appear in the list.
            </Typography>
            {(() => {
              const assignedActivityIds = new Set(
                activityAssignments
                  .filter(a => a.status !== 'cancelled' && a.status !== 'completed')
                  .map(a => a.clearance_activity_id)
              )
              const allActivitiesAssigned = clearanceActivities.length > 0 && 
                clearanceActivities.every(activity => assignedActivityIds.has(activity.id))
              
              if (allActivitiesAssigned) {
                return (
                  <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                    <AlertTitle>All Activities Assigned</AlertTitle>
                    <Typography variant="body2">
                      All clearance activities for this shipment have been assigned to field staff members. 
                      You can view current assignments below or reassign activities by removing existing assignments first.
                    </Typography>
                  </Alert>
                )
              }
              return null
            })()}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormSelect
                  label="Field Staff"
                  value={assignmentFormData.user_id}
                  onChange={(e) =>
                    setAssignmentFormData({ ...assignmentFormData, user_id: e.target.value })
                  }
                  options={fieldStaffUsers.map((user) => ({
                    value: user.id,
                    label: `${user.full_name || user.email}${user.email ? ` (${user.email})` : ''}`,
                  }))}
                  margin="none"
                  required
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <FormControl fullWidth margin="none" required>
                  <InputLabel>Clearance Activities (Select Multiple)</InputLabel>
                  <Select
                    multiple
                    value={assignmentFormData.clearance_activity_ids}
                    onChange={(e) => {
                      const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value
                      setAssignmentFormData({ ...assignmentFormData, clearance_activity_ids: value })
                    }}
                    label="Clearance Activities (Select Multiple)"
                    renderValue={(selected) => {
                      if (selected.length === 0) return 'Select activities...'
                      return selected
                        .map((id) => {
                          const activity = clearanceActivities.find((a) => a.id === id)
                          return activity ? `${activity.name} (P${activity.priority})` : ''
                        })
                        .filter(Boolean)
                        .join(', ')
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    {(() => {
                      // Filter out activities that are already assigned to any field staff for this shipment
                      const assignedActivityIds = new Set(
                        activityAssignments
                          .filter(a => a.status !== 'cancelled' && a.status !== 'completed')
                          .map(a => a.clearance_activity_id)
                      )
                      const availableActivities = clearanceActivities
                        .filter(activity => !assignedActivityIds.has(activity.id))
                        .sort((a, b) => (a.priority || 0) - (b.priority || 0))
                      
                      if (availableActivities.length === 0) {
                        return (
                          <MenuItem disabled>
                            <ListItemText
                              primary="All activities are already assigned"
                              secondary="No available activities to assign"
                            />
                          </MenuItem>
                        )
                      }
                      
                      return availableActivities.map((activity) => (
                        <MenuItem key={activity.id} value={activity.id}>
                          <Checkbox checked={assignmentFormData.clearance_activity_ids.indexOf(activity.id) > -1} />
                          <ListItemText
                            primary={activity.name}
                            secondary={`Priority: ${activity.priority}${activity.description ? ` - ${activity.description}` : ''}`}
                          />
                        </MenuItem>
                      ))
                    })()}
                  </Select>
                </FormControl>
                {assignmentFormData.clearance_activity_ids.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {assignmentFormData.clearance_activity_ids.map((activityId) => {
                      const activity = clearanceActivities.find((a) => a.id === activityId)
                      if (!activity) return null
                      return (
                        <Chip
                          key={activityId}
                          label={`${activity.name} (P${activity.priority})`}
                          size="small"
                          color="primary"
                          onDelete={() => {
                            setAssignmentFormData({
                              ...assignmentFormData,
                              clearance_activity_ids: assignmentFormData.clearance_activity_ids.filter((id) => id !== activityId),
                            })
                          }}
                        />
                      )
                    })}
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <FormTextField
                  label="Notes (Optional)"
                  value={assignmentFormData.notes}
                  onChange={(e) =>
                    setAssignmentFormData({ ...assignmentFormData, notes: e.target.value })
                  }
                  multiline
                  rows={2}
                  margin="none"
                  placeholder="Add any notes about these assignments..."
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PersonAdd />}
                  onClick={handleCreateAssignment}
                  disabled={!assignmentFormData.user_id || !assignmentFormData.clearance_activity_ids || assignmentFormData.clearance_activity_ids.length === 0}
                  sx={{ mt: 1, py: 1.5, borderRadius: 2 }}
                >
                  Assign {assignmentFormData.clearance_activity_ids.length > 0 ? `${assignmentFormData.clearance_activity_ids.length} ` : ''}Activity{assignmentFormData.clearance_activity_ids.length !== 1 ? 'ies' : ''}
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Current Assignments ({activityAssignments.length})
          </Typography>
          {activityAssignments.length === 0 ? (
            <Alert severity="info">No assignments yet. Create one above to assign field staff to clearance activities.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Field Staff</TableCell>
                    <TableCell>Clearance Activity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assigned</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activityAssignments.map((assignment) => (
                    <TableRow key={assignment.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {assignment.user_name?.charAt(0)?.toUpperCase() || assignment.user_email?.charAt(0)?.toUpperCase() || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {assignment.user_name || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {assignment.user_email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={assignment.clearance_activity_name || 'N/A'}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          size="small"
                          value={assignment.status}
                          onChange={(e) =>
                            handleUpdateAssignmentStatus(assignment.id, e.target.value)
                          }
                          sx={{ minWidth: 130 }}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="in_progress">In Progress</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                          <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {assignment.assigned_at
                            ? format(new Date(assignment.assigned_at), 'MMM dd, yyyy HH:mm')
                            : 'N/A'}
                        </Typography>
                        {assignment.assigner_name && (
                          <Typography variant="caption" color="text.secondary">
                            by {assignment.assigner_name}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          title="Delete assignment"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </FormDialog>

    </Box>
  )
}

export default Shipments

