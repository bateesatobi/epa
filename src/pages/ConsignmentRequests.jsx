import React, { useMemo, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  CircularProgress,
} from '@mui/material'
import {
  CheckCircle,
  Cancel,
  Transform,
  Assignment,
  AssignmentTurnedIn,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { consignmentRequestsAPI, depotsAPI } from '../services/api'
import DocumentPreviewDialog from '../components/portal/DocumentPreviewDialog'
import RequestActionsMenu from '../components/portal/RequestActionsMenu'
import ConsignmentRequestDetailDialog from '../components/consignment/ConsignmentRequestDetailDialog'
import DataTable from '../components/DataTable'
import FormSelect from '../components/FormSelect'
import { PageSkeleton } from '../components/LoadingStates'
import ResourceAlertBadges from '../components/ResourceAlertBadges'
import { useUnreadNotifications } from '../hooks/useNotifications'
import { indexResourceAlerts } from '../utils/notificationNavigation'
import { toast } from 'react-toastify'

const STATUS_COLORS = {
  submitted: 'warning',
  approved: 'success',
  rejected: 'error',
  promoted: 'info',
  draft: 'default',
  under_review: 'secondary',
}

function CountdownChip({ days }) {
  if (days == null) return null
  if (days < 0) return <Chip size="small" color="error" label={`Overdue ${Math.abs(days)}d`} sx={{ fontWeight: 700 }} />
  if (days <= 3) return <Chip size="small" color="warning" label={`${days}d to arrival`} sx={{ fontWeight: 700 }} />
  return <Chip size="small" color="primary" label={`${days}d to arrival`} sx={{ fontWeight: 700 }} />
}

const TAB_GROUPS = [
  { key: 'pending', label: 'Pending review', statuses: ['submitted', 'under_review'] },
  { key: 'approved', label: 'Approved — convert', statuses: ['approved'] },
  { key: 'promoted', label: 'Promoted', statuses: ['promoted'] },
  { key: 'rejected', label: 'Rejected', statuses: ['rejected'] },
]

export default function ConsignmentRequests() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState(0)
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [previewDoc, setPreviewDoc] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [promoteOpen, setPromoteOpen] = useState(false)
  const [promoteOrigin, setPromoteOrigin] = useState('')
  const [promoteDestination, setPromoteDestination] = useState('')

  const { data: requests = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['consignment-requests'],
    queryFn: () => consignmentRequestsAPI.list(),
  })

  const { data: unreadNotifications = [] } = useUnreadNotifications()
  const resourceAlerts = useMemo(
    () => indexResourceAlerts(unreadNotifications),
    [unreadNotifications]
  )

  const { data: depots = [], isLoading: depotsLoading } = useQuery({
    queryKey: ['depotsActive'],
    queryFn: async () => {
      const data = await depotsAPI.list({ is_active: true })
      return Array.isArray(data) ? data : (data?.items || [])
    },
    staleTime: 5 * 60 * 1000,
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, rejection_reason }) =>
      consignmentRequestsAPI.review(id, { action, rejection_reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignment-requests'] })
      toast.success('Request updated')
      setRejectOpen(false)
      setSelected(null)
      setRejectReason('')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Review failed'),
  })

  const promoteMutation = useMutation({
    mutationFn: ({ id, origin, destination }) =>
      consignmentRequestsAPI.promote(id, { origin, destination }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['consignment-requests'] })
      toast.success(`Promoted to ${data.shipment_number}`)
      setPromoteOpen(false)
      setPromoteOrigin('')
      setPromoteDestination('')
      setSelected(null)
      navigate(`/dashboard/shipments/${data.shipment_id}`)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Promote failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => consignmentRequestsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignment-requests'] })
      toast.success('Request removed')
      setConfirmDelete(false)
      setDeleteTarget(null)
      setSelected(null)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Delete failed'),
  })

  const canAdminUpdate = (status) => status !== 'promoted'
  const canAdminDelete = (status) => status !== 'promoted'

  const openPromoteDialog = () => {
    if (!selected) return
    setPromoteOpen(true)
  }

  useEffect(() => {
    if (!promoteOpen || !selected || depotsLoading) return
    const depotNames = depots.map((d) => d.name)
    setPromoteOrigin(depotNames.includes(selected.origin) ? selected.origin : '')
    setPromoteDestination(
      depotNames.includes(selected.destination) ? selected.destination : ''
    )
  }, [promoteOpen, selected, depots, depotsLoading])

  const openDetail = async (row) => {
    setSelected(row)
    setDetailLoading(true)
    try {
      const full = await consignmentRequestsAPI.get(row.id)
      setSelected(full)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not load request detail')
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    const requestId = location.state?.requestId
    if (!requestId) return
    openDetail({ id: requestId })
    navigate(location.pathname, { replace: true, state: {} })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.requestId])

  const viewDoc = async (doc) => {
    if (!selected?.id) return
    try {
      const full = await consignmentRequestsAPI.viewDocument(selected.id, doc.id)
      setPreviewDoc(full)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not load document')
    }
  }

  const tabFiltered = useMemo(() => {
    const group = TAB_GROUPS[tab]
    if (!group) return requests
    return requests.filter((r) => group.statuses.includes(r.status))
  }, [requests, tab])

  const tabCounts = useMemo(() => {
    return TAB_GROUPS.map((group) =>
      requests.filter((r) => group.statuses.includes(r.status)).length
    )
  }, [requests])

  const columns = useMemo(
    () => [
      {
        field: 'request_number',
        label: 'Request #',
        minWidth: 140,
        accessor: (row) => row.request_number,
        render: (row) => {
          const unread = resourceAlerts[row.id] || {}
          return (
            <Stack spacing={0.5}>
              <Typography variant="body2" fontWeight={700} color="text.primary">
                {row.request_number}
              </Typography>
              <ResourceAlertBadges
                queries={row.open_query_count}
                unreadQueries={unread.queries}
                onQueryClick={() => openDetail(row)}
              />
            </Stack>
          )
        },
      },
      {
        field: 'client',
        label: 'Client',
        minWidth: 160,
        accessor: (row) => `${row.client_company || ''} ${row.client_name || ''}`,
        render: (row) => (
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {row.client_company || row.client_name || '—'}
            </Typography>
            {row.client_company && row.client_name ? (
              <Typography variant="caption" color="text.secondary">
                {row.client_name}
              </Typography>
            ) : null}
          </Box>
        ),
      },
      {
        field: 'route',
        label: 'Route',
        minWidth: 180,
        accessor: (row) => `${row.origin} ${row.destination}`,
        render: (row) => (
          <Typography variant="body2">
            {row.origin} → {row.destination}
          </Typography>
        ),
      },
      {
        field: 'expected_arrival_date',
        label: 'Expected arrival',
        minWidth: 180,
        accessor: (row) => row.expected_arrival_date,
        render: (row) => (
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="body2" fontWeight={500}>
              {format(new Date(row.expected_arrival_date), 'MMM dd, yyyy')}
            </Typography>
            <CountdownChip days={row.days_until_arrival} />
          </Stack>
        ),
      },
      {
        field: 'status',
        label: 'Status',
        minWidth: 120,
        accessor: (row) => row.status,
        render: (row) => (
          <Chip
            size="small"
            label={String(row.status).replace('_', ' ')}
            color={STATUS_COLORS[row.status] || 'default'}
            sx={{ fontWeight: 700, textTransform: 'capitalize' }}
          />
        ),
      },
      {
        field: 'documents',
        label: 'Docs',
        minWidth: 70,
        align: 'center',
        accessor: (row) => String(row.documents?.length ?? 0),
        render: (row) => (
          <Chip size="small" variant="outlined" label={row.documents?.length ?? 0} sx={{ fontWeight: 700, minWidth: 36 }} />
        ),
      },
      {
        field: 'actions',
        label: 'Actions',
        minWidth: 80,
        align: 'right',
        render: (row) => (
          <RequestActionsMenu
            canUpdate={canAdminUpdate(row.status)}
            canDelete={canAdminDelete(row.status)}
            onView={() => openDetail(row)}
            onUpdate={() => openDetail(row)}
            onDelete={() => {
              setDeleteTarget(row)
              setConfirmDelete(true)
            }}
          />
        ),
      },
    ],
    [resourceAlerts]
  )

  const detailFooter = selected ? (
    <>
      {['submitted', 'under_review'].includes(selected.status) && (
        <>
          <Button
            color="success"
            variant="contained"
            startIcon={<CheckCircle />}
            disabled={reviewMutation.isPending}
            onClick={() => reviewMutation.mutate({ id: selected.id, action: 'approve' })}
            sx={{ fontWeight: 700 }}
          >
            Approve
          </Button>
          <Button
            color="error"
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => setRejectOpen(true)}
            sx={{ fontWeight: 700 }}
          >
            Reject
          </Button>
        </>
      )}
      {selected.status === 'approved' && (
        <Button
          variant="contained"
          startIcon={<Transform />}
          disabled={promoteMutation.isPending}
          onClick={openPromoteDialog}
          sx={{ fontWeight: 700 }}
        >
          Convert to consignment
        </Button>
      )}
      {selected.status === 'promoted' && selected.promoted_shipment_id && (
        <Button
          variant="outlined"
          startIcon={<Assignment />}
          onClick={() => navigate(`/dashboard/shipments/${selected.promoted_shipment_id}`)}
          sx={{ fontWeight: 700 }}
        >
          Open consignment
        </Button>
      )}
      {canAdminDelete(selected.status) && (
        <Button
          color="error"
          variant="text"
          onClick={() => {
            setDeleteTarget(selected)
            setConfirmDelete(true)
          }}
          sx={{ fontWeight: 700 }}
        >
          Delete
        </Button>
      )}
      <Button onClick={() => setSelected(null)} sx={{ fontWeight: 700 }}>
        Close
      </Button>
    </>
  ) : null

  if (isLoading && requests.length === 0) {
    return <PageSkeleton showHeader showTable />
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 3,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #000000 0%, #1A2027 100%)',
          color: 'white',
        }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.75, fontWeight: 700, letterSpacing: 1.4 }}>
              Operations
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
              Consignment requests
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 1, maxWidth: 640, lineHeight: 1.6 }}>
              Review client submissions, approve arrivals, convert approved requests into consignments, and assign field staff.
            </Typography>
          </Box>
          <Chip
            icon={<AssignmentTurnedIn sx={{ color: 'white !important' }} />}
            label={`${requests.length} total`}
            sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white', fontWeight: 700, px: 1 }}
          />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              py: 2.5,
              px: 3,
              minHeight: 72,
              textTransform: 'none',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
            '& .Mui-selected': { color: 'primary.main', fontWeight: 800 },
            '& .MuiTabs-indicator': { height: 3 },
          }}
        >
          {TAB_GROUPS.map((group, index) => (
            <Tab
              key={group.key}
              label={
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" fontWeight={700}>
                    {group.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tabCounts[index]} request{tabCounts[index] === 1 ? '' : 's'}
                  </Typography>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      <Box sx={{ position: 'relative' }}>
        {isFetching && !isLoading ? (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'background.paper',
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CircularProgress size={16} />
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              Refreshing…
            </Typography>
          </Box>
        ) : null}

        <DataTable
          key={tab}
          columns={columns}
          data={tabFiltered}
          loading={isLoading}
          onRefresh={refetch}
          onRowClick={openDetail}
          searchable
          searchPlaceholder="Search request #, client, route, status..."
        />
      </Box>

      <ConsignmentRequestDetailDialog
        open={Boolean(selected && !rejectOpen && !promoteOpen)}
        request={selected}
        loading={detailLoading}
        onClose={() => setSelected(null)}
        onViewDocument={viewDoc}
        footerActions={detailFooter}
        showQueries
        isAdmin
      />

      <DocumentPreviewDialog
        open={!!previewDoc}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      <Dialog
        open={confirmDelete}
        onClose={() => {
          setConfirmDelete(false)
          setDeleteTarget(null)
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete request?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Permanently remove request {(deleteTarget || selected)?.request_number}? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setConfirmDelete(false)
              setDeleteTarget(null)
            }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate((deleteTarget || selected).id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={promoteOpen}
        onClose={() => {
          setPromoteOpen(false)
          setPromoteOrigin('')
          setPromoteDestination('')
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Convert to consignment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose departure and arrival depots for this consignment. The client entered route was{' '}
            <strong>
              {selected?.origin || '—'} → {selected?.destination || '—'}
            </strong>
            .
          </Typography>
          {depotsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : depots.length === 0 ? (
            <Typography color="error" variant="body2">
              No active depots found. Add depots under Depot Management before converting.
            </Typography>
          ) : (
            <Stack spacing={0}>
              <FormSelect
                label="Departure depot (origin)"
                value={promoteOrigin}
                onChange={(e) => setPromoteOrigin(e.target.value)}
                options={depots.map((d) => ({
                  value: d.name,
                  label: d.category ? `${d.name} (${d.category})` : d.name,
                }))}
                required
                margin="none"
              />
              <FormSelect
                label="Arrival depot (destination)"
                value={promoteDestination}
                onChange={(e) => setPromoteDestination(e.target.value)}
                options={depots.map((d) => ({
                  value: d.name,
                  label: d.category ? `${d.name} (${d.category})` : d.name,
                }))}
                required
                margin="none"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setPromoteOpen(false)
              setPromoteOrigin('')
              setPromoteDestination('')
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Transform />}
            disabled={
              !promoteOrigin ||
              !promoteDestination ||
              depotsLoading ||
              depots.length === 0 ||
              promoteMutation.isPending
            }
            onClick={() =>
              promoteMutation.mutate({
                id: selected.id,
                origin: promoteOrigin,
                destination: promoteDestination,
              })
            }
          >
            Convert
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Reject request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide a clear reason — the client will see this in their notifications.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Reason for rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain what needs to be corrected or why the request cannot be approved."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={!rejectReason.trim() || reviewMutation.isPending}
            onClick={() =>
              reviewMutation.mutate({
                id: selected.id,
                action: 'reject',
                rejection_reason: rejectReason.trim(),
              })
            }
          >
            Reject request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
