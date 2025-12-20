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
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: '#1976d2',
    timer: 3000,
    timerProgressBar: true,
    showClass: {
      popup: 'animate__animated animate__fadeInDown',
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp',
    },
  })
}

export const showErrorAlert = (title, text = '') => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: '#d32f2f',
    showClass: {
      popup: 'animate__animated animate__shakeX',
    },
  })
}

export const showWarningAlert = (title, text = '') => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: '#ed6c02',
  })
}

export const showConfirmDialog = (title, text = '', confirmText = 'Yes, proceed') => {
  return Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#1976d2',
    cancelButtonColor: '#6c757d',
    reverseButtons: true,
    showClass: {
      popup: 'animate__animated animate__zoomIn',
    },
  })
}

export const showInfoAlert = (title, text = '') => {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: '#1976d2',
  })
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
        <Box component="form" onSubmit={handleSubmit} noValidate>
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
          sx={{ minWidth: 100 }}
        >
          {cancelText}
        </Button>
        {submitText && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ minWidth: 120 }}
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

