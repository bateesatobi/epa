import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Upload,
  CheckCircle,
  Cancel,
  Description,
  CloudUpload,
} from '@mui/icons-material'
import FormDialog from '../components/FormDialog'
import FormTextField from '../components/FormTextField'
import FormSelect from '../components/FormSelect'
import { clientsAPI } from '../services/api'
import {
  showSuccessAlert,
  showErrorAlert,
  showLoadingAlert,
  closeAlert,
} from '../utils/alerts'
import { format } from 'date-fns'

const ClientDashboard = () => {
  const [documentStatus, setDocumentStatus] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [openUploadDialog, setOpenUploadDialog] = useState(false)
  const [uploadData, setUploadData] = useState({
    document_type: '',
    title: '',
    file: null,
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
    { value: 'other', label: 'Other' },
  ]

  useEffect(() => {
    fetchDocumentStatus()
  }, [])

  const fetchDocumentStatus = async () => {
    try {
      setLoading(true)
      const status = await clientsAPI.getDocumentStatus()
      setDocumentStatus(status)
    } catch (error) {
      showErrorAlert('Failed', 'Failed to load document status')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadData({ ...uploadData, file })
    }
  }

  const convertFileToBase64 = (file) => {
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

  const handleUpload = async () => {
    if (!uploadData.document_type || !uploadData.title || !uploadData.file) {
      showErrorAlert('Validation Error', 'Please fill in all fields and select a file')
      return
    }

    setSubmitting(true)
    const loadingAlert = showLoadingAlert('Uploading Document...', 'Please wait')

    try {
      const base64Data = await convertFileToBase64(uploadData.file)
      const documentData = {
        document_type: uploadData.document_type,
        title: uploadData.title,
        file_data: base64Data,
        file_name: uploadData.file.name,
        file_size: uploadData.file.size,
        mime_type: uploadData.file.type,
      }

      await clientsAPI.uploadDocument(documentData)
      closeAlert()
      await showSuccessAlert('Success!', 'Document uploaded successfully')
      setOpenUploadDialog(false)
      setUploadData({ document_type: '', title: '', file: null })
      fetchDocumentStatus()
    } catch (error) {
      closeAlert()
      showErrorAlert('Upload Failed', error.response?.data?.detail || 'Failed to upload document')
    } finally {
      setSubmitting(false)
    }
  }

  const uploadedCount = documentStatus.filter((doc) => doc.is_uploaded).length
  const totalCount = documentStatus.filter((doc) => doc.document_type !== 'other').length

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>
          Client Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Upload />}
          onClick={() => setOpenUploadDialog(true)}
        >
          Upload Document
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Documents Uploaded
              </Typography>
              <Typography variant="h3" color="primary">
                {uploadedCount} / {totalCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalCount - uploadedCount} documents remaining
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Completion Rate
              </Typography>
              <Typography variant="h3" color="primary">
                {totalCount > 0 ? Math.round((uploadedCount / totalCount) * 100) : 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0}
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status
              </Typography>
              <Chip
                label="Active"
                color="success"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Compliance Documents Status
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Document Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Uploaded Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documentStatus.map((doc, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {doc.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={doc.is_uploaded ? <CheckCircle /> : <Cancel />}
                          label={doc.is_uploaded ? 'Uploaded' : 'Missing'}
                          color={doc.is_uploaded ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {doc.uploaded_at
                          ? format(new Date(doc.uploaded_at), 'MMM dd, yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell align="right">
                        {doc.is_uploaded ? (
                          <IconButton size="small" color="primary">
                            <Description />
                          </IconButton>
                        ) : (
                          <Button
                            size="small"
                            startIcon={<CloudUpload />}
                            onClick={() => {
                              setUploadData({
                                document_type: doc.document_type,
                                title: doc.title,
                                file: null,
                              })
                              setOpenUploadDialog(true)
                            }}
                          >
                            Upload
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <FormDialog
        open={openUploadDialog}
        onClose={() => {
          setOpenUploadDialog(false)
          setUploadData({ document_type: '', title: '', file: null })
        }}
        title="Upload Compliance Document"
        onSubmit={handleUpload}
        submitText="Upload Document"
        loading={submitting}
        maxWidth="sm"
      >
        <Alert severity="info" sx={{ mb: 2 }}>
          Upload your compliance documents. All documents are optional but recommended.
        </Alert>
        <FormSelect
          label="Document Type"
          value={uploadData.document_type}
          onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
          options={documentTypes}
          required
          disabled={submitting}
        />
        <FormTextField
          label="Document Title"
          value={uploadData.title}
          onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
          required
          disabled={submitting}
          helperText="Enter a descriptive title for this document"
        />
        <Box sx={{ mt: 2, mb: 2 }}>
          <Button variant="outlined" component="label" fullWidth sx={{ py: 1.5 }}>
            Select File
            <input type="file" hidden onChange={handleFileSelect} />
          </Button>
          {uploadData.file && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Selected: {uploadData.file.name} ({(uploadData.file.size / 1024).toFixed(2)} KB)
            </Typography>
          )}
        </Box>
      </FormDialog>
    </Box>
  )
}

export default ClientDashboard







