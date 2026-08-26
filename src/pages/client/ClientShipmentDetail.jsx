import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material'
import { ArrowBack, Upload, Description } from '@mui/icons-material'
import { clientPortalAPI } from '../../services/clientPortalApi'
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts'
import { formatShipmentStatusLabel, isMissionClosed } from '../../utils/shipmentStatus'
import { ArrivalMeta } from '../../components/consignment/ArrivalCountdownChip'

const DOC_TYPES = [
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

export default function ClientShipmentDetail() {
  const { shipmentId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState(searchParams.get('tab') === 'documents' ? 0 : 0)
  const [shipment, setShipment] = useState(null)
  const [documents, setDocuments] = useState([])
  const [comments, setComments] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [upload, setUpload] = useState({ document_type: '', title: '', file: null })
  const [comment, setComment] = useState('')
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [s, docs, comm, hist] = await Promise.all([
        clientPortalAPI.getShipment(shipmentId),
        clientPortalAPI.getShipmentDocuments(shipmentId).catch(() => []),
        clientPortalAPI.getComments(shipmentId).catch(() => []),
        clientPortalAPI.getClearanceHistory(shipmentId).catch(() => []),
      ])
      setShipment(s)
      setDocuments(Array.isArray(docs) ? docs : docs.items || [])
      setComments(Array.isArray(comm) ? comm : comm.items || [])
      setHistory(Array.isArray(hist) ? hist : hist.items || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [shipmentId])

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleUpload = async () => {
    if (!upload.document_type || !upload.file) {
      showErrorAlert('Missing fields', 'Select document type and file')
      return
    }
    if (upload.document_type === 'other' && !String(upload.title || '').trim()) {
      showErrorAlert('Title required', 'Enter a title for this Other document before uploading')
      return
    }
    setUploading(true)
    try {
      const file_data = await fileToBase64(upload.file)
      await clientPortalAPI.uploadDocument(
        {
          document_type: upload.document_type,
          title:
            upload.document_type === 'other'
              ? upload.title.trim()
              : upload.title || upload.file.name,
          file_data,
          file_name: upload.file.name,
          file_size: upload.file.size,
          mime_type: upload.file.type,
        },
        shipmentId
      )
      showSuccessAlert('Uploaded', 'Document uploaded successfully')
      setUpload({ document_type: '', title: '', file: null })
      load()
    } catch (e) {
      showErrorAlert('Upload failed', e.response?.data?.detail || 'Could not upload document')
    } finally {
      setUploading(false)
    }
  }

  const postComment = async () => {
    if (!comment.trim()) return
    await clientPortalAPI.postComment(shipmentId, comment.trim())
    setComment('')
    load()
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/client/consignments')} sx={{ mb: 2 }}>
        Back to consignments
      </Button>

      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #01A3DA 0%, #0178A3 100%)',
          color: '#fff',
        }}
      >
        <Typography variant="overline" fontWeight={700}>
          CONSIGNMENT
        </Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h4" fontWeight={800}>
            {shipment?.shipment_number}
          </Typography>
          <Chip label={formatShipmentStatusLabel(shipment?.status)} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, textTransform: 'capitalize' }} />
        </Stack>
        <Typography sx={{ mt: 1, opacity: 0.9 }}>
          {shipment?.origin} → {shipment?.destination}
          {shipment?.container_number ? ` · Container ${shipment.container_number}` : ''}
        </Typography>
        <Box sx={{ mt: 1.5 }}>
          <ArrivalMeta date={shipment?.estimated_delivery_date} status={shipment?.status} onDark />
        </Box>
      </Box>

      {isMissionClosed(shipment?.status) && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography fontWeight={800}>Mission closed</Typography>
          <Typography variant="body2">
            EPA has closed this consignment mission
            {shipment?.closure_reason ? ` — ${shipment.closure_reason}` : ''}.
          </Typography>
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Documents" icon={<Description />} iconPosition="start" />
        <Tab label="Feedback" />
        <Tab label="Clearance Log" />
      </Tabs>

      {tab === 0 && (
        <Stack spacing={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E9ECEF' }} elevation={0}>
            <CardContent>
              <Typography fontWeight={700} gutterBottom>
                Upload Document
              </Typography>
              <Stack spacing={2} mt={2}>
                <TextField
                  select
                  label="Document Type"
                  value={upload.document_type}
                  onChange={(e) => setUpload({ ...upload, document_type: e.target.value })}
                  fullWidth
                >
                  {DOC_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label={
                    upload.document_type === 'other'
                      ? 'Title (required for Other)'
                      : 'Title (optional)'
                  }
                  value={upload.title}
                  onChange={(e) => setUpload({ ...upload, title: e.target.value })}
                  fullWidth
                  required={upload.document_type === 'other'}
                  error={upload.document_type === 'other' && !String(upload.title || '').trim()}
                  helperText={
                    upload.document_type === 'other'
                      ? 'Other documents must have a title. You can upload multiple Other files.'
                      : undefined
                  }
                />
                <Button variant="outlined" component="label">
                  {upload.file ? upload.file.name : 'Choose file'}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,image/*"
                    onChange={(e) =>
                      setUpload({
                        ...upload,
                        file: e.target.files?.[0],
                        title:
                          upload.title ||
                          (upload.document_type === 'other' && e.target.files?.[0]
                            ? e.target.files[0].name.replace(/\.[^/.]+$/, '')
                            : upload.title),
                      })
                    }
                  />
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Upload />}
                  onClick={handleUpload}
                  disabled={
                    uploading ||
                    (upload.document_type === 'other' && !String(upload.title || '').trim())
                  }
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
          <List>
            {documents.map((d) => (
              <Card key={d.id} sx={{ mb: 1, borderRadius: 2, border: '1px solid #E9ECEF' }} elevation={0}>
                <ListItem>
                  <ListItemText primary={d.title || d.document_type} secondary={d.status || d.document_type} />
                </ListItem>
              </Card>
            ))}
          </List>
        </Stack>
      )}

      {tab === 1 && (
        <Stack spacing={2}>
          <TextField multiline rows={3} placeholder="Write feedback..." value={comment} onChange={(e) => setComment(e.target.value)} fullWidth />
          <Button variant="contained" onClick={postComment}>
            Post Feedback
          </Button>
          {comments.map((c) => (
            <Card key={c.id} sx={{ borderRadius: 2, p: 2, border: '1px solid #E9ECEF' }} elevation={0}>
              <Typography variant="body2">{c.content}</Typography>
              <Typography variant="caption" color="text.secondary">
                {c.author_name || 'You'} · {c.created_at}
              </Typography>
            </Card>
          ))}
        </Stack>
      )}

      {tab === 2 && (
        <List>
          {history.map((h, i) => (
            <Card key={i} sx={{ mb: 1, borderRadius: 2, border: '1px solid #E9ECEF' }} elevation={0}>
              <ListItem>
                <ListItemText primary={h.activity_name || h.status} secondary={h.notes || h.created_at} />
              </ListItem>
            </Card>
          ))}
        </List>
      )}
    </Box>
  )
}
