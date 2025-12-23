import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  Avatar,
  Tooltip,
  IconButton,
  MenuItem,
  Alert,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Toolbar,
} from '@mui/material'
import {
  VerifiedUser,
  Visibility,
  MoreVert,
  DeleteSweep,
  Cancel,
} from '@mui/icons-material'
import { complianceAPI, shipmentsAPI } from '../services/api'
import { toast } from 'react-toastify'
import { PageSkeleton, LoadingOverlay } from '../components/LoadingStates'
import {
  showSuccessAlert,
  showErrorAlert,
  showLoadingAlert,
  showConfirmDialog,
  closeAlert,
} from '../utils/alerts'

const Compliance = () => {
  const navigate = useNavigate()
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, shipment: null })
  const [selectedShipments, setSelectedShipments] = useState([])

  useEffect(() => {
    fetchShipmentsWithCompliance()
  }, [])

  const fetchShipmentsWithCompliance = async () => {
    try {
      setLoading(true)
      // Reduced limit for faster loading - can be increased if needed
      const data = await complianceAPI.getShipmentsWithCompliance({ limit: 50 })
      setShipments(data)
    } catch (error) {
      toast.error('Failed to load compliance data')
      console.error('Compliance fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (shipment) => {
    navigate(`/compliance/${shipment.id}`)
  }

  const openActionsMenu = Boolean(actionMenu.anchorEl)

  const handleOpenActionsMenu = (event, shipment) => {
    event.stopPropagation()
    setActionMenu({ anchorEl: event.currentTarget, shipment })
  }

  const handleCloseActionsMenu = () => {
    setActionMenu({ anchorEl: null, shipment: null })
  }

  const handleMenuView = () => {
    if (!actionMenu.shipment) return
    handleView(actionMenu.shipment)
    handleCloseActionsMenu()
  }

  const handleSelectAllShipments = (event) => {
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

  const handleBatchDeleteShipments = async () => {
    if (selectedShipments.length === 0) {
      showErrorAlert('Selection Required', 'Please select at least one shipment')
      return
    }

    const result = await showConfirmDialog(
      'Delete Shipments',
      `Are you sure you want to delete ${selectedShipments.length} shipment(s)? This will also delete all associated compliance documents. This action cannot be undone.`,
      'Yes, Delete'
    )

    if (result.isConfirmed) {
      setSubmitting(true)
      const loadingAlert = showLoadingAlert('Deleting Shipments...', 'Please wait')

      try {
        const shipmentIds = selectedShipments.map(s => s.id)
        await shipmentsAPI.batchDelete(shipmentIds)
        closeAlert()
        await showSuccessAlert('Success!', `Successfully deleted ${selectedShipments.length} shipment(s)`)
        setSelectedShipments([])
        fetchShipmentsWithCompliance()
      } catch (error) {
        closeAlert()
        showErrorAlert('Failed', error.response?.data?.detail || 'Failed to delete shipments')
      } finally {
        setSubmitting(false)
      }
    }
  }

  if (loading && shipments.length === 0) {
    return <PageSkeleton showHeader={true} showTable={true} />
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Avatar
          variant="rounded"
          sx={{
            width: 48,
            height: 48,
            bgcolor: 'primary.light',
            color: 'primary.dark',
          }}
        >
          <VerifiedUser />
        </Avatar>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 0 }}>
            Compliance Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage client documents, track compliance, and communicate with clients
          </Typography>
        </Box>
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {selectedShipments.length > 0 && (
            <Paper sx={{ mb: 2, p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Toolbar sx={{ minHeight: '48px !important', px: '0 !important' }}>
                <Typography variant="body1" sx={{ flex: 1 }}>
                  {selectedShipments.length} shipment(s) selected
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteSweep />}
                  onClick={handleBatchDeleteShipments}
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
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedShipments.length > 0 && selectedShipments.length < shipments.length}
                      checked={shipments.length > 0 && selectedShipments.length === shipments.length}
                      onChange={handleSelectAllShipments}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>Shipment</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell align="center">Total Documents</TableCell>
                  <TableCell align="center">Uploaded</TableCell>
                  <TableCell align="center">Missing</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
            <TableBody>
              {shipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No shipments found
                  </TableCell>
                </TableRow>
              ) : (
                shipments.map((shipment) => (
                  <TableRow key={shipment.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedShipments.some((s) => s.id === shipment.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleSelectShipment(shipment, e.target.checked)
                        }}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {shipment.shipment_number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {shipment.origin} → {shipment.destination}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {shipment.client_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {shipment.client_company}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={shipment.total_documents} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={shipment.uploaded_documents}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={shipment.missing_documents}
                        color={shipment.missing_documents > 0 ? 'error' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={shipment.missing_documents === 0 ? 'Complete' : 'Incomplete'}
                        color={shipment.missing_documents === 0 ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenActionsMenu(e, shipment)}
                          color="primary"
                        >
                          <MoreVert />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        </>
      )}

      {/* Actions Menu */}
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
          <ListItemText primary="View" secondary="View compliance details and documents" />
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default Compliance
