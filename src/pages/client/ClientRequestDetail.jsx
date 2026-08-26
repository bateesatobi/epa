import React, { useState } from 'react'
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { ArrowBack, Edit, Delete, Visibility, Description } from '@mui/icons-material'
import { format } from 'date-fns'
import { consignmentRequestsAPI } from '../../services/clientPortalApi'
import DocumentPreviewDialog from '../../components/portal/DocumentPreviewDialog'
import { toast } from 'react-toastify'

const STATUS_COLOR = {
  submitted: 'warning',
  approved: 'success',
  rejected: 'error',
  promoted: 'info',
  draft: 'default',
}

export default function ClientRequestDetail({ basePath = '/client/consignments' }) {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [previewDoc, setPreviewDoc] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: request, isLoading, error } = useQuery({
    queryKey: ['consignment-request', requestId],
    queryFn: () => consignmentRequestsAPI.get(requestId),
    enabled: !!requestId,
  })

  const deleteMutation = useMutation({
    mutationFn: () => consignmentRequestsAPI.delete(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-consignment-requests'] })
      toast.success('Request cancelled')
      navigate(`${basePath}/requests`)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Could not cancel request'),
  })

  const viewDoc = async (doc) => {
    try {
      const full = await consignmentRequestsAPI.viewDocument(requestId, doc.id)
      setPreviewDoc(full)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not load document')
    }
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !request) {
    return <Alert severity="error">Could not load request.</Alert>
  }

  const editable = ['draft', 'submitted', 'under_review', 'rejected'].includes(request.status)
  const days = request.days_until_arrival

  return (
    <Box maxWidth={800} mx="auto">
      <Button startIcon={<ArrowBack />} onClick={() => navigate(`${basePath}/requests`)} sx={{ mb: 2 }}>
        Back to requests
      </Button>

      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>{request.request_number}</Typography>
            <Chip
              size="small"
              label={request.status}
              color={STATUS_COLOR[request.status] || 'default'}
              sx={{ mt: 1 }}
            />
          </Box>
          <Stack direction="row" spacing={1}>
            {editable && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => navigate(`${basePath}/requests/${requestId}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setConfirmDelete(true)}
                >
                  Cancel
                </Button>
              </>
            )}
            {request.promoted_shipment_id && (
              <Button
                variant="contained"
                component={RouterLink}
                to={`/client/shipments/${request.promoted_shipment_id}`}
              >
                View consignment
              </Button>
            )}
          </Stack>
        </Stack>

        {request.rejection_reason && (
          <Alert severity="error" sx={{ mb: 2 }}>{request.rejection_reason}</Alert>
        )}

        <Stack spacing={1.5}>
          <Typography><strong>Route:</strong> {request.origin} → {request.destination}</Typography>
          <Typography>
            <strong>Expected arrival:</strong>{' '}
            {format(new Date(request.expected_arrival_date), 'MMM dd, yyyy')}
            {days != null && (
              <Chip
                size="small"
                label={days < 0 ? `Overdue ${Math.abs(days)}d` : `${days}d to arrival`}
                color={days < 0 ? 'error' : days <= 3 ? 'warning' : 'primary'}
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          <Typography><strong>Consignee:</strong> {request.consignee_name}{request.consignee_phone ? ` (${request.consignee_phone})` : ''}</Typography>
          <Typography><strong>Container:</strong> {request.container_number || '—'}</Typography>
          <Typography><strong>Cargo:</strong> {request.cargo_description}</Typography>
        </Stack>

        <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
          Documents ({request.documents?.length || 0})
        </Typography>
        <List dense>
          {(request.documents || []).map((doc) => (
            <ListItem key={doc.id} divider>
              <ListItemText primary={doc.title} secondary={doc.file_name || doc.mime_type} />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => viewDoc(doc)} aria-label="View document">
                  <Visibility />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {!request.documents?.length && (
            <ListItem>
              <ListItemText secondary="No documents attached" />
            </ListItem>
          )}
        </List>
      </Paper>

      <DocumentPreviewDialog
        open={!!previewDoc}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Cancel request?</DialogTitle>
        <DialogContent>
          <Typography>This will permanently remove request {request.request_number}.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Keep</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            Cancel request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
