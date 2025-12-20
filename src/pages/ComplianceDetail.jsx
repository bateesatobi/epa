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
import { format } from 'date-fns'
import { toast } from 'react-toastify'
import FormDialog from '../components/FormDialog'
import FormTextField from '../components/FormTextField'
import FormSelect from '../components/FormSelect'
import {
  showSuccessAlert,
  showErrorAlert,
  showLoadingAlert,
  closeAlert,
} from '../utils/alerts'

const ComplianceDetail = () => {
  const { shipmentId } = useParams()
  const navigate = useNavigate()
  const [shipment, setShipment] = useState(null)
  const [documents, setDocuments] = useState([])
  const [complianceSummary, setComplianceSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [viewingDocument, setViewingDocument] = useState(null)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [openUploadDialog, setOpenUploadDialog] = useState(false)
  const [openQueryDrawer, setOpenQueryDrawer] = useState(false)
  const [openReviewDialog, setOpenReviewDialog] = useState(false)
  const [communications, setCommunications] = useState([])
  const [documentMenu, setDocumentMenu] = useState({ anchorEl: null, document: null })
  
  // Document upload form - batch upload support
  const [documentFiles, setDocumentFiles] = useState({}) // { document_type: { file: File, title: string } }
  const [uploadProgress, setUploadProgress] = useState({}) // { document_type: { status: 'idle'|'uploading'|'success'|'error', progress: number } }
  const [otherDocuments, setOtherDocuments] = useState([]) // Array of { file: File, title: string, document_type: string }
  
  // Query/Communication form
  const [queryForm, setQueryForm] = useState({
    message: '',
  })
  
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

  const messagesEndRef = React.useRef(null)

  useEffect(() => {
    if (shipmentId) {
      fetchData()
    }
  }, [shipmentId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && openQueryDrawer) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [communications, openQueryDrawer])

  const fetchCommunications = async () => {
    if (!shipment?.client_id) return
    
    try {
      const comms = await complianceAPI.getClientCommunications(shipment.client_id, shipmentId)
      // API already returns messages sorted by created_at ascending (oldest first)
      setCommunications(comms || [])
    } catch (error) {
      console.error('Failed to load communications:', error)
      setCommunications([])
    }
  }

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
      
      // Fetch communications after we have the shipment data
      if (shipmentData?.client_id) {
        await fetchCommunications()
      }
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

  const handleSendQuery = async () => {
    if (!queryForm.message || !queryForm.message.trim()) {
      showErrorAlert('Validation Error', 'Please enter a message')
      return
    }

    if (!shipment) {
      showErrorAlert('Validation Error', 'Shipment data not loaded')
      return
    }

    const messageText = queryForm.message.trim()
    setSubmitting(true)

    // Optimistically add message to UI (will be replaced with server response)
    const tempMessage = {
      id: `temp-${Date.now()}`,
      client_id: shipment.client_id,
      shipment_id: shipment.id,
      sender_id: null,
      sender_type: 'admin',
      sender_name: 'You', // Will be replaced with actual name from server
      subject: null,
      message: messageText,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
    }
    
    // Add optimistic message
    setCommunications(prev => [...prev, tempMessage])
    setQueryForm({ message: '' })

    try {
      const response = await complianceAPI.queryClient(shipment.client_id, {
        subject: '', // Empty subject as per requirement
        message: messageText,
        shipment_id: shipment.id,
      })
      
      // Replace optimistic message with server response
      setCommunications(prev => {
        const filtered = prev.filter(msg => msg.id !== tempMessage.id)
        return [...filtered, response].sort((a, b) => {
          const dateA = new Date(a.created_at || 0)
          const dateB = new Date(b.created_at || 0)
          return dateA - dateB
        })
      })
    } catch (error) {
      // Remove optimistic message on error
      setCommunications(prev => prev.filter(msg => msg.id !== tempMessage.id))
      showErrorAlert('Failed', error.response?.data?.detail || 'Failed to send message')
      // Restore message text so user can retry
      setQueryForm({ message: messageText })
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!shipment) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/compliance')} sx={{ mb: 2 }}>
          Back to Compliance
        </Button>
        <Alert severity="error">Shipment not found</Alert>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/compliance')}>
          Back
        </Button>
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
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 0 }}>
            Compliance Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {shipment.shipment_number} - {shipment.origin} → {shipment.destination}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setOpenUploadDialog(true)}
          >
            Upload Document
          </Button>
          <Button
            variant="contained"
            startIcon={<Message />}
            onClick={() => setOpenQueryDrawer(true)}
          >
            Query Client
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Shipment Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Shipment Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Shipment Number
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {shipment.shipment_number}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Route
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body1">
                      {shipment.origin} → {shipment.destination}
                    </Typography>
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={shipment.current_clearance_activity_name || shipment.status || 'N/A'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                {shipment.created_at && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(shipment.created_at), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Client Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Person fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Name
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={500}>
                    {shipment.client_name || shipment.consignee_name || 'N/A'}
                  </Typography>
                </Box>
                {shipment.client_company && (
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Business fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Company
                      </Typography>
                    </Stack>
                    <Typography variant="body1">
                      {shipment.client_company}
                    </Typography>
                  </Box>
                )}
                {shipment.consignee_email && (
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                    </Stack>
                    <Typography variant="body2">
                      {shipment.consignee_email}
                    </Typography>
                  </Box>
                )}
                {shipment.consignee_phone && (
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Phone fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                    </Stack>
                    <Typography variant="body2">
                      {shipment.consignee_phone}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Documents Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">
                  Documents
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={`${documents.length} Document${documents.length !== 1 ? 's' : ''} Uploaded`}
                    color="success"
                    size="small"
                  />
                  {complianceSummary && complianceSummary.missing_count > 0 && (
                    <Chip
                      label={`${complianceSummary.missing_count} Missing`}
                      color="error"
                      size="small"
                    />
                  )}
                </Stack>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Document Type</TableCell>
                      <TableCell>Uploaded</TableCell>
                      <TableCell>Review Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                            No documents uploaded yet
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      documents.map((doc) => (
                        <TableRow key={doc.id} hover>
                          <TableCell>
                            <Chip
                              label={doc.document_type?.replace(/_/g, ' ').toUpperCase()}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {doc.uploaded_at
                              ? format(new Date(doc.uploaded_at), 'MMM dd, yyyy HH:mm')
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={doc.review_status?.toUpperCase() || 'PENDING'}
                              color={getStatusColor(doc.review_status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Actions">
                              <IconButton
                                size="small"
                                onClick={(e) => handleOpenDocumentMenu(e, doc)}
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

      {/* Query Client Drawer */}
      <Drawer
        anchor="right"
        open={openQueryDrawer}
        onClose={() => setOpenQueryDrawer(false)}
        PaperProps={{
          sx: { 
            width: { xs: '100%', sm: 500 },
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
          {/* Header */}
          <Box
            sx={{
              p: 3,
              bgcolor: 'primary.main',
              color: 'white',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    width: 48,
                    height: 48,
                  }}
                >
                  <ChatBubble sx={{ fontSize: 28 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Client Communication
                  </Typography>
                  {shipment?.client_name && (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                      <PersonOutline sx={{ fontSize: 14 }} />
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {shipment.client_name}
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Stack>
              <IconButton 
                onClick={() => setOpenQueryDrawer(false)}
                sx={{ 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <Close />
              </IconButton>
            </Stack>
            {shipment?.shipment_number && (
              <Chip
                icon={<LocalShipping sx={{ color: 'white !important' }} />}
                label={`Shipment: ${shipment.shipment_number}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              />
            )}
          </Box>
          
          {/* Messages List - Chat Style */}
          <Box 
            sx={{ 
              flex: 1, 
              overflow: 'auto', 
              mb: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              p: 2,
              bgcolor: 'grey.50',
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.05) 0%, transparent 50%)',
            }}
          >
            {communications.length === 0 ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%',
                  textAlign: 'center',
                  px: 3,
                }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'primary.light',
                    mb: 2,
                  }}
                >
                  <ChatBubbleOutline sx={{ fontSize: 40, color: 'primary.main' }} />
                </Avatar>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No messages yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Start the conversation by sending a message below
                </Typography>
                <Chip
                  icon={<AutoAwesome sx={{ fontSize: 16 }} />}
                  label="Type your message and press Enter"
                  size="small"
                  sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}
                />
              </Box>
            ) : (
              communications.map((comm, index) => {
                const isAdmin = comm.sender_type === 'admin'
                const prevComm = index > 0 ? communications[index - 1] : null
                const showDateSeparator = !prevComm || 
                  format(new Date(comm.created_at), 'yyyy-MM-dd') !== format(new Date(prevComm.created_at), 'yyyy-MM-dd')
                
                return (
                  <React.Fragment key={comm.id || index}>
                    {showDateSeparator && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <Chip
                          icon={<Schedule sx={{ fontSize: 14 }} />}
                          label={format(new Date(comm.created_at), 'MMM dd, yyyy')}
                          size="small"
                          sx={{ 
                            bgcolor: 'white',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: 1,
                          }}
                        />
                      </Box>
                    )}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                        mb: 0.5,
                      }}
                    >
                        <Box
                          sx={{
                            maxWidth: '75%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isAdmin ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, px: 1 }}>
                            {comm.sender_name && (
                              <>
                                <Avatar
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    bgcolor: isAdmin ? 'primary.main' : 'grey.400',
                                    fontSize: '0.6rem',
                                  }}
                                >
                                  {isAdmin ? <PersonOutline sx={{ fontSize: 12 }} /> : <Person sx={{ fontSize: 12 }} />}
                                </Avatar>
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary" 
                                  sx={{ fontSize: '0.7rem', fontWeight: 500 }}
                                >
                                  {comm.sender_name}
                                </Typography>
                              </>
                            )}
                          </Stack>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 3,
                              background: isAdmin 
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                : 'white',
                              color: isAdmin ? 'white' : 'black',
                              boxShadow: isAdmin 
                                ? '0 2px 8px rgba(102, 126, 234, 0.3)' 
                                : '0 2px 8px rgba(0,0,0,0.08)',
                              position: 'relative',
                              maxWidth: '100%',
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                [isAdmin ? 'right' : 'left']: -8,
                                top: 12,
                                width: 0,
                                height: 0,
                                borderTop: '8px solid transparent',
                                borderBottom: '8px solid transparent',
                                [isAdmin ? 'borderLeft' : 'borderRight']: `8px solid ${isAdmin ? '#667eea' : 'white'}`,
                              },
                            }}
                          >
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                wordBreak: 'break-word',
                                lineHeight: 1.5,
                                color: isAdmin ? 'white' : 'black',
                              }}
                            >
                              {comm.message}
                            </Typography>
                          </Box>
                          <Stack 
                            direction="row" 
                            spacing={0.5} 
                            alignItems="center"
                            sx={{ mt: 0.5, px: 1 }}
                          >
                            <Schedule sx={{ fontSize: 12, color: 'text.secondary' }} />
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ fontSize: '0.7rem' }}
                            >
                              {comm.created_at ? format(new Date(comm.created_at), 'HH:mm') : ''}
                              {comm.created_at && ` • ${format(new Date(comm.created_at), 'MMM dd')}`}
                            </Typography>
                          </Stack>
                        </Box>
                    </Box>
                  </React.Fragment>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Send Message Form */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'white',
              borderTop: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-end">
              <Box sx={{ flex: 1, position: 'relative' }}>
                <TextField
                  placeholder="Type your message here..."
                  value={queryForm.message}
                  onChange={(e) => setQueryForm({ message: e.target.value })}
                  multiline
                  maxRows={4}
                  disabled={submitting}
                  fullWidth
                  size="small"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (queryForm.message.trim()) {
                        handleSendQuery()
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Message sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 4,
                      bgcolor: 'grey.50',
                      '&:hover': {
                        bgcolor: 'grey.100',
                      },
                      '&.Mui-focused': {
                        bgcolor: 'white',
                        boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.1)',
                      },
                    },
                  }}
                />
                {queryForm.message.trim() && (
                  <Chip
                    icon={<TrendingUp sx={{ fontSize: 12 }} />}
                    label="Press Enter to send"
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: -20,
                      left: 8,
                      height: 18,
                      fontSize: '0.65rem',
                      bgcolor: 'primary.light',
                      color: 'primary.dark',
                    }}
                  />
                )}
              </Box>
              <IconButton
                onClick={handleSendQuery}
                disabled={submitting || !queryForm.message.trim()}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  width: 40,
                  height: 40,
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'grey.300',
                    color: 'grey.500',
                    boxShadow: 'none',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {submitting ? (
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                ) : (
                  <Send sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </Stack>
          </Box>
        </Box>
      </Drawer>

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

