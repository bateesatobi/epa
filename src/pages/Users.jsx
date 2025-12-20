import React, { useState, useEffect } from 'react'
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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Avatar,
  Tooltip,
  Stack,
  Checkbox,
  FormControlLabel,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Switch,
} from '@mui/material'
import {
  Add,
  Edit,
  Block,
  CheckCircle,
  Cancel,
  Group,
  AdminPanelSettings,
  LocalShipping,
  PersonOutline,
  FactCheck,
  MailOutline,
  MoreVert,
  Lock,
  LockReset,
  VpnKey,
  PersonAdd,
  Delete,
  Refresh,
  Assignment,
  BarChart,
  History,
  Work,
  Security,
  People,
  CheckBox,
  CheckBoxOutlineBlank,
  PlayArrow,
  Stop,
  Visibility,
  Person,
  Phone,
  Email,
  AccountCircle,
  PhotoCamera,
} from '@mui/icons-material'
import { usersAPI, authAPI, clientsAPI } from '../services/api'
import { toast } from 'react-toastify'
import DataTable from '../components/DataTable'
import { format } from 'date-fns'
import FormDialog from '../components/FormDialog'
import FormTextField from '../components/FormTextField'
import FormSelect from '../components/FormSelect'
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmDialog,
  showInfoAlert,
  showLoadingAlert,
  closeAlert,
} from '../utils/alerts'

const Users = () => {
  const [users, setUsers] = useState([])
  const [clients, setClients] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false)
  const [openRoleDialog, setOpenRoleDialog] = useState(false)
  // Old assignments dialog removed - now using clearance activity assignments per shipment
  const [openBulkDialog, setOpenBulkDialog] = useState(false)
  const [openStatsDialog, setOpenStatsDialog] = useState(false)
  const [openActivityLogDialog, setOpenActivityLogDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [openClientViewDialog, setOpenClientViewDialog] = useState(false)
  const [openClientApproveDialog, setOpenClientApproveDialog] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [viewingUser, setViewingUser] = useState(null)
  const [viewingClient, setViewingClient] = useState(null)
  const [editingRole, setEditingRole] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [viewingUserId, setViewingUserId] = useState(null)
  const [activityLogs, setActivityLogs] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, user: null })
  const [approvalData, setApprovalData] = useState({ status: 'approved', rejection_reason: '' })
  
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    username: '',
    password: '',
    role_ids: [],
    nin: '',
    national_id_front: null,
    national_id_back: null,
    user_photo: null,
  })

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const [roleData, setRoleData] = useState({
    name: '',
    description: '',
    permissions: '',
  })

  // Old assignmentsData removed - now using clearance activity assignments per shipment

  useEffect(() => {
    fetchUsers()
    fetchRoles()
    if (tabValue === 4) {
      fetchClients()
    }
  }, [tabValue])

  // Refetch roles when dialog opens to ensure latest data
  useEffect(() => {
    if (openDialog) {
      fetchRoles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openDialog])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await usersAPI.list()
      setUsers(data.items || [])
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const data = await usersAPI.listRoles()
      // Handle both array and object response formats
      const rolesList = Array.isArray(data) ? data : (data.items || [])
      setRoles(rolesList)
      console.log('Roles loaded:', rolesList)
    } catch (error) {
      console.error('Failed to load roles:', error)
      toast.error('Failed to load roles')
    }
  }

  const fetchClients = async () => {
    try {
      setLoading(true)
      const data = await clientsAPI.list()
      setClients(data.items || [])
    } catch (error) {
      console.error('Failed to load clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const handleViewClient = async (client) => {
    try {
      const clientData = await clientsAPI.get(client.id)
      // Fetch client documents
      try {
        const documents = await clientsAPI.getDocuments(client.id)
        clientData.documents = documents
      } catch (docError) {
        console.error('Failed to load documents:', docError)
        clientData.documents = []
      }
      setViewingClient(clientData)
      setOpenClientViewDialog(true)
    } catch (error) {
      showErrorAlert('Failed', 'Failed to load client details')
    }
  }

  const handleApproveClient = async (clientId) => {
    setSubmitting(true)
    const loadingAlert = showLoadingAlert('Processing...', 'Please wait')
    
    try {
      await clientsAPI.approve(clientId, approvalData.status, approvalData.rejection_reason || null)
      closeAlert()
      await showSuccessAlert('Success!', `Client ${approvalData.status === 'approved' ? 'approved' : 'rejected'} successfully`)
      setOpenClientApproveDialog(false)
      setApprovalData({ status: 'approved', rejection_reason: '' })
      fetchClients()
    } catch (error) {
      closeAlert()
      showErrorAlert('Failed', error.response?.data?.detail || 'Failed to update client status')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        email: user.email,
        full_name: user.full_name || '',
        phone: user.phone || '',
        username: user.username || '',
        password: '',
        role_ids: user.roles?.map((r) => r.id) || [],
        nin: user.nin || '',
        national_id_front: null, // Don't load existing images in edit mode (user can re-upload)
        national_id_back: null,
        user_photo: null,
      })
    } else {
      setEditingUser(null)
      setFormData({
        email: '',
        full_name: '',
        phone: '',
        username: '',
        password: '',
        role_ids: [],
        nin: '',
        national_id_front: null,
        national_id_back: null,
        user_photo: null,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingUser(null)
  }

  const handleSubmit = async () => {
    if (!formData.email || (!editingUser && !formData.password) || formData.role_ids.length === 0) {
      showErrorAlert('Validation Error', 'Please fill in all required fields')
      return
    }
    
    setSubmitting(true)
    const loadingAlert = showLoadingAlert(
      editingUser ? 'Updating User...' : 'Creating User...',
      'Please wait while we process your request'
    )
    
    try {
      // Convert image files to base64
      const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => {
            const base64String = reader.result.split(',')[1] // Remove data:type;base64, prefix
            resolve(base64String)
          }
          reader.onerror = (error) => reject(error)
        })
      }
      
      const submitData = { ...formData }
      
      // Convert image files to base64 if they are File objects
      if (submitData.national_id_front instanceof File) {
        submitData.national_id_front = await convertToBase64(submitData.national_id_front)
      } else if (!submitData.national_id_front) {
        delete submitData.national_id_front
      }
      
      if (submitData.national_id_back instanceof File) {
        submitData.national_id_back = await convertToBase64(submitData.national_id_back)
      } else if (!submitData.national_id_back) {
        delete submitData.national_id_back
      }
      
      if (submitData.user_photo instanceof File) {
        submitData.user_photo = await convertToBase64(submitData.user_photo)
      } else if (!submitData.user_photo) {
        delete submitData.user_photo
      }
      
      // Remove password from update if not provided
      if (editingUser && !submitData.password) {
        delete submitData.password
      }
      
      if (editingUser) {
        await usersAPI.update(editingUser.id, submitData)
        closeAlert()
        await showSuccessAlert('Success!', 'User updated successfully')
      } else {
        await usersAPI.create(submitData)
        closeAlert()
        await showSuccessAlert('Success!', 'User created successfully')
      }
      handleCloseDialog()
      fetchUsers()
    } catch (error) {
      closeAlert()
      showErrorAlert('Operation Failed', error.response?.data?.detail || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (userId) => {
    const result = await showConfirmDialog(
      'Deactivate User',
      'Are you sure you want to deactivate this user? They will not be able to access the system.',
      'Yes, Deactivate'
    )
    if (result.isConfirmed) {
      const loadingAlert = showLoadingAlert('Deactivating User...', 'Please wait')
      try {
        await usersAPI.deactivate(userId)
        closeAlert()
        await showSuccessAlert('User Deactivated', 'The user has been successfully deactivated')
        fetchUsers()
      } catch (error) {
        closeAlert()
        showErrorAlert('Failed', 'Failed to deactivate user')
      }
    }
  }

  const handleActivate = async (userId) => {
    const loadingAlert = showLoadingAlert('Activating User...', 'Please wait')
    try {
      await usersAPI.activate(userId)
      closeAlert()
      await showSuccessAlert('User Activated', 'The user has been successfully activated')
      fetchUsers()
    } catch (error) {
      closeAlert()
      showErrorAlert('Failed', 'Failed to activate user')
    }
  }

  const handleDelete = async (userId) => {
    const result = await showConfirmDialog(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone. The user will be soft-deleted.',
      'Yes, Delete',
      'Cancel'
    )
    if (result.isConfirmed) {
      const loadingAlert = showLoadingAlert('Deleting User...', 'Please wait')
      try {
        await usersAPI.delete(userId)
        closeAlert()
        await showSuccessAlert('User Deleted', 'The user has been successfully deleted')
        fetchUsers()
      } catch (error) {
        closeAlert()
        showErrorAlert('Failed', error.response?.data?.detail || 'Failed to delete user')
      }
    }
  }

  const handleOpenPasswordDialog = (user = null) => {
    setEditingUser(user)
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: '',
    })
    setOpenPasswordDialog(true)
  }

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      showErrorAlert('Validation Error', 'Passwords do not match')
      return
    }
    if (passwordData.new_password.length < 8) {
      showErrorAlert('Validation Error', 'Password must be at least 8 characters')
      return
    }
    
    setSubmitting(true)
    const loadingAlert = showLoadingAlert(
      editingUser ? 'Resetting Password...' : 'Changing Password...',
      'Please wait'
    )
    
    try {
      if (editingUser) {
        // Admin reset password
        await usersAPI.resetPassword(editingUser.id, {
          new_password: passwordData.new_password,
          send_email: false,
        })
        closeAlert()
        await showSuccessAlert('Password Reset', 'Password has been reset successfully')
      } else {
        // User change own password
        await authAPI.changePassword(
          passwordData.current_password,
          passwordData.new_password
        )
        closeAlert()
        await showSuccessAlert('Password Changed', 'Your password has been changed successfully')
      }
      setOpenPasswordDialog(false)
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (error) {
      closeAlert()
      showErrorAlert('Failed', error.response?.data?.detail || 'Failed to change password')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenRoleDialog = (role = null) => {
    setEditingRole(role)
    if (role) {
      setRoleData({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || '',
      })
    } else {
      setRoleData({
        name: '',
        description: '',
        permissions: '',
      })
    }
    setOpenRoleDialog(true)
  }

  const handleRoleSubmit = async () => {
    if (!roleData.name) {
      showErrorAlert('Validation Error', 'Role name is required')
      return
    }
    
    setSubmitting(true)
    const loadingAlert = showLoadingAlert(
      editingRole ? 'Updating Role...' : 'Creating Role...',
      'Please wait'
    )
    
    try {
      if (editingRole) {
        await usersAPI.updateRole(editingRole.id, roleData)
        closeAlert()
        await showSuccessAlert('Success!', 'Role updated successfully')
      } else {
        await usersAPI.createRole(roleData)
        closeAlert()
        await showSuccessAlert('Success!', 'Role created successfully')
      }
      setOpenRoleDialog(false)
      fetchRoles()
    } catch (error) {
      closeAlert()
      showErrorAlert('Operation Failed', error.response?.data?.detail || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRole = async (roleId) => {
    const result = await showConfirmDialog(
      'Delete Role',
      'Are you sure you want to delete this role? This action cannot be undone.',
      'Yes, Delete'
    )
    if (result.isConfirmed) {
      const loadingAlert = showLoadingAlert('Deleting Role...', 'Please wait')
      try {
        await usersAPI.deleteRole(roleId)
        closeAlert()
        await showSuccessAlert('Role Deleted', 'The role has been successfully deleted')
        fetchRoles()
      } catch (error) {
        closeAlert()
        showErrorAlert('Failed', error.response?.data?.detail || 'Failed to delete role')
      }
    }
  }

  // Old assignment handlers removed - now using clearance activity assignments per shipment
  // Assignments are managed from the Shipments page

  const handleBulkOperation = async (operation) => {
    if (selectedUsers.length === 0) {
      showErrorAlert('Selection Required', 'Please select at least one user')
      return
    }
    
    const userIds = selectedUsers.map((u) => u.id)
    let confirmTitle = ''
    let confirmText = ''
    
    switch (operation) {
      case 'activate':
        confirmTitle = 'Activate Users'
        confirmText = `Are you sure you want to activate ${userIds.length} user(s)?`
        break
      case 'deactivate':
        confirmTitle = 'Deactivate Users'
        confirmText = `Are you sure you want to deactivate ${userIds.length} user(s)?`
        break
      case 'assignRoles':
        if (formData.role_ids.length === 0) {
          showErrorAlert('Selection Required', 'Please select at least one role')
          return
        }
        confirmTitle = 'Assign Roles'
        confirmText = `Are you sure you want to assign roles to ${userIds.length} user(s)?`
        break
      default:
        return
    }
    
    const result = await showConfirmDialog(confirmTitle, confirmText, 'Yes, Proceed')
    if (!result.isConfirmed) return
    
    const loadingAlert = showLoadingAlert('Processing...', 'Please wait')
    
    try {
      let apiResult
      switch (operation) {
        case 'activate':
          apiResult = await usersAPI.bulkActivate(userIds)
          break
        case 'deactivate':
          apiResult = await usersAPI.bulkDeactivate(userIds)
          break
        case 'assignRoles':
          apiResult = await usersAPI.bulkAssignRoles(userIds, formData.role_ids)
          break
        default:
          return
      }
      closeAlert()
      await showSuccessAlert('Success!', apiResult.message || 'Operation completed successfully')
      setOpenBulkDialog(false)
      setSelectedUsers([])
      fetchUsers()
    } catch (error) {
      closeAlert()
      showErrorAlert('Operation Failed', error.response?.data?.detail || 'An error occurred')
    }
  }

  const handleViewStatistics = async () => {
    try {
      const stats = await usersAPI.getStatistics()
      setStatistics(stats)
      setOpenStatsDialog(true)
    } catch (error) {
      toast.error('Failed to load statistics')
    }
  }

  const handleViewActivityLog = async (userId) => {
    setViewingUserId(userId)
    try {
      const logs = await usersAPI.getActivityLog(userId, { limit: 50 })
      setActivityLogs(logs || [])
      setOpenActivityLogDialog(true)
    } catch (error) {
      toast.error('Failed to load activity log')
    }
  }

  const handleViewUser = (user) => {
    setViewingUser(user)
    setOpenViewDialog(true)
  }

  const handleOpenActionsMenu = (event, user) => {
    event.stopPropagation()
    setActionMenu({ anchorEl: event.currentTarget, user })
  }

  const handleCloseActionsMenu = () => {
    setActionMenu({ anchorEl: null, user: null })
  }

  const roleIconMap = {
    admin: <AdminPanelSettings sx={{ fontSize: 16 }} />,
    'field-staff': <LocalShipping sx={{ fontSize: 16 }} />,
    client: <PersonOutline sx={{ fontSize: 16 }} />,
  }

  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
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
              bgcolor: 'secondary.light',
              color: 'secondary.dark',
              boxShadow: '0 8px 22px rgba(156,39,176,0.25)',
            }}
          >
            <Group />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 0 }}>
              User Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Control account access, roles, and activation status across the fleet
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Tooltip title="View statistics" arrow>
            <Button
              variant="outlined"
              startIcon={<BarChart />}
              onClick={handleViewStatistics}
            >
              Statistics
            </Button>
          </Tooltip>
          <Tooltip title="Bulk operations" arrow>
            <span>
              <Button
                variant="outlined"
                startIcon={<People />}
                onClick={() => setOpenBulkDialog(true)}
                disabled={selectedUsers.length === 0}
              >
                Bulk ({selectedUsers.length})
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Manage roles" arrow>
            <Button
              variant="outlined"
              startIcon={<Security />}
              onClick={() => handleOpenRoleDialog()}
            >
              Roles
            </Button>
          </Tooltip>
          <Tooltip title="Add a new platform user" arrow>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Add User
            </Button>
          </Tooltip>
        </Stack>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Users" />
          <Tab label="Active" />
          <Tab label="Inactive" />
          <Tab label="Field Staff" />
          <Tab label="Clients" />
        </Tabs>
      </Paper>

      <DataTable
        columns={[
          {
            field: 'select',
            headerName: '',
            render: (row) => (
              <Checkbox
                checked={selectedUsers.some((u) => u.id === row.id)}
                onChange={(e) => {
                  e.stopPropagation()
                  if (e.target.checked) {
                    setSelectedUsers([...selectedUsers, row])
                  } else {
                    setSelectedUsers(selectedUsers.filter((u) => u.id !== row.id))
                  }
                }}
                size="small"
              />
            ),
          },
          {
            field: 'full_name',
            headerName: 'Name',
            render: (row) => {
              // Get avatar source - use user_photo if available, otherwise use initials
              const getAvatarSrc = () => {
                if (row.user_photo) {
                  // If it's already a data URL, use it directly
                  if (row.user_photo.startsWith('data:')) {
                    return row.user_photo
                  }
                  // Otherwise, assume it's base64 and create data URL
                  return `data:image/jpeg;base64,${row.user_photo}`
                }
                return null
              }
              
              const avatarSrc = getAvatarSrc()
              const initials = row.full_name?.charAt(0) || row.email?.charAt(0) || 'U'
              
              return (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar 
                    src={avatarSrc || undefined}
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      bgcolor: avatarSrc ? 'transparent' : 'primary.main' 
                    }}
                  >
                    {!avatarSrc && initials}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {row.full_name || 'N/A'}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <MailOutline sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {row.email}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              )
            },
          },
          {
            field: 'username',
            headerName: 'Username',
            render: (row) => (
              <Typography variant="body2" fontWeight="medium">
                {row.username || '—'}
              </Typography>
            ),
          },
          {
            field: 'roles',
            headerName: 'Roles',
            render: (row) => (
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {row.roles?.map((role) => (
                  <Chip
                    key={role.id}
                    icon={roleIconMap[role.name] || undefined}
                    label={role.name.replace('-', ' ').toUpperCase()}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                    color={role.name === 'admin' ? 'primary' : 'default'}
                  />
                ))}
              </Stack>
            ),
          },
          {
            field: 'is_active',
            headerName: 'Status',
            render: (row) => (
              <Chip
                icon={row.is_active ? <CheckCircle /> : <Cancel />}
                label={row.is_active ? 'Active' : 'Inactive'}
                color={row.is_active ? 'success' : 'default'}
                size="small"
              />
            ),
          },
          {
            field: 'actions',
            headerName: 'Actions',
            align: 'right',
            render: (row) => (
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Tooltip title="More actions">
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenActionsMenu(e, row)}
                    color="primary"
                  >
                    <MoreVert />
                  </IconButton>
                </Tooltip>
              </Stack>
            ),
          },
        ]}
        data={users.filter((user) => {
          if (tabValue === 1) return user.is_active
          if (tabValue === 2) return !user.is_active
          if (tabValue === 3)
            return user.roles?.some((r) => r.name === 'field-staff')
          if (tabValue === 4)
            return user.roles?.some((r) => r.name === 'client')
          return true
        })}
        loading={loading}
        searchable
        exportable
        onExport={() => toast.info('Export functionality coming soon')}
        onRefresh={fetchUsers}
      />

      {/* View User Dialog */}
      <FormDialog
        open={openViewDialog}
        onClose={() => {
          setOpenViewDialog(false)
          setViewingUser(null)
        }}
        title="User Details"
        submitText=""
        cancelText="Close"
        maxWidth="md"
        showProgress={false}
      >
        {viewingUser && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, pb: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Avatar
                src={
                  viewingUser.user_photo
                    ? viewingUser.user_photo.startsWith('data:')
                      ? viewingUser.user_photo
                      : `data:image/jpeg;base64,${viewingUser.user_photo}`
                    : undefined
                }
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: viewingUser.user_photo ? 'transparent' : 'primary.main',
                  fontSize: '2rem',
                  mr: 3,
                }}
              >
                {!viewingUser.user_photo && (viewingUser.full_name?.charAt(0) || viewingUser.email?.charAt(0) || 'U')}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  {viewingUser.full_name || 'N/A'}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Chip
                    icon={viewingUser.is_active ? <CheckCircle /> : <Cancel />}
                    label={viewingUser.is_active ? 'Active' : 'Inactive'}
                    color={viewingUser.is_active ? 'success' : 'default'}
                    size="small"
                  />
                  {viewingUser.roles?.map((role) => (
                    <Chip
                      key={role.id}
                      icon={roleIconMap[role.name] || undefined}
                      label={role.name.replace('-', ' ').toUpperCase()}
                      size="small"
                      color={role.name === 'admin' ? 'primary' : 'default'}
                    />
                  ))}
                </Stack>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                    <Email color="primary" />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                      Email Address
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingUser.email}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                    <AccountCircle color="primary" />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                      Username
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingUser.username || 'Not set'}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                    <Phone color="primary" />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                      Phone Number
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingUser.phone || 'Not provided'}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                    <Person color="primary" />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                      Full Name
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingUser.full_name || 'Not provided'}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600} mb={2}>
                    Roles & Permissions
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {viewingUser.roles?.length > 0 ? (
                      viewingUser.roles.map((role) => (
                        <Chip
                          key={role.id}
                          icon={roleIconMap[role.name] || undefined}
                          label={role.name.replace('-', ' ').toUpperCase()}
                          color={role.name === 'admin' ? 'primary' : 'default'}
                          sx={{ mb: 1 }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No roles assigned
                      </Typography>
                    )}
                  </Stack>
                </Card>
              </Grid>
              {/* Old capabilities section removed - assignments are now managed per shipment via clearance activities */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600} mb={1}>
                    Account Information
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Account Status:
                      </Typography>
                      <Chip
                        icon={viewingUser.is_active ? <CheckCircle /> : <Cancel />}
                        label={viewingUser.is_active ? 'Active' : 'Inactive'}
                        color={viewingUser.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Email Verified:
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {viewingUser.is_verified ? 'Yes' : 'No'}
                      </Typography>
                    </Box>
                    {viewingUser.created_at && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Created:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {format(new Date(viewingUser.created_at), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                    )}
                    {viewingUser.last_login && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Last Login:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {format(new Date(viewingUser.last_login), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </FormDialog>

      {/* User Create/Edit Dialog */}
      <FormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={
          editingUser ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={
                  editingUser.user_photo
                    ? editingUser.user_photo.startsWith('data:')
                      ? editingUser.user_photo
                      : `data:image/jpeg;base64,${editingUser.user_photo}`
                    : undefined
                }
                sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: editingUser.user_photo ? 'transparent' : 'primary.main' 
                }}
              >
                {!editingUser.user_photo && (editingUser.full_name?.charAt(0) || editingUser.email?.charAt(0) || 'U')}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Edit User
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {editingUser.email}
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Stack direction="row" spacing={2} alignItems="center">
              <PersonAdd color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Create New User
              </Typography>
            </Stack>
          )
        }
        onSubmit={handleSubmit}
        submitText={editingUser ? 'Update User' : 'Create User'}
        loading={submitting}
        maxWidth="sm"
      >
        <Alert severity="info" sx={{ mb: 3 }}>
          {editingUser
            ? 'Update the user information below. Email cannot be changed.'
            : 'Fill in the required information to create a new user account.'}
        </Alert>
        <Stack spacing={2.5}>
          <FormTextField
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={!!editingUser}
            autoFocus
            startAdornment={<Email fontSize="small" sx={{ color: 'text.secondary' }} />}
            helperText={editingUser ? 'Email cannot be changed' : 'User login email address'}
          />
          <FormTextField
            label="Full Name"
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
            startAdornment={<Person fontSize="small" sx={{ color: 'text.secondary' }} />}
            helperText="User's full name (optional)"
          />
          <FormTextField
            label="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            startAdornment={<AccountCircle fontSize="small" sx={{ color: 'text.secondary' }} />}
            helperText="Unique username (optional)"
          />
          <FormTextField
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            startAdornment={<Phone fontSize="small" sx={{ color: 'text.secondary' }} />}
            helperText="Contact phone number (optional)"
            placeholder="+256700000000"
          />
          <FormTextField
            label="NIN (National Identification Number)"
            value={formData.nin}
            onChange={(e) =>
              setFormData({ ...formData, nin: e.target.value })
            }
            helperText="Optional - National ID number"
          />
          {!editingUser && (
            <FormTextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              helperText="Minimum 8 characters. User will use this to login."
            />
          )}
          <Divider sx={{ my: 1 }} />
          
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Identification Photos (Optional)
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<PhotoCamera />}
                  disabled={submitting}
                  sx={{ py: 1.5 }}
                >
                  National ID Front
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, national_id_front: e.target.files?.[0] || null })}
                  />
                </Button>
                {formData.national_id_front && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Selected: {formData.national_id_front.name}
                  </Typography>
                )}
              </Box>
              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<PhotoCamera />}
                  disabled={submitting}
                  sx={{ py: 1.5 }}
                >
                  National ID Back
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, national_id_back: e.target.files?.[0] || null })}
                  />
                </Button>
                {formData.national_id_back && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Selected: {formData.national_id_back.name}
                  </Typography>
                )}
              </Box>
              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<PhotoCamera />}
                  disabled={submitting}
                  sx={{ py: 1.5 }}
                >
                  User Photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, user_photo: e.target.files?.[0] || null })}
                  />
                </Button>
                {formData.user_photo && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Selected: {formData.user_photo.name}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          <FormSelect
            label="User Roles"
            value={formData.role_ids}
            onChange={(e) =>
              setFormData({ ...formData, role_ids: e.target.value })
            }
            options={roles.map((role) => ({
              value: role.id,
              label: role.name,
            }))}
            multiple
            required
            renderValue={(selected) =>
              selected
                .map((id) => roles.find((r) => r.id === id)?.name || 'Unknown')
                .filter(Boolean)
                .join(', ') || 'Select roles...'
            }
            helperText={
              roles.length === 0
                ? 'No roles available. Please create roles first.'
                : 'Select one or more roles for this user. At least one role is required.'
            }
          />
        </Stack>
      </FormDialog>

      {/* Password Dialog */}
      <FormDialog
        open={openPasswordDialog}
        onClose={() => setOpenPasswordDialog(false)}
        title={editingUser ? 'Reset User Password' : 'Change Password'}
        onSubmit={handleChangePassword}
        submitText={editingUser ? 'Reset Password' : 'Change Password'}
        loading={submitting}
        maxWidth="sm"
      >
        {!editingUser && (
          <FormTextField
            label="Current Password"
            type="password"
            value={passwordData.current_password}
            onChange={(e) =>
              setPasswordData({ ...passwordData, current_password: e.target.value })
            }
            required
            autoFocus
          />
        )}
        <FormTextField
          label="New Password"
          type="password"
          value={passwordData.new_password}
          onChange={(e) =>
            setPasswordData({ ...passwordData, new_password: e.target.value })
          }
          required
          helperText="Must be at least 8 characters"
        />
        <FormTextField
          label="Confirm Password"
          type="password"
          value={passwordData.confirm_password}
          onChange={(e) =>
            setPasswordData({ ...passwordData, confirm_password: e.target.value })
          }
          required
        />
      </FormDialog>

      {/* Role Management Dialog */}
      <FormDialog
        open={openRoleDialog}
        onClose={() => setOpenRoleDialog(false)}
        title={editingRole ? 'Edit Role' : 'Create Role'}
        onSubmit={handleRoleSubmit}
        submitText={editingRole ? 'Update' : 'Create'}
        loading={submitting}
        maxWidth="sm"
      >
        <FormTextField
          label="Role Name"
          value={roleData.name}
          onChange={(e) => setRoleData({ ...roleData, name: e.target.value })}
          required
          disabled={!!editingRole}
          autoFocus
        />
        <FormTextField
          label="Description"
          value={roleData.description}
          onChange={(e) => setRoleData({ ...roleData, description: e.target.value })}
          multiline
          rows={3}
        />
        <FormTextField
          label="Permissions (JSON)"
          value={roleData.permissions}
          onChange={(e) => setRoleData({ ...roleData, permissions: e.target.value })}
          multiline
          rows={4}
          helperText="Enter permissions as JSON string (optional)"
        />
      </FormDialog>

      {/* Old capabilities dialog removed - assignments are now managed per shipment via clearance activities */}

      {/* Bulk Operations Dialog */}
      <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Operations</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            {selectedUsers.length} user(s) selected
          </Alert>
          <Stack spacing={2}>
            <Button
              variant="outlined"
              startIcon={<PlayArrow />}
              onClick={() => handleBulkOperation('activate')}
              fullWidth
            >
              Activate Selected
            </Button>
            <Button
              variant="outlined"
              startIcon={<Stop />}
              onClick={() => handleBulkOperation('deactivate')}
              fullWidth
            >
              Deactivate Selected
            </Button>
            <Divider />
            <FormControl fullWidth>
              <InputLabel>Assign Roles</InputLabel>
              <Select
                multiple
                value={formData.role_ids}
                onChange={(e) =>
                  setFormData({ ...formData, role_ids: e.target.value })
                }
                renderValue={(selected) =>
                  selected
                    .map((id) => roles.find((r) => r.id === id)?.name)
                    .join(', ')
                }
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<Security />}
              onClick={() => handleBulkOperation('assignRoles')}
              fullWidth
            >
              Assign Roles to Selected
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog open={openStatsDialog} onClose={() => setOpenStatsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>User Statistics</DialogTitle>
        <DialogContent>
          {statistics && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{statistics.total_users}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{statistics.active_users}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Users
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Users by Role
                </Typography>
                <Stack spacing={1}>
                  {Object.entries(statistics.users_by_role || {}).map(([role, count]) => (
                    <Box key={role} display="flex" justifyContent="space-between">
                      <Typography variant="body2">{role}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {count}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Activity Log Dialog */}
      <Dialog open={openActivityLogDialog} onClose={() => setOpenActivityLogDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Activity Log</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activityLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>
                      {log.resource_type} #{log.resource_id}
                    </TableCell>
                    <TableCell>{log.details}</TableCell>
                    <TableCell>
                      {log.created_at
                        ? format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActivityLogDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={handleCloseActionsMenu}
      >
        <MenuItem
          onClick={() => {
            handleViewUser(actionMenu.user)
            handleCloseActionsMenu()
          }}
        >
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View Details" secondary="View user information" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleOpenDialog(actionMenu.user)
            handleCloseActionsMenu()
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" secondary="Modify user details" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleOpenPasswordDialog(actionMenu.user)
            handleCloseActionsMenu()
          }}
        >
          <ListItemIcon>
            <VpnKey fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Reset Password" />
        </MenuItem>
        {/* Old capabilities menu item removed - assignments are now managed per shipment via clearance activities */}
        <MenuItem
          onClick={() => {
            handleViewActivityLog(actionMenu.user.id)
            handleCloseActionsMenu()
          }}
        >
          <ListItemIcon>
            <History fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Activity Log" />
        </MenuItem>
        <Divider />
        {actionMenu.user?.is_active ? (
          <MenuItem
            onClick={() => {
              handleDeactivate(actionMenu.user.id)
              handleCloseActionsMenu()
            }}
          >
            <ListItemIcon>
              <Block fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Deactivate" />
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              handleActivate(actionMenu.user.id)
              handleCloseActionsMenu()
            }}
          >
            <ListItemIcon>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText primary="Activate" />
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            handleDelete(actionMenu.user.id)
            handleCloseActionsMenu()
          }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      {/* Clients Table (when Clients tab is selected) */}
      {tabValue === 4 && (
        <DataTable
          columns={[
            {
              field: 'name',
              headerName: 'Name',
              render: (row) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    src={
                      row.national_id_front
                        ? row.national_id_front.startsWith('data:')
                          ? row.national_id_front
                          : `data:image/jpeg;base64,${row.national_id_front}`
                        : undefined
                    }
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      bgcolor: row.national_id_front ? 'transparent' : 'primary.main' 
                    }}
                  >
                    {!row.national_id_front && (row.name?.charAt(0) || 'C')}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {row.name || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.company_name}
                    </Typography>
                  </Box>
                </Stack>
              ),
            },
            {
              field: 'email',
              headerName: 'Email',
              render: (row) => (
                <Typography variant="body2">{row.email}</Typography>
              ),
            },
            {
              field: 'telephone',
              headerName: 'Phone',
              render: (row) => (
                <Typography variant="body2">{row.telephone}</Typography>
              ),
            },
            {
              field: 'consignment_type',
              headerName: 'Type',
              render: (row) => (
                <Chip
                  label={row.consignment_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                  size="small"
                  variant="outlined"
                />
              ),
            },
            {
              field: 'status',
              headerName: 'Status',
              render: (row) => {
                const statusColors = {
                  pending: 'warning',
                  approved: 'success',
                  rejected: 'error',
                }
                return (
                  <Chip
                    label={row.status?.toUpperCase() || 'PENDING'}
                    color={statusColors[row.status] || 'default'}
                    size="small"
                  />
                )
              },
            },
            {
              field: 'actions',
              headerName: 'Actions',
              align: 'right',
              render: (row) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Tooltip title="View details">
                    <IconButton
                      size="small"
                      onClick={() => handleViewClient(row)}
                      color="primary"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {row.status === 'pending' && (
                    <Tooltip title="Approve/Reject">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setViewingClient(row)
                            setOpenClientApproveDialog(true)
                          }}
                          color="primary"
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Stack>
              ),
            },
          ]}
          data={clients}
          loading={loading}
          searchable
          exportable
          onExport={() => toast.info('Export functionality coming soon')}
          onRefresh={fetchClients}
        />
      )}

      {/* Client View Dialog */}
      <FormDialog
        open={openClientViewDialog}
        onClose={() => {
          setOpenClientViewDialog(false)
          setViewingClient(null)
        }}
        title="Client Details"
        submitText=""
        cancelText="Close"
        maxWidth="md"
        showProgress={false}
      >
        {viewingClient && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, pb: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Avatar
                src={
                  viewingClient.national_id_front
                    ? viewingClient.national_id_front.startsWith('data:')
                      ? viewingClient.national_id_front
                      : `data:image/jpeg;base64,${viewingClient.national_id_front}`
                    : undefined
                }
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: viewingClient.national_id_front ? 'transparent' : 'primary.main',
                  fontSize: '2rem',
                  mr: 3,
                }}
              >
                {!viewingClient.national_id_front && (viewingClient.name?.charAt(0) || 'C')}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  {viewingClient.name || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {viewingClient.company_name}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mt: 1 }}>
                  <Chip
                    label={viewingClient.status?.toUpperCase() || 'PENDING'}
                    color={
                      viewingClient.status === 'approved'
                        ? 'success'
                        : viewingClient.status === 'rejected'
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  />
                  <Chip
                    label={viewingClient.consignment_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                    <Email color="primary" />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                      Email Address
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingClient.email}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                    <Phone color="primary" />
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                      Phone Number
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingClient.telephone}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600} mb={1}>
                    TIN
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingClient.tin}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600} mb={1}>
                    Position
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {viewingClient.position || 'Not provided'}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={600} mb={2}>
                    Compliance Documents
                  </Typography>
                  {viewingClient.documents && viewingClient.documents.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Title</TableCell>
                            <TableCell>File Name</TableCell>
                            <TableCell>Uploaded</TableCell>
                            <TableCell>Review Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {viewingClient.documents.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell>
                                <Chip
                                  label={doc.document_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {doc.title}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {doc.file_name || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {doc.uploaded_at
                                  ? format(new Date(doc.uploaded_at), 'MMM dd, yyyy')
                                  : '—'}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={doc.review_status?.toUpperCase() || 'PENDING'}
                                  size="small"
                                  color={
                                    doc.review_status === 'approved'
                                      ? 'success'
                                      : doc.review_status === 'rejected'
                                      ? 'error'
                                      : 'warning'
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No documents uploaded yet
                    </Typography>
                  )}
                </Card>
              </Grid>
              {viewingClient.rejection_reason && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    <Typography variant="subtitle2" fontWeight={600}>
                      Rejection Reason:
                    </Typography>
                    <Typography variant="body2">{viewingClient.rejection_reason}</Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </FormDialog>

      {/* Client Approval Dialog */}
      <FormDialog
        open={openClientApproveDialog}
        onClose={() => {
          setOpenClientApproveDialog(false)
          setApprovalData({ status: 'approved', rejection_reason: '' })
        }}
        title={`${approvalData.status === 'approved' ? 'Approve' : 'Reject'} Client`}
        onSubmit={() => handleApproveClient(viewingClient?.id)}
        submitText={approvalData.status === 'approved' ? 'Approve' : 'Reject'}
        loading={submitting}
        maxWidth="sm"
      >
        <Alert severity="info" sx={{ mb: 2 }}>
          {approvalData.status === 'approved'
            ? 'This will approve the client and allow them to access the system.'
            : 'Please provide a reason for rejection.'}
        </Alert>
        <FormSelect
          label="Status"
          value={approvalData.status}
          onChange={(e) => setApprovalData({ ...approvalData, status: e.target.value })}
          options={[
            { value: 'approved', label: 'Approve' },
            { value: 'rejected', label: 'Reject' },
          ]}
        />
        {approvalData.status === 'rejected' && (
          <FormTextField
            label="Rejection Reason"
            multiline
            rows={4}
            value={approvalData.rejection_reason}
            onChange={(e) => setApprovalData({ ...approvalData, rejection_reason: e.target.value })}
            required
            helperText="Please provide a reason for rejection"
          />
        )}
      </FormDialog>
    </Box>
  )
}

export default Users
