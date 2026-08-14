export function createBlobUrl({ file_data, mime_type }) {
  if (!file_data) return null

  const byteCharacters = atob(file_data)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], {
    type: mime_type || 'application/octet-stream',
  })
  return window.URL.createObjectURL(blob)
}

export function revokeBlobUrl(url) {
  if (url) window.URL.revokeObjectURL(url)
}

export function isPreviewableImage(mime_type = '') {
  return mime_type.startsWith('image/')
}

export function isPreviewablePdf(mime_type = '') {
  return mime_type === 'application/pdf' || mime_type.endsWith('/pdf')
}

export function canPreviewInline(mime_type = '') {
  return isPreviewableImage(mime_type) || isPreviewablePdf(mime_type)
}

export function downloadBase64Document({ file_data, mime_type, file_name }) {
  const url = createBlobUrl({ file_data, mime_type })
  if (!url) return false

  const link = document.createElement('a')
  link.href = url
  link.download = file_name || 'document'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => revokeBlobUrl(url), 1000)
  return true
}
