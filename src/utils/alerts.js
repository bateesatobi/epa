import Swal from 'sweetalert2'

// Configure SweetAlert2 with custom styling
const swalConfig = {
  customClass: {
    confirmButton: 'swal2-confirm',
    cancelButton: 'swal2-cancel',
    popup: 'swal2-popup',
  },
  buttonsStyling: false,
  confirmButtonText: 'OK',
  cancelButtonText: 'Cancel',
}

export const showSuccessAlert = (title, text = '', timer = 3000) => {
  return Swal.fire({
    ...swalConfig,
    icon: 'success',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: '#1976d2',
    timer,
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
    ...swalConfig,
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
    ...swalConfig,
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: '#ed6c02',
  })
}

export const showConfirmDialog = (title, text = '', confirmText = 'Yes, proceed', cancelText = 'Cancel') => {
  return Swal.fire({
    ...swalConfig,
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
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
    ...swalConfig,
    icon: 'info',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: '#1976d2',
  })
}

export const showLoadingAlert = (title = 'Processing...', text = 'Please wait') => {
  return Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading()
    },
  })
}

export const closeAlert = () => {
  Swal.close()
}

