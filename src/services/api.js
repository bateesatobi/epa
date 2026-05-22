import axios from 'axios'
// Forced reload: 2026-03-19T02:20:00Z

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://epa-backend-latest.onrender.com'
  // import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login-json', { email, password })
    return response.data
  },
  getCurrentUser: async (token) => {
    const response = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.data
  },
  logout: async () => {
    await api.post('/api/auth/logout')
  },
  // New password management endpoints
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/api/auth/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    return response.data
  },
  forgotPassword: async (email) => {
    const response = await api.post('/api/auth/forgot-password', { email })
    return response.data
  },
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/api/auth/reset-password', {
      token,
      new_password: newPassword,
    })
    return response.data
  },
}

// Users API
export const usersAPI = {
  list: async (params = {}) => {
    const response = await api.get('/api/users', { params })
    return response.data
  },
  get: async (id) => {
    const response = await api.get(`/api/users/${id}`)
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/api/users', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/api/users/${id}`, data)
    return response.data
  },
  deactivate: async (id) => {
    const response = await api.patch(`/api/users/${id}/deactivate`)
    return response.data
  },
  activate: async (id) => {
    const response = await api.patch(`/api/users/${id}/activate`)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/api/users/${id}`)
    return response.data
  },
  getByRole: async (role) => {
    const response = await api.get(`/api/users/role/${role}`)
    return response.data
  },
  // Admin reset password
  resetPassword: async (id, data) => {
    const response = await api.post(`/api/users/${id}/reset-password`, data)
    return response.data
  },
  // Role management
  listRoles: async () => {
    const response = await api.get('/api/users/roles/list')
    return response.data
  },
  getRole: async (id) => {
    const response = await api.get(`/api/users/roles/${id}`)
    return response.data
  },
  createRole: async (data) => {
    const response = await api.post('/api/users/roles', data)
    return response.data
  },
  updateRole: async (id, data) => {
    const response = await api.put(`/api/users/roles/${id}`, data)
    return response.data
  },
  deleteRole: async (id) => {
    const response = await api.delete(`/api/users/roles/${id}`)
    return response.data
  },
  // Role assignments
  assignRoles: async (id, roleIds) => {
    const response = await api.post(`/api/users/${id}/roles`, { role_ids: roleIds })
    return response.data
  },
  removeRoles: async (id, roleIds) => {
    const response = await api.delete(`/api/users/${id}/roles`, {
      data: { role_ids: roleIds },
    })
    return response.data
  },
  // Old activity assignments removed - now using clearance activity assignments per shipment
  // Use shipmentsAPI.clearanceActivityAssignments methods instead
  // Bulk operations
  bulkActivate: async (userIds) => {
    const response = await api.post('/api/users/bulk-activate', { user_ids: userIds })
    return response.data
  },
  bulkDeactivate: async (userIds) => {
    const response = await api.post('/api/users/bulk-deactivate', { user_ids: userIds })
    return response.data
  },
  bulkAssignRoles: async (userIds, roleIds) => {
    const response = await api.post('/api/users/bulk-assign-roles', {
      user_ids: userIds,
      role_ids: roleIds,
    })
    return response.data
  },
  // Old bulkAssignActivities removed - use shipmentsAPI.bulkCreateClearanceActivityAssignments instead
  // Statistics and reporting
  getStatistics: async () => {
    const response = await api.get('/api/users/statistics')
    return response.data
  },
  getActivityLog: async (id, params = {}) => {
    const response = await api.get(`/api/users/${id}/activity-log`, { params })
    return response.data
  },
  getWorkload: async (id) => {
    const response = await api.get(`/api/users/${id}/workload`)
    return response.data
  },
  getFieldStaffPerformance: async () => {
    const response = await api.get('/api/users/field-staff/performance')
    return response.data
  },
  getStaffPerformanceByShipment: async (userId) => {
    const response = await api.get(`/api/users/field-staff/${userId}/performance-by-shipment`)
    return response.data
  },
}

// Shipments API
export const shipmentsAPI = {
  list: async (params = {}) => {
    const response = await api.get('/api/shipments', { params })
    return response.data
  },
  getClearanceActivityCounts: async () => {
    const response = await api.get('/api/shipments/clearance-activity-counts')
    return response.data
  },
  get: async (id) => {
    const response = await api.get(`/api/shipments/${id}`)
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/api/shipments', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/api/shipments/${id}`, data)
    return response.data
  },
  updateStatus: async (id, data) => {
    const response = await api.patch(`/api/shipments/${id}/status`, data)
    return response.data
  },
  cancel: async (id, reason) => {
    const response = await api.post(`/api/shipments/${id}/cancel?reason=${encodeURIComponent(reason || '')}`)
    return response.data
  },
  assign: async (id, data) => {
    const response = await api.post(`/api/shipments/${id}/assign`, data)
    return response.data
  },
  // Clearance activity assignments (replaces old activity assignments)
  createClearanceActivityAssignment: async (shipmentId, data) => {
    const response = await api.post(`/api/shipments/${shipmentId}/clearance-activity-assignments`, data)
    return response.data
  },
  listClearanceActivityAssignments: async (shipmentId) => {
    const response = await api.get(`/api/shipments/${shipmentId}/clearance-activity-assignments`)
    return response.data
  },
  updateClearanceActivityAssignment: async (assignmentId, data) => {
    const response = await api.put(`/api/shipments/clearance-activity-assignments/${assignmentId}`, data)
    return response.data
  },
  deleteClearanceActivityAssignment: async (assignmentId) => {
    const response = await api.delete(`/api/shipments/clearance-activity-assignments/${assignmentId}`)
    return response.data
  },
  bulkCreateClearanceActivityAssignments: async (shipmentId, data) => {
    const response = await api.post(`/api/shipments/${shipmentId}/clearance-activity-assignments/bulk`, data)
    return response.data
  },
  assignMultipleActivitiesToUser: async (shipmentId, data) => {
    const response = await api.post(`/api/shipments/${shipmentId}/clearance-activity-assignments/single-user-multiple`, data)
    return response.data
  },
  // Old activity assignments (deprecated - use clearance activity assignments above)
  createActivityAssignment: async (shipmentId, data) => {
    const response = await api.post(`/api/shipments/${shipmentId}/activity-assignments`, data)
    return response.data
  },
  listActivityAssignments: async (shipmentId) => {
    const response = await api.get(`/api/shipments/${shipmentId}/activity-assignments`)
    return response.data
  },
  getMyAssignments: async (params = {}) => {
    const response = await api.get('/api/shipments/activity-assignments/my-assignments', { params })
    return response.data
  },
  updateActivityAssignment: async (assignmentId, data) => {
    const response = await api.put(`/api/shipments/activity-assignments/${assignmentId}`, data)
    return response.data
  },
  // Clearance history
  getClearanceHistory: async (shipmentId) => {
    const response = await api.get(`/api/shipments/${shipmentId}/clearance-history`)
    return response.data
  },
  updateClearanceStatus: async (shipmentId, data) => {
    const response = await api.post(`/api/shipments/${shipmentId}/clearance-status`, data)
    return response.data
  },
  deleteActivityAssignment: async (assignmentId) => {
    const response = await api.delete(`/api/shipments/activity-assignments/${assignmentId}`)
    return response.data
  },
  listAllActivityAssignments: async (params = {}) => {
    const response = await api.get('/api/shipments/activity-assignments/all', { params })
    return response.data
  },
  bulkCreateActivityAssignments: async (shipmentId, assignments) => {
    const response = await api.post(`/api/shipments/${shipmentId}/activity-assignments/bulk`, assignments)
    return response.data
  },
  getTimeline: async (id) => {
    const response = await api.get(`/api/shipments/${id}/timeline`)
    return response.data
  },
  getInsights: async (id) => {
    const response = await api.get(`/api/shipments/${id}/insights`)
    return response.data
  },
  optimizeRoute: async (params) => {
    const response = await api.post('/api/shipments/optimize-route', null, {
      params,
    })
    return response.data
  },
  exportExcel: async (status) => {
    const response = await api.get('/api/shipments/export/excel', {
      params: status ? { status } : {},
    })
    return response.data
  },
  batchDelete: async (shipmentIds) => {
    const response = await api.post('/api/shipments/batch-delete', {
      shipment_ids: shipmentIds,
    })
    return response.data
  },
}

// Compliance API
export const complianceAPI = {
  // Get clients with documents
  getClientsWithDocuments: async (params = {}) => {
    const response = await api.get('/api/compliance/clients', { params })
    return response.data
  },
  // Get client documents
  getClientDocuments: async (clientId) => {
    const response = await api.get(`/api/compliance/clients/${clientId}/documents`)
    return response.data
  },
  // View document
  viewDocument: async (documentId) => {
    const response = await api.get(`/api/compliance/documents/${documentId}/view`)
    return response.data
  },
  // Upload document for client
  uploadDocumentForClient: async (clientId, documentData, shipmentId = null) => {
    const params = shipmentId ? { shipment_id: shipmentId } : {}
    const response = await api.post(`/api/compliance/clients/${clientId}/documents`, documentData, { params })
    return response.data
  },
  // Attach document to shipment
  attachDocumentToShipment: async (documentId, shipmentId) => {
    const response = await api.patch(`/api/compliance/documents/${documentId}/attach-shipment`, { shipment_id: shipmentId })
    return response.data
  },
  // Get document shipments
  getDocumentShipments: async (documentId) => {
    const response = await api.get(`/api/compliance/documents/${documentId}/shipments`)
    return response.data
  },
  // Update document
  updateDocument: async (documentId, documentData) => {
    const response = await api.put(`/api/compliance/documents/${documentId}`, documentData)
    return response.data
  },
  // Delete document
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/api/compliance/documents/${documentId}`)
    return response.data
  },
  // Query client (send communication)
  queryClient: async (clientId, communicationData) => {
    const response = await api.post(`/api/compliance/clients/${clientId}/query`, communicationData)
    return response.data
  },
  // Get client communications
  getClientCommunications: async (clientId, shipmentId = null) => {
    const params = shipmentId ? { shipment_id: shipmentId } : {}
    const response = await api.get(`/api/compliance/clients/${clientId}/communications`, { params })
    return response.data
  },
  // Get shipment documents
  getShipmentDocuments: async (shipmentId) => {
    const response = await api.get(`/api/compliance/shipments/${shipmentId}/documents`)
    return response.data
  },
  reviewDocument: async (documentId, reviewData) => {
    const response = await api.patch(`/api/compliance/documents/${documentId}/review`, reviewData)
    return response.data
  },
  // Get shipments with compliance info
  getShipmentsWithCompliance: async (params = {}) => {
    const response = await api.get('/api/compliance/shipments', { params })
    return response.data
  },
  // Legacy endpoints (deprecated - kept for backward compatibility but will be removed)
  generateT1: async (data) => {
    const response = await api.post('/api/compliance/t1/generate', data)
    return response.data
  },
  getT1: async (id) => {
    const response = await api.get(`/api/compliance/t1/${id}`)
    return response.data
  },
  generateIM4: async (data) => {
    const response = await api.post('/api/compliance/im4/generate', data)
    return response.data
  },
  generateIM7: async (data) => {
    const response = await api.post('/api/compliance/im7/generate', data)
    return response.data
  },
  createSeal: async (data) => {
    const response = await api.post('/api/compliance/seals', data)
    return response.data
  },
  getSeals: async (shipmentId) => {
    const response = await api.get(`/api/compliance/seals/shipment/${shipmentId}`)
    return response.data
  },
  uploadDocument: async (formData) => {
    const response = await api.post('/api/compliance/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  getDocuments: async (shipmentId) => {
    const response = await api.get(`/api/compliance/documents/shipment/${shipmentId}`)
    return response.data
  },
  getSummary: async (shipmentId) => {
    const response = await api.get(`/api/compliance/shipment/${shipmentId}/summary`)
    return response.data
  },
  escalate: async (params) => {
    const response = await api.post('/api/compliance/escalations', null, { params })
    return response.data
  },
  markT1Status: async (formId, status) => {
    const response = await api.patch(`/api/compliance/t1/${formId}/status`, { status })
    return response.data
  },
  // Global Communications (Admin Inbox)
  getAllCommunications: async () => {
    const response = await api.get('/api/compliance/communications')
    return response.data
  },
  markCommunicationRead: async (id) => {
    const response = await api.patch(`/api/compliance/communications/${id}/read`)
    return response.data
  },
}

// Reports API
export const reportsAPI = {
  generateDaily: async (date) => {
    const response = await api.get('/api/reports/daily', { params: { date } })
    return response.data
  },
  getKPIs: async (params = {}) => {
    const response = await api.get('/api/reports/kpis', { params })
    return response.data
  },
  getDelayTrends: async (days = 30, params = {}) => {
    const response = await api.get('/api/reports/trends/delays', {
      params: { days, ...params },
    })
    return response.data
  },
  getControlRoomAlerts: async (params = {}) => {
    const response = await api.get('/api/reports/control-room/alerts', { params })
    return response.data
  },
  generate: async (data) => {
    const response = await api.post('/api/reports/generate', data)
    return response.data
  },
  getActivityAnalytics: async (params = {}) => {
    const response = await api.get('/api/reports/analytics/activities', { params })
    return response.data
  },
  getFieldStaffAnalytics: async (params = {}) => {
    const response = await api.get('/api/reports/analytics/field-staff', { params })
    return response.data
  },
  getOverdueAnalytics: async (params = {}) => {
    const response = await api.get('/api/reports/analytics/overdue', { params })
    return response.data
  },
  getTimelineAnalytics: async (days = 30, params = {}) => {
    const response = await api.get('/api/reports/analytics/timeline', { params: { days, ...params } })
    return response.data
  },
}

// Notifications API
export const notificationsAPI = {
  list: async (params = {}) => {
    const response = await api.get('/api/notifications', { params })
    return response.data
  },
  getUnread: async (limit = 10) => {
    const response = await api.get('/api/notifications/unread', { params: { limit } })
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/api/notifications', data)
    return response.data
  },
  markRead: async (id) => {
    const response = await api.patch(`/api/notifications/${id}/read`)
    return response.data
  },
  markUnread: async (id) => {
    const response = await api.patch(`/api/notifications/${id}/unread`)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/api/notifications/${id}`)
    return response.data
  },
  markAllRead: async () => {
    const response = await api.post('/api/notifications/mark-all-read')
    return response.data
  },
  getUnreadCount: async () => {
    const response = await api.get('/api/notifications/unread/count')
    return response.data
  },
}

// Inventory API
export const inventoryAPI = {
  list: async (params = {}) => {
    const response = await api.get('/api/inventory', { params })
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/api/inventory', data)
    return response.data
  },
  updateLocation: async (id, locationId) => {
    const response = await api.put(`/api/inventory/${id}/location`, null, {
      params: { location_id: locationId },
    })
    return response.data
  },
}

// Billing API
export const billingAPI = {
  generateInvoice: async (data) => {
    const response = await api.post('/api/billing/invoices/generate', data)
    return response.data
  },
  listInvoices: async (params = {}) => {
    const response = await api.get('/api/billing/invoices', { params })
    return response.data
  },
  calculateCosts: async (shipmentId) => {
    const response = await api.post('/api/billing/costs/calculate', null, {
      params: { shipment_id: shipmentId },
    })
    return response.data
  },
}

// Client API
export const clientsAPI = {
  register: async (data) => {
    const response = await api.post('/api/clients/register', data)
    return response.data
  },
  login: async (telephone, password) => {
    const response = await api.post('/api/clients/login', {
      telephone,
      password,
    })
    return response.data
  },
  uploadDocument: async (documentData) => {
    const response = await api.post('/api/clients/documents', documentData)
    return response.data
  },
  getMyDocuments: async () => {
    const response = await api.get('/api/clients/documents')
    return response.data
  },
  getDocumentStatus: async () => {
    const response = await api.get('/api/clients/documents/status')
    return response.data
  },
  // Admin endpoints
  list: async (params = {}) => {
    const response = await api.get('/api/clients', { params })
    return response.data
  },
  get: async (clientId) => {
    const response = await api.get(`/api/clients/${clientId}`)
    return response.data
  },
  approve: async (clientId, status, rejectionReason = null) => {
    const response = await api.patch(`/api/clients/${clientId}/approve`, {
      status,
      rejection_reason: rejectionReason,
    })
    return response.data
  },
  getDocuments: async (clientId) => {
    const response = await api.get(`/api/clients/${clientId}/documents`)
    return response.data
  },
  activate: async (clientId) => {
    const response = await api.patch(`/api/clients/${clientId}/activate`)
    return response.data
  },
  deactivate: async (clientId) => {
    const response = await api.patch(`/api/clients/${clientId}/deactivate`)
    return response.data
  },
  delete: async (clientId) => {
    const response = await api.delete(`/api/clients/${clientId}`)
    return response.data
  },
  resetPassword: async (clientId, data) => {
    const response = await api.patch(`/api/clients/${clientId}/reset-password`, data)
    return response.data
  },
}

// Depots API
export const depotsAPI = {
  list: async (params = {}) => {
    const response = await api.get('/api/depots', { params })
    return response.data
  },
  get: async (id) => {
    const response = await api.get(`/api/depots/${id}`)
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/api/depots', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/api/depots/${id}`, data)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/api/depots/${id}`)
    return response.data
  },
}

export const commentsAPI = {
  listByShipment: async (shipmentId) => {
    const response = await api.get(`/api/comments/shipment/${shipmentId}`)
    return response.data
  },
  create: async (shipmentId, data) => {
    const response = await api.post(`/api/comments/shipment/${shipmentId}`, data)
    return response.data
  },
  delete: async (commentId) => {
    const response = await api.delete(`/api/comments/${commentId}`)
    return response.data
  },
}

export const clearanceActivitiesAPI = {
  list: async (params = {}) => {
    const response = await api.get('/api/clearance-activities', { params })
    return response.data
  },
  get: async (id) => {
    const response = await api.get(`/api/clearance-activities/${id}`)
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/api/clearance-activities', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/api/clearance-activities/${id}`, data)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/api/clearance-activities/${id}`)
    return response.data
  },
  reorder: async (activityId, newPosition) => {
    const response = await api.post('/api/clearance-activities/reorder', {
      activity_id: activityId,
      new_position: newPosition,
    })
    return response.data
  },
}

export const queriesAPI = {
  listByShipment: async (shipmentId) => {
    const response = await api.get(`/api/queries/shipment/${shipmentId}`)
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/api/queries/', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/api/queries/${id}`, data)
    return response.data
  },
  reply: async (id, replies) => {
    const response = await api.patch(`/api/queries/${id}/reply`, replies)
    return response.data
  },
  updateStatus: async (id, data) => {
    const response = await api.patch(`/api/queries/${id}/status`, data)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/api/queries/${id}`)
    return response.data
  },
}

export default api

