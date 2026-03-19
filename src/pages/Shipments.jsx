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
import { alpha } from '@mui/material/styles'

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
    clearance_activity_ids: [],
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
    if (clearanceActivities.length > 0 || tabValue === 0) {
      fetchShipments()
    }
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
      const depotsList = Array.isArray(data) ? data : (data?.items || [])
      setDepots(depotsList)
    } catch (error) {
      console.error('Failed to load depots:', error)
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
      const sorted = (data.items || []).sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || 0)
        const dateB = new Date(b.updated_at || b.created_at || 0)
        return dateB - dateA
      })
      setShipments(sorted)
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
    const payload = {}
    if (selectedClient?.id) {
      payload.client_id = selectedClient.id
    } else if (formData.client_id) {
      payload.client_id = parseInt(formData.client_id, 10)
    } else {
      throw new Error('Client is required')
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
    if (!editingShipment && !formData.client_id) {
      showErrorAlert('Validation Error', 'Please select a client')
      return
    }
    if (!formData.origin?.trim() || !formData.destination?.trim() || !formData.consignee_name?.trim()) {
      showErrorAlert('Validation Error', 'Please fill in all required fields')
      return
    }

    setSubmitting(true)
    showLoadingAlert(editingShipment ? 'Updating Mission...' : 'Starting Mission...')

    try {
      const payload = normalizePayload()
      if (editingShipment) {
        delete payload.client_id
        await shipmentsAPI.update(editingShipment.id, payload)
        closeAlert()
        await showSuccessAlert('Updated', 'Consignment has been updated successfully')
      } else {
        await shipmentsAPI.create(payload)
        closeAlert()
        await showSuccessAlert('Success', 'New consignment mission created')
        window.dispatchEvent(new Event('notifications:updated'))
      }
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

  const handleCancelShipment = async () => {
    if (!actionMenu.shipment) return
    const shipmentId = actionMenu.shipment.id
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
        {loading && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3 }}>
            <CircularProgress color="primary" />
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
                    if (e.target.checked) setSelectedShipments([...selectedShipments, row])
                    else setSelectedShipments(selectedShipments.filter(s => s.id !== row.id))
                  }}
                  size="small"
                />
              ),
            },
            {
              field: 'shipment_number',
              headerName: 'Mission ID',
              render: (row) => (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  {row.is_overdue && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />}
                  <Typography variant="body2" fontWeight={800}>{row.shipment_number}</Typography>
                </Stack>
              )
            },
            { field: 'origin', headerName: 'Origin' },
            { field: 'destination', headerName: 'Terminal' },
            { field: 'consignee_name', headerName: 'Consignee' },
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
              render: (row) => (
                <Box>
                  <IconButton size="small" onClick={(e) => handleOpenActionsMenu(e, row)} color="primary">
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>
              )
            }
          ]}
          data={shipments}
          onRowClick={(row) => navigate(`/shipments/${row.id}`)}
          onExport={() => shipmentsAPI.exportExcel()}
          onRefresh={fetchShipments}
        />
      </Box>

      {/* Global Mission Dialog (Create/Edit) */}
      <FormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={editingShipment ? 'Refine Mission Details' : 'Initialize Mission'}
        onSubmit={handleSubmit}
        loading={submitting}
        maxWidth="md"
      >
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Autocomplete
              options={clients}
              getOptionLabel={(opt) => `${opt.name} (${opt.company_name})`}
              value={selectedClient}
              onChange={(e, v) => {
                setSelectedClient(v)
                if (v && !editingShipment) {
                  setFormData({ ...formData, client_id: v.id, consignee_name: v.name || '', consignee_email: v.email || '', consignee_phone: v.telephone || '' })
                }
              }}
              disabled={!!editingShipment}
              renderInput={(p) => <TextField {...p} label="Client Entity" required />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormSelect 
              label="Departure Depot" 
              value={formData.origin} 
              onChange={(e) => setFormData({...formData, origin: e.target.value})}
              options={depots.map(d => ({ value: d.name, label: d.name }))}
              required 
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormSelect 
              label="Arrival Depot" 
              value={formData.destination} 
              onChange={(e) => setFormData({...formData, destination: e.target.value})}
              options={depots.map(d => ({ value: d.name, label: d.name }))}
              required 
            />
          </Grid>
          <Grid item xs={12} sm={6}><FormTextField label="Consignee Name" value={formData.consignee_name} onChange={(e) => setFormData({...formData, consignee_name: e.target.value})} required /></Grid>
          <Grid item xs={12} sm={6}><FormTextField label="Consignee Phone" value={formData.consignee_phone} onChange={(e) => setFormData({...formData, consignee_phone: e.target.value})} /></Grid>
          <Grid item xs={12}><FormTextField label="Mission Cargo Details" multiline rows={3} value={formData.cargo_description} onChange={(e) => setFormData({...formData, cargo_description: e.target.value})} required /></Grid>
        </Grid>
      </FormDialog>

      {/* Mission Action Control Menu */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={handleCloseActionsMenu}
      >
        <MenuItem onClick={() => { navigate(`/shipments/${actionMenu.shipment.id}`); handleCloseActionsMenu(); }}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText primary="Mission Cockpit" secondary="Full governance view" />
        </MenuItem>
        <MenuItem onClick={() => { setEditingShipment(actionMenu.shipment); setOpenDialog(true); handleCloseActionsMenu(); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText primary="Edit Logs" secondary="Modify mission parameters" />
        </MenuItem>
        <MenuItem onClick={() => { handleOpenAssignmentsDialog(actionMenu.shipment); handleCloseActionsMenu(); }}>
          <ListItemIcon><Assignment fontSize="small" /></ListItemIcon>
          <ListItemText primary="Delegate Staff" secondary="Assign field staff to checkpoints" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleCancelShipment}>
          <ListItemIcon><Cancel fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Abort Mission" secondary="Record termination" primaryTypographyProps={{ color: 'error.main' }} />
        </MenuItem>
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
                  onChange={(e) => setAssignmentFormData({...assignmentFormData, user_id: e.target.value})}
                  options={fieldStaffUsers.map(u => ({ value: u.id, label: u.full_name }))}
                />
              </Grid>
              <Grid item xs={12} md={7}>
                <FormControl fullWidth>
                  <InputLabel>Checkpoints</InputLabel>
                  <Select
                    multiple
                    value={assignmentFormData.clearance_activity_ids}
                    onChange={(e) => setAssignmentFormData({...assignmentFormData, clearance_activity_ids: e.target.value})}
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
