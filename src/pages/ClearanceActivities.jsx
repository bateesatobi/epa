import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Select,
  FormControl,
  InputLabel,
  TextField,
  Card,
  CardContent,
  Divider,
  Tooltip,
  CircularProgress,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  CheckCircle,
  Cancel,
  Timeline,
  ArrowUpward,
  ArrowDownward,
  DragHandle,
} from '@mui/icons-material'
import { clearanceActivitiesAPI } from '../services/api'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import FormDialog from '../components/FormDialog'
import FormTextField from '../components/FormTextField'
import { PageSkeleton, LoadingOverlay } from '../components/LoadingStates'
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmDialog,
  showLoadingAlert,
  closeAlert,
} from '../utils/alerts'

const ClearanceActivities = () => {
  const [loadingLocal, setLoadingLocal] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, activity: null })
  
  const [formData, setFormData] = useState({
    name: '',
    priority: 1,
    description: '',
    substates: [],
    is_active: true,
  })

  const [substateInput, setSubstateInput] = useState('')

  const { data: rawActivities = [], isLoading: loading, refetch: fetchActivities } = useQuery({
    queryKey: ['clearanceActivitiesList'],
    queryFn: async () => {
      const data = await clearanceActivitiesAPI.list()
      return Array.isArray(data) ? data : []
    },
    staleTime: 5 * 60 * 1000,
  })

  // To support state mutations before refetch resolves, we keep a local sync 
  // or we can simply map the query data downstream. We'll map query data downstream,
  // except for drag reordering which overrides the UI optimistically.
  const [optimisticActivities, setOptimisticActivities] = useState(null)
  
  const activities = optimisticActivities || rawActivities

  const handleOpenDialog = (activity = null) => {
    if (activity) {
      setEditingActivity(activity)
      setFormData({
        name: activity.name || '',
        priority: activity.priority || 1,
        description: activity.description || '',
        substates: activity.substates || [],
        is_active: activity.is_active !== undefined ? activity.is_active : true,
      })
    } else {
      setEditingActivity(null)
      // Get next available priority
      const maxPriority = activities.length > 0 
        ? Math.max(...activities.map(a => a.priority || 0))
        : 0
      setFormData({
        name: '',
        priority: maxPriority + 1,
        description: '',
        substates: [],
        is_active: true,
      })
    }
    setSubstateInput('')
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingActivity(null)
    setFormData({
      name: '',
      priority: 1,
      description: '',
      substates: [],
      is_active: true,
    })
    setSubstateInput('')
  }

  const handleAddSubstate = () => {
    if (substateInput.trim() && !formData.substates.includes(substateInput.trim())) {
      setFormData({
        ...formData,
        substates: [...formData.substates, substateInput.trim()],
      })
      setSubstateInput('')
    }
  }

  const handleRemoveSubstate = (substate) => {
    setFormData({
      ...formData,
      substates: formData.substates.filter(s => s !== substate),
    })
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showErrorAlert('Activity name is required')
      return
    }

    if (!formData.priority || formData.priority < 1) {
      showErrorAlert('Priority must be a positive number')
      return
    }

    try {
      setSubmitting(true)
      showLoadingAlert('Saving clearance activity...')

      const payload = {
        name: formData.name.trim(),
        priority: formData.priority,
        description: formData.description.trim() || null,
        substates: formData.substates.length > 0 ? formData.substates : null,
        is_active: formData.is_active,
      }

      if (editingActivity) {
        await clearanceActivitiesAPI.update(editingActivity.id, payload)
        closeAlert()
        showSuccessAlert('Clearance activity updated successfully')
      } else {
        await clearanceActivitiesAPI.create(payload)
        closeAlert()
        showSuccessAlert('Clearance activity created successfully')
      }

      handleCloseDialog()
      fetchActivities()
    } catch (error) {
      closeAlert()
      const errorMessage = error.response?.data?.detail || 'Failed to save clearance activity'
      showErrorAlert(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleMoveUp = async (activity) => {
    if (activity.priority <= 1) return // Already at the top
    
    try {
      setReordering(true)
      showLoadingAlert('Reordering activities...')
      
      const newPosition = activity.priority - 1
      const updatedActivities = await clearanceActivitiesAPI.reorder(activity.id, newPosition)
      
      setOptimisticActivities(updatedActivities)
      await fetchActivities()
      setOptimisticActivities(null)
      closeAlert()
      showSuccessAlert('Activity moved up successfully')
    } catch (error) {
      closeAlert()
      const errorMessage = error.response?.data?.detail || 'Failed to reorder activity'
      showErrorAlert(errorMessage)
    } finally {
      setReordering(false)
    }
  }

  const handleMoveDown = async (activity) => {
    if (activity.priority >= activities.length) return // Already at the bottom
    
    try {
      setReordering(true)
      showLoadingAlert('Reordering activities...')
      
      const newPosition = activity.priority + 1
      const updatedActivities = await clearanceActivitiesAPI.reorder(activity.id, newPosition)
      
      setOptimisticActivities(updatedActivities)
      await fetchActivities()
      setOptimisticActivities(null)
      closeAlert()
      showSuccessAlert('Activity moved down successfully')
    } catch (error) {
      closeAlert()
      const errorMessage = error.response?.data?.detail || 'Failed to reorder activity'
      showErrorAlert(errorMessage)
    } finally {
      setReordering(false)
    }
  }

  const handleDelete = async (activityId) => {
    const confirmed = await showConfirmDialog(
      'Delete Clearance Activity',
      'Are you sure you want to delete this clearance activity? This action cannot be undone.',
      'warning'
    )

    if (!confirmed) return

    try {
      showLoadingAlert('Deleting clearance activity...')
      await clearanceActivitiesAPI.delete(activityId)
      closeAlert()
      showSuccessAlert('Clearance activity deleted successfully')
      fetchActivities()
    } catch (error) {
      closeAlert()
      const errorMessage = error.response?.data?.detail || 'Failed to delete clearance activity'
      showErrorAlert(errorMessage)
    }
  }

  const handleOpenActionsMenu = (event, activity) => {
    setActionMenu({ anchorEl: event.currentTarget, activity })
  }

  const handleCloseActionsMenu = () => {
    setActionMenu({ anchorEl: null, activity: null })
  }

  if (loading && activities.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#FFFFFF', minHeight: '100vh' }}>
      {loading && activities.length > 0 && (
        <LoadingOverlay message="Refreshing operations..." />
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#000', letterSpacing: '-0.02em', mb: 1 }}>
            Clearance Protocol
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, maxWidth: 600 }}>
            Define and sequencer the operational checkpoints required for successful consignment clearance. 
            Adjust priorities to reorder the global shipment workflow.
          </Typography>
        </Box>
        <Button
          variant="contained"
          disableElevation
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            borderRadius: 2, textTransform: 'none', fontWeight: 600,
            bgcolor: '#01A3DA', px: 3, py: 1,
            '&:hover': { bgcolor: '#0088b8' }
          }}
        >
          Add Protocol Stage
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Loading activities...</Typography>
          </Box>
        ) : activities.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No clearance activities found</Typography>
          </Box>
        ) : (
          <Box>
            {activities.map((activity, index) => (
              <Card
                key={activity.id}
                sx={{
                  borderRadius: 0,
                  borderBottom: index < activities.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Priority Badge */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: 60,
                      }}
                    >
                      <Chip
                        label={`${activity.priority}`}
                        size="small"
                        sx={{ 
                          fontWeight: 700, mb: 1, 
                          bgcolor: 'rgba(1, 163, 218, 0.08)', color: '#01A3DA',
                          borderRadius: '6px'
                        }}
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Tooltip title="Move up">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleMoveUp(activity)}
                              disabled={reordering || activity.priority <= 1}
                              sx={{ p: 0.5 }}
                            >
                              <ArrowUpward fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Move down">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleMoveDown(activity)}
                              disabled={reordering || activity.priority >= activities.length}
                              sx={{ p: 0.5 }}
                            >
                              <ArrowDownward fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Drag Handle Icon */}
                    <DragHandle sx={{ color: 'text.secondary', cursor: 'grab' }} />

                    {/* Activity Details */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Timeline fontSize="small" color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#000' }}>
                          {activity.name}
                        </Typography>
                        <Chip
                          label={activity.is_active ? 'Active' : 'Archived'}
                          size="small"
                          sx={{ 
                            ml: 'auto', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                            bgcolor: activity.is_active ? 'rgba(1, 163, 218, 0.08)' : '#F1F5F9',
                            color: activity.is_active ? '#01A3DA' : 'text.disabled',
                            textTransform: 'uppercase'
                          }}
                        />
                      </Box>
                      
                      {activity.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {activity.description}
                        </Typography>
                      )}

                      {activity.substates && activity.substates.length > 0 && (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
                          {activity.substates.map((substate, idx) => (
                            <Chip
                              key={idx}
                              label={substate}
                              size="small"
                              sx={{ 
                                fontSize: '0.75rem', fontWeight: 500, bgcolor: 'transparent',
                                border: '1px solid #E2E8F0', borderRadius: '4px'
                              }}
                            />
                          ))}
                        </Stack>
                      )}

                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Created: {activity.created_at ? format(new Date(activity.created_at), 'MMM dd, yyyy') : 'N/A'}
                      </Typography>
                    </Box>

                    {/* Actions Menu */}
                    <IconButton
                      size="small"
                      onClick={(e) => handleOpenActionsMenu(e, activity)}
                      disabled={reordering}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <FormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={
          <Stack direction="row" spacing={2} alignItems="center">
            <Timeline color="primary" />
            <Typography variant="h6" fontWeight={600}>
              {editingActivity ? 'Edit Clearance Activity' : 'Add New Clearance Activity'}
            </Typography>
          </Stack>
        }
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={editingActivity ? 'Update' : 'Create'}
      >
        <FormTextField
          label="Activity Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          fullWidth
          margin="normal"
        />

        <FormTextField
          label="Priority"
          type="number"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
          required
          fullWidth
          margin="normal"
          inputProps={{ min: 1 }}
          helperText="Lower numbers indicate earlier stages in the clearance process"
        />

        <FormTextField
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          fullWidth
          margin="normal"
          multiline
          rows={3}
        />

        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Substates (Optional)
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Add substates for activities like UNBS (Red lane, Yellow lane, Green lane) or Release (Exit)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Enter substate name"
              value={substateInput}
              onChange={(e) => setSubstateInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddSubstate()
                }
              }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              onClick={handleAddSubstate}
              disabled={!substateInput.trim()}
            >
              Add
            </Button>
          </Box>
          {formData.substates.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
              {formData.substates.map((substate, idx) => (
                <Chip
                  key={idx}
                  label={substate}
                  onDelete={() => handleRemoveSubstate(substate)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Stack>
          )}
        </Box>

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
            handleOpenDialog(actionMenu.activity)
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
            handleDelete(actionMenu.activity.id)
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

export default ClearanceActivities
