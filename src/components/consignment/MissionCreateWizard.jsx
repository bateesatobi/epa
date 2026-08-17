import React, { useEffect, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  LinearProgress,
  Radio,
  RadioGroup,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material'
import { shipmentsAPI } from '../../services/api'
import FormSelect from '../FormSelect'
import FormTextField from '../FormTextField'
import ConsignmentDocuments from './ConsignmentDocuments'
import {
  closeAlert,
  showErrorAlert,
  showLoadingAlert,
  showSuccessAlert,
} from '../../utils/alerts'

const STEPS = ['Mission details', 'Compliance documents']

const emptyForm = () => ({
  client_id: '',
  external_client_name: '',
  external_client_company: '',
  origin: '',
  destination: '',
  shipper_name: '',
  consignee_name: '',
  consignee_email: '',
  consignee_phone: '',
  container_number: '',
  cargo_description: '',
  estimated_cost: '',
})

export default function MissionCreateWizard({ open, onClose, onComplete, clients = [], depots = [] }) {
  const [activeStep, setActiveStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [clientSourceMode, setClientSourceMode] = useState('registered')
  const [selectedClient, setSelectedClient] = useState(null)
  const [formData, setFormData] = useState(emptyForm())
  const [createdShipment, setCreatedShipment] = useState(null)

  const resetWizard = () => {
    setActiveStep(0)
    setSubmitting(false)
    setClientSourceMode('registered')
    setSelectedClient(null)
    setFormData(emptyForm())
    setCreatedShipment(null)
  }

  useEffect(() => {
    if (!open) {
      resetWizard()
    }
  }, [open])

  const buildPayload = () => {
    const payload = {}
    if (clientSourceMode === 'registered') {
      if (selectedClient?.id) {
        payload.client_id = selectedClient.id
      } else if (formData.client_id) {
        payload.client_id = parseInt(formData.client_id, 10)
      } else {
        throw new Error('Client is required')
      }
    } else {
      const externalName = formData.external_client_name?.trim()
      if (!externalName) {
        throw new Error('Client name is required for walk-in missions')
      }
      payload.external_client_name = externalName
      if (formData.external_client_company?.trim()) {
        payload.external_client_company = formData.external_client_company.trim()
      }
    }

    payload.origin = formData.origin?.trim() || ''
    payload.destination = formData.destination?.trim() || ''
    payload.consignee_name = formData.consignee_name?.trim() || ''

    if (formData.shipper_name?.trim()) payload.shipper_name = formData.shipper_name.trim()
    if (formData.consignee_email?.trim()) payload.consignee_email = formData.consignee_email.trim()
    if (formData.consignee_phone?.trim()) payload.consignee_phone = formData.consignee_phone.trim()
    if (formData.container_number?.trim()) payload.container_number = formData.container_number.trim()
    if (formData.cargo_description?.trim()) payload.cargo_description = formData.cargo_description.trim()

    if (formData.estimated_cost) {
      const cost = parseFloat(formData.estimated_cost)
      if (!Number.isNaN(cost)) payload.estimated_cost = cost
    }

    return payload
  }

  const validateStep0 = () => {
    if (clientSourceMode === 'registered' && !selectedClient?.id && !formData.client_id) {
      showErrorAlert('Validation Error', 'Please select a registered client')
      return false
    }
    if (clientSourceMode === 'external' && !formData.external_client_name?.trim()) {
      showErrorAlert('Validation Error', 'Please enter the client / account name')
      return false
    }
    if (!formData.origin?.trim() || !formData.destination?.trim() || !formData.consignee_name?.trim()) {
      showErrorAlert('Validation Error', 'Please fill in departure, arrival, and consignee name')
      return false
    }
    if (!formData.cargo_description?.trim()) {
      showErrorAlert('Validation Error', 'Please enter mission cargo details')
      return false
    }
    return true
  }

  const handleCreateMission = async () => {
    if (!validateStep0()) return

    setSubmitting(true)
    showLoadingAlert('Starting Mission...', 'Creating consignment record')

    try {
      const payload = buildPayload()
      const shipment = await shipmentsAPI.create(payload)
      closeAlert()
      setCreatedShipment(shipment)
      setActiveStep(1)
    } catch (error) {
      closeAlert()
      showErrorAlert('Error', error.response?.data?.detail || error.message || 'Failed to create mission')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFinish = async (skippedDocs = false) => {
    if (!createdShipment) return
    await showSuccessAlert(
      'Success',
      skippedDocs
        ? 'Mission created. You can upload documents anytime from the mission Compliance tab.'
        : 'Mission created with compliance documents attached.'
    )
    onComplete?.(createdShipment)
    onClose?.()
  }

  const handleClose = () => {
    if (submitting) return
    if (createdShipment) {
      onComplete?.(createdShipment)
    }
    onClose?.()
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : handleClose}
      maxWidth={activeStep === 0 ? 'md' : 'lg'}
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      {submitting && (
        <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3 }} />
      )}
      <DialogTitle sx={{ pb: 2, borderBottom: 1, borderColor: 'divider', fontWeight: 700 }}>
        Initialize Mission
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 ? (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Walk-in missions (client not in system) are stored without a portal account. After creation,
                upload compliance documents in the next step — they sync with the mission Compliance tab.
              </Alert>
              <FormControl sx={{ mt: 2 }}>
                <FormLabel sx={{ fontWeight: 700, mb: 1 }}>Client source</FormLabel>
                <RadioGroup
                  row
                  value={clientSourceMode}
                  onChange={(e) => {
                    const mode = e.target.value
                    setClientSourceMode(mode)
                    if (mode === 'registered') {
                      setFormData((prev) => ({
                        ...prev,
                        external_client_name: '',
                        external_client_company: '',
                      }))
                    } else {
                      setSelectedClient(null)
                      setFormData((prev) => ({ ...prev, client_id: '' }))
                    }
                  }}
                >
                  <FormControlLabel value="registered" control={<Radio />} label="Client in system" />
                  <FormControlLabel value="external" control={<Radio />} label="Client not in system" />
                </RadioGroup>
              </FormControl>
            </Grid>

            {clientSourceMode === 'registered' ? (
              <Grid item xs={12}>
                <Autocomplete
                  options={clients}
                  getOptionLabel={(opt) => `${opt.name} (${opt.company_name})`}
                  value={selectedClient}
                  onChange={(e, v) => {
                    setSelectedClient(v)
                    if (v) {
                      setFormData((prev) => ({
                        ...prev,
                        client_id: v.id,
                        consignee_name: v.name || prev.consignee_name,
                        consignee_email: v.email || prev.consignee_email,
                        consignee_phone: v.telephone || prev.consignee_phone,
                      }))
                    }
                  }}
                  renderInput={(p) => <TextField {...p} label="Client entity" required />}
                />
              </Grid>
            ) : (
              <>
                <Grid item xs={12} sm={6}>
                  <FormTextField
                    label="Client / account name"
                    value={formData.external_client_name}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData((prev) => ({
                        ...prev,
                        external_client_name: value,
                        consignee_name: prev.consignee_name || value,
                      }))
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField
                    label="Company (optional)"
                    value={formData.external_client_company}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, external_client_company: e.target.value }))
                    }
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={6}>
              <FormSelect
                label="Departure Depot"
                value={formData.origin}
                onChange={(e) => setFormData((prev) => ({ ...prev, origin: e.target.value }))}
                options={depots.map((d) => ({ value: d.name, label: d.name }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormSelect
                label="Arrival Depot"
                value={formData.destination}
                onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
                options={depots.map((d) => ({ value: d.name, label: d.name }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField
                label="Shipper name (optional)"
                value={formData.shipper_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, shipper_name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField
                label="Container number"
                value={formData.container_number}
                onChange={(e) => setFormData((prev) => ({ ...prev, container_number: e.target.value }))}
                placeholder="e.g. MSKU1234567"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField
                label="Consignee name"
                value={formData.consignee_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, consignee_name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField
                label="Consignee phone"
                value={formData.consignee_phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, consignee_phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField
                label="Consignee email"
                type="email"
                value={formData.consignee_email}
                onChange={(e) => setFormData((prev) => ({ ...prev, consignee_email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormTextField
                label="Mission cargo details"
                multiline
                rows={3}
                value={formData.cargo_description}
                onChange={(e) => setFormData((prev) => ({ ...prev, cargo_description: e.target.value }))}
                required
              />
            </Grid>
          </Grid>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload required operational documents for{' '}
              <strong>{createdShipment?.shipment_number}</strong>. These appear on the mission Compliance tab
              and anywhere else documents are managed for this consignment.
            </Typography>
            <ConsignmentDocuments shipment={createdShipment} canManage />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
        <Button onClick={handleClose} disabled={submitting} variant="outlined" sx={{ fontWeight: 600 }}>
          {activeStep === 1 && createdShipment ? 'Close' : 'Cancel'}
        </Button>
        {activeStep === 1 && (
          <Button
            onClick={() => handleFinish(true)}
            disabled={submitting}
            sx={{ fontWeight: 600 }}
          >
            Skip for now
          </Button>
        )}
        {activeStep === 0 ? (
          <Button
            variant="contained"
            onClick={handleCreateMission}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ fontWeight: 700 }}
          >
            {submitting ? 'Creating...' : 'Create & continue'}
          </Button>
        ) : (
          <Button variant="contained" onClick={() => handleFinish(false)} sx={{ fontWeight: 700 }}>
            Finish
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
