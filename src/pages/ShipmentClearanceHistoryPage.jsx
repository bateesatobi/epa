import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  CircularProgress,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import ShipmentClearanceHistory from '../components/ShipmentClearanceHistory'
import { shipmentsAPI } from '../services/api'

const ShipmentClearanceHistoryPage = () => {
  const { shipmentId } = useParams()
  const navigate = useNavigate()
  const [shipment, setShipment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (shipmentId) {
      fetchShipment()
    }
  }, [shipmentId])

  const fetchShipment = async () => {
    try {
      setLoading(true)
      const data = await shipmentsAPI.get(parseInt(shipmentId))
      setShipment(data)
    } catch (error) {
      console.error('Failed to fetch shipment:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!shipmentId) {
    return (
      <Box p={3}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Invalid Shipment ID
          </Typography>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/shipments')}
            sx={{ mt: 2 }}
          >
            Back to Shipments
          </Button>
        </Paper>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/shipments')}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Back to Shipments
          </Button>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              Clearance History & Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {shipment?.shipment_number || `Shipment ID: ${shipmentId}`}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <ShipmentClearanceHistory
        shipmentId={parseInt(shipmentId)}
        shipmentNumber={shipment?.shipment_number || shipmentId}
      />
    </Box>
  )
}

export default ShipmentClearanceHistoryPage
