import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://epa-backend-latest.onrender.com'

export const CLIENT_TOKEN_KEY = 'client_token'
export const CLIENT_DATA_KEY = 'client_data'

let onSessionExpired = null

export function setClientSessionExpiredHandler(handler) {
  onSessionExpired = handler
}

const clientApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

clientApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(CLIENT_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

clientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isAuthRoute =
      url.includes('/clients/login') ||
      url.includes('/clients/register') ||
      url.includes('/clients/forgot-password') ||
      url.includes('/clients/reset-password')

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem(CLIENT_TOKEN_KEY)
      localStorage.removeItem(CLIENT_DATA_KEY)
      if (typeof onSessionExpired === 'function') {
        onSessionExpired()
      } else if (!window.location.pathname.startsWith('/client/login')) {
        window.location.href = '/client/login'
      }
    }
    return Promise.reject(error)
  }
)

export const clientPortalAPI = {
  register: (data) => clientApi.post('/api/clients/register', data).then((r) => r.data),
  login: (telephone, password) =>
    clientApi.post('/api/clients/login', { telephone, password }).then((r) => r.data),
  forgotPassword: (identifier) =>
    clientApi.post('/api/clients/forgot-password', { identifier }).then((r) => r.data),
  resetPassword: (token, new_password) =>
    clientApi.post('/api/clients/reset-password', { token, new_password }).then((r) => r.data),
  changePassword: (current_password, new_password) =>
    clientApi.put('/api/auth/me/password', { current_password, new_password }).then((r) => r.data),

  listShipments: (params = {}) =>
    clientApi.get('/api/client/shipments', { params }).then((r) => r.data),
  getShipment: (id) => clientApi.get(`/api/client/shipments/${id}`).then((r) => r.data),
  getTimeline: (id) => clientApi.get(`/api/client/shipments/${id}/timeline`).then((r) => r.data),
  getCostEstimate: (id) =>
    clientApi.get(`/api/client/shipments/${id}/cost-estimate`).then((r) => r.data),

  getShipmentDocuments: (shipmentId) =>
    clientApi.get(`/api/compliance/shipments/${shipmentId}/documents`).then((r) => r.data),
  uploadDocument: (documentData, shipmentId) =>
    clientApi
      .post('/api/clients/documents', documentData, { params: { shipment_id: shipmentId } })
      .then((r) => r.data),
  updateDocument: (id, data) =>
    clientApi.put(`/api/clients/documents/${id}`, data).then((r) => r.data),
  deleteDocument: (id) => clientApi.delete(`/api/clients/documents/${id}`).then((r) => r.data),
  viewDocument: (id) =>
    clientApi.get(`/api/compliance/documents/${id}/view`).then((r) => r.data),

  getMyCommunications: (shipmentId) =>
    clientApi
      .get('/api/compliance/my/communications', { params: { shipment_id: shipmentId } })
      .then((r) => r.data),
  replyToQuery: (data) =>
    clientApi.post('/api/compliance/my/communications/reply', data).then((r) => r.data),
  markCommunicationRead: (id) =>
    clientApi.patch(`/api/compliance/my/communications/${id}/read`).then((r) => r.data),

  listQueries: (shipmentId) =>
    clientApi.get(`/api/queries/shipment/${shipmentId}`).then((r) => r.data),
  replyToStructuredQuery: (queryId, replies) =>
    clientApi.patch(`/api/queries/${queryId}/reply`, replies).then((r) => r.data),

  listNotifications: (params = {}) =>
    clientApi.get('/api/notifications', { params }).then((r) => r.data),
  markNotificationRead: (id) =>
    clientApi.patch(`/api/notifications/${id}/read`).then((r) => r.data),
  markAllNotificationsRead: () =>
    clientApi.post('/api/notifications/mark-all-read').then((r) => r.data),
  getUnreadCount: () =>
    clientApi.get('/api/notifications/unread/count').then((r) => r.data),

  getSupportMessages: () => clientApi.get('/api/clients/communications').then((r) => r.data),
  sendSupportMessage: (data) =>
    clientApi.post('/api/clients/communications', data).then((r) => r.data),

  getComments: (shipmentId) =>
    clientApi.get(`/api/comments/shipment/${shipmentId}`).then((r) => r.data),
  postComment: (shipmentId, content) =>
    clientApi.post(`/api/comments/shipment/${shipmentId}`, { content }).then((r) => r.data),

  getClearanceHistory: (shipmentId) =>
    clientApi.get(`/api/shipments/${shipmentId}/clearance-history`).then((r) => r.data),

  createConsignmentRequest: (data) =>
    clientApi.post('/api/consignment-requests', data).then((r) => r.data),
  listMyConsignmentRequests: () =>
    clientApi.get('/api/consignment-requests/my').then((r) => r.data),
  uploadConsignmentRequestDocument: (requestId, data) =>
    clientApi.post(`/api/consignment-requests/${requestId}/documents`, data).then((r) => r.data),
  getConsignmentRequest: (id) =>
    clientApi.get(`/api/consignment-requests/${id}`).then((r) => r.data),
  updateConsignmentRequest: (id, data) =>
    clientApi.put(`/api/consignment-requests/${id}`, data).then((r) => r.data),
  deleteConsignmentRequest: (id) =>
    clientApi.delete(`/api/consignment-requests/${id}`),
  deleteConsignmentRequestDocument: (requestId, docId) =>
    clientApi.delete(`/api/consignment-requests/${requestId}/documents/${docId}`),
  viewConsignmentRequestDocument: (requestId, docId) =>
    clientApi.get(`/api/consignment-requests/${requestId}/documents/${docId}/view`).then((r) => r.data),
}

export const consignmentRequestsAPI = {
  create: (data) => clientPortalAPI.createConsignmentRequest(data),
  listMy: () => clientPortalAPI.listMyConsignmentRequests(),
  get: (id) => clientPortalAPI.getConsignmentRequest(id),
  update: (id, data) => clientPortalAPI.updateConsignmentRequest(id, data),
  delete: (id) => clientPortalAPI.deleteConsignmentRequest(id),
  uploadDocument: (requestId, data) =>
    clientPortalAPI.uploadConsignmentRequestDocument(requestId, data),
  deleteDocument: (requestId, docId) =>
    clientPortalAPI.deleteConsignmentRequestDocument(requestId, docId),
  viewDocument: (requestId, docId) =>
    clientPortalAPI.viewConsignmentRequestDocument(requestId, docId),
}

export default clientApi
