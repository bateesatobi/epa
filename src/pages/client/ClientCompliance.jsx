import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
  Button,
} from '@mui/material'
import { ShieldOutlined } from '@mui/icons-material'
import { clientPortalAPI } from '../../services/clientPortalApi'
import { ArrivalMeta } from '../../components/consignment/ArrivalCountdownChip'

const REQUIRED_TYPES = [
  't1_document',
  'certificate_of_origin',
  'bill_of_lading',
  'packing_list',
  'invoice',
  'pvoc',
  'proof_of_payment',
  'im8',
]

export default function ClientCompliance() {
  const navigate = useNavigate()
  const [shipments, setShipments] = useState([])
  const [docsByShipment, setDocsByShipment] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await clientPortalAPI.listShipments({ limit: 100 })
        const items = data.items || data || []
        setShipments(items)
        const docMap = {}
        await Promise.all(
          items.map(async (s) => {
            try {
              const docs = await clientPortalAPI.getShipmentDocuments(s.id)
              docMap[s.id] = Array.isArray(docs) ? docs : docs.items || []
            } catch {
              docMap[s.id] = []
            }
          })
        )
        setDocsByShipment(docMap)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <ShieldOutlined />
          <Typography variant="overline" fontWeight={700}>
            MY COMPLIANCE
          </Typography>
        </Stack>
        <Typography variant="h4" fontWeight={800}>
          Document Centre
        </Typography>
        <Typography sx={{ opacity: 0.9, mt: 0.5 }}>
          {shipments.length} shipment{shipments.length !== 1 ? 's' : ''} under review
        </Typography>
      </Box>

      {shipments.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">No shipments for compliance tracking.</Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {shipments.map((s) => {
            const docs = docsByShipment[s.id] || []
            const uploadedTypes = new Set(docs.map((d) => d.document_type))
            const progress = Math.round(
              (REQUIRED_TYPES.filter((t) => uploadedTypes.has(t)).length / REQUIRED_TYPES.length) * 100
            )
            return (
              <Card key={s.id} sx={{ borderRadius: 3, border: '1px solid #E9ECEF' }} elevation={0}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography fontWeight={700}>{s.shipment_number}</Typography>
                    <Chip label={`${progress}%`} size="small" color={progress === 100 ? 'success' : 'warning'} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Container {s.container_number || '—'}
                  </Typography>
                  <ArrivalMeta date={s.estimated_delivery_date} status={s.status} sx={{ mb: 1 }} />
                  <LinearProgress variant="determinate" value={progress} sx={{ mb: 2, borderRadius: 1, height: 8 }} />
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {docs.length} document{docs.length !== 1 ? 's' : ''} uploaded
                  </Typography>
                  <Button variant="contained" size="small" onClick={() => navigate(`/client/shipments/${s.id}?tab=documents`)}>
                    Manage Documents
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}
