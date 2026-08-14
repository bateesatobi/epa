import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { Add } from '@mui/icons-material'
import { format } from 'date-fns'
import { toast } from 'react-toastify'
import { consignmentRequestsAPI } from '../../services/clientPortalApi'
import RequestActionsMenu from '../../components/portal/RequestActionsMenu'

const STATUS_COLOR = {
  submitted: 'warning',
  approved: 'success',
  rejected: 'error',
  promoted: 'info',
  draft: 'default',
}

const CLIENT_EDITABLE_REQUEST_STATUSES = ['draft', 'submitted', 'under_review', 'rejected']

const isEditable = (status) => CLIENT_EDITABLE_REQUEST_STATUSES.includes(status)

function Countdown(days) {
  if (days == null) return '—'
  if (days < 0) return `Overdue ${Math.abs(days)}d`
  return `${days}d to arrival`
}

export default function ClientMyRequests({ basePath = '/client/consignments' }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-consignment-requests'],
    queryFn: () => consignmentRequestsAPI.listMy(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => consignmentRequestsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-consignment-requests'] })
      toast.success('Request deleted')
      setDeleteTarget(null)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Delete failed'),
  })

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>My consignment requests</Typography>
          <Typography variant="body2" color="text.secondary">
            Track approval status and expected arrival dates.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} component={RouterLink} to={`${basePath}/requests/new`}>
          New request
        </Button>
      </Stack>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : requests.length === 0 ? (
        <Alert severity="info">No requests yet. Submit your first consignment request.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Request #</TableCell>
                <TableCell>Route</TableCell>
                <TableCell>Expected arrival</TableCell>
                <TableCell>Countdown</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Consignment</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((r) => (
                <TableRow
                  key={r.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`${basePath}/requests/${r.id}`)}
                >
                  <TableCell>{r.request_number}</TableCell>
                  <TableCell>{r.origin} → {r.destination}</TableCell>
                  <TableCell>{format(new Date(r.expected_arrival_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{Countdown(r.days_until_arrival)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={r.status} color={STATUS_COLOR[r.status] || 'default'} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {r.promoted_shipment_id ? (
                      <Button size="small" component={RouterLink} to={`/client/shipments/${r.promoted_shipment_id}`}>
                        {r.promoted_shipment_number || 'View'}
                      </Button>
                    ) : r.status === 'rejected' ? (
                      <Button size="small" component={RouterLink} to={`${basePath}/requests/${r.id}/edit`}>
                        Edit & resubmit
                      </Button>
                    ) : '—'}
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <RequestActionsMenu
                      canUpdate={isEditable(r.status)}
                      canDelete={isEditable(r.status)}
                      onView={() => navigate(`${basePath}/requests/${r.id}`)}
                      onUpdate={() => navigate(`${basePath}/requests/${r.id}/edit`)}
                      onDelete={() => setDeleteTarget(r)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {requests.some((r) => r.status === 'rejected') && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Rejected requests include a reason in your notifications. Edit and submit a new request.
        </Alert>
      )}

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete request?</DialogTitle>
        <DialogContent>
          <Typography>
            Permanently remove request {deleteTarget?.request_number}? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(deleteTarget.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
