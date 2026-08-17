import React, { useEffect, useState } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { complianceAPI } from '../../services/api'
import FormDialog from '../FormDialog'
import FormSelect from '../FormSelect'
import FormTextField from '../FormTextField'
import DocumentPreviewDialog from '../portal/DocumentPreviewDialog'
import ConsignmentDocumentPanel from './ConsignmentDocumentPanel'
import {
  closeAlert,
  showConfirmDialog,
  showErrorAlert,
  showLoadingAlert,
  showSuccessAlert,
} from '../../utils/alerts'

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = reject
  })

export default function ConsignmentDocuments({
  shipment,
  canManage = false,
  onChanged,
  initialOpenUpload = false,
}) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingType, setUploadingType] = useState(null)
  const [uploadingOther, setUploadingOther] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewingDocument, setReviewingDocument] = useState(null)
  const [reviewForm, setReviewForm] = useState({ status: 'approved', review_notes: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  const loadDocuments = async () => {
    if (!shipment?.id) return
    setLoading(true)
    try {
      const data = await complianceAPI.getShipmentDocuments(shipment.id)
      setDocuments(Array.isArray(data) ? data : [])
    } catch (error) {
      showErrorAlert('Failed', error.response?.data?.detail || 'Could not load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipment?.id])

  const uploadDocument = async (docType, file, titleOverride) => {
    if (!file || !shipment?.id) return
    const title =
      String(titleOverride || '').trim() ||
      file.name.replace(/\.[^/.]+$/, '').slice(0, 255) ||
      docType

    const busyKey = docType === 'other' ? 'other' : docType
    if (docType === 'other') {
      setUploadingOther(true)
    } else {
      setUploadingType(busyKey)
    }

    try {
      const file_data = await fileToBase64(file)
      const payload = {
        document_type: docType,
        title: title.slice(0, 255),
        file_data,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
      }
      if (shipment.client_id) {
        await complianceAPI.uploadDocumentForClient(shipment.client_id, payload, shipment.id)
      } else {
        await complianceAPI.uploadDocumentForShipment(shipment.id, payload)
      }
      await showSuccessAlert('Uploaded', 'Document saved')
      await loadDocuments()
      onChanged?.()
    } catch (error) {
      showErrorAlert('Failed', error.response?.data?.detail || 'Could not upload document')
      throw error
    } finally {
      setUploadingType(null)
      setUploadingOther(false)
    }
  }

  const handleViewDoc = async (doc) => {
    try {
      const full = await complianceAPI.viewDocument(doc.id)
      setPreviewDoc(full)
    } catch (error) {
      showErrorAlert('Failed', error.response?.data?.detail || 'Could not open document')
    }
  }

  const handleDeleteDoc = async (doc) => {
    const result = await showConfirmDialog(
      'Delete document',
      `Permanently delete "${doc.title || doc.file_name}"? This cannot be undone.`,
      'Yes, delete'
    )
    if (!result.isConfirmed) return
    showLoadingAlert('Deleting document...')
    try {
      await complianceAPI.deleteDocument(doc.id)
      closeAlert()
      await showSuccessAlert('Deleted', 'Document removed')
      await loadDocuments()
      onChanged?.()
    } catch (error) {
      closeAlert()
      showErrorAlert('Failed', error.response?.data?.detail || 'Could not delete document')
    }
  }

  const openReviewDialog = (doc) => {
    setReviewingDocument(doc)
    setReviewForm({
      status: doc.review_status === 'rejected' ? 'rejected' : 'approved',
      review_notes: doc.review_notes || '',
    })
    setReviewDialogOpen(true)
  }

  const handleReview = async () => {
    if (!reviewingDocument) return
    setSubmittingReview(true)
    showLoadingAlert('Saving review...')
    try {
      await complianceAPI.reviewDocument(reviewingDocument.id, {
        status: reviewForm.status,
        review_notes: reviewForm.review_notes || null,
      })
      closeAlert()
      await showSuccessAlert('Saved', `Document ${reviewForm.status}`)
      setReviewDialogOpen(false)
      setReviewingDocument(null)
      await loadDocuments()
      onChanged?.()
    } catch (error) {
      closeAlert()
      showErrorAlert('Failed', error.response?.data?.detail || 'Could not review document')
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h6" fontWeight={800}>
            Compliance documents
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Required operational documents and additional files for this consignment.
          </Typography>
        </Box>

        <ConsignmentDocumentPanel
          shipment={shipment}
          documents={documents}
          loading={loading}
          canUpload={canManage}
          showReviewStatus={canManage}
          onUploadRequired={(docType, file) => uploadDocument(docType, file)}
          onUploadOther={(title, file) => uploadDocument('other', file, title)}
          onViewDoc={handleViewDoc}
          onDeleteDoc={canManage ? handleDeleteDoc : undefined}
          onReviewDoc={canManage ? openReviewDialog : undefined}
          uploadingType={uploadingType}
          uploadingOther={uploadingOther}
          initialOpenOther={initialOpenUpload}
        />
      </Stack>

      <DocumentPreviewDialog
        open={!!previewDoc}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      <FormDialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        title={`Review: ${reviewingDocument?.title || 'document'}`}
        onSubmit={handleReview}
        submitText={reviewForm.status === 'approved' ? 'Approve' : 'Reject'}
        loading={submittingReview}
        maxWidth="sm"
      >
        <Stack spacing={2}>
          <FormSelect
            label="Review status"
            value={reviewForm.status}
            onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
            options={[
              { value: 'approved', label: 'Approve' },
              { value: 'rejected', label: 'Reject' },
            ]}
            required
          />
          <FormTextField
            label="Notes"
            value={reviewForm.review_notes}
            onChange={(e) => setReviewForm({ ...reviewForm, review_notes: e.target.value })}
            multiline
            rows={3}
          />
        </Stack>
      </FormDialog>
    </Paper>
  )
}
