import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
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
  Lock,
} from '@mui/icons-material'
import { shipmentsAPI, usersAPI, clientsAPI, depotsAPI, clearanceActivitiesAPI } from '../services/api'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import DataTable from '../components/DataTable'
import FormDialog from '../components/FormDialog'
import FormTextField from '../components/FormTextField'
import FormSelect from '../components/FormSelect'
import MissionCreateWizard from '../components/consignment/MissionCreateWizard'
import { PageSkeleton, LoadingOverlay } from '../components/LoadingStates'
import ResourceAlertBadges from '../components/ResourceAlertBadges'
import { useUnreadNotifications } from '../hooks/useNotifications'
import { indexResourceAlerts } from '../utils/notificationNavigation'
import {
  formatShipmentStatusLabel,
  shipmentStatusChipColor,
  isMissionTerminal,
  isMissionClosed,
} from '../utils/shipmentStatus'
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmDialog,
  showLoadingAlert,
  closeAlert,
} from '../utils/alerts'
import { alpha } from '@mui/material/styles'

const Shipments = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.roles?.some(r => r.name === 'admin') ?? false
  // Local UI States
  const [submitting, setSubmitting] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [openCreateWizard, setOpenCreateWizard] = useState(false)
  const [editingShipment, setEditingShipment] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [formData, setFormData] = useState({
    client_id: '',
    external_client_name: '',
    external_client_company: '',
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
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientSourceMode, setClientSourceMode] = useState('registered')
  const [selectedShipments, setSelectedShipments] = useState([])
  const [assignmentFormData, setAssignmentFormData] = useState({
    user_id: '',
    clearance_activity_ids: [],
    notes: '',
  })

  // Queries
  const { data: activityCounts = { total: 0, by_activity: {} }, refetch: fetchActivityCounts } = useQuery({
    queryKey: ['activityCounts'],
    queryFn: shipmentsAPI.getClearanceActivityCounts,
    staleTime: 30000,
  })

  const { data: clearanceActivities = [] } = useQuery({
    queryKey: ['clearanceActivitiesActive'],
    queryFn: async () => {
      const data = await clearanceActivitiesAPI.list({ is_active: true })
      return Array.isArray(data) ? data : []
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clientsApproved'],
    queryFn: async () => {
      const data = await clientsAPI.list({ status: 'approved', limit: 100 })
      return Array.isArray(data) ? data : (data?.items || [])
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: depots = [] } = useQuery({
    queryKey: ['depotsActive'],
    queryFn: async () => {
      const data = await depotsAPI.list({ is_active: true })
      return Array.isArray(data) ? data : (data?.items || [])
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: fieldStaffUsers = [] } = useQuery({
    queryKey: ['fieldStaff'],
    queryFn: async () => {
      const data = await usersAPI.list({ role: 'field-staff', limit: 100 })
      return Array.isArray(data) ? data : (data?.items || [])
    },
    staleTime: 5 * 60 * 1000,
    enabled: isAdmin,
  })

  // Dependent Main Shipments Query
  const { data: shipments = [], isLoading: loading, refetch: fetchShipments } = useQuery({
    queryKey: ['shipmentsList', tabValue, clearanceActivities],
    queryFn: async () => {
      const sortedActivities = [...clearanceActivities].sort((a, b) => (a.priority || 0) - (b.priority || 0))
      const selectedActivityId = tabValue === 0
        ? undefined
        : (sortedActivities.length > 0 && sortedActivities[tabValue - 1]
          ? sortedActivities[tabValue - 1].id
          : undefined)

      const data = await shipmentsAPI.list({
        clearance_activity_id: selectedActivityId,
        limit: 100,
      })
      const sorted = (Array.isArray(data) ? data : (data?.items || [])).sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || 0)
        const dateB = new Date(b.updated_at || b.created_at || 0)
        return dateB - dateA
      })
      fetchActivityCounts() // update counts asynchronously
      return sorted
    },
    enabled: clearanceActivities.length > 0 || tabValue === 0, // only fetch when ready
    placeholderData: keepPreviousData,
  })

  const { data: unreadNotifications = [] } = useUnreadNotifications()
  const resourceAlerts = useMemo(
    () => indexResourceAlerts(unreadNotifications),
    [unreadNotifications]
  )

  useEffect(() => {
    setSelectedShipments([])
  }, [tabValue])

  const isShipmentSelected = (id) => selectedShipments.some((s) => s.id === id)

  const handleSelectShipment = (shipment, checked) => {
    if (checked) {
      setSelectedShipments((prev) =>
        prev.some((s) => s.id === shipment.id) ? prev : [...prev, shipment]
      )
    } else {
      setSelectedShipments((prev) => prev.filter((s) => s.id !== shipment.id))
    }
  }

  const handleSelectAllShipments = (event) => {
    if (event.target.checked) {
      setSelectedShipments([...shipments])
    } else {
      setSelectedShipments([])
    }
  }

  const handleOpenDialog = () => {
    setOpenCreateWizard(true)
  }

  const handleCreateWizardComplete = () => {
    fetchShipments()
    window.dispatchEvent(new Event('notifications:updated'))
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingShipment(null)
  }

  const shipmentDetailPath = (id) => `/dashboard/shipments/${id}`

  const populateEditForm = (shipment) => {
    const client = clients.find((c) => String(c.id) === String(shipment.client_id)) || null
    setSelectedClient(client)
    setClientSourceMode(shipment.client_id ? 'registered' : 'external')
    setFormData({
      client_id: shipment.client_id || '',
      external_client_name: shipment.external_client_name || shipment.client_name || '',
      external_client_company: shipment.external_client_company || shipment.client_company || '',
      origin: shipment.origin || '',
      destination: shipment.destination || '',
      shipper_name: shipment.shipper_name || '',
      consignee_name: shipment.consignee_name || '',
      consignee_email: shipment.consignee_email || '',
      consignee_phone: shipment.consignee_phone || '',
      container_number: shipment.container_number || '',
      cargo_description: shipment.cargo_description || '',
      estimated_cost: shipment.estimated_cost ?? '',
    })
  }

  const normalizePayload = () => {
    const payload = {}
    if (editingShipment) {
      // Client link is fixed after creation
    } else if (clientSourceMode === 'registered') {
      if (selectedClient?.id) {
        payload.client_id = selectedClient.id
      } else if (formData.client_id) {
        payload.client_id = parseInt(formData.client_id, 10)
      } else {
        throw new Error('Client is required')
      }
    } else {
      const externalName = formData.external_client_name?.trim()
      if (!externalName) {
        throw new Error('Client name is required for walk-in missions')
      }
      payload.external_client_name = externalName
      if (formData.external_client_company?.trim()) {
        payload.external_client_company = formData.external_client_company.trim()
      }
    }

    payload.origin = formData.origin?.trim() || ''
    payload.destination = formData.destination?.trim() || ''
    payload.consignee_name = formData.consignee_name?.trim() || ''

    if (formData.shipper_name?.trim()) payload.shipper_name = formData.shipper_name.trim()
    if (formData.consignee_email?.trim()) payload.consignee_email = formData.consignee_email.trim()
    if (formData.consignee_phone?.trim()) payload.consignee_phone = formData.consignee_phone.trim()
    if (formData.container_number?.trim()) payload.container_number = formData.container_number.trim()
    if (formData.cargo_description?.trim()) payload.cargo_description = formData.cargo_description.trim()

    if (formData.estimated_cost) {
      const cost = parseFloat(formData.estimated_cost)
      if (!isNaN(cost)) payload.estimated_cost = cost
    }

    return payload
  }

  const handleSubmit = async () => {
    if (!editingShipment) return

    if (!formData.origin?.trim() || !formData.destination?.trim() || !formData.consignee_name?.trim()) {
      showErrorAlert('Validation Error', 'Please fill in all required fields')
      return
    }

    setSubmitting(true)
    showLoadingAlert('Updating Mission...')

    try {
      const payload = normalizePayload()
      delete payload.client_id
      await shipmentsAPI.update(editingShipment.id, payload)
      closeAlert()
      await showSuccessAlert('Updated', 'Consignment has been updated successfully')
      handleCloseDialog()
      fetchShipments()
    } catch (error) {
      closeAlert()
      showErrorAlert('Error', error.response?.data?.detail || 'Failed to save mission')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenActionsMenu = (event, shipment) => {
    event.stopPropagation()
    setActionMenu({ anchorEl: event.currentTarget, shipment })
  }

  const handleCloseActionsMenu = () => {
    setActionMenu({ anchorEl: null, shipment: null })
  }

  const closeMenuAndRun = (fn) => {
    const shipment = actionMenu.shipment
    handleCloseActionsMenu()
    if (!shipment?.id) return
    fn(shipment)
  }

  const handleCancelShipment = async () => {
    const shipment = actionMenu.shipment
    if (!shipment?.id) return
    const shipmentId = shipment.id
    handleCloseActionsMenu()

    const result = await showConfirmDialog(
      'Cancel Mission',
      'Are you sure you want to terminate this consignment mission?',
      'Yes, Cancel Mission'
    )
    if (result.isConfirmed) {
      showLoadingAlert('Processing cancellation...')
      try {
        await shipmentsAPI.cancel(shipmentId, 'Cancelled via admin cockpit')
        closeAlert()
        await showSuccessAlert('Cancelled', 'Mission has been terminated')
        fetchShipments()
      } catch (error) {
        closeAlert()
        showErrorAlert('Failed', error.response?.data?.detail || 'Cancellation failed')
      }
    }
  }

  const handleCloseMission = async () => {
    const shipment = actionMenu.shipment
    if (!shipment?.id) return
    const shipmentId = shipment.id
    handleCloseActionsMenu()

    if (isMissionTerminal(shipment.status)) {
      showErrorAlert('Unavailable', 'This mission is already closed or cancelled')
      return
    }

    const result = await showConfirmDialog(
      'Close Mission',
      'Close this consignment mission? Clients and field staff will see it as Mission closed. Operational updates will stop.',
      'Yes, Close Mission'
    )
    if (result.isConfirmed) {
      showLoadingAlert('Closing mission...')
      try {
        await shipmentsAPI.closeMission(shipmentId, 'Closed via admin cockpit')
        closeAlert()
        await showSuccessAlert('Closed', 'Mission has been closed')
        fetchShipments()
      } catch (error) {
        closeAlert()
        showErrorAlert('Failed', error.response?.data?.detail || 'Could not close mission')
      }
    }
  }

  const handleDeleteConsignment = async () => {
    const shipment = actionMenu.shipment
    if (!shipment?.id) return
    const shipmentId = shipment.id
    const shipmentNumber = shipment.shipment_number
    handleCloseActionsMenu()

    const result = await showConfirmDialog(
      'Delete consignment',
      `Permanently delete ${shipmentNumber}? This removes the consignment, documents, assignments, queries, and the original request. This cannot be undone.`,
      'Yes, delete permanently'
    )
    if (!result.isConfirmed) return
    showLoadingAlert('Deleting consignment...')
    try {
      await shipmentsAPI.delete(shipmentId)
      closeAlert()
      await showSuccessAlert('Deleted', 'Consignment has been removed')
      setSelectedShipments((prev) => prev.filter((s) => s.id !== shipmentId))
      fetchShipments()
    } catch (error) {
      closeAlert()
      showErrorAlert('Failed', error.response?.data?.detail || 'Could not delete consignment')
    }
  }

  const handleBatchDelete = async () => {
    if (selectedShipments.length === 0) return
    const result = await showConfirmDialog(
      'Purge Records',
      `Delete ${selectedShipments.length} selected records permanently?`,
      'Confirm Purge'
    )
    if (result.isConfirmed) {
      setSubmitting(true)
      showLoadingAlert('Purging records...')
      try {
        await shipmentsAPI.batchDelete(selectedShipments.map(s => s.id))
        closeAlert()
        await showSuccessAlert('Purged', 'Records removed successfully')
        setSelectedShipments([])
        fetchShipments()
      } catch (error) {
        closeAlert()
        showErrorAlert('Failed', 'Cleanup failed')
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleOpenAssignmentsDialog = async (shipment) => {
    setEditingShipment(shipment)
    try {
      const assignments = await shipmentsAPI.listClearanceActivityAssignments(shipment.id)
      setActivityAssignments(assignments || [])
    } catch (error) {
      setActivityAssignments([])
    }
    setAssignmentFormData({ user_id: '', clearance_activity_ids: [], notes: '' })
    setOpenAssignmentsDialog(true)
  }

  const handleCreateAssignment = async () => {
    try {
      showLoadingAlert('Assigning field staff...')
      const result = await shipmentsAPI.assignMultipleActivitiesToUser(editingShipment.id, {
        user_id: assignmentFormData.user_id,
        clearance_activity_ids: assignmentFormData.clearance_activity_ids,
        notes: assignmentFormData.notes || null,
      })
      closeAlert()
      await showSuccessAlert('Assigned', `Staff assigned to ${result.created_count} activities`)
      const assignments = await shipmentsAPI.listClearanceActivityAssignments(editingShipment.id)
      setActivityAssignments(assignments || [])
      setAssignmentFormData({ user_id: '', clearance_activity_ids: [], notes: '' })
    } catch (error) {
      closeAlert()
      showErrorAlert('Assignment Failed', error.response?.data?.detail || 'Failed to assign staff')
    }
  }

  const handleDeleteAssignment = async (assignmentId) => {
    const confirmed = await showConfirmDialog('Remove Assignment', 'Withdraw staff from this activity?')
    if (confirmed.isConfirmed) {
      try {
        showLoadingAlert('Withdrawing staff...')
        await shipmentsAPI.deleteClearanceActivityAssignment(assignmentId)
        closeAlert()
        const assignments = await shipmentsAPI.listClearanceActivityAssignments(editingShipment.id)
        setActivityAssignments(assignments || [])
      } catch (error) {
        closeAlert()
        showErrorAlert('Failed', 'Action failed')
      }
    }
  }

  if (loading && shipments.length === 0) {
    return <PageSkeleton showHeader={true} showTable={true} />
  }

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
            <Stack direction="row" spacing={2.5} alignItems="center">
              <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: 'primary.main', border: '2px solid rgba(255,255,255,0.2)' }}>
                <Map sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={800} gutterBottom>Consignment Deck</Typography>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>Governance of global freight missions and clearance checkpoints</Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenDialog}
              sx={{ bgcolor: 'white', color: 'black', '&:hover': { bgcolor: alpha('#FFF', 0.8) }, fontWeight: 700, px: 3, py: 1.2, borderRadius: 2 }}
            >
              Start New Mission
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Tabs / Filter Navigation */}
      <Paper elevation={0} sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { py: 3, px: 4, minHeight: 80, textTransform: 'none', borderRight: '1px solid', borderColor: 'divider' },
            '& .Mui-selected': { color: 'primary.main', fontWeight: 800 },
            '& .MuiTabs-indicator': { height: 4, borderRadius: '4px 4px 0 0' }
          }}
        >
          <Tab
            label={
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" fontWeight={700}>Global Fleet</Typography>
                <Typography variant="caption" color="text.secondary">{activityCounts.total} missions</Typography>
              </Box>
            }
          />
          {clearanceActivities
            .sort((a, b) => (a.priority || 0) - (b.priority || 0))
            .map((activity) => (
              <Tab
                key={activity.id}
                label={
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" fontWeight={700}>{activity.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{activityCounts.by_activity?.[activity.id] || 0} active</Typography>
                  </Box>
                }
              />
            ))}
        </Tabs>
      </Paper>

      {/* Batch Actions */}
      {selectedShipments.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'primary.main', color: 'white', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" fontWeight={700}>{selectedShipments.length} missions selected for cleanup</Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained" color="error" onClick={handleBatchDelete} sx={{ fontWeight: 800 }}>Purge Selected</Button>
            <IconButton size="small" onClick={() => setSelectedShipments([])} sx={{ color: 'white' }}><Cancel /></IconButton>
          </Stack>
        </Paper>
      )}

      {/* Main Table Deck */}
      <Box sx={{ position: 'relative' }}>
        <DataTable
          columns={[
            {
              field: 'select',
              headerName: '',
              stopRowClick: true,
              headerPadding: 'checkbox',
              cellPadding: 'checkbox',
              headerRender: () => (
                <Checkbox
                  indeterminate={
                    selectedShipments.length > 0 && selectedShipments.length < shipments.length
                  }
                  checked={shipments.length > 0 && selectedShipments.length === shipments.length}
                  onChange={handleSelectAllShipments}
                  size="small"
                  inputProps={{ 'aria-label': 'Select all consignments' }}
                />
              ),
              render: (row) => (
                <Checkbox
                  checked={isShipmentSelected(row.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation()
                    handleSelectShipment(row, e.target.checked)
                  }}
                  size="small"
                  inputProps={{ 'aria-label': `Select ${row.shipment_number}` }}
                />
              ),
            },
            {
              field: 'shipment_number',
              headerName: 'Mission ID',
              render: (row) => {
                const unread = resourceAlerts[row.id] || {}
                return (
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                      {row.is_overdue && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />}
                      <Typography variant="body2" fontWeight={800}>{row.shipment_number}</Typography>
                      <Chip
                        size="small"
                        label={formatShipmentStatusLabel(row.status)}
                        color={shipmentStatusChipColor(row.status)}
                        sx={{ fontWeight: 800, fontSize: '0.65rem', textTransform: 'capitalize' }}
                      />
                    </Stack>
                    <ResourceAlertBadges
                      queries={row.open_query_count}
                      feedback={row.comment_count}
                      unreadQueries={unread.queries}
                      unreadFeedback={unread.feedback}
                      onQueryClick={() => navigate(`${shipmentDetailPath(row.id)}?tab=queries`)}
                      onFeedbackClick={() => navigate(`${shipmentDetailPath(row.id)}?tab=comments`)}
                    />
                  </Stack>
                )
              }
            },
            { field: 'origin', headerName: 'Origin' },
            { field: 'destination', headerName: 'Terminal' },
            { field: 'consignee_name', headerName: 'Consignee' },
            {
              field: 'created_at',
              headerName: 'Date',
              render: (row) => (
                <Typography variant="body2" fontWeight={500}>
                  {row.created_at ? format(new Date(row.created_at), 'MMM dd, yyyy') : '—'}
                </Typography>
              ),
            },
            {
              field: 'status',
              headerName: 'Checkpoint',
              render: (row) => (
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={row.current_clearance_activity_name?.toUpperCase() || 'NOT STARTED'}
                    size="small"
                    variant={row.current_clearance_activity_name ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: row.current_clearance_activity_name ? 'primary.light' : 'transparent', color: row.current_clearance_activity_name ? 'primary.main' : 'text.disabled' }}
                  />
                  {row.current_clearance_substate && (
                    <Chip label={row.current_clearance_substate} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.6rem' }} />
                  )}
                </Stack>
              )
            },
            {
              field: 'actions',
              headerName: 'Actions',
              align: 'right',
              stopRowClick: true,
              render: (row) => (
                <Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenActionsMenu(e, row)}
                    color="primary"
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>
              )
            }
          ]}
          data={shipments}
          onRowClick={(row) => navigate(shipmentDetailPath(row.id))}
          onExport={() => shipmentsAPI.exportExcel()}
          onRefresh={fetchShipments}
        />
      </Box>

      {/* Mission create wizard */}
      <MissionCreateWizard
        open={openCreateWizard}
        onClose={() => setOpenCreateWizard(false)}
        onComplete={handleCreateWizardComplete}
        clients={clients}
        depots={depots}
      />

      {/* Mission edit dialog */}
      <FormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title="Refine Mission Details"
        onSubmit={handleSubmit}
        loading={submitting}
        maxWidth="md"
      >
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {editingShipment && !editingShipment.client_id && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Walk-in mission — not linked to a registered client account ({formData.external_client_name || 'external contact'}).
              </Alert>
            </Grid>
          )}

          {editingShipment?.client_id ? (
            <Grid item xs={12}>
              <Autocomplete
                options={clients}
                getOptionLabel={(opt) => `${opt.name} (${opt.company_name})`}
                value={selectedClient}
                disabled
                renderInput={(p) => <TextField {...p} label="Client entity" />}
              />
            </Grid>
          ) : editingShipment ? (
            <>
              <Grid item xs={12} sm={6}>
                <FormTextField
                  label="Client / account name"
                  value={formData.external_client_name}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormTextField
                  label="Company (optional)"
                  value={formData.external_client_company}
                  disabled
                />
              </Grid>
            </>
          ) : null}

          <Grid item xs={12} sm={6}>
            <FormSelect
              label="Departure Depot"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              options={depots.map(d => ({ value: d.name, label: d.name }))}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormSelect
              label="Arrival Depot"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              options={depots.map(d => ({ value: d.name, label: d.name }))}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField
              label="Shipper name (optional)"
              value={formData.shipper_name}
              onChange={(e) => setFormData({ ...formData, shipper_name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField
              label="Container number"
              value={formData.container_number}
              onChange={(e) => setFormData({ ...formData, container_number: e.target.value })}
              placeholder="e.g. MSKU1234567"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField
              label="Consignee Name"
              value={formData.consignee_name}
              onChange={(e) => setFormData({ ...formData, consignee_name: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField
              label="Consignee Phone"
              value={formData.consignee_phone}
              onChange={(e) => setFormData({ ...formData, consignee_phone: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormTextField
              label="Consignee Email"
              type="email"
              value={formData.consignee_email}
              onChange={(e) => setFormData({ ...formData, consignee_email: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <FormTextField
              label="Mission Cargo Details"
              multiline
              rows={3}
              value={formData.cargo_description}
              onChange={(e) => setFormData({ ...formData, cargo_description: e.target.value })}
              required
            />
          </Grid>
        </Grid>
      </FormDialog>

      {/* Mission Action Control Menu */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={handleCloseActionsMenu}
      >
        <MenuItem
          onClick={() =>
            closeMenuAndRun((shipment) => navigate(shipmentDetailPath(shipment.id)))
          }
        >
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText primary="Mission Cockpit" secondary="Full governance view" />
        </MenuItem>
        <MenuItem
          onClick={() =>
            closeMenuAndRun((shipment) => {
              setEditingShipment(shipment)
              populateEditForm(shipment)
              setOpenDialog(true)
            })
          }
        >
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText primary="Edit Logs" secondary="Modify mission parameters" />
        </MenuItem>
        <MenuItem
          onClick={() => closeMenuAndRun((shipment) => handleOpenAssignmentsDialog(shipment))}
        >
          <ListItemIcon><Assignment fontSize="small" /></ListItemIcon>
          <ListItemText primary="Delegate Staff" secondary="Assign field staff to checkpoints" />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleCloseMission}
          disabled={isMissionTerminal(actionMenu.shipment?.status)}
        >
          <ListItemIcon><Lock fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText
            primary={isMissionClosed(actionMenu.shipment?.status) ? 'Mission closed' : 'Close Mission'}
            secondary="Mark consignment complete for all parties"
          />
        </MenuItem>
        <MenuItem
          onClick={handleCancelShipment}
          disabled={isMissionTerminal(actionMenu.shipment?.status)}
        >
          <ListItemIcon><Cancel fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Abort Mission" secondary="Record termination" primaryTypographyProps={{ color: 'error.main' }} />
        </MenuItem>
        {isAdmin && (
          <MenuItem onClick={handleDeleteConsignment}>
            <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
            <ListItemText
              primary="Delete consignment"
              secondary="Permanently remove all records"
              primaryTypographyProps={{ color: 'error.main' }}
            />
          </MenuItem>
        )}
      </Menu>

      {/* Staff Delegation Deck */}
      <FormDialog
        open={openAssignmentsDialog}
        onClose={() => setOpenAssignmentsDialog(false)}
        title="Checkpoint Delegation"
        submitText=""
        maxWidth="md"
      >
        <Box sx={{ mt: 1 }}>
          <Paper sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: '#F8F9FA' }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>New Assignment</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <FormSelect
                  label="Field Staff"
                  value={assignmentFormData.user_id}
                  onChange={(e) => setAssignmentFormData({ ...assignmentFormData, user_id: e.target.value })}
                  options={fieldStaffUsers.map(u => ({ value: u.id, label: u.full_name }))}
                />
              </Grid>
              <Grid item xs={12} md={7}>
                <FormControl fullWidth>
                  <InputLabel>Checkpoints</InputLabel>
                  <Select
                    multiple
                    value={assignmentFormData.clearance_activity_ids}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, clearance_activity_ids: e.target.value })}
                    label="Checkpoints"
                    renderValue={(sel) => sel.map(id => clearanceActivities.find(a => a.id === id)?.name).join(', ')}
                  >
                    {clearanceActivities.map(a => (
                      <MenuItem key={a.id} value={a.id}>
                        <Checkbox checked={assignmentFormData.clearance_activity_ids.includes(a.id)} />
                        <ListItemText primary={a.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}><Button variant="contained" fullWidth onClick={handleCreateAssignment} sx={{ py: 1.5, fontWeight: 700 }}>Deploy Staff</Button></Grid>
            </Grid>
          </Paper>

          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>Current Deployments</Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table size="small">
              <TableHead><TableRow><TableCell sx={{ fontWeight: 700 }}>Staff</TableCell><TableCell sx={{ fontWeight: 700 }}>Checkpoint</TableCell><TableCell sx={{ fontWeight: 700 }}>Status</TableCell><TableCell align="right"></TableCell></TableRow></TableHead>
              <TableBody>
                {activityAssignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell><Typography variant="body2" fontWeight={700}>{a.user_name}</Typography></TableCell>
                    <TableCell><Chip label={a.clearance_activity_name} size="small" variant="outlined" /></TableCell>
                    <TableCell><Chip label={a.status.toUpperCase()} size="small" sx={{ fontWeight: 800, fontSize: '0.6rem' }} /></TableCell>
                    <TableCell align="right"><IconButton size="small" color="error" onClick={() => handleDeleteAssignment(a.id)}><Delete fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </FormDialog>
    </Box>
  )
}

export default Shipments
