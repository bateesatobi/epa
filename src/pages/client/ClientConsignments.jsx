import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Search, ArrowForward, FlightTakeoff, FlightLand } from '@mui/icons-material'
import { clientPortalAPI } from '../../services/clientPortalApi'
import { formatShipmentStatusLabel, shipmentStatusChipColor } from '../../utils/shipmentStatus'
import { ArrivalMeta } from '../../components/consignment/ArrivalCountdownChip'

export default function ClientConsignments() {
  const navigate = useNavigate()
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    clientPortalAPI
      .listShipments({ limit: 100 })
      .then((data) => setShipments(data.items || data || []))
      .catch(() => setShipments([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = shipments.filter(
    (s) =>
      !search ||
      s.shipment_number?.toLowerCase().includes(search.toLowerCase()) ||
      s.origin?.toLowerCase().includes(search.toLowerCase()) ||
      s.destination?.toLowerCase().includes(search.toLowerCase()) ||
      s.container_number?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #01A3DA 0%, #0178A3 100%)',
          color: '#fff',
        }}
      >
        <Typography variant="overline" sx={{ opacity: 0.85, fontWeight: 700 }}>
          GLOBAL LOGISTICS
        </Typography>
        <Typography variant="h4" fontWeight={800}>
          My Consignments
        </Typography>
        <Typography sx={{ opacity: 0.9, mt: 0.5 }}>
          {shipments.length} active shipment{shipments.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <TextField
        fullWidth
        placeholder="Search by ID, container, origin, or destination..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search color="action" />
            </InputAdornment>
          ),
        }}
      />

      {filtered.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">No consignments found.</Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((s) => (
            <Grid item xs={12} md={6} key={s.id}>
              <Card sx={{ borderRadius: 3, border: '1px solid #E9ECEF' }} elevation={0}>
                <CardActionArea onClick={() => navigate(`/client/shipments/${s.id}`)}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" fontWeight={700}>
                        {s.shipment_number}
                      </Typography>
                      <Chip
                        label={formatShipmentStatusLabel(s.status)}
                        size="small"
                        color={shipmentStatusChipColor(s.status)}
                        variant="outlined"
                        sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mb={1}>
                      <FlightTakeoff fontSize="small" />
                      <Typography variant="body2">{s.origin || '—'}</Typography>
                      <ArrowForward fontSize="small" />
                      <FlightLand fontSize="small" />
                      <Typography variant="body2">{s.destination || '—'}</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1}>
                      Container {s.container_number || '—'}
                    </Typography>
                    <ArrivalMeta date={s.estimated_delivery_date} status={s.status} sx={{ mb: 2 }} />
                    <Typography variant="caption" color="primary" fontWeight={600}>
                      View details →
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
