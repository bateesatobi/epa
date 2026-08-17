import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  CheckCircle,
  Close,
  CloudUpload,
  DeleteOutline,
  EditNote,
  Visibility,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { ACCEPTED_DOCUMENT_FILES, REQUIRED_DOC_TYPES } from '../../constants/requiredDocumentTypes'
import { groupDocumentsByType, reviewStatusColor } from '../../utils/complianceDocuments'

/**
 * Standard consignment document upload layout — required slots + other documents.
 * Used by field staff workspace and admin compliance tab.
 */
export default function ConsignmentDocumentPanel({
  shipment,
  documents = [],
  loading = false,
  canUpload = true,
  showReviewStatus = false,
  onUploadRequired,
  onUploadOther,
  onViewDoc,
  onDeleteDoc,
  onReviewDoc,
  uploadingType = null,
  uploadingOther = false,
  initialOpenOther = false,
}) {
  const [otherDialogOpen, setOtherDialogOpen] = useState(false)
  const [otherForm, setOtherForm] = useState({ title: '', file: null })

  const { byType: docsByType, other: otherDocuments } = useMemo(
    () => groupDocumentsByType(documents),
    [documents]
  )

  useEffect(() => {
    if (initialOpenOther && canUpload) {
      setOtherForm({ title: '', file: null })
      setOtherDialogOpen(true)
    }
  }, [initialOpenOther, canUpload])

  const openOtherDialog = () => {
    setOtherForm({ title: '', file: null })
    setOtherDialogOpen(true)
  }

  const handleUploadOther = async () => {
    if (!otherForm.file || !String(otherForm.title || '').trim()) return
    try {
      await onUploadOther?.(otherForm.title.trim(), otherForm.file)
      setOtherDialogOpen(false)
      setOtherForm({ title: '', file: null })
    } catch {
      // Parent surfaces the error; keep dialog open for retry.
    }
  }

  const clientMissing = !shipment?.client_id

  if (loading) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Stack spacing={2}>
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        Upload required operational documents. For additional files, use Other Documents — each needs its own title.
      </Alert>

      {clientMissing && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          This mission is not linked to a client portal account. Documents are stored on the consignment only.
        </Alert>
      )}

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
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
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
                  {showReviewStatus && uploaded && (
                    <Chip
                      size="small"
                      label={(uploaded.review_status || 'pending').toUpperCase()}
                      color={reviewStatusColor(uploaded.review_status)}
                      sx={{ fontWeight: 700, height: 22, fontSize: '0.65rem' }}
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
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {uploaded && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => onViewDoc?.(uploaded)}
                    sx={{ fontWeight: 700 }}
                  >
                    View
                  </Button>
                )}
                {showReviewStatus && uploaded && onReviewDoc && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditNote />}
                    onClick={() => onReviewDoc(uploaded)}
                    sx={{ fontWeight: 700 }}
                  >
                    Review
                  </Button>
                )}
                {showReviewStatus && uploaded && onDeleteDoc && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDeleteDoc(uploaded)}
                    aria-label={`Delete ${type.label}`}
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                )}
                {canUpload && (
                  <Button
                    size="small"
                    variant="contained"
                    component="label"
                    disabled={busy}
                    startIcon={
                      busy ? <CircularProgress size={14} color="inherit" /> : <CloudUpload />
                    }
                    sx={{ fontWeight: 800 }}
                  >
                    {uploaded ? 'Replace' : 'Upload'}
                    <input
                      hidden
                      type="file"
                      accept={ACCEPTED_DOCUMENT_FILES}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (file) onUploadRequired?.(type.value, file)
                      }}
                    />
                  </Button>
                )}
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
          {canUpload && (
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={openOtherDialog}
              sx={{ fontWeight: 800 }}
            >
              Add other document
            </Button>
          )}
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
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="body2" fontWeight={800} noWrap>
                      {doc.title || 'Untitled'}
                    </Typography>
                    <Chip size="small" label="Other" sx={{ height: 20, fontWeight: 700 }} />
                    {showReviewStatus && (
                      <Chip
                        size="small"
                        label={(doc.review_status || 'pending').toUpperCase()}
                        color={reviewStatusColor(doc.review_status)}
                        sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }}
                      />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {doc.file_name || 'Document'}
                    {doc.uploaded_at
                      ? ` · ${format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}`
                      : ''}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5} flexShrink={0}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => onViewDoc?.(doc)}
                    sx={{ fontWeight: 700 }}
                  >
                    View
                  </Button>
                  {showReviewStatus && onReviewDoc && (
                    <IconButton size="small" onClick={() => onReviewDoc(doc)} aria-label="Review document">
                      <EditNote fontSize="small" />
                    </IconButton>
                  )}
                  {showReviewStatus && onDeleteDoc && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDeleteDoc(doc)}
                      aria-label="Delete document"
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

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
                accept={ACCEPTED_DOCUMENT_FILES}
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
    </Stack>
  )
}
