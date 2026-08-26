import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Alert,
  IconButton,
  CircularProgress,
  MenuItem,
} from '@mui/material'
import { Add, Delete, Send } from '@mui/icons-material'
import { consignmentRequestsAPI } from '../../services/clientPortalApi'
import { useClientAuth } from '../../contexts/ClientAuthContext'
import { toast } from 'react-toastify'

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      const base64 = typeof result === 'string' ? result.split(',')[1] : ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const emptyDoc = () => ({ title: '', file: null })

export default function ClientRequestConsignment({ basePath = '/client/consignments' }) {
  const navigate = useNavigate()
  const { client } = useClientAuth()
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    expected_arrival_date: '',
    consignee_name: '',
    consignee_phone: '',
    container_number: '',
    cargo_description: '',
  })
  const [docs, setDocs] = useState([emptyDoc()])

  useEffect(() => {
    if (!client) return
    setForm((prev) => ({
      ...prev,
      consignee_name: client.name || '',
      consignee_phone: client.telephone || '',
    }))
  }, [client])

  const { data: depots = [] } = useQuery({
    queryKey: ['depots-public'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://epa-backend-latest.onrender.com'}/api/depots?is_active=true`)
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, submit: true }
      const created = await consignmentRequestsAPI.create(payload)
      for (const doc of docs) {
        if (!doc.title.trim() || !doc.file) continue
        const file_data = await fileToBase64(doc.file)
        await consignmentRequestsAPI.uploadDocument(created.id, {
          title: doc.title.trim(),
          file_data,
          file_name: doc.file.name,
          file_size: doc.file.size,
          mime_type: doc.file.type,
        })
      }
      return created
    },
    onSuccess: () => {
      toast.success('Consignment request submitted')
      navigate(`${basePath}/requests`)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to submit request'),
  })

  const daysPreview = form.expected_arrival_date
    ? Math.ceil(
        (new Date(form.expected_arrival_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null

  const canSubmit =
    form.origin &&
    form.destination &&
    form.expected_arrival_date &&
    form.consignee_name &&
    form.cargo_description

  return (
    <Box maxWidth={720} mx="auto">
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Request a consignment
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Submit your shipment details for admin review. Once approved, EPA will convert it to a consignment.
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <TextField
            label="Origin"
            placeholder="Type origin location"
            value={form.origin}
            onChange={(e) => setForm({ ...form, origin: e.target.value })}
            fullWidth
          />
          <TextField
            select
            label="Arrival location (destination)"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            fullWidth
          >
            {depots.map((d) => (
              <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            label="Expected day of arrival"
            InputLabelProps={{ shrink: true }}
            value={form.expected_arrival_date}
            onChange={(e) => setForm({ ...form, expected_arrival_date: e.target.value })}
            fullWidth
          />
          {daysPreview != null && (
            <Alert severity={daysPreview < 0 ? 'error' : daysPreview <= 3 ? 'warning' : 'info'}>
              {daysPreview < 0
                ? `Selected date is ${Math.abs(daysPreview)} days in the past`
                : `${daysPreview} day(s) until expected arrival`}
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
            helperText="Linked to your logged-in account"
          />
          <TextField
            label="Consignee name"
            value={form.consignee_name}
            fullWidth
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Consignee phone"
            value={form.consignee_phone}
            fullWidth
            InputProps={{ readOnly: true }}
          />
          <TextField
            label="Container number"
            value={form.container_number}
            onChange={(e) => setForm({ ...form, container_number: e.target.value })}
            placeholder="e.g. MSKU1234567"
            fullWidth
          />
          <TextField
            label="Cargo description"
            value={form.cargo_description}
            onChange={(e) => setForm({ ...form, cargo_description: e.target.value })}
            multiline
            minRows={3}
            fullWidth
          />

          <Typography variant="subtitle1" fontWeight={700} sx={{ pt: 1 }}>
            Documents (title + file)
          </Typography>
          {docs.map((doc, idx) => (
            <Stack key={idx} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
              <TextField
                label="Document title"
                value={doc.title}
                onChange={(e) => {
                  const next = [...docs]
                  next[idx] = { ...next[idx], title: e.target.value }
                  setDocs(next)
                }}
                fullWidth
              />
              <Button variant="outlined" component="label" sx={{ whiteSpace: 'nowrap' }}>
                {doc.file ? doc.file.name : 'Choose file'}
                <input
                  hidden
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const next = [...docs]
                    next[idx] = { ...next[idx], file }
                    setDocs(next)
                  }}
                />
              </Button>
              {docs.length > 1 && (
                <IconButton color="error" onClick={() => setDocs(docs.filter((_, i) => i !== idx))}>
                  <Delete />
                </IconButton>
              )}
            </Stack>
          ))}
          <Button startIcon={<Add />} onClick={() => setDocs([...docs, emptyDoc()])}>
            Add another document
          </Button>

          <Button
            variant="contained"
            size="large"
            startIcon={createMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <Send />}
            disabled={!canSubmit || createMutation.isPending || (daysPreview != null && daysPreview < 0)}
            onClick={() => createMutation.mutate()}
          >
            Submit request
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
