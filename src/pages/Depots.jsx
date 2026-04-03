import React, { useState } from 'react'
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
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Alert,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Warehouse,
  LocationOn,
  CheckCircle,
  Cancel,
} from '@mui/icons-material'
import { depotsAPI } from '../services/api'
import DataTable from '../components/DataTable'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
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

const Depots = () => {
  const [submitting, setSubmitting] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingDepot, setEditingDepot] = useState(null)
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, depot: null })
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'inland',
    location: '',
    is_active: true,
  })

  const { data: depots = [], isLoading: loading, refetch: fetchDepots } = useQuery({
    queryKey: ['depotsList'],
    queryFn: async () => {
      const data = await depotsAPI.list()
      return Array.isArray(data) ? data : []
    },
    staleTime: 5 * 60 * 1000,
  })

  const handleOpenDialog = (depot = null) => {
    if (depot) {
      setEditingDepot(depot)
      setFormData({
        name: depot.name || '',
        category: depot.category || 'inland',
        location: depot.location || '',
        is_active: depot.is_active !== undefined ? depot.is_active : true,
      })
    } else {
      setEditingDepot(null)
      setFormData({
        name: '',
        category: 'inland',
        location: '',
        is_active: true,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingDepot(null)
    setFormData({
      name: '',
      category: 'inland',
      location: '',
      is_active: true,
    })
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showErrorAlert('Depot name is required')
      return
    }

    try {
      setSubmitting(true)
      showLoadingAlert('Saving depot...')

      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        location: formData.location.trim() || null,
        is_active: formData.is_active,
      }

      if (editingDepot) {
        await depotsAPI.update(editingDepot.id, payload)
        closeAlert()
        showSuccessAlert('Depot updated successfully')
      } else {
        await depotsAPI.create(payload)
        closeAlert()
        showSuccessAlert('Depot created successfully')
      }

      handleCloseDialog()
      fetchDepots()
    } catch (error) {
      closeAlert()
      const errorMessage = error.response?.data?.detail || 'Failed to save depot'
      showErrorAlert(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (depotId) => {
    const confirmed = await showConfirmDialog(
      'Delete Depot',
      'Are you sure you want to delete this depot? This action cannot be undone.',
      'warning'
    )

    if (!confirmed) return

    try {
      showLoadingAlert('Deleting depot...')
      await depotsAPI.delete(depotId)
      closeAlert()
      showSuccessAlert('Depot deleted successfully')
      fetchDepots()
    } catch (error) {
      closeAlert()
      const errorMessage = error.response?.data?.detail || 'Failed to delete depot'
      showErrorAlert(errorMessage)
    }
  }

  const handleOpenActionsMenu = (event, depot) => {
    setActionMenu({ anchorEl: event.currentTarget, depot })
  }

  const handleCloseActionsMenu = () => {
    setActionMenu({ anchorEl: null, depot: null })
  }

  const columns = [
    {
      field: 'name',
      label: 'Name',
      minWidth: 150,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOn fontSize="small" color="primary" />
          <Typography variant="body2" fontWeight={500}>
            {row.name}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'category',
      label: 'Category',
      minWidth: 120,
      render: (row) => (
        <Chip
          label={row.category.charAt(0).toUpperCase() + row.category.slice(1)}
          size="small"
          color={row.category === 'inland' ? 'primary' : 'secondary'}
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: 'location',
      label: 'Location',
      minWidth: 200,
      render: (row) => row.location || 'N/A',
    },
    {
      field: 'is_active',
      label: 'Status',
      minWidth: 100,
      render: (row) => (
        <Chip
          label={row.is_active ? 'Active' : 'Inactive'}
          size="small"
          color={row.is_active ? 'success' : 'default'}
          icon={row.is_active ? <CheckCircle /> : <Cancel />}
        />
      ),
    },
    {
      field: 'created_at',
      label: 'Created',
      minWidth: 120,
      render: (row) =>
        row.created_at ? format(new Date(row.created_at), 'MMM dd, yyyy') : 'N/A',
    },
    {
      field: 'actions',
      label: 'Actions',
      minWidth: 80,
      align: 'right',
      render: (row) => (
        <IconButton
          size="small"
          onClick={(e) => handleOpenActionsMenu(e, row)}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ]

  if (loading && depots.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Depots Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage inland and border depots
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add Depot
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={depots}
          loading={loading && depots.length > 0}
          emptyMessage="No depots found"
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <FormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={
          <Stack direction="row" spacing={2} alignItems="center">
            <Warehouse color="primary" />
            <Typography variant="h6" fontWeight={600}>
              {editingDepot ? 'Edit Depot' : 'Add New Depot'}
            </Typography>
          </Stack>
        }
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={editingDepot ? 'Update' : 'Create'}
      >
        <FormTextField
          label="Depot Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          fullWidth
          margin="normal"
        />

        <FormControl fullWidth required margin="normal">
          <InputLabel>Category</InputLabel>
          <Select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            label="Category"
          >
            <MenuItem value="inland">Inland</MenuItem>
            <MenuItem value="border">Border</MenuItem>
          </Select>
        </FormControl>

        <FormTextField
          label="Location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          fullWidth
          margin="normal"
          multiline
          rows={2}
          placeholder="e.g., Kampala, Uganda"
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select
            value={formData.is_active ? 'active' : 'inactive'}
            onChange={(e) =>
              setFormData({ ...formData, is_active: e.target.value === 'active' })
            }
            label="Status"
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </FormDialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={handleCloseActionsMenu}
      >
        <MenuItem
          onClick={() => {
            handleOpenDialog(actionMenu.depot)
            handleCloseActionsMenu()
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleDelete(actionMenu.depot.id)
            handleCloseActionsMenu()
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default Depots

