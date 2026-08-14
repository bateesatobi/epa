import React, { useEffect, useMemo } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { Close, Download, Description } from '@mui/icons-material'
import {
  canPreviewInline,
  createBlobUrl,
  downloadBase64Document,
  isPreviewableImage,
  revokeBlobUrl,
} from '../../utils/documentPreview'

export default function DocumentPreviewDialog({ open, document, onClose }) {
  const previewUrl = useMemo(() => {
    if (!open || !document?.file_data) return null
    return createBlobUrl({
      file_data: document.file_data,
      mime_type: document.mime_type,
    })
  }, [open, document?.file_data, document?.mime_type])

  useEffect(() => {
    return () => revokeBlobUrl(previewUrl)
  }, [previewUrl])

  const title = document?.title || document?.file_name || 'Document'
  const mime = document?.mime_type || ''
  const inline = canPreviewInline(mime)

  const handleDownload = () => {
    downloadBase64Document({
      file_data: document?.file_data,
      mime_type: document?.mime_type,
      file_name: document?.file_name || title,
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #EEF2F6', display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        <IconButton onClick={onClose}><Close /></IconButton>
      </Box>
      <DialogContent sx={{ p: 0, bgcolor: '#F8FAFC', minHeight: 360 }}>
        {!document?.file_data || !previewUrl ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No preview available.</Typography>
          </Box>
        ) : inline && isPreviewableImage(mime) ? (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Box component="img" src={previewUrl} alt={title} sx={{ maxWidth: '100%', maxHeight: '70vh' }} />
          </Box>
        ) : inline ? (
          <Box component="iframe" src={previewUrl} title={title} sx={{ width: '100%', height: '70vh', border: 0 }} />
        ) : (
          <Stack alignItems="center" spacing={2} sx={{ p: 4 }}>
            <Description sx={{ fontSize: 48, color: '#94A3B8' }} />
            <Typography>Preview not supported — download to view.</Typography>
            <Button variant="contained" startIcon={<Download />} onClick={handleDownload}>Download</Button>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDownload} startIcon={<Download />}>Download</Button>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  )
}
