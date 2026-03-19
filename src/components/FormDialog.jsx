import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  LinearProgress,
  Typography,
  Stack,
  CircularProgress,
} from '@mui/material'
import Swal from 'sweetalert2'

// Configure SweetAlert2 theme
Swal.mixin({
  customClass: {
    confirmButton: 'swal2-confirm',
    cancelButton: 'swal2-cancel',
    popup: 'swal2-popup',
  },
  buttonsStyling: false,
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
})

export const showSuccessAlert = (title, text = '') => {
  return Swal.fire({
    icon: 'success',
    title: `<span style="font-family: Inter, sans-serif; font-weight: 700; font-size: 1.25rem;">${title}</span>`,
    html: `<span style="font-family: Inter, sans-serif; font-weight: 500; color: #64748B;">${text}</span>`,
    confirmButtonText: 'Continue',
    confirmButtonColor: '#01A3DA',
    timer: 4000,
    timerProgressBar: true,
    padding: '2rem',
    borderRadius: '16px',
    showClass: {
      popup: 'animate__animated animate__fadeInDown animate__faster',
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp animate__faster',
    },
  })
}

export const showErrorAlert = (title, text = '') => {
  return Swal.fire({
    icon: 'error',
    title: `<span style="font-family: Inter, sans-serif; font-weight: 700; font-size: 1.25rem;">${title}</span>`,
    html: `<span style="font-family: Inter, sans-serif; font-weight: 500; color: #64748B;">${text}</span>`,
    confirmButtonText: 'Got it',
    confirmButtonColor: '#000',
    padding: '2rem',
    borderRadius: '16px',
    showClass: {
      popup: 'animate__animated animate__shakeX animate__faster',
    },
  })
}

export const showWarningAlert = (title, text = '') => {
  return Swal.fire({
    icon: 'warning',
    title: `<span style="font-family: Inter, sans-serif; font-weight: 700; font-size: 1.25rem;">${title}</span>`,
    html: `<span style="font-family: Inter, sans-serif; font-weight: 500; color: #64748B;">${text}</span>`,
    confirmButtonText: 'Understood',
    confirmButtonColor: '#01A3DA',
    padding: '2rem',
    borderRadius: '16px',
  })
}

export const showConfirmDialog = (title, text = '', confirmText = 'Yes, proceed') => {
  return Swal.fire({
    title: `<span style="font-family: Inter, sans-serif; font-weight: 700; font-size: 1.25rem;">${title}</span>`,
    html: `<span style="font-family: Inter, sans-serif; font-weight: 500; color: #64748B;">${text}</span>`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#01A3DA',
    cancelButtonColor: '#F1F5F9',
    cancelButtonTextColor: '#64748B',
    reverseButtons: true,
    padding: '2rem',
    borderRadius: '16px',
    showClass: {
      popup: 'animate__animated animate__zoomIn animate__faster',
    },
  })
}

export const showInfoAlert = (title, text = '') => {
  return Swal.fire({
    icon: 'info',
    title: `<span style="font-family: Inter, sans-serif; font-weight: 700; font-size: 1.25rem;">${title}</span>`,
    html: `<span style="font-family: Inter, sans-serif; font-weight: 500; color: #64748B;">${text}</span>`,
    confirmButtonText: 'Okay',
    confirmButtonColor: '#01A3DA',
    padding: '2rem',
    borderRadius: '16px',
  })
}

export const showLoadingAlert = (title, text = '') => {
  return Swal.fire({
    title: `<span style="font-family: Inter, sans-serif; font-weight: 700; font-size: 1.25rem;">${title}</span>`,
    html: `<span style="font-family: Inter, sans-serif; font-weight: 500; color: #64748B;">${text}</span>`,
    allowOutsideClick: false,
    showConfirmButton: false,
    padding: '2rem',
    borderRadius: '16px',
    didOpen: () => {
      Swal.showLoading()
    },
  })
}

export const closeAlert = () => {
  Swal.close()
}

const FormDialog = ({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitText = 'Save',
  cancelText = 'Cancel',
  loading = false,
  maxWidth = 'sm',
  fullWidth = true,
  submitButtonProps = {},
  showProgress = true,
}) => {
  // Handle title as string or React element
  const titleContent = typeof title === 'string' ? title : title
  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (onSubmit) {
      await onSubmit()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}
    >
      {showProgress && loading && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
          }}
        />
      )}
      <DialogTitle
        sx={{
          pb: 2,
          borderBottom: 1,
          borderColor: 'divider',
          fontWeight: 600,
          fontSize: typeof title === 'string' ? '1.25rem' : 'inherit',
        }}
      >
        {titleContent}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ // Applied TextField styles to the Box containing children
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              bgcolor: '#FAFBFC',
              '& fieldset': {
                borderColor: '#E2E8F0',
              },
              '&:hover fieldset': {
                borderColor: '#01A3DA',
              },
              '&.Mui-focused': {
                bgcolor: '#FFFFFF',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#01A3DA',
                borderWidth: 2,
              },
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.9rem',
              color: 'text.secondary',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#01A3DA',
            },
          }}
        >
          {children}
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 2,
          borderTop: 1,
          borderColor: 'divider',
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{ 
            minWidth: 100, borderRadius: 2, 
            textTransform: 'none', fontWeight: 600,
            borderColor: '#EEEEEE', color: 'text.secondary',
            '&:hover': { borderColor: '#000', color: '#000', bgcolor: 'transparent' }
          }}
        >
          {cancelText}
        </Button>
        {submitText && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disableElevation
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ 
              minWidth: 120, borderRadius: 2, 
              textTransform: 'none', fontWeight: 600,
              bgcolor: '#01A3DA', color: '#FFF',
              '&:hover': { bgcolor: '#0088b8' }
            }}
            {...submitButtonProps}
          >
            {loading ? 'Processing...' : submitText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default FormDialog

