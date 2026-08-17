export function groupDocumentsByType(documents = []) {
  const byType = {}
  const other = []

  for (const doc of documents) {
    const type = doc.document_type || 'other'
    if (type === 'other') {
      other.push(doc)
      continue
    }
    if (!byType[type]) byType[type] = doc
  }

  return { byType, other }
}

export function reviewStatusColor(status) {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  return 'warning'
}
