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
  Tabs,
  Tab,
} from '@mui/material'
import { Search, LocalShipping, History, Assignment } from '@mui/icons-material'
import { format } from 'date-fns'
import FieldStaffPageHeader from '../../components/fieldstaff/FieldStaffPageHeader'
import {
  useMyAssignments,
  groupConsignmentsFromAssignments,
  statusColor,
  formatStatusLabel,
} from '../../hooks/useFieldStaff'
import { ArrivalMeta } from '../../components/consignment/ArrivalCountdownChip'

function matchesSearch(row, query) {
  if (!query) return true
  const hay = [
    row.shipment_number,
    row.origin,
    row.destination,
    row.consignee_name,
    row.container_number,
    row.estimated_delivery_date,
    row.status,
    row.shipment_status,
    ...(row.activity_names || []),
    row.clearance_activity_name,
    row.activity_name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(query)
}

function ConsignmentRow({ row, onOpen }) {
  const shipmentId = row.shipment_id || row.id
  const missionStatus = row.shipment_status || null
  const latestDate = row.completed_at || row.assigned_at

  return (
    <Paper
      elevation={0}
      onClick={() => onOpen(shipmentId)}
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
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="subtitle1" fontWeight={800}>
              {row.shipment_number || `Shipment #${shipmentId}`}
            </Typography>
            <Chip
              size="small"
              label={row.hasActive ? 'Current' : 'History'}
              color={row.hasActive ? 'info' : 'default'}
              sx={{ fontWeight: 800 }}
            />
            <Chip
              size="small"
              label={formatStatusLabel(row.status)}
              color={statusColor(row.status)}
              sx={{ fontWeight: 800, textTransform: 'capitalize' }}
            />
            {missionStatus && String(missionStatus).toLowerCase() !== String(row.status || '').toLowerCase() ? (
              <Chip
                size="small"
                variant="outlined"
                label={`Mission ${formatStatusLabel(missionStatus)}`}
                sx={{ fontWeight: 700, textTransform: 'capitalize' }}
              />
            ) : null}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {(row.origin || '—') + ' → ' + (row.destination || '—')}
          </Typography>
          <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
            Container: {row.container_number || '—'}
          </Typography>
          <ArrivalMeta
            date={row.estimated_delivery_date}
            status={row.shipment_status || row.status}
            sx={{ mt: 0.5 }}
          />
          {row.consignee_name ? (
            <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
              {row.consignee_name}
            </Typography>
          ) : null}
          {(row.activity_names || []).length > 0 ? (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              {(row.activity_names || []).map((name) => (
                <Chip key={name} size="small" variant="outlined" label={name} sx={{ fontWeight: 700 }} />
              ))}
            </Stack>
          ) : null}
          {latestDate ? (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {row.hasActive ? 'Assigned' : 'Last activity'}{' '}
              {format(new Date(latestDate), 'MMM dd, yyyy')}
            </Typography>
          ) : null}
        </Box>
        <Button
          variant="contained"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(shipmentId)
          }}
          sx={{ fontWeight: 700 }}
        >
          Open workspace
        </Button>
      </Stack>
    </Paper>
  )
}

export default function FieldStaffConsignments() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('current')
  const { data: assignments = [], isLoading, refetch, isFetching } = useMyAssignments()

  const consignments = useMemo(
    () => groupConsignmentsFromAssignments(assignments),
    [assignments]
  )

  const current = useMemo(() => consignments.filter((c) => c.hasActive), [consignments])
  const history = useMemo(() => consignments.filter((c) => !c.hasActive), [consignments])

  const visible = tab === 'current' ? current : tab === 'history' ? history : consignments

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return visible.filter((row) => matchesSearch(row, q))
  }, [visible, search])

  const workspacePath = (shipmentId) => `/dashboard/field-staff/consignments/${shipmentId}`
  const openWorkspace = (shipmentId) => navigate(workspacePath(shipmentId))

  return (
    <Box sx={{ pb: 4 }}>
      <FieldStaffPageHeader
        showBack
        title="Consignments"
        subtitle="Current assignments and history of consignments you have worked on."
        chipLabel={`${filtered.length} shown`}
      />

      <Paper
        elevation={0}
        sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search shipment #, container, route, consignee, activity…"
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

      <Paper
        elevation={0}
        sx={{ mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="fullWidth"
          sx={{ minHeight: 52 }}
        >
          <Tab
            value="current"
            icon={<Assignment fontSize="small" />}
            iconPosition="start"
            label={`Current (${current.length})`}
            sx={{ fontWeight: 800, textTransform: 'none' }}
          />
          <Tab
            value="history"
            icon={<History fontSize="small" />}
            iconPosition="start"
            label={`History (${history.length})`}
            sx={{ fontWeight: 800, textTransform: 'none' }}
          />
          <Tab
            value="all"
            icon={<LocalShipping fontSize="small" />}
            iconPosition="start"
            label={`All (${consignments.length})`}
            sx={{ fontWeight: 800, textTransform: 'none' }}
          />
        </Tabs>
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
            {search ? 'No matching consignments' : tab === 'history' ? 'No history yet' : 'No current consignments'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search
              ? 'Try a different search term.'
              : tab === 'history'
                ? 'Completed consignments you have worked on will appear here.'
                : 'Consignments currently assigned to you will appear here.'}
          </Typography>
          <Button sx={{ mt: 2, fontWeight: 700 }} onClick={() => refetch()} disabled={isFetching}>
            Refresh
          </Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {filtered.map((row) => (
            <ConsignmentRow key={row.shipment_id || row.id} row={row} onOpen={openWorkspace} />
          ))}
        </Stack>
      )}
    </Box>
  )
}
