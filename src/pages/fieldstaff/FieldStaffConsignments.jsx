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
import { Search, LocalShipping } from '@mui/icons-material'
import FieldStaffPageHeader from '../../components/fieldstaff/FieldStaffPageHeader'
import {
  useMyAssignments,
  uniqueConsignmentsFromAssignments,
  statusColor,
  formatStatusLabel,
} from '../../hooks/useFieldStaff'

export default function FieldStaffConsignments() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: assignments = [], isLoading, refetch, isFetching } = useMyAssignments()

  const consignments = useMemo(
    () => uniqueConsignmentsFromAssignments(assignments),
    [assignments]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return consignments
    return consignments.filter((a) => {
      const hay = [a.shipment_number, a.origin, a.destination, a.consignee_name, a.container_number, a.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [consignments, search])

  const workspacePath = (shipmentId) =>
    `/dashboard/field-staff/consignments/${shipmentId}`

  return (
    <Box sx={{ pb: 4 }}>
      <FieldStaffPageHeader
        showBack
        title="Consignments"
        subtitle="Consignments linked to your clearance assignments — open one to work timeline, documents, and queries."
        chipLabel={`${filtered.length} consignments`}
      />

      <Paper
        elevation={0}
        sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search shipment #, container, route, consignee…"
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
            No consignments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No consignments found from your assignments.
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
                key={shipmentId}
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
                  alignItems={{ sm: 'center' }}
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
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                      Container: {row.container_number || '—'}
                    </Typography>
                    {row.consignee_name && (
                      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                        {row.consignee_name}
                      </Typography>
                    )}
                    {(row.clearance_activity_name || row.activity_name) && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        Activity: {row.clearance_activity_name || row.activity_name}
                      </Typography>
                    )}
                  </Box>
                  <Button
                    variant="contained"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(workspacePath(shipmentId))
                    }}
                    sx={{ fontWeight: 700 }}
                  >
                    Open workspace
                  </Button>
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}
