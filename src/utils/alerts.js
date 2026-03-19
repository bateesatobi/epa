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
    iconColor: '#01A3DA',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: '#01A3DA',
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
    iconColor: '#1A1A1A',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: '#1A1A1A',
    showClass: {
      popup: 'animate__animated animate__shakeX',
    },
  })
}

export const showWarningAlert = (title, text = '') => {
  return Swal.fire({
    ...swalConfig,
    icon: 'warning',
    iconColor: '#0178A3',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: '#0178A3',
  })
}

export const showConfirmDialog = (title, text = '', confirmText = 'Yes, proceed', cancelText = 'Cancel') => {
  return Swal.fire({
    ...swalConfig,
    title,
    text,
    icon: 'question',
    iconColor: '#01A3DA',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: '#01A3DA',
    cancelButtonColor: '#1A1A1A',
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
    iconColor: '#01A3DA',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: '#01A3DA',
  })
}

export const showLoadingAlert = (title = 'Processing...', text = 'Please wait') => {
  return Swal.fire({
    title,
    text,
    color: '#1A1A1A',
    loaderHtml: '<div class="swal2-loader" style="border-color: #01A3DA transparent #01A3DA transparent;"></div>',
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

