import React, { useState, useEffect } from 'react'
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
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const data = await clearanceActivitiesAPI.list()
      setActivities(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching clearance activities:', error)
      showErrorAlert('Failed to fetch clearance activities')
    } finally {
      setLoading(false)
    }
  }

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
      
      setActivities(updatedActivities)
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
      
      setActivities(updatedActivities)
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
    return <PageSkeleton showHeader={true} showTable={true} />
  }

  return (
    <Box>
      {loading && activities.length > 0 && (
        <LoadingOverlay message="Refreshing activities..." />
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Clearance Activities Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage shipment clearance stages and their order. Drag or use arrows to reorder.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          Add Activity
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
                        label={`#${activity.priority}`}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 600, mb: 0.5 }}
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
                        <Typography variant="h6" fontWeight={600}>
                          {activity.name}
                        </Typography>
                        <Chip
                          label={activity.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={activity.is_active ? 'success' : 'default'}
                          icon={activity.is_active ? <CheckCircle /> : <Cancel />}
                          sx={{ ml: 'auto' }}
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
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
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
