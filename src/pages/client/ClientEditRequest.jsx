import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  MenuItem,
} from '@mui/material'
import { ArrowBack, Add, Delete, Save } from '@mui/icons-material'
import { consignmentRequestsAPI } from '../../services/clientPortalApi'
import { useClientAuth } from '../../contexts/ClientAuthContext'
import { toast } from 'react-toastify'

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      resolve(typeof result === 'string' ? result.split(',')[1] : '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const emptyDoc = () => ({ title: '', file: null })

export default function ClientEditRequest({ basePath = '/client/consignments' }) {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { client } = useClientAuth()

  const { data: request, isLoading } = useQuery({
    queryKey: ['consignment-request', requestId],
    queryFn: () => consignmentRequestsAPI.get(requestId),
    enabled: !!requestId,
  })

  const [form, setForm] = useState(null)
  const [newDocs, setNewDocs] = useState([emptyDoc()])

  useEffect(() => {
    if (request && !form) {
      setForm({
        origin: request.origin,
        destination: request.destination,
        expected_arrival_date: request.expected_arrival_date,
        consignee_name: request.consignee_name,
        consignee_phone: request.consignee_phone || '',
        container_number: request.container_number || '',
        cargo_description: request.cargo_description,
      })
    }
  }, [request, form])

  useEffect(() => {
    if (!client) return
    setForm((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        consignee_name: client.name || '',
        consignee_phone: client.telephone || '',
      }
    })
  }, [client])

  const { data: depots = [] } = useQuery({
    queryKey: ['depots-public'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://epa-backend-latest.onrender.com'}/api/depots?is_active=true`)
      return res.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (submit) => {
      await consignmentRequestsAPI.update(requestId, { ...form, submit })
      for (const doc of newDocs) {
        if (!doc.title.trim() || !doc.file) continue
        const file_data = await fileToBase64(doc.file)
        await consignmentRequestsAPI.uploadDocument(requestId, {
          title: doc.title.trim(),
          file_data,
          file_name: doc.file.name,
          file_size: doc.file.size,
          mime_type: doc.file.type,
        })
      }
    },
    onSuccess: (_, submit) => {
      queryClient.invalidateQueries({ queryKey: ['consignment-request', requestId] })
      queryClient.invalidateQueries({ queryKey: ['my-consignment-requests'] })
      toast.success(submit ? 'Request resubmitted' : 'Draft saved')
      navigate(`${basePath}/requests/${requestId}`)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Update failed'),
  })

  const deleteDocMutation = useMutation({
    mutationFn: (docId) => consignmentRequestsAPI.deleteDocument(requestId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignment-request', requestId] })
      toast.success('Document removed')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Could not delete document'),
  })

  if (isLoading || !form) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    )
  }

  if (!['draft', 'submitted', 'under_review', 'rejected'].includes(request.status)) {
    return <Alert severity="warning">This request can no longer be edited.</Alert>
  }

  const daysPreview = form.expected_arrival_date
    ? Math.ceil((new Date(form.expected_arrival_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Box maxWidth={720} mx="auto">
      <Button startIcon={<ArrowBack />} onClick={() => navigate(`${basePath}/requests/${requestId}`)} sx={{ mb: 2 }}>
        Back
      </Button>
      <Typography variant="h5" fontWeight={800} gutterBottom>Edit request</Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Stack spacing={2.5}>
          <TextField label="Origin" placeholder="Type origin location" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} fullWidth />
          <TextField select label="Arrival location" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} fullWidth>
            {depots.map((d) => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
          </TextField>
          <TextField type="date" label="Expected arrival" InputLabelProps={{ shrink: true }} value={form.expected_arrival_date} onChange={(e) => setForm({ ...form, expected_arrival_date: e.target.value })} fullWidth />
          {daysPreview != null && (
            <Alert severity={daysPreview < 0 ? 'error' : 'info'}>
              {daysPreview < 0 ? `${Math.abs(daysPreview)} days in the past` : `${daysPreview} days to arrival`}
            </Alert>
          )}
          <Typography variant="subtitle1" fontWeight={700}>
            Consignee (your account)
          </Typography>
          <TextField
            label="Company"
            value={client?.company_name || ''}
            fullWidth
            InputProps={{ readOnly: true }}
          />
          <TextField label="Consignee name" value={form.consignee_name} fullWidth InputProps={{ readOnly: true }} />
          <TextField label="Consignee phone" value={form.consignee_phone} fullWidth InputProps={{ readOnly: true }} />
          <TextField
            label="Container number"
            value={form.container_number}
            onChange={(e) => setForm({ ...form, container_number: e.target.value })}
            placeholder="e.g. MSKU1234567"
            fullWidth
          />
          <TextField label="Cargo description" multiline minRows={3} value={form.cargo_description} onChange={(e) => setForm({ ...form, cargo_description: e.target.value })} fullWidth />

          <Typography variant="subtitle1" fontWeight={700}>Existing documents</Typography>
          {(request.documents || []).map((doc) => (
            <Stack key={doc.id} direction="row" alignItems="center" spacing={1}>
              <Typography flex={1}>{doc.title}</Typography>
              <IconButton color="error" onClick={() => deleteDocMutation.mutate(doc.id)}>
                <Delete />
              </IconButton>
            </Stack>
          ))}

          <Typography variant="subtitle1" fontWeight={700}>Add documents</Typography>
          {newDocs.map((doc, idx) => (
            <Stack key={idx} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
              <TextField label="Title" value={doc.title} onChange={(e) => {
                const next = [...newDocs]; next[idx] = { ...next[idx], title: e.target.value }; setNewDocs(next)
              }} fullWidth />
              <Button variant="outlined" component="label">
                {doc.file ? doc.file.name : 'Choose file'}
                <input hidden type="file" onChange={(e) => {
                  const file = e.target.files?.[0]; if (!file) return
                  const next = [...newDocs]; next[idx] = { ...next[idx], file }; setNewDocs(next)
                }} />
              </Button>
              {newDocs.length > 1 && (
                <IconButton onClick={() => setNewDocs(newDocs.filter((_, i) => i !== idx))}><Delete /></IconButton>
              )}
            </Stack>
          ))}
          <Button startIcon={<Add />} onClick={() => setNewDocs([...newDocs, emptyDoc()])}>Add document row</Button>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Save />} disabled={saveMutation.isPending} onClick={() => saveMutation.mutate(false)}>
              Save draft
            </Button>
            <Button variant="contained" disabled={saveMutation.isPending || daysPreview < 0} onClick={() => saveMutation.mutate(true)}>
              Resubmit for review
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}
