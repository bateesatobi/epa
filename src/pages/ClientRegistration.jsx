import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  LinearProgress,
  CircularProgress,
} from '@mui/material'
import {
  Business,
  PersonAdd,
  PhotoCamera,
  Image,
} from '@mui/icons-material'
import FormDialog from '../components/FormDialog'
import FormTextField from '../components/FormTextField'
import FormSelect from '../components/FormSelect'
import EPALogo from '../components/EPALogo'
import { clientsAPI } from '../services/api'
import {
  showSuccessAlert,
  showErrorAlert,
  showLoadingAlert,
  closeAlert,
} from '../utils/alerts'

const ClientRegistration = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    tin: '',
    nin: '',
    telephone: '',
    position: '',
    email: '',
    consignment_type: '',
    password: '',
    confirm_password: '',
    national_id_front: null,
    national_id_back: null,
  })

  const consignmentTypes = [
    { value: 'import', label: 'Import' },
    { value: 'export', label: 'Export' },
    { value: 're_export', label: 'Re-export' },
    { value: 'transit', label: 'Transit' },
    { value: 'warehousing', label: 'Warehousing' },
    { value: 'other', label: 'Other' },
  ]

  const handleSubmit = async (e) => {
    e?.preventDefault()
    
    if (!formData.name || !formData.company_name || !formData.tin || !formData.telephone || 
        !formData.email || !formData.consignment_type || !formData.password) {
      showErrorAlert('Validation Error', 'Please fill in all required fields')
      return
    }
    
    if (formData.password !== formData.confirm_password) {
      showErrorAlert('Validation Error', 'Passwords do not match')
      return
    }
    
    if (formData.password.length < 8) {
      showErrorAlert('Validation Error', 'Password must be at least 8 characters')
      return
    }
    
    setLoading(true)
    const loadingAlert = showLoadingAlert('Registering...', 'Please wait')
    
    try {
      const { confirm_password, national_id_front, national_id_back, ...registrationData } = formData
      
      // Convert image files to base64
      const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => {
            const base64String = reader.result.split(',')[1] // Remove data:type;base64, prefix
            resolve(base64String)
          }
          reader.onerror = (error) => reject(error)
        })
      }
      
      if (national_id_front) {
        registrationData.national_id_front = await convertToBase64(national_id_front)
      }
      if (national_id_back) {
        registrationData.national_id_back = await convertToBase64(national_id_back)
      }
      
      await clientsAPI.register(registrationData)
      closeAlert()
      await showSuccessAlert(
        'Registration Successful!',
        'Your account has been submitted for approval. You will be notified once approved.'
      )
      navigate('/client-login')
    } catch (error) {
      closeAlert()
      showErrorAlert('Registration Failed', error.response?.data?.detail || 'An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'white',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <EPALogo width={150} height={75} />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Client Registration
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Register your company to use EPA FMS
            </Typography>
          </Box>

          {loading && (
            <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
          )}

          <form onSubmit={handleSubmit}>
            <FormTextField
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
              disabled={loading}
            />
            <FormTextField
              label="Company Name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              required
              disabled={loading}
            />
            <FormTextField
              label="TIN (Tax Identification Number)"
              value={formData.tin}
              onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
              required
              disabled={loading}
            />
            <FormTextField
              label="NIN (National Identification Number)"
              value={formData.nin}
              onChange={(e) => setFormData({ ...formData, nin: e.target.value })}
              disabled={loading}
              helperText="Optional - National ID number"
            />
            <FormTextField
              label="Telephone Number"
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              required
              placeholder="+256700000000"
              helperText="This will be used for login"
              disabled={loading}
            />
            <FormTextField
              label="Position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              disabled={loading}
            />
            <FormTextField
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
            <FormSelect
              label="Type of Consignment"
              value={formData.consignment_type}
              onChange={(e) => setFormData({ ...formData, consignment_type: e.target.value })}
              options={consignmentTypes}
              required
              disabled={loading}
            />
            <FormTextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              helperText="Minimum 8 characters"
              disabled={loading}
            />
            <FormTextField
              label="Confirm Password"
              type="password"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              required
              disabled={loading}
            />
            
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                National ID Photos (Optional)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ flex: 1 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<PhotoCamera />}
                    disabled={loading}
                    sx={{ py: 1.5 }}
                  >
                    National ID Front
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, national_id_front: e.target.files?.[0] || null })}
                    />
                  </Button>
                  {formData.national_id_front && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Selected: {formData.national_id_front.name}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<PhotoCamera />}
                    disabled={loading}
                    sx={{ py: 1.5 }}
                  >
                    National ID Back
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, national_id_back: e.target.files?.[0] || null })}
                    />
                  </Button>
                  {formData.national_id_back && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Selected: {formData.national_id_back.name}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Already registered?{' '}
            <Button
              variant="text"
              size="small"
              onClick={() => navigate('/client-login')}
              sx={{ textTransform: 'none' }}
            >
              Login here
            </Button>
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}

export default ClientRegistration


