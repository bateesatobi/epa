import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  TextField,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material'
import { Sync, CheckCircle } from '@mui/icons-material'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import FieldStaffPageHeader from '../../components/fieldstaff/FieldStaffPageHeader'
import {
  useMyAssignments,
  fieldStaffKeys,
  statusColor,
  formatStatusLabel,
} from '../../hooks/useFieldStaff'
import { shipmentsAPI, clearanceActivitiesAPI } from '../../services/api'

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
]

const DEFAULT_SUBSTATES = {
  in_progress: ['Started', 'Under Review', 'Awaiting Approval', 'Pending Documents'],
  completed: ['Approved', 'Cleared', 'Released'],
}

export default function FieldStaffUpdateStatus() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const paramAssignmentId = searchParams.get('assignmentId')
  const paramShipmentId = searchParams.get('shipmentId')

  const { data: assignments = [], isLoading } = useMyAssignments({ activeOnly: true })
  const [assignmentId, setAssignmentId] = useState(paramAssignmentId || '')
  const [status, setStatus] = useState('pending')
  const [substate, setSubstate] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activitySubstates, setActivitySubstates] = useState([])

  const selected = useMemo(
    () => assignments.find((a) => String(a.id) === String(assignmentId)) || null,
    [assignments, assignmentId]
  )

  useEffect(() => {
    if (paramAssignmentId) setAssignmentId(paramAssignmentId)
  }, [paramAssignmentId])

  useEffect(() => {
    if (selected?.status) setStatus(String(selected.status).toLowerCase())
  }, [selected?.id, selected?.status])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!selected?.clearance_activity_id) {
        setActivitySubstates([])
        return
      }
      try {
        const activity = await clearanceActivitiesAPI.get(selected.clearance_activity_id)
        const raw = activity?.substates || activity?.possible_substates || []
        const list = Array.isArray(raw)
          ? raw.map((s) => (typeof s === 'string' ? s : s?.name || s?.label)).filter(Boolean)
          : []
        if (!cancelled) setActivitySubstates(list)
      } catch {
        if (!cancelled) setActivitySubstates([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selected?.clearance_activity_id])

  const substateOptions = useMemo(() => {
    if (activitySubstates.length) return activitySubstates
    return DEFAULT_SUBSTATES[status] || []
  }, [activitySubstates, status])

  const handleSubmit = async () => {
    if (!selected) {
      toast.error('Select an assignment first')
      return
    }
    setSubmitting(true)
    try {
      await shipmentsAPI.updateClearanceActivityAssignment(selected.id, {
        status,
        substate: substate || null,
        notes: notes || null,
      })
      toast.success('Status updated')
      queryClient.invalidateQueries({ queryKey: fieldStaffKeys.assignments() })
      const shipmentId = selected.shipment_id || paramShipmentId
      if (shipmentId) {
        navigate(`/dashboard/field-staff/consignments/${shipmentId}`)
      } else {
        navigate('/dashboard/field-staff/assignments')
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update status')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ pb: 4 }}>
      <FieldStaffPageHeader
        showBack
        title="Update Status"
        subtitle="Update the status of your assigned clearance activities — same flow as the mobile app."
      />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : assignments.length === 0 ? (
        <Alert severity="info">You have no active assignments to update.</Alert>
      ) : (
        <Paper
          elevation={0}
          sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', maxWidth: 640 }}
        >
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Assignment</InputLabel>
              <Select
                label="Assignment"
                value={assignmentId}
                onChange={(e) => setAssignmentId(e.target.value)}
              >
                {assignments.map((a) => (
                  <MenuItem key={a.id} value={String(a.id)}>
                    {(a.shipment_number || `Shipment #${a.shipment_id}`) +
                      ' — ' +
                      (a.clearance_activity_name || a.activity_name || 'Activity')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selected && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={formatStatusLabel(selected.status)}
                  color={statusColor(selected.status)}
                  size="small"
                  sx={{ fontWeight: 800, textTransform: 'capitalize' }}
                />
                <Chip
                  label={(selected.origin || '—') + ' → ' + (selected.destination || '—')}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            )}

            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                Status
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {STATUS_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    clickable
                    color={status === opt.value ? statusColor(opt.value) : 'default'}
                    variant={status === opt.value ? 'filled' : 'outlined'}
                    onClick={() => {
                      setStatus(opt.value)
                      setSubstate('')
                    }}
                    sx={{ fontWeight: 800 }}
                  />
                ))}
              </Stack>
            </Box>

            {substateOptions.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Substate</InputLabel>
                <Select
                  label="Substate"
                  value={substate}
                  onChange={(e) => setSubstate(e.target.value)}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {substateOptions.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Notes"
              multiline
              minRows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add operational notes for this update…"
              fullWidth
            />

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                disabled={!selected || submitting}
                onClick={handleSubmit}
                sx={{ fontWeight: 800 }}
              >
                Save status
              </Button>
              <Button
                variant="outlined"
                startIcon={<Sync />}
                disabled={!selected}
                onClick={() => {
                  const shipmentId = selected?.shipment_id || paramShipmentId
                  if (shipmentId) navigate(`/dashboard/field-staff/consignments/${shipmentId}`)
                }}
                sx={{ fontWeight: 700 }}
              >
                Open consignment
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </Box>
  )
}
