import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Button,
} from '@mui/material'
import { Search, Sync, LocalShipping } from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import FieldStaffPageHeader from '../../components/fieldstaff/FieldStaffPageHeader'
import {
  useMyAssignments,
  statusColor,
  formatStatusLabel,
} from '../../hooks/useFieldStaff'
import { ArrivalMeta } from '../../components/consignment/ArrivalCountdownChip'

export default function FieldStaffAssignments() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: assignments = [], isLoading, refetch, isFetching } = useMyAssignments({
    activeOnly: true,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return assignments
    return assignments.filter((a) => {
      const hay = [
        a.shipment_number,
        a.origin,
        a.destination,
        a.consignee_name,
        a.container_number,
        a.clearance_activity_name || a.activity_name,
        a.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [assignments, search])

  const workspacePath = (shipmentId) =>
    `/dashboard/field-staff/consignments/${shipmentId}`

  return (
    <Box sx={{ pb: 4 }}>
      <FieldStaffPageHeader
        showBack
        title="My Assignments"
        subtitle="Operational tasks assigned to you — open a consignment to update status, docs, and queries."
        chipLabel={`${filtered.length} active`}
      />

      <Paper
        elevation={0}
        sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search shipment #, container, route, activity, consignee…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <LocalShipping sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" fontWeight={700}>
            No assignments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You have no active tasks currently.
          </Typography>
          <Button sx={{ mt: 2, fontWeight: 700 }} onClick={() => refetch()} disabled={isFetching}>
            Refresh
          </Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {filtered.map((row) => {
            const shipmentId = row.shipment_id || row.id
            return (
              <Paper
                key={row.id}
                elevation={0}
                onClick={() => navigate(workspacePath(shipmentId))}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  spacing={1.5}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="subtitle1" fontWeight={800}>
                        {row.shipment_number || `Shipment #${shipmentId}`}
                      </Typography>
                      <Chip
                        size="small"
                        label={formatStatusLabel(row.status)}
                        color={statusColor(row.status)}
                        sx={{ fontWeight: 800, textTransform: 'capitalize' }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {(row.origin || '—') + ' → ' + (row.destination || '—')}
                      {row.consignee_name ? ` · ${row.consignee_name}` : ''}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                      Container: {row.container_number || '—'}
                    </Typography>
                    <ArrivalMeta
                      date={row.estimated_delivery_date}
                      status={row.shipment_status || row.status}
                      sx={{ mt: 0.5 }}
                    />
                    <Typography variant="body2" fontWeight={700} sx={{ mt: 1 }}>
                      {row.clearance_activity_name || row.activity_name || 'Clearance activity'}
                    </Typography>
                    {row.assigned_at && (
                      <Typography variant="caption" color="text.disabled">
                        Assigned{' '}
                        {formatDistanceToNow(new Date(row.assigned_at), { addSuffix: true })}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Sync />}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(
                          `/dashboard/field-staff/update-status?assignmentId=${row.id}&shipmentId=${shipmentId}`
                        )
                      }}
                      sx={{ fontWeight: 700 }}
                    >
                      Update
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(workspacePath(shipmentId))
                      }}
                      sx={{ fontWeight: 700 }}
                    >
                      Open
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}
