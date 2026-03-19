import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
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
  Alert,
  CircularProgress,
  LinearProgress,
  Divider,
  Drawer,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material'
import {
  ArrowBack,
  VerifiedUser,
  Description,
  Visibility,
  Upload,
  Message,
  Send,
  Close,
  LocalShipping,
  Business,
  Person,
  Email,
  Phone,
  LocationOn,
  CheckCircle,
  Cancel,
  Warning,
  Download,
  RateReview,
  AttachFile,
  ThumbUp,
  ThumbDown,
  ChatBubbleOutline,
  ChatBubble,
  Schedule,
  PersonOutline,
  SmartToy,
  AutoAwesome,
  TrendingUp,
  MoreVert,
  Assignment,
  EditNote,
  CloudUpload,
  Delete,
  InsertDriveFile,
  CheckCircleOutline,
  ErrorOutline,
} from '@mui/icons-material'
import { complianceAPI, shipmentsAPI } from '../services/api'
import { format, isToday, isYesterday } from 'date-fns'
import { toast } from 'react-toastify'
import { PageSkeleton, LoadingOverlay } from '../components/LoadingStates'
import FormDialog from '../components/FormDialog'
import FormTextField from '../components/FormTextField'
import FormSelect from '../components/FormSelect'
import ShipmentQueries from '../components/ShipmentQueries'
import { useAuth } from '../contexts/AuthContext'
import {
  showSuccessAlert,
  showErrorAlert,
  showLoadingAlert,
  closeAlert,
} from '../utils/alerts'

const ComplianceDetail = () => {
  const { shipmentId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [shipment, setShipment] = useState(null)
  const [documents, setDocuments] = useState([])
  const [complianceSummary, setComplianceSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [viewingDocument, setViewingDocument] = useState(null)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [openUploadDialog, setOpenUploadDialog] = useState(false)
  const [openReviewDialog, setOpenReviewDialog] = useState(false)
  const [documentMenu, setDocumentMenu] = useState({ anchorEl: null, document: null })
  const queriesRef = React.useRef(null)
  
  // Document upload form - batch upload support
  const [documentFiles, setDocumentFiles] = useState({}) // { document_type: { file: File, title: string } }
  const [uploadProgress, setUploadProgress] = useState({}) // { document_type: { status: 'idle'|'uploading'|'success'|'error', progress: number } }
  const [otherDocuments, setOtherDocuments] = useState([]) // Array of { file: File, title: string, document_type: string }
  
  // Review form
  const [reviewForm, setReviewForm] = useState({
    status: 'approved',
    review_notes: '',
  })

  const documentTypes = [
    { value: 't1_document', label: 'T1 Document' },
    { value: 'certificate_of_origin', label: 'Certificate of Origin' },
    { value: 'bill_of_lading', label: 'Bill of Lading' },
    { value: 'packing_list', label: 'Packing List' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'pvoc', label: 'PVOC' },
    { value: 'proof_of_payment', label: 'Proof of Payment' },
    { value: 'im8', label: 'IM8' },
  ]

  useEffect(() => {
    if (shipmentId) {
      fetchData()
    }
  }, [shipmentId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [shipmentData, documentsData, summaryData] = await Promise.all([
        shipmentsAPI.get(shipmentId).catch(() => null),
        complianceAPI.getShipmentDocuments(shipmentId).catch(() => []),
        complianceAPI.getSummary(shipmentId).catch(() => null),
      ])
      
      setShipment(shipmentData)
      setDocuments(documentsData || [])
      setComplianceSummary(summaryData)
    } catch (error) {
      toast.error('Failed to load compliance data')
      console.error('Compliance detail fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDocument = async (document) => {
    try {
      const docData = await complianceAPI.viewDocument(document.id)
      setViewingDocument(docData)
      setOpenViewDialog(true)
    } catch (error) {
      showErrorAlert('Error', 'Failed to load document')
    }
  }

  const handleDownloadDocument = () => {
    if (!viewingDocument) return
    const byteCharacters = atob(viewingDocument.file_data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: viewingDocument.mime_type })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = viewingDocument.file_name || 'document'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64String = reader.result.split(',')[1]
        resolve(base64String)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const handleFileSelect = (documentType, file) => {
    if (!file) return
    
    const title = file.name.replace(/\.[^/.]+$/, '') // Use filename without extension as default title
    setDocumentFiles(prev => ({
      ...prev,
      [documentType]: { file, title }
    }))
    // Reset progress when new file is selected
    setUploadProgress(prev => ({
      ...prev,
      [documentType]: { status: 'idle', progress: 0 }
    }))
  }

  const handleRemoveFile = (documentType) => {
    setDocumentFiles(prev => {
      const updated = { ...prev }
      delete updated[documentType]
      return updated
    })
    setUploadProgress(prev => {
      const updated = { ...prev }
      delete updated[documentType]
      return updated
    })
  }

  const handleTitleChange = (documentType, title) => {
    setDocumentFiles(prev => ({
      ...prev,
      [documentType]: { ...prev[documentType], title }
    }))
  }

  const handleAddOtherDocument = (file) => {
    if (!file) return
    const title = file.name.replace(/\.[^/.]+$/, '')
    const newDoc = {
      id: `other-${Date.now()}`,
      file,
      title,
      document_type: 'other',
    }
    setOtherDocuments(prev => [...prev, newDoc])
  }

  const handleRemoveOtherDocument = (id) => {
    setOtherDocuments(prev => prev.filter(doc => doc.id !== id))
    // Also remove progress tracking for this document
    setUploadProgress(prev => {
      const updated = { ...prev }
      delete updated[`other-${id}`]
      return updated
    })
  }

  const handleOtherTitleChange = (id, title) => {
    setOtherDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, title } : doc
    ))
  }

  const handleUploadDocument = async () => {
    if (!shipment) {
      showErrorAlert('Validation Error', 'Shipment data not loaded')
      return
    }

    const allDocuments = [
      ...Object.entries(documentFiles).map(([documentType, { file, title }]) => ({
        documentType,
        file,
        title: title || file.name,
        id: documentType, // Use documentType as ID for standard documents
      })),
      ...otherDocuments.map(({ id, file, title, document_type }) => ({
        documentType: document_type,
        file,
        title: title || file.name,
        id: `other-${id}`, // Use the document's unique ID for other documents
      })),
    ]

    if (allDocuments.length === 0) {
      showErrorAlert('No Documents', 'Please select at least one document to upload')
      return
    }

    setSubmitting(true)
    
    // Initialize progress for all documents
    const initialProgress = {}
    allDocuments.forEach(({ documentType }) => {
      initialProgress[documentType] = { status: 'uploading', progress: 0 }
    })
    setUploadProgress(initialProgress)

    try {
      const uploadPromises = allDocuments.map(async ({ documentType, file, title, id }, index) => {
        const progressKey = id // Use the id directly
        
        try {
          // Simulate progress (since we can't track actual upload progress with base64)
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => ({
              ...prev,
              [progressKey]: {
                ...prev[progressKey],
                progress: Math.min((prev[progressKey]?.progress || 0) + 10, 90)
              }
            }))
          }, 200)

          const base64Data = await convertFileToBase64(file)
          clearInterval(progressInterval)
          
          setUploadProgress(prev => ({
            ...prev,
            [progressKey]: { status: 'uploading', progress: 95 }
          }))

          const documentData = {
            document_type: documentType,
            title: title || file.name,
            file_data: base64Data,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
          }
          
          const result = await complianceAPI.uploadDocumentForClient(shipment.client_id, documentData, shipment.id)
          
          // Mark as success
          setUploadProgress(prev => ({
            ...prev,
            [progressKey]: { status: 'success', progress: 100 }
          }))

          return result
        } catch (error) {
          // Mark as error
          setUploadProgress(prev => ({
            ...prev,
            [progressKey]: { status: 'error', progress: 0 }
          }))
          throw error
        }
      })

      await Promise.all(uploadPromises)
      
      // Wait a moment to show success indicators
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await showSuccessAlert('Success!', `Successfully uploaded ${allDocuments.length} document(s)`)
      setOpenUploadDialog(false)
      setDocumentFiles({})
      setOtherDocuments([])
      setUploadProgress({})
      fetchData()
    } catch (error) {
      showErrorAlert('Upload Failed', error.response?.data?.detail || 'Some documents failed to upload. Please check and retry.')
    } finally {
      setSubmitting(false)
    }
  }



  const handleOpenReviewDialog = (document) => {
    setViewingDocument(document)
    setReviewForm({
      status: document.review_status === 'approved' ? 'approved' : document.review_status === 'rejected' ? 'rejected' : 'approved',
      review_notes: document.review_notes || '',
    })
    setOpenReviewDialog(true)
  }

  const handleReviewDocument = async () => {
    if (!reviewForm.status || !viewingDocument) {
      showErrorAlert('Validation Error', 'Please select a review status')
      return
    }

    setSubmitting(true)
    const loadingAlert = showLoadingAlert('Reviewing Document...', 'Please wait')

    try {
      await complianceAPI.reviewDocument(viewingDocument.id, {
        status: reviewForm.status,
        review_notes: reviewForm.review_notes || null,
      })
      closeAlert()
      await showSuccessAlert('Success!', `Document ${reviewForm.status} successfully`)
      setOpenReviewDialog(false)
      fetchData()
    } catch (error) {
      closeAlert()
      showErrorAlert('Failed', error.response?.data?.detail || 'Failed to review document')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success'
      case 'rejected':
        return 'error'
      default:
        return 'warning'
    }
  }

  const handleOpenDocumentMenu = (event, document) => {
    event.stopPropagation()
    setDocumentMenu({ anchorEl: event.currentTarget, document })
  }

  const handleCloseDocumentMenu = () => {
    setDocumentMenu({ anchorEl: null, document: null })
  }

  const handleMenuView = () => {
    if (documentMenu.document) {
      handleViewDocument(documentMenu.document)
      handleCloseDocumentMenu()
    }
  }

  const handleMenuReview = () => {
    if (documentMenu.document) {
      handleOpenReviewDialog(documentMenu.document)
      handleCloseDocumentMenu()
    }
  }

  if (loading && !shipment) {
    return <PageSkeleton showHeader={true} showTable={false} />
  }

  if (!shipment) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back to Compliance
        </Button>
        <Alert severity="error">Shipment not found</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ pb: 5 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={3}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate(-1)}
            variant="text"
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            Back
          </Button>
          <Avatar
            variant="rounded"
            sx={{
              width: 56,
              height: 56,
              bgcolor: 'primary.light',
              color: 'primary.main',
              borderRadius: 2,
            }}
          >
            <VerifiedUser sx={{ fontSize: 32 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              Compliance Details
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalShipping fontSize="inherit" />
              {shipment.shipment_number} • {shipment.origin} → {shipment.destination}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={() => setOpenUploadDialog(true)}
              sx={{ borderRadius: 2 }}
            >
              Upload Document
            </Button>
            <Button
              variant="contained"
              startIcon={<Assignment />}
              onClick={() => {
                if (queriesRef.current) {
                  queriesRef.current.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              sx={{ borderRadius: 2, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              Issue Protocol
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={4}>
        {/* Shipment & Client Information */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assignment color="primary" /> Shipment Details
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Shipment Number
                    </Typography>
                    <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
                      {shipment.shipment_number}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Route
                    </Typography>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                      <LocationOn color="action" />
                      <Typography variant="body1" fontWeight={500}>
                        {shipment.origin} → {shipment.destination}
                      </Typography>
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={shipment.current_clearance_activity_name || shipment.status || 'N/A'}
                        color="primary"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business color="primary" /> Client Profile
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Client Name
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                      {shipment.client_name || shipment.consignee_name || 'N/A'}
                    </Typography>
                  </Box>
                  {shipment.client_company && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Company
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {shipment.client_company}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Contact Information
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Email fontSize="small" color="action" /> {shipment.consignee_email || 'No email provided'}
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Phone fontSize="small" color="action" /> {shipment.consignee_phone || 'No phone provided'}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Documents Section */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ borderRadius: 3, minHeight: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Compliance Documents
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  <Chip
                    label={`${documents.length} Uploaded`}
                    bgcolor="primary.light"
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  {complianceSummary && complianceSummary.missing_count > 0 && (
                    <Chip
                      label={`${complianceSummary.missing_count} Action Required`}
                      variant="outlined"
                      color="error"
                      size="small"
                      sx={{ fontWeight: 600, borderColor: 'error.main' }}
                    />
                  )}
                </Stack>
              </Stack>
              <Divider sx={{ mb: 3 }} />
              
              <TableContainer component={Box}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8F9FA' }}>
                      <TableCell sx={{ fontWeight: 700, py: 2 }}>Document</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 2 }}>Uploaded On</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 2 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, py: 2 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                          <Stack alignItems="center" spacing={2}>
                            <Description sx={{ fontSize: 48, color: 'text.disabled' }} />
                            <Typography variant="body1" color="text.secondary">
                              No compliance documents have been submitted yet.
                            </Typography>
                            <Button variant="outlined" onClick={() => setOpenUploadDialog(true)}>
                              Submit First Document
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ) : (
                      documents.map((doc) => (
                        <TableRow key={doc.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ py: 2 }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#F8F9FA', display: 'flex' }}>
                                <InsertDriveFile color="primary" />
                              </Box>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {doc.document_type?.replace(/_/g, ' ').toUpperCase()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {doc.file_name || 'View details'}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body2">
                              {doc.uploaded_at ? format(new Date(doc.uploaded_at), 'MMM dd, yyyy') : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip
                              label={doc.review_status?.toUpperCase() || 'PENDING'}
                              size="small"
                              sx={{ 
                                fontWeight: 700, 
                                fontSize: '0.65rem',
                                bgcolor: doc.review_status === 'approved' ? '#E3F2FD' : doc.review_status === 'rejected' ? '#1A1A1A' : '#F8F9FA',
                                color: doc.review_status === 'approved' ? '#0178A3' : doc.review_status === 'rejected' ? 'white' : 'text.secondary',
                                border: '1px solid',
                                borderColor: 'divider'
                              }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ py: 2 }}>
                            <Tooltip title="View & Review">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={(e) => handleOpenDocumentMenu(e, doc)}
                                sx={{ border: '1px solid', borderColor: 'divider' }}
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* View Document Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6">View Document</Typography>
              <Typography variant="caption" color="text.secondary">
                {viewingDocument?.title}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={<Download />}
                onClick={handleDownloadDocument}
                variant="outlined"
                size="small"
              >
                Download
              </Button>
              <IconButton onClick={() => setOpenViewDialog(false)} size="small">
                <Close />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {viewingDocument && (
            <Box>
              <Stack spacing={2} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="body2">
                      <strong>File Name:</strong> {viewingDocument.file_name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>MIME Type:</strong> {viewingDocument.mime_type}
                    </Typography>
                    {viewingDocument.file_size && (
                      <Typography variant="body2">
                        <strong>File Size:</strong> {(viewingDocument.file_size / 1024).toFixed(2)} KB
                      </Typography>
                    )}
                  </Box>
                  {viewingDocument.review_status && (
                    <Chip
                      label={viewingDocument.review_status.toUpperCase()}
                      color={getStatusColor(viewingDocument.review_status)}
                      size="medium"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Box>
                {viewingDocument.review_notes && (
                  <Alert severity={viewingDocument.review_status === 'approved' ? 'success' : viewingDocument.review_status === 'rejected' ? 'error' : 'info'}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Review Notes:
                    </Typography>
                    <Typography variant="body2">
                      {viewingDocument.review_notes}
                    </Typography>
                    {viewingDocument.reviewed_at && (
                      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        Reviewed on: {format(new Date(viewingDocument.reviewed_at), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    )}
                  </Alert>
                )}
              </Stack>
              {viewingDocument.mime_type?.startsWith('image/') ? (
                <Box
                  component="img"
                  src={`data:${viewingDocument.mime_type};base64,${viewingDocument.file_data}`}
                  alt={viewingDocument.title}
                  sx={{ maxWidth: '100%', height: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                />
              ) : viewingDocument.mime_type === 'application/pdf' ? (
                <Box
                  component="iframe"
                  src={`data:${viewingDocument.mime_type};base64,${viewingDocument.file_data}`}
                  sx={{
                    width: '100%',
                    height: '70vh',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                  title={viewingDocument.title}
                />
              ) : (
                <Alert severity="info">
                  Document preview not available for this file type. Please download to view.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog - Batch Upload */}
      <Dialog
        open={openUploadDialog}
        onClose={() => {
          if (!submitting) {
            setOpenUploadDialog(false)
            setDocumentFiles({})
          }
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <CloudUpload />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">Batch Upload Documents</Typography>
              <Typography variant="caption" color="text.secondary">
                Upload all required compliance documents for shipment {shipment?.shipment_number}
              </Typography>
            </Box>
            <IconButton 
              onClick={() => {
                if (!submitting) {
                  setOpenUploadDialog(false)
                  setDocumentFiles({})
                  setOtherDocuments([])
                  setUploadProgress({})
                }
              }}
              disabled={submitting}
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Upload compliance documents for shipment {shipment?.shipment_number}. 
              You can upload multiple documents at once and remove any before submitting.
            </Typography>
          </Alert>

          <Stack spacing={2}>
            {documentTypes.map((docType) => {
              const hasFile = !!documentFiles[docType.value]
              const fileData = documentFiles[docType.value]
              const progress = uploadProgress[docType.value]
              const isUploading = progress?.status === 'uploading'
              const isSuccess = progress?.status === 'success'
              const isError = progress?.status === 'error'

              return (
                <Card
                  key={docType.value}
                  variant="outlined"
                  sx={{
                    border: hasFile ? '2px solid' : '1px solid',
                    borderColor: isSuccess ? 'success.main' : hasFile ? 'primary.main' : 'divider',
                    bgcolor: isSuccess ? 'success.light' : hasFile ? 'primary.light' : 'background.paper',
                    transition: 'all 0.2s',
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          {isSuccess ? (
                            <CheckCircle color="success" />
                          ) : hasFile ? (
                            <CheckCircleOutline color="primary" />
                          ) : (
                            <Description color="action" />
                          )}
                          <Typography variant="subtitle1" fontWeight={600}>
                            {docType.label}
                          </Typography>
                          {isSuccess && (
                            <Chip
                              icon={<CheckCircle sx={{ fontSize: 14 }} />}
                              label="Uploaded"
                              color="success"
                              size="small"
                              sx={{ height: 22 }}
                            />
                          )}
                          {isUploading && (
                            <Chip
                              label="Uploading..."
                              color="primary"
                              size="small"
                              sx={{ height: 22 }}
                            />
                          )}
                          {isError && (
                            <Chip
                              icon={<ErrorOutline sx={{ fontSize: 14 }} />}
                              label="Failed"
                              color="error"
                              size="small"
                              sx={{ height: 22 }}
                            />
                          )}
                        </Stack>
                        {hasFile && !isUploading && !isSuccess && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveFile(docType.value)}
                            disabled={submitting}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>

                      {isUploading && (
                        <Box>
                          <LinearProgress
                            variant="determinate"
                            value={progress?.progress || 0}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {progress?.progress || 0}% uploaded
                          </Typography>
                        </Box>
                      )}

                      {hasFile && !isUploading && (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: 'white',
                            borderRadius: 2,
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: isSuccess ? 'success.light' : 'primary.light' }}>
                              {isSuccess ? (
                                <CheckCircle color="success" />
                              ) : (
                                <InsertDriveFile color="primary" />
                              )}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {fileData.file.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {(fileData.file.size / 1024).toFixed(2)} KB
                              </Typography>
                            </Box>
                            {!isSuccess && (
                              <Chip
                                icon={<CheckCircle sx={{ fontSize: 14 }} />}
                                label="Ready"
                                color="primary"
                                size="small"
                              />
                            )}
                          </Stack>
                          <TextField
                            label="Document Title"
                            value={fileData.title}
                            onChange={(e) => handleTitleChange(docType.value, e.target.value)}
                            fullWidth
                            size="small"
                            sx={{ mt: 2 }}
                            disabled={submitting || isSuccess}
                            placeholder="Enter a title for this document"
                          />
                        </Paper>
                      )}

                      {!hasFile && (
                        <Button
                          variant="outlined"
                          component="label"
                          fullWidth
                          startIcon={<Upload />}
                          disabled={submitting || isUploading}
                          sx={{
                            py: 2,
                            borderStyle: 'dashed',
                            borderWidth: 2,
                            '&:hover': {
                              borderStyle: 'dashed',
                              borderWidth: 2,
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          Select File
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileSelect(docType.value, e.target.files?.[0] || null)}
                          />
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )
            })}

            {/* Other Documents Section */}
            <Card
              variant="outlined"
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Description color="action" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Other Documents
                    </Typography>
                    <Chip
                      label="Optional"
                      size="small"
                      color="default"
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  </Stack>

                  {otherDocuments.map((doc) => {
                    const progress = uploadProgress[`other-${doc.id}`]
                    const isUploading = progress?.status === 'uploading'
                    const isSuccess = progress?.status === 'success'
                    const isError = progress?.status === 'error'

                    return (
                      <Paper
                        key={doc.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: isSuccess ? 'success.light' : 'white',
                          borderRadius: 2,
                          border: isSuccess ? '2px solid' : '1px solid',
                          borderColor: isSuccess ? 'success.main' : 'divider',
                        }}
                      >
                        <Stack spacing={1.5}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: isSuccess ? 'success.light' : 'primary.light' }}>
                              {isSuccess ? (
                                <CheckCircle color="success" />
                              ) : (
                                <InsertDriveFile color="primary" />
                              )}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {doc.file.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {(doc.file.size / 1024).toFixed(2)} KB
                              </Typography>
                            </Box>
                            {isSuccess && (
                              <Chip
                                icon={<CheckCircle sx={{ fontSize: 14 }} />}
                                label="Uploaded"
                                color="success"
                                size="small"
                              />
                            )}
                            {isUploading && (
                              <Chip
                                label="Uploading..."
                                color="primary"
                                size="small"
                              />
                            )}
                            {!isUploading && !isSuccess && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveOtherDocument(doc.id)}
                                disabled={submitting}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>
                          {isUploading && (
                            <Box>
                              <LinearProgress
                                variant="determinate"
                                value={progress?.progress || 0}
                                sx={{ height: 8, borderRadius: 1 }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {progress?.progress || 0}% uploaded
                              </Typography>
                            </Box>
                          )}
                          <TextField
                            label="Document Title"
                            value={doc.title}
                            onChange={(e) => handleOtherTitleChange(doc.id, e.target.value)}
                            fullWidth
                            size="small"
                            disabled={submitting || isSuccess}
                            placeholder="Enter a title for this document"
                          />
                        </Stack>
                      </Paper>
                    )
                  })}

                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<Upload />}
                    disabled={submitting}
                    sx={{
                      py: 2,
                      borderStyle: 'dashed',
                      borderWidth: 2,
                      '&:hover': {
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    Add Other Document
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleAddOtherDocument(e.target.files?.[0] || null)}
                    />
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                <strong>Selected:</strong> {Object.keys(documentFiles).length + otherDocuments.length} document(s)
              </Typography>
              <Box sx={{ flex: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={
                    Object.values(uploadProgress).filter(p => p?.status === 'success').length > 0
                      ? (Object.values(uploadProgress).filter(p => p?.status === 'success').length / 
                         (Object.keys(documentFiles).length + otherDocuments.length)) * 100
                      : 0
                  }
                  sx={{ height: 8, borderRadius: 1 }}
                  color="success"
                />
              </Box>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => {
              setOpenUploadDialog(false)
              setDocumentFiles({})
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUploadDocument}
            disabled={submitting || (Object.keys(documentFiles).length === 0 && otherDocuments.length === 0)}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CloudUpload />}
            sx={{
              minWidth: 150,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
              },
            }}
          >
            {submitting ? 'Uploading...' : `Upload ${Object.keys(documentFiles).length + otherDocuments.length} Document(s)`}
          </Button>
        </DialogActions>
      </Dialog>

      <Box ref={queriesRef} sx={{ mt: 4 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: '#FFFFFF' }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment color="primary" /> Official Compliance Protocols
          </Typography>
          <ShipmentQueries 
            shipmentId={shipmentId} 
            isAdmin={isAdmin} 
            user={user} 
          />
        </Paper>
      </Box>

      {/* Review Document Dialog */}
      <FormDialog
        open={openReviewDialog}
        onClose={() => setOpenReviewDialog(false)}
        title={`Review Document: ${viewingDocument?.title}`}
        onSubmit={handleReviewDocument}
        submitText={reviewForm.status === 'approved' ? 'Approve' : 'Reject'}
        loading={submitting}
        maxWidth="md"
      >
        <Alert severity="info" sx={{ mb: 2 }}>
          Review and approve or reject the document "{viewingDocument?.title}"
        </Alert>
        <Stack spacing={2.5}>
          <FormSelect
            label="Review Status"
            value={reviewForm.status}
            onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
            options={[
              { value: 'approved', label: 'Approve' },
              { value: 'rejected', label: 'Reject' },
            ]}
            required
            disabled={submitting}
          />
          <FormTextField
            label="Review Notes"
            value={reviewForm.review_notes}
            onChange={(e) => setReviewForm({ ...reviewForm, review_notes: e.target.value })}
            multiline
            rows={4}
            disabled={submitting}
            helperText="Optional notes about your review decision"
          />
          {viewingDocument?.review_status && (
            <Alert severity={viewingDocument.review_status === 'approved' ? 'success' : viewingDocument.review_status === 'rejected' ? 'error' : 'info'}>
              Current Status: <strong>{viewingDocument.review_status.toUpperCase()}</strong>
              {viewingDocument.review_notes && (
                <>
                  <br />
                  Previous Notes: {viewingDocument.review_notes}
                </>
              )}
            </Alert>
          )}
        </Stack>
      </FormDialog>

      {/* Document Actions Menu */}
      <Menu
        anchorEl={documentMenu.anchorEl}
        open={Boolean(documentMenu.anchorEl)}
        onClose={handleCloseDocumentMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleMenuView}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View Document" secondary="View document details and preview" />
        </MenuItem>
        <MenuItem onClick={handleMenuReview}>
          <ListItemIcon>
            <EditNote fontSize="small" color={documentMenu.document?.review_status === 'approved' ? 'success' : documentMenu.document?.review_status === 'rejected' ? 'error' : 'warning'} />
          </ListItemIcon>
          <ListItemText 
            primary="Review Document" 
            secondary="Approve or reject this document"
            primaryTypographyProps={{ 
              color: documentMenu.document?.review_status === 'approved' ? 'success.main' : documentMenu.document?.review_status === 'rejected' ? 'error.main' : 'warning.main'
            }}
          />
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default ComplianceDetail

