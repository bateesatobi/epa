import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
  Avatar,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
} from '@mui/material'
import {
  Timeline as TimelineIcon,
  Description,
  ChatBubbleOutline,
  CloudUpload,
  Visibility,
  Sync,
  ArrowBack,
  CheckCircle,
  InfoOutlined,
  Close,
  Download,
} from '@mui/icons-material'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import {
  shipmentsAPI,
  complianceAPI,
  commentsAPI,
} from '../../services/api'
import FieldStaffPageHeader from '../../components/fieldstaff/FieldStaffPageHeader'
import ShipmentQueries from '../../components/ShipmentQueries'
import {
  statusColor,
  formatStatusLabel,
} from '../../hooks/useFieldStaff'
import DocumentPreviewDialog from '../../components/portal/DocumentPreviewDialog'
import { downloadConsignmentReport } from '../../utils/consignmentReport'
import { isMissionClosed, isMissionTerminal } from '../../utils/shipmentStatus'

const REQUIRED_DOC_TYPES = [
  { value: 't1_document', label: 'T1 Document' },
  { value: 'certificate_of_origin', label: 'Certificate of Origin' },
  { value: 'bill_of_lading', label: 'Bill of Lading' },
  { value: 'packing_list', label: 'Packing List' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'pvoc', label: 'PVOC' },
  { value: 'proof_of_payment', label: 'Proof of Payment' },
  { value: 'im8', label: 'IM8' },
]

const TAB_KEYS = ['info', 'timeline', 'documents', 'queries']

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function InfoRow({ label, value }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={700}
        sx={{ letterSpacing: 0.5, display: 'block' }}
      >
        {label.toUpperCase()}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25, wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Box>
  )
}

/**
 * Field staff consignment workspace — mirrors mobile assignment detail:
 * Info | Timeline | Documents (upload) | Queries
 */
export default function FieldStaffAssignmentWorkspace() {
  const { shipmentId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const initialTab = Math.max(0, TAB_KEYS.indexOf(searchParams.get('tab') || 'info'))
  const [tab, setTab] = useState(initialTab)
  const [loading, setLoading] = useState(true)
  const [shipment, setShipment] = useState(null)
  const [history, setHistory] = useState([])
  const [assignments, setAssignments] = useState([])
  const [documents, setDocuments] = useState([])
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [uploadingType, setUploadingType] = useState(null)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusForm, setStatusForm] = useState({ assignmentId: '', status: 'in_progress', notes: '' })
  const [savingStatus, setSavingStatus] = useState(false)
  const [otherDialogOpen, setOtherDialogOpen] = useState(false)
  const [otherForm, setOtherForm] = useState({ title: '', file: null })
  const [uploadingOther, setUploadingOther] = useState(false)
  const [downloadingReport, setDownloadingReport] = useState(false)

  const myAssignments = useMemo(() => {
    if (!user?.id) return []
    return assignments.filter(
      (a) =>
        a.user_id === user.id &&
        ['pending', 'in_progress'].includes(String(a.status || '').toLowerCase())
    )
  }, [assignments, user])

  const load = useCallback(async () => {
    if (!shipmentId) return
    setLoading(true)
    try {
      const [ship, hist, assigns, docs, chat] = await Promise.all([
        shipmentsAPI.get(shipmentId),
        shipmentsAPI.getClearanceHistory(shipmentId).catch(() => []),
        shipmentsAPI.listClearanceActivityAssignments(shipmentId).catch(() => []),
        complianceAPI.getShipmentDocuments(shipmentId).catch(() => []),
        commentsAPI.listByShipment(shipmentId).catch(() => []),
      ])
      setShipment(ship)
      setHistory(Array.isArray(hist) ? hist : [])
      setAssignments(Array.isArray(assigns) ? assigns : [])
      setDocuments(Array.isArray(docs) ? docs : docs?.items || [])
      setComments(Array.isArray(chat) ? chat : [])
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to load consignment')
    } finally {
      setLoading(false)
    }
  }, [shipmentId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const key = TAB_KEYS[tab] || 'info'
    if (searchParams.get('tab') !== key) {
      setSearchParams({ tab: key }, { replace: true })
    }
  }, [tab, searchParams, setSearchParams])

  const openStatusDialog = (assignmentId = '') => {
    setStatusForm({
      assignmentId: assignmentId ? String(assignmentId) : myAssignments[0] ? String(myAssignments[0].id) : '',
      status: 'in_progress',
      notes: '',
    })
    setStatusDialogOpen(true)
  }

  const closeStatusDialog = () => {
    if (savingStatus) return
    setStatusDialogOpen(false)
  }

  const docsByType = useMemo(() => {
    const map = {}
    for (const doc of documents) {
      const type = doc.document_type || 'other'
      if (type === 'other') continue
      if (!map[type]) map[type] = doc
    }
    return map
  }, [documents])

  const otherDocuments = useMemo(
    () => documents.filter((d) => (d.document_type || '') === 'other'),
    [documents]
  )

  const handleTabChange = (_, value) => setTab(value)

  const handleUpload = async (docType, file, titleOverride) => {
    if (!file || !shipment?.client_id) {
      toast.error('Shipment client is missing — cannot upload')
      return
    }
    const title =
      String(titleOverride || '').trim() ||
      file.name.replace(/\.[^/.]+$/, '').slice(0, 255) ||
      docType
    if (docType === 'other' && !String(titleOverride || '').trim()) {
      toast.error('Enter a title for this Other document')
      return
    }
    setUploadingType(docType)
    try {
      const file_data = await fileToBase64(file)
      await complianceAPI.uploadDocumentForClient(
        shipment.client_id,
        {
          document_type: docType,
          title: title.slice(0, 255),
          file_data,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
        },
        shipment.id
      )
      toast.success('Document uploaded')
      await load()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed')
    } finally {
      setUploadingType(null)
    }
  }

  const openOtherDialog = () => {
    setOtherForm({ title: '', file: null })
    setOtherDialogOpen(true)
  }

  const handleUploadOther = async () => {
    if (!otherForm.file) {
      toast.error('Choose a file to upload')
      return
    }
    if (!String(otherForm.title || '').trim()) {
      toast.error('Enter a title for this Other document')
      return
    }
    if (!shipment?.client_id) {
      toast.error('Shipment client is missing — cannot upload')
      return
    }
    setUploadingOther(true)
    try {
      const file_data = await fileToBase64(otherForm.file)
      await complianceAPI.uploadDocumentForClient(
        shipment.client_id,
        {
          document_type: 'other',
          title: otherForm.title.trim().slice(0, 255),
          file_data,
          file_name: otherForm.file.name,
          file_size: otherForm.file.size,
          mime_type: otherForm.file.type || 'application/octet-stream',
        },
        shipment.id
      )
      toast.success('Other document uploaded')
      setOtherDialogOpen(false)
      setOtherForm({ title: '', file: null })
      await load()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed')
    } finally {
      setUploadingOther(false)
    }
  }

  const handleViewDoc = async (doc) => {
    try {
      const full = await complianceAPI.viewDocument(doc.id)
      setPreviewDoc(full)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not open document')
    }
  }

  const handlePostComment = async () => {
    if (!newComment.trim()) return
    try {
      await commentsAPI.create(shipmentId, { content: newComment.trim() })
      setNewComment('')
      toast.success('Message posted')
      const chat = await commentsAPI.listByShipment(shipmentId)
      setComments(Array.isArray(chat) ? chat : [])
    } catch {
      toast.error('Failed to post message')
    }
  }

  const handleUpdateStatus = async () => {
    if (!statusForm.assignmentId) {
      toast.error('Select one of your assignments')
      return
    }
    setSavingStatus(true)
    try {
      await shipmentsAPI.updateClearanceActivityAssignment(statusForm.assignmentId, {
        status: statusForm.status,
        notes: statusForm.notes || null,
      })
      toast.success('Status updated')
      setStatusForm({ assignmentId: '', status: 'in_progress', notes: '' })
      setStatusDialogOpen(false)
      await load()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update status')
    } finally {
      setSavingStatus(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!shipmentId) return
    setDownloadingReport(true)
    const toastId = toast.loading('Preparing consignment package…')
    try {
      const { filename, missingCount } = await downloadConsignmentReport({
        shipmentId,
        shipment,
        documents,
        clearanceHistory: history,
        assignments,
        generatedBy: user?.full_name || user?.name || user?.email || '',
        onProgress: (msg) => toast.update(toastId, { render: msg, isLoading: true }),
      })
      toast.update(toastId, {
        render: missingCount
          ? `Downloaded ${filename} (${missingCount} document(s) missing from server — see _MISSING_DOCUMENTS.txt)`
          : `Downloaded package ${filename}`,
        type: missingCount ? 'warning' : 'success',
        isLoading: false,
        autoClose: 5000,
      })
    } catch (error) {
      toast.update(toastId, {
        render: error.response?.data?.detail || error.message || 'Failed to download package',
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      })
    } finally {
      setDownloadingReport(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!shipment) {
    return (
      <Box sx={{ pb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Consignment not found
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard/field-staff/assignments')}>
          Back
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ pb: 4 }}>
      <FieldStaffPageHeader
        showBack
        backTo="/dashboard/field-staff/assignments"
        title={shipment.shipment_number || `Consignment #${shipmentId}`}
        subtitle={`${shipment.origin || '—'} → ${shipment.destination || '—'}${
          shipment.consignee_name ? ` · ${shipment.consignee_name}` : ''
        }`}
        chipLabel={formatStatusLabel(shipment.status)}
        action={
          <Button
            variant="outlined"
            startIcon={
              downloadingReport ? <CircularProgress size={16} color="inherit" /> : <Download />
            }
            onClick={handleDownloadReport}
            disabled={downloadingReport}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 700 }}
          >
            Download package
          </Button>
        }
      />

      {isMissionClosed(shipment.status) && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }} icon={<CheckCircle />}>
          <strong>Mission closed</strong>
          {shipment.closure_reason ? ` — ${shipment.closure_reason}` : ''}. Status updates are locked for this consignment.
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
      >
        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 1,
            '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', minHeight: 56 },
          }}
        >
          <Tab icon={<InfoOutlined />} iconPosition="start" label="Info" />
          <Tab icon={<TimelineIcon />} iconPosition="start" label="Timeline" />
          <Tab
            icon={<Description />}
            iconPosition="start"
            label={`Documents (${documents.length})`}
          />
          <Tab icon={<ChatBubbleOutline />} iconPosition="start" label="Queries & chat" />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {tab === 0 && (
            <Stack spacing={2.5}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#F8FAFC' }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>
                  Route & status
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Shipment number" value={shipment.shipment_number} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Status" value={formatStatusLabel(shipment.status)} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Origin" value={shipment.origin} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Destination" value={shipment.destination} />
                  </Grid>
                  <Grid item xs={12}>
                    <InfoRow label="Route" value={shipment.route} />
                  </Grid>
                </Grid>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>
                  Parties
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Shipper" value={shipment.shipper_name} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Consignee" value={shipment.consignee_name} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Consignee email" value={shipment.consignee_email} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Consignee phone" value={shipment.consignee_phone} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      label="Client"
                      value={shipment.client_name || shipment.client_company || (shipment.client_id ? `#${shipment.client_id}` : null)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Invoice number" value={shipment.invoice_number} />
                  </Grid>
                </Grid>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>
                  Cargo
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label="Container number" value={shipment.container_number} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      label="Estimated delivery"
                      value={
                        shipment.estimated_delivery_date
                          ? format(new Date(shipment.estimated_delivery_date), 'MMM dd, yyyy')
                          : null
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <InfoRow label="Description" value={shipment.cargo_description} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <InfoRow
                      label="Weight"
                      value={shipment.cargo_weight != null ? `${shipment.cargo_weight}` : null}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <InfoRow
                      label="Volume"
                      value={shipment.cargo_volume != null ? `${shipment.cargo_volume}` : null}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <InfoRow
                      label="Value"
                      value={shipment.cargo_value != null ? `${shipment.cargo_value}` : null}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      label="Estimated cost"
                      value={
                        shipment.estimated_cost != null
                          ? `UGX ${Number(shipment.estimated_cost).toLocaleString()}`
                          : null
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow
                      label="Created"
                      value={
                        shipment.created_at
                          ? format(new Date(shipment.created_at), 'MMM dd, yyyy HH:mm')
                          : null
                      }
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          )}

          {tab === 1 && (
            <Stack spacing={3}>
              {myAssignments.length > 0 && !isMissionTerminal(shipment.status) && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<Sync />}
                    onClick={() => openStatusDialog()}
                    sx={{ fontWeight: 800, alignSelf: 'flex-start' }}
                  >
                    Update status
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    You have {myAssignments.length} active assignment
                    {myAssignments.length === 1 ? '' : 's'} on this consignment.
                  </Typography>
                </Stack>
              )}

              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
                  Team on this consignment
                </Typography>
                {assignments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No field staff assignments yet.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {assignments.map((a) => (
                      <Paper key={a.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 800 }}>
                            {(a.user_name || '?').charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700}>
                              {a.user_name || `User #${a.user_id}`}
                              {a.user_id === user?.id ? ' (you)' : ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {a.clearance_activity_name || a.activity_name || 'Activity'}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={formatStatusLabel(a.status)}
                            color={statusColor(a.status)}
                            sx={{ fontWeight: 800, textTransform: 'capitalize' }}
                          />
                          {a.user_id === user?.id &&
                            !isMissionTerminal(shipment.status) &&
                            ['pending', 'in_progress'].includes(String(a.status || '').toLowerCase()) && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => openStatusDialog(a.id)}
                                sx={{ fontWeight: 700, flexShrink: 0 }}
                              >
                                Update
                              </Button>
                            )}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
                  Clearance timeline
                </Typography>
                {history.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No timeline events yet.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {history.map((event) => (
                      <Paper key={event.id || `${event.clearance_activity_id}-${event.timestamp}`} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                          <Typography variant="body2" fontWeight={800}>
                            {event.clearance_activity_name || event.activity_name || 'Activity'}
                          </Typography>
                          <Chip
                            size="small"
                            label={formatStatusLabel(event.status)}
                            color={statusColor(event.status)}
                            sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                          />
                        </Stack>
                        {event.assigned_user_name && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {event.assigned_user_name}
                          </Typography>
                        )}
                        {event.notes && (
                          <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                            {event.notes}
                          </Typography>
                        )}
                        {(event.timestamp || event.updated_at || event.created_at) && (
                          <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 1 }}>
                            {format(
                              new Date(event.timestamp || event.updated_at || event.created_at),
                              'MMM dd, yyyy HH:mm'
                            )}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          )}

          {tab === 2 && (
            <Stack spacing={2}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Upload required operational documents. For additional files, use Other Documents — each needs its own title.
              </Alert>
              {REQUIRED_DOC_TYPES.map((type) => {
                const uploaded = docsByType[type.value]
                const busy = uploadingType === type.value
                return (
                  <Paper
                    key={type.value}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: uploaded ? 'success.light' : 'divider',
                      bgcolor: uploaded ? 'rgba(16,185,129,0.04)' : 'background.paper',
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      alignItems={{ sm: 'center' }}
                      justifyContent="space-between"
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2" fontWeight={800}>
                            {type.label}
                          </Typography>
                          {uploaded && (
                            <Chip
                              size="small"
                              icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                              label="Uploaded"
                              color="success"
                              sx={{ fontWeight: 700, height: 22 }}
                            />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {uploaded?.uploaded_at
                            ? `Uploaded ${format(new Date(uploaded.uploaded_at), 'MMM dd, yyyy')}`
                            : 'Not uploaded yet'}
                          {uploaded?.file_name ? ` · ${uploaded.file_name}` : ''}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        {uploaded && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => handleViewDoc(uploaded)}
                            sx={{ fontWeight: 700 }}
                          >
                            View
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="contained"
                          component="label"
                          disabled={busy || !shipment.client_id}
                          startIcon={
                            busy ? <CircularProgress size={14} color="inherit" /> : <CloudUpload />
                          }
                          sx={{ fontWeight: 800 }}
                        >
                          {uploaded ? 'Replace' : 'Upload'}
                          <input
                            hidden
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              e.target.value = ''
                              if (file) handleUpload(type.value, file)
                            }}
                          />
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                )
              })}

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems={{ sm: 'center' }}
                  justifyContent="space-between"
                  sx={{ mb: 2 }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800}>
                      Other Documents
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Add any additional files dynamically — each requires a title.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={openOtherDialog}
                    disabled={!shipment.client_id}
                    sx={{ fontWeight: 800 }}
                  >
                    Add other document
                  </Button>
                </Stack>

                {otherDocuments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No other documents uploaded yet.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {otherDocuments.map((doc) => (
                      <Paper
                        key={doc.id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          bgcolor: 'rgba(16,185,129,0.04)',
                          borderColor: 'success.light',
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" fontWeight={800} noWrap>
                              {doc.title || 'Untitled'}
                            </Typography>
                            <Chip size="small" label="Other" sx={{ height: 20, fontWeight: 700 }} />
                          </Stack>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {doc.file_name || 'Document'}
                            {doc.uploaded_at
                              ? ` · ${format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}`
                              : ''}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => handleViewDoc(doc)}
                          sx={{ fontWeight: 700, flexShrink: 0 }}
                        >
                          View
                        </Button>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Stack>
          )}

          {tab === 3 && (
            <Stack spacing={4}>
              <ShipmentQueries shipmentId={shipmentId} isAdmin user={user} />
              <Divider />
              <Box>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
                  Internal chat
                </Typography>
                <Stack spacing={1.5} sx={{ mb: 2, maxHeight: 360, overflowY: 'auto' }}>
                  {comments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No messages yet.
                    </Typography>
                  ) : (
                    comments.map((c) => (
                      <Paper key={c.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" fontWeight={800}>
                            {c.author?.name || 'Staff'}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {c.created_at
                              ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true })
                              : ''}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {c.content}
                        </Typography>
                      </Paper>
                    ))
                  )}
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Write a note or reply…"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    multiline
                    minRows={2}
                  />
                  <Button
                    variant="contained"
                    onClick={handlePostComment}
                    disabled={!newComment.trim()}
                    sx={{ fontWeight: 800, alignSelf: { sm: 'flex-start' } }}
                  >
                    Post
                  </Button>
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>
      </Paper>

      <Dialog
        open={statusDialogOpen}
        onClose={closeStatusDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 800, position: 'relative' }}>
          Update activity status
          <IconButton
            onClick={closeStatusDialog}
            disabled={savingStatus}
            size="small"
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              select
              label="Your assignment"
              size="small"
              value={statusForm.assignmentId}
              onChange={(e) => setStatusForm((s) => ({ ...s, assignmentId: e.target.value }))}
              fullWidth
            >
              {myAssignments.map((a) => (
                <MenuItem key={a.id} value={String(a.id)}>
                  {a.clearance_activity_name || a.activity_name || `Activity #${a.clearance_activity_id}`}{' '}
                  ({formatStatusLabel(a.status)})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Status"
              size="small"
              value={statusForm.status}
              onChange={(e) => setStatusForm((s) => ({ ...s, status: e.target.value }))}
              fullWidth
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
            <TextField
              label="Notes"
              size="small"
              multiline
              minRows={3}
              value={statusForm.notes}
              onChange={(e) => setStatusForm((s) => ({ ...s, notes: e.target.value }))}
              fullWidth
              placeholder="Optional notes for this update…"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeStatusDialog} disabled={savingStatus} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={savingStatus ? <CircularProgress size={16} color="inherit" /> : <Sync />}
            disabled={savingStatus || !statusForm.assignmentId}
            onClick={handleUpdateStatus}
            sx={{ fontWeight: 800 }}
          >
            Save status
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={otherDialogOpen}
        onClose={() => !uploadingOther && setOtherDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 800, position: 'relative' }}>
          Add other document
          <IconButton
            onClick={() => !uploadingOther && setOtherDialogOpen(false)}
            disabled={uploadingOther}
            size="small"
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              label="Document title"
              required
              size="small"
              fullWidth
              value={otherForm.title}
              onChange={(e) => setOtherForm((s) => ({ ...s, title: e.target.value }))}
              placeholder="e.g. Bond amendment letter"
              helperText="Required — this is how the document will appear for staff and clients"
              error={Boolean(otherForm.file) && !String(otherForm.title || '').trim()}
            />
            <Button variant="outlined" component="label" disabled={uploadingOther} sx={{ fontWeight: 700 }}>
              {otherForm.file ? otherForm.file.name : 'Choose file'}
              <input
                hidden
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  e.target.value = ''
                  setOtherForm((s) => ({
                    ...s,
                    file,
                    title:
                      s.title ||
                      (file ? file.name.replace(/\.[^/.]+$/, '').slice(0, 255) : ''),
                  }))
                }}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOtherDialogOpen(false)}
            disabled={uploadingOther}
            sx={{ fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={
              uploadingOther ? <CircularProgress size={16} color="inherit" /> : <CloudUpload />
            }
            disabled={
              uploadingOther || !otherForm.file || !String(otherForm.title || '').trim()
            }
            onClick={handleUploadOther}
            sx={{ fontWeight: 800 }}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      <DocumentPreviewDialog
        open={!!previewDoc}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </Box>
  )
}
