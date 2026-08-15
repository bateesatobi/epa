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
import { Search, Description, Visibility } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { consignmentRequestsAPI } from '../../services/api'
import { fieldStaffKeys } from '../../hooks/useFieldStaff'
import FieldStaffPageHeader from '../../components/fieldstaff/FieldStaffPageHeader'
import ConsignmentRequestDetailDialog from '../../components/consignment/ConsignmentRequestDetailDialog'
import DocumentPreviewDialog from '../../components/portal/DocumentPreviewDialog'
import { toast } from 'react-toastify'

export default function FieldStaffIncoming() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)

  const { data: requests = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: fieldStaffKeys.incoming(),
    queryFn: async () => {
      const data = await consignmentRequestsAPI.incoming()
      return Array.isArray(data) ? data : []
    },
    staleTime: 30_000,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return requests
    return requests.filter((r) => {
      const hay = [
        r.request_number,
        r.origin,
        r.destination,
        r.client_name,
        r.client_company,
        r.consignee_name,
        r.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [requests, search])

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

  const viewDoc = async (doc) => {
    if (!selected?.id) return
    try {
      const full = await consignmentRequestsAPI.viewDocument(selected.id, doc.id)
      setPreviewDoc(full)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not load document')
    }
  }

  return (
    <Box sx={{ pb: 4 }}>
      <FieldStaffPageHeader
        showBack
        title="Consignment Requests"
        subtitle="Approved requests awaiting setup — review client details, documents, and raise queries."
        chipLabel={`${filtered.length} incoming`}
        action={
          <Button
            variant="outlined"
            onClick={() => refetch()}
            disabled={isFetching}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', fontWeight: 700 }}
          >
            Refresh
          </Button>
        }
      />

      <Paper
        elevation={0}
        sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search request #, client, route…"
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
          <Description sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" fontWeight={700}>
            No incoming requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            There are no approved consignment requests awaiting setup right now.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {filtered.map((row) => (
            <Paper
              key={row.id}
              elevation={0}
              onClick={() => openDetail(row)}
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
                      {row.request_number}
                    </Typography>
                    <Chip
                      size="small"
                      label={String(row.status || '').replace('_', ' ')}
                      color="success"
                      sx={{ fontWeight: 800, textTransform: 'capitalize' }}
                    />
                    {row.open_query_count > 0 && (
                      <Chip
                        size="small"
                        color="error"
                        label={`${row.open_query_count} open quer${row.open_query_count === 1 ? 'y' : 'ies'}`}
                        sx={{ fontWeight: 800 }}
                      />
                    )}
                  </Stack>
                  <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                    {row.client_company || row.client_name || 'Client'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(row.origin || '—') + ' → ' + (row.destination || '—')}
                  </Typography>
                  {row.expected_arrival_date && (
                    <Typography variant="caption" color="text.disabled">
                      Arrival {format(new Date(row.expected_arrival_date), 'MMM dd, yyyy')}
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Visibility />}
                  onClick={(e) => {
                    e.stopPropagation()
                    openDetail(row)
                  }}
                  sx={{ fontWeight: 700 }}
                >
                  View
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <ConsignmentRequestDetailDialog
        open={Boolean(selected)}
        request={selected}
        loading={detailLoading}
        onClose={() => setSelected(null)}
        onViewDocument={viewDoc}
        showQueries
        isAdmin
        useTabs
        footerActions={
          <>
            {selected?.promoted_shipment_id && (
              <Button
                variant="outlined"
                onClick={() =>
                  navigate(`/dashboard/field-staff/consignments/${selected.promoted_shipment_id}`)
                }
                sx={{ fontWeight: 700 }}
              >
                Open consignment
              </Button>
            )}
            <Button onClick={() => setSelected(null)} sx={{ fontWeight: 700 }}>
              Close
            </Button>
          </>
        }
      />

      <DocumentPreviewDialog
        open={!!previewDoc}
        document={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </Box>
  )
}
