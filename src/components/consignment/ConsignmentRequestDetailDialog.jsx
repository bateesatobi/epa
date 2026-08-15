import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Chip,
  Stack,
  Grid,
  Paper,
  Divider,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Close,
  Business,
  Person,
  Phone,
  LocalShipping,
  CalendarMonth,
  Inventory2,
  Description,
  Visibility,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { alpha } from '@mui/material/styles'

const STATUS_COLORS = {
  submitted: 'warning',
  approved: 'success',
  rejected: 'error',
  promoted: 'info',
  draft: 'default',
  under_review: 'secondary',
}

function formatFileSize(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DetailItem({ icon: Icon, label, value, subvalue }) {
  if (!value && !subvalue) return null
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          bgcolor: alpha('#01A3DA', 0.08),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 18, color: '#01A3DA' }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.6 }}>
          {label.toUpperCase()}
        </Typography>
        <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mt: 0.25 }}>
          {value || '—'}
        </Typography>
        {subvalue ? (
          <Typography variant="caption" color="text.secondary">
            {subvalue}
          </Typography>
        ) : null}
      </Box>
    </Box>
  )
}

function CountdownBadge({ days }) {
  if (days == null) return null
  if (days < 0) {
    return <Chip size="small" color="error" label={`Overdue ${Math.abs(days)}d`} sx={{ fontWeight: 700 }} />
  }
  if (days <= 3) {
    return <Chip size="small" color="warning" label={`${days}d to arrival`} sx={{ fontWeight: 700 }} />
  }
  return <Chip size="small" color="primary" label={`${days}d to arrival`} sx={{ fontWeight: 700 }} />
}

import ConsignmentRequestQueries from './ConsignmentRequestQueries'

export default function ConsignmentRequestDetailDialog({
  open,
  request,
  loading,
  onClose,
  onViewDocument,
  footerActions,
  showQueries = false,
  isAdmin = false,
  useTabs = false,
}) {
  const statusColor = STATUS_COLORS[request?.status] || 'default'
  const [tab, setTab] = useState(0)

  useEffect(() => {
    if (open) setTab(0)
  }, [open, request?.id])

  const overview = request ? (
    <Stack spacing={3}>
      {request.rejection_reason ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Rejection reason
          </Typography>
          <Typography variant="body2">{request.rejection_reason}</Typography>
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, bgcolor: '#FAFBFC' }}>
        <Typography variant="subtitle2" fontWeight={800} gutterBottom>
          Client & consignee
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <DetailItem
              icon={Business}
              label="Client company"
              value={request.client_company}
              subvalue={request.client_name}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailItem
              icon={Person}
              label="Consignee"
              value={request.consignee_name}
              subvalue={request.consignee_phone ? `Phone: ${request.consignee_phone}` : undefined}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={800} gutterBottom>
          Shipment details
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <DetailItem icon={LocalShipping} label="Origin" value={request.origin} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailItem icon={LocalShipping} label="Destination" value={request.destination} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailItem
              icon={CalendarMonth}
              label="Expected arrival"
              value={
                request.expected_arrival_date
                  ? format(new Date(request.expected_arrival_date), 'EEEE, MMM dd, yyyy')
                  : '—'
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailItem icon={Phone} label="Consignee phone" value={request.consignee_phone} />
          </Grid>
          <Grid item xs={12}>
            <DetailItem icon={Inventory2} label="Cargo description" value={request.cargo_description} />
          </Grid>
        </Grid>
      </Paper>
    </Stack>
  ) : null

  const documents = request ? (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={800}>
          Documents
        </Typography>
        <Chip
          size="small"
          label={`${request.documents?.length || 0} attached`}
          variant="outlined"
          sx={{ fontWeight: 700 }}
        />
      </Stack>

      {(request.documents || []).length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
          <Description sx={{ color: 'text.disabled', fontSize: 32, mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No documents attached to this request.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1}>
          {(request.documents || []).map((doc) => (
            <Paper
              key={doc.id}
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: alpha('#01A3DA', 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Description sx={{ color: '#01A3DA' }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>
                  {doc.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {doc.file_name || doc.mime_type || 'Document'}
                  {doc.file_size ? ` · ${formatFileSize(doc.file_size)}` : ''}
                </Typography>
                {doc.uploaded_at ? (
                  <Typography variant="caption" color="text.disabled">
                    Uploaded {format(new Date(doc.uploaded_at), 'PPp')}
                  </Typography>
                ) : null}
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Visibility fontSize="small" />}
                onClick={() => onViewDocument?.(doc)}
                sx={{ flexShrink: 0, fontWeight: 700 }}
              >
                View
              </Button>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  ) : null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden' },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: '#FAFBFC',
        }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
              Consignment request
            </Typography>
            <Typography variant="h6" fontWeight={800} noWrap>
              {request?.request_number || 'Request detail'}
            </Typography>
            {request && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  size="small"
                  label={String(request.status).replace('_', ' ')}
                  color={statusColor}
                  sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                />
                <CountdownBadge days={request.days_until_arrival} />
                {request.promoted_shipment_number ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={request.promoted_shipment_number}
                    sx={{ fontWeight: 700 }}
                  />
                ) : null}
              </Stack>
            )}
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Close fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={240}>
            <CircularProgress />
          </Box>
        ) : request ? (
          useTabs ? (
            <Box>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  mb: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  minHeight: 44,
                  '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', minHeight: 44 },
                }}
              >
                <Tab label="Overview" />
                <Tab label={`Documents (${request.documents?.length || 0})`} />
                {showQueries ? <Tab label="Queries" /> : null}
              </Tabs>
              {tab === 0 && overview}
              {tab === 1 && documents}
              {tab === 2 && showQueries && request?.id ? (
                <ConsignmentRequestQueries requestId={request.id} isAdmin={isAdmin} />
              ) : null}
            </Box>
          ) : (
            <Stack spacing={3}>
              {overview}
              {documents}
              {showQueries && request?.id ? (
                <ConsignmentRequestQueries requestId={request.id} isAdmin={isAdmin} />
              ) : null}
            </Stack>
          )
        ) : null}
      </DialogContent>

      {footerActions ? (
        <>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1, bgcolor: '#FAFBFC' }}>
            {footerActions}
          </DialogActions>
        </>
      ) : null}
    </Dialog>
  )
}
