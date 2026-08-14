import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  alpha,
} from '@mui/material'
import {
  Add,
  Delete,
  Edit,
  Reply,
  CheckCircle,
  Description,
  Assignment,
  Person,
  Schedule,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { consignmentRequestQueriesAPI } from '../../services/api'
import { toast } from 'react-toastify'

const statusColors = {
  sent: 'info',
  replied: 'warning',
  under_review: 'secondary',
  resolved: 'success',
  closed: 'default',
}

export default function ConsignmentRequestQueries({ requestId, isAdmin }) {
  const [queries, setQueries] = useState([])
  const [loading, setLoading] = useState(true)
  const [openForm, setOpenForm] = useState(false)
  const [openReply, setOpenReply] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    declaration_ref: '',
    office_code: 'UGKLA',
    subject: '',
    items: [{ item_no: '1', details: '' }],
  })

  const [selectedQuery, setSelectedQuery] = useState(null)
  const [replies, setReplies] = useState({})

  const fetchQueries = async () => {
    try {
      setLoading(true)
      const data = await consignmentRequestQueriesAPI.listByRequest(requestId)
      setQueries(data)
    } catch {
      toast.error('Failed to load queries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (requestId) fetchQueries()
  }, [requestId])

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { item_no: (formData.items.length + 1).toString(), details: '' }],
    })
  }

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }

  const handleSubmit = async () => {
    if (!formData.subject && !formData.declaration_ref) {
      toast.warning('Please provide at least a subject or declaration reference')
      return
    }
    if (!formData.items.some((item) => item.details?.trim())) {
      toast.warning('Please add at least one query detail')
      return
    }

    setSubmitting(true)
    try {
      if (formData.id) {
        await consignmentRequestQueriesAPI.update(formData.id, { ...formData, request_id: requestId })
        toast.success('Query updated')
      } else {
        await consignmentRequestQueriesAPI.create({ ...formData, request_id: requestId })
        toast.success('Query sent to client')
      }
      setOpenForm(false)
      fetchQueries()
    } catch (error) {
      const detail = error.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg || JSON.stringify(d)).join('; ')
        : detail || error.message || 'Failed to save query'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async () => {
    setSubmitting(true)
    try {
      const replyData = Object.entries(replies)
        .filter(([, text]) => text?.trim())
        .map(([itemId, text]) => ({
          item_id: parseInt(itemId, 10),
          client_reply: text.trim(),
        }))
      if (replyData.length === 0) {
        toast.warning('Please enter at least one reply')
        return
      }
      await consignmentRequestQueriesAPI.reply(selectedQuery.id, replyData)
      toast.success('Reply submitted')
      setOpenReply(false)
      fetchQueries()
    } catch {
      toast.error('Failed to submit reply')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this query?')) return
    try {
      await consignmentRequestQueriesAPI.delete(id)
      toast.success('Query deleted')
      fetchQueries()
    } catch {
      toast.error('Failed to delete query')
    }
  }

  if (!requestId) return null
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={3}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" fontWeight={800} display="flex" alignItems="center" gap={1}>
          <Assignment color="primary" fontSize="small" /> Request queries
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => {
              setFormData({
                declaration_ref: '',
                office_code: 'UGKLA',
                subject: '',
                items: [{ item_no: '1', details: '' }],
              })
              setOpenForm(true)
            }}
          >
            New query
          </Button>
        )}
      </Stack>

      {queries.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: '#F8F9FA', borderRadius: 2 }}>
          <Description sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {isAdmin
              ? 'No queries raised on this request yet.'
              : 'No queries from staff on this request.'}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {queries.map((query) => (
            <Paper key={query.id} variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2 }}>
              <Box sx={{ p: 2, bgcolor: '#F8F9FA', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">
                      OFFICE / REF
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {query.office_code} - {query.declaration_ref || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" display="block">
                      SUBJECT
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {query.subject || 'General inquiry'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                      <Chip
                        label={String(query.status || 'sent').replace('_', ' ').toUpperCase()}
                        size="small"
                        color={statusColors[query.status] || 'default'}
                        sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                      />
                      {isAdmin && (
                        <>
                          <IconButton size="small" onClick={() => { setFormData(query); setOpenForm(true) }}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(query.id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#EDF2F7' }}>
                      <TableCell sx={{ fontWeight: 700, width: 80 }}>Item</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Query details</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reply</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(query.items || []).map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.item_no}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.details}</Typography>
                        </TableCell>
                        <TableCell>
                          {item.client_reply ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                              <Typography variant="body2" color="success.main" fontSize="0.8rem">
                                {item.client_reply}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.disabled" fontStyle="italic">
                              Waiting for reply…
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box
                sx={{
                  p: 1.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack direction="row" spacing={2}>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Person sx={{ fontSize: 14 }} /> {query.officer_name || 'Staff'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Schedule sx={{ fontSize: 14 }} /> {format(new Date(query.created_at), 'MMM dd, HH:mm')}
                  </Typography>
                </Stack>
                {!isAdmin && query.status !== 'resolved' && query.status !== 'closed' && (
                  <Button
                    size="small"
                    startIcon={<Reply />}
                    variant="outlined"
                    onClick={() => {
                      setSelectedQuery(query)
                      const initialReplies = {}
                      query.items.forEach((item) => {
                        initialReplies[item.id] = item.client_reply || ''
                      })
                      setReplies(initialReplies)
                      setOpenReply(true)
                    }}
                  >
                    Reply
                  </Button>
                )}
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {formData.id ? 'Edit query' : 'New request query'}
          <Typography variant="body2" color="text.secondary">
            Structured query for the client to respond to
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Office code"
                value={formData.office_code}
                onChange={(e) => setFormData({ ...formData, office_code: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Declaration ref"
                placeholder="e.g. 2026/C/32733"
                value={formData.declaration_ref}
                onChange={(e) => setFormData({ ...formData, declaration_ref: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={700} mb={1}>
            Query items
          </Typography>
          <Stack spacing={2}>
            {formData.items.map((item, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2, bgcolor: '#F8F9FA' }}>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={2}>
                    <TextField
                      label="No."
                      value={item.item_no}
                      onChange={(e) => handleItemChange(index, 'item_no', e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={9}>
                    <TextField
                      label="Query details"
                      multiline
                      rows={2}
                      value={item.details}
                      onChange={(e) => handleItemChange(index, 'details', e.target.value)}
                      fullWidth
                      size="small"
                      required
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <Delete />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
          <Button startIcon={<Add />} onClick={handleAddItem} sx={{ mt: 2 }}>
            Add item
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : formData.id ? 'Save changes' : 'Send query'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openReply} onClose={() => setOpenReply(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Reply to query: {selectedQuery?.subject || selectedQuery?.declaration_ref}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {selectedQuery?.items.map((item) => (
              <Box key={item.id}>
                <Typography variant="body2" fontWeight={700} color="primary" mb={0.5}>
                  Item {item.item_no}
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, bgcolor: '#F8F9FA' }}>
                  <Typography variant="body2">{item.details}</Typography>
                </Paper>
                <TextField
                  label="Your reply"
                  fullWidth
                  multiline
                  rows={3}
                  value={replies[item.id] || ''}
                  onChange={(e) => setReplies({ ...replies, [item.id]: e.target.value })}
                />
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReply(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleReply} disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Submit replies'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
