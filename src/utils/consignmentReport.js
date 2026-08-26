import { format } from 'date-fns'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import JSZip from 'jszip'
import { shipmentsAPI, complianceAPI, consignmentRequestsAPI } from '../services/api'
import { EPA_COMPANY } from '../constants/epaCompany'

function esc(value) {
  return String(value ?? '')
}

function fmtDate(value, withTime = false) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return format(d, withTime ? 'MMM dd, yyyy HH:mm' : 'MMM dd, yyyy')
  } catch {
    return '—'
  }
}

function labelStatus(status) {
  const s = String(status || 'unknown').toLowerCase()
  if (s === 'closed') return 'Mission closed'
  return s.replace(/_/g, ' ')
}

function docTypeLabel(type) {
  if (!type) return 'Document'
  if (type === 'other') return 'Other'
  return String(type).replace(/_/g, ' ')
}

function infoRows(shipment) {
  return [
    ['Shipment number', shipment.shipment_number],
    ['Status', labelStatus(shipment.status)],
    ['Origin', shipment.origin],
    ['Destination', shipment.destination],
    ['Route', shipment.route],
    ['Shipper', shipment.shipper_name],
    ['Consignee', shipment.consignee_name],
    ['Consignee email', shipment.consignee_email],
    ['Consignee phone', shipment.consignee_phone],
    [
      'Client',
      shipment.client_name ||
        shipment.client_company ||
        (shipment.client_id ? `#${shipment.client_id}` : ''),
    ],
    ['Invoice number', shipment.invoice_number],
    ['Container number', shipment.container_number],
    ['Cargo description', shipment.cargo_description],
    ['Cargo weight', shipment.cargo_weight != null ? String(shipment.cargo_weight) : ''],
    ['Cargo volume', shipment.cargo_volume != null ? String(shipment.cargo_volume) : ''],
    ['Cargo value', shipment.cargo_value != null ? String(shipment.cargo_value) : ''],
    [
      'Estimated cost',
      shipment.estimated_cost != null
        ? `UGX ${Number(shipment.estimated_cost).toLocaleString()}`
        : '',
    ],
    ['Date of arrival', fmtDate(shipment.estimated_delivery_date)],
    ['Created', fmtDate(shipment.created_at, true)],
    ['Updated', fmtDate(shipment.updated_at, true)],
    ['Closed', fmtDate(shipment.closed_at, true)],
    ['Closure reason', shipment.closure_reason],
  ].filter(([, v]) => v != null && String(v).trim() !== '' && String(v) !== '—')
}

function requestInfoRows(request) {
  if (!request) return []
  return [
    ['Request number', request.request_number],
    ['Request status', labelStatus(request.status)],
    ['Origin (request)', request.origin],
    ['Destination (request)', request.destination],
    ['Expected arrival', fmtDate(request.expected_arrival_date)],
    ['Consignee', request.consignee_name],
    ['Consignee phone', request.consignee_phone],
    ['Cargo description', request.cargo_description],
    [
      'Client',
      request.client_company || request.client_name || (request.client_id ? `#${request.client_id}` : ''),
    ],
    ['Submitted', fmtDate(request.created_at, true)],
    ['Reviewed', fmtDate(request.reviewed_at, true)],
  ].filter(([, v]) => v != null && String(v).trim() !== '' && String(v) !== '—')
}

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/** Load EPA logo as a data URL so the PDF stays self-contained. */
export async function loadEpaLogoDataUrl() {
  for (const path of EPA_COMPANY.logoPaths) {
    try {
      const res = await fetch(path)
      if (!res.ok) continue
      const blob = await res.blob()
      if (!blob || blob.size < 32) continue
      return await blobToDataUrl(blob)
    } catch {
      // try next path
    }
  }
  return ''
}

function folderNameForShipment(shipment, id) {
  const raw = shipment?.shipment_number || `consignment-${id}`
  return String(raw).replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || `consignment-${id}`
}

function safeFileName(name, fallback = 'document') {
  const cleaned = String(name || fallback)
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120)
  return cleaned || fallback
}

function stripDataUrl(base64OrDataUrl) {
  const value = String(base64OrDataUrl || '')
  const match = value.match(/^data:[^;]+;base64,(.+)$/i)
  return (match ? match[1] : value).replace(/\s/g, '')
}

function base64ToUint8Array(base64OrDataUrl) {
  let base64 = stripDataUrl(base64OrDataUrl)
  if (!base64) throw new Error('Empty file data')
  // Support URL-safe base64 and missing padding
  base64 = base64.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  if (pad) base64 += '='.repeat(4 - pad)
  try {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch (err) {
    throw new Error(`Invalid base64 file data: ${err.message || err}`)
  }
}

function guessExtension(fileName, mimeType) {
  const fromName = String(fileName || '').match(/\.([a-z0-9]+)$/i)
  if (fromName) return fromName[1].toLowerCase()
  const mime = String(mimeType || '').toLowerCase()
  if (mime.includes('pdf')) return 'pdf'
  if (mime.includes('png')) return 'png'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('word')) return 'docx'
  return 'bin'
}

function ensureExtension(fileName, mimeType) {
  const base = safeFileName(fileName || 'document')
  if (/\.[a-z0-9]+$/i.test(base)) return base
  return `${base}.${guessExtension(base, mimeType)}`
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function addSectionTitle(doc, title, y) {
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(10, 25, 47)
  doc.text(title.toUpperCase(), 14, y)
  doc.setDrawColor(1, 163, 218)
  doc.setLineWidth(0.6)
  doc.line(14, y + 1.5, pageWidth - 14, y + 1.5)
  return y + 8
}

function ensureSpace(doc, y, needed = 24) {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + needed < pageHeight - 16) return y
  doc.addPage()
  return 20
}

/**
 * Build the consignment dossier PDF (EPA letterhead + info + docs inventory + timeline).
 */
export function buildConsignmentReportPdf({
  shipment,
  documents = [],
  clearanceHistory = [],
  assignments = [],
  sourceRequest = null,
  logoDataUrl = '',
  generatedBy = '',
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const number = shipment?.shipment_number || `Shipment #${shipment?.id || ''}`
  const generatedAt = format(new Date(), 'MMM dd, yyyy HH:mm')

  // Letterhead
  let y = 14
  if (logoDataUrl) {
    try {
      const formatHint = logoDataUrl.includes('image/png') ? 'PNG' : 'JPEG'
      doc.addImage(logoDataUrl, formatHint, 14, 10, 22, 22)
    } catch {
      // ignore logo failures
    }
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(10, 25, 47)
  doc.text(EPA_COMPANY.name, logoDataUrl ? 40 : 14, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(EPA_COMPANY.tagline, logoDataUrl ? 40 : 14, 23)

  doc.setFontSize(8)
  doc.setTextColor(51, 65, 85)
  const contactLines = [
    ...EPA_COMPANY.addressLines,
    `Tel: ${EPA_COMPANY.phone}`,
    `Email: ${EPA_COMPANY.email}`,
    `Location: ${EPA_COMPANY.location}`,
  ]
  contactLines.forEach((line, idx) => {
    doc.text(line, pageWidth - 14, 14 + idx * 4, { align: 'right' })
  })

  y = 38
  doc.setDrawColor(1, 163, 218)
  doc.setLineWidth(1)
  doc.line(14, y, pageWidth - 14, y)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(10, 25, 47)
  doc.text('Consignment Dossier', 14, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('Official operational summary — information, documentation & clearance timeline', 14, y)
  y += 8

  // Hero strip
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text(String(number), 18, y + 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(51, 65, 85)
  doc.text(`${esc(shipment?.origin || '—')} → ${esc(shipment?.destination || '—')}`, 18, y + 13)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(1, 120, 163)
  doc.text(labelStatus(shipment?.status), pageWidth - 18, y + 7, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generated ${generatedAt}`, pageWidth - 18, y + 13, { align: 'right' })
  y += 26

  // Consignment information
  y = addSectionTitle(doc, 'Consignment information', y)
  autoTable(doc, {
    startY: y,
    head: [['Field', 'Value']],
    body: infoRows(shipment || {}).map(([k, v]) => [k, String(v)]),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [1, 163, 218], textColor: 255 },
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', textColor: [100, 116, 139] } },
    margin: { left: 14, right: 14 },
  })
  y = (doc.lastAutoTable?.finalY || y) + 10

  // Source request
  if (sourceRequest) {
    y = ensureSpace(doc, y, 40)
    y = addSectionTitle(doc, 'Source consignment request', y)
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(
      `This consignment was created from client request ${sourceRequest.request_number || ''}.`,
      14,
      y
    )
    y += 4
    autoTable(doc, {
      startY: y,
      head: [['Field', 'Value']],
      body: requestInfoRows(sourceRequest).map(([k, v]) => [k, String(v)]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [10, 25, 47], textColor: 255 },
      columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', textColor: [100, 116, 139] } },
      margin: { left: 14, right: 14 },
    })
    y = (doc.lastAutoTable?.finalY || y) + 8

    const requestDocs = Array.isArray(sourceRequest.documents) ? sourceRequest.documents : []
    y = ensureSpace(doc, y, 30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(1, 120, 163)
    doc.text(`Documents uploaded at request creation (${requestDocs.length})`, 14, y)
    y += 3
    autoTable(doc, {
      startY: y,
      head: [['#', 'Title', 'File', 'Uploaded']],
      body:
        requestDocs.length === 0
          ? [['—', 'No request documents', '—', '—']]
          : requestDocs.map((d, i) => [
              String(i + 1),
              d.title || 'Untitled',
              d.file_name || '—',
              fmtDate(d.uploaded_at, true),
            ]),
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 95], textColor: 255 },
      margin: { left: 14, right: 14 },
    })
    y = (doc.lastAutoTable?.finalY || y) + 10
  }

  // Operational documents inventory
  y = ensureSpace(doc, y, 40)
  y = addSectionTitle(doc, `Operational documentation (${documents.length})`, y)
  const docsSorted = [...documents].sort((a, b) => {
    const ta = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0
    const tb = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0
    return tb - ta
  })
  autoTable(doc, {
    startY: y,
    head: [['#', 'Title / type', 'File', 'Status', 'Uploaded']],
    body:
      docsSorted.length === 0
        ? [['—', 'No operational documents', '—', '—', '—']]
        : docsSorted.map((d, i) => {
            const title =
              d.document_type === 'other'
                ? d.title || 'Untitled other document'
                : d.title || docTypeLabel(d.document_type)
            return [
              String(i + 1),
              `${title}\n${docTypeLabel(d.document_type).toUpperCase()}`,
              d.file_name || '—',
              labelStatus(d.review_status || d.status || 'pending'),
              fmtDate(d.uploaded_at, true),
            ]
          }),
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [1, 163, 218], textColor: 255 },
    margin: { left: 14, right: 14 },
  })
  y = (doc.lastAutoTable?.finalY || y) + 10

  // Assignments
  if (assignments.length) {
    y = ensureSpace(doc, y, 40)
    y = addSectionTitle(doc, 'Field assignments', y)
    autoTable(doc, {
      startY: y,
      head: [['Staff', 'Activity', 'Status', 'Assigned']],
      body: assignments.map((a) => [
        a.user_name || `User #${a.user_id}`,
        a.clearance_activity_name || a.activity_name || 'Activity',
        labelStatus(a.status),
        fmtDate(a.assigned_at || a.created_at, true),
      ]),
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [10, 25, 47], textColor: 255 },
      margin: { left: 14, right: 14 },
    })
    y = (doc.lastAutoTable?.finalY || y) + 10
  }

  // Timeline
  y = ensureSpace(doc, y, 40)
  y = addSectionTitle(doc, `Clearance timeline (${clearanceHistory.length})`, y)
  const historySorted = [...clearanceHistory].sort((a, b) => {
    const ta = new Date(a.timestamp || a.updated_at || a.created_at || 0).getTime()
    const tb = new Date(b.timestamp || b.updated_at || b.created_at || 0).getTime()
    return ta - tb
  })
  autoTable(doc, {
    startY: y,
    head: [['Activity', 'Status', 'Staff / notes', 'When']],
    body:
      historySorted.length === 0
        ? [['No timeline events', '—', '—', '—']]
        : historySorted.map((event) => [
            event.clearance_activity_name || event.activity_name || 'Activity',
            labelStatus(event.status),
            [event.assigned_user_name, event.notes].filter(Boolean).join(' — ') || '—',
            fmtDate(event.timestamp || event.updated_at || event.created_at, true),
          ]),
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [1, 163, 218], textColor: 255 },
    margin: { left: 14, right: 14 },
  })

  // Footer on each page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i)
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `${EPA_COMPANY.name} · ${EPA_COMPANY.email} · ${EPA_COMPANY.phone}${
        generatedBy ? ` · Prepared by ${generatedBy}` : ''
      }`,
      14,
      pageHeight - 8
    )
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
  }

  return doc
}

async function resolveOperationalDocBytes(docMeta) {
  const errors = []

  // Prefer binary endpoint (smaller / more reliable than JSON base64)
  try {
    const file = await complianceAPI.downloadDocumentFile(docMeta.id)
    if (file?.bytes?.byteLength) {
      return {
        bytes: file.bytes,
        fileName: ensureExtension(
          file.fileName || docMeta.file_name || docMeta.title || `document-${docMeta.id}`,
          file.mimeType || docMeta.mime_type
        ),
        title: docMeta.title || docTypeLabel(docMeta.document_type),
        documentType: docMeta.document_type || 'document',
      }
    }
    errors.push('binary download returned empty body')
  } catch (err) {
    errors.push(`binary: ${err.response?.data?.detail || err.message || err}`)
  }

  // Fallback: JSON view payload
  try {
    const full = await complianceAPI.viewDocument(docMeta.id)
    if (full?.file_data) {
      return {
        bytes: base64ToUint8Array(full.file_data),
        fileName: ensureExtension(
          full.file_name || docMeta.file_name || docMeta.title || `document-${docMeta.id}`,
          full.mime_type || docMeta.mime_type
        ),
        title: full.title || docMeta.title || docTypeLabel(docMeta.document_type),
        documentType: docMeta.document_type || 'document',
      }
    }
    errors.push('view returned no file_data')
  } catch (err) {
    errors.push(`view: ${err.response?.data?.detail || err.message || err}`)
  }

  throw new Error(errors.join('; ') || `Could not download document ${docMeta.id}`)
}

async function resolveRequestDocBytes(requestId, docMeta) {
  const errors = []

  try {
    const file = await consignmentRequestsAPI.downloadDocumentFile(requestId, docMeta.id)
    if (file?.bytes?.byteLength) {
      return {
        bytes: file.bytes,
        fileName: ensureExtension(
          file.fileName || docMeta.file_name || docMeta.title || `request-doc-${docMeta.id}`,
          file.mimeType || docMeta.mime_type
        ),
        title: docMeta.title || 'Request document',
      }
    }
    errors.push('binary download returned empty body')
  } catch (err) {
    errors.push(`binary: ${err.response?.data?.detail || err.message || err}`)
  }

  try {
    const full = await consignmentRequestsAPI.viewDocument(requestId, docMeta.id)
    if (full?.file_data) {
      return {
        bytes: base64ToUint8Array(full.file_data),
        fileName: ensureExtension(
          full.file_name || docMeta.file_name || docMeta.title || `request-doc-${docMeta.id}`,
          full.mime_type || docMeta.mime_type
        ),
        title: full.title || docMeta.title || 'Request document',
      }
    }
    errors.push('view returned no file_data')
  } catch (err) {
    errors.push(`view: ${err.response?.data?.detail || err.message || err}`)
  }

  throw new Error(errors.join('; ') || `Could not download request document ${docMeta.id}`)
}

/**
 * Download a ZIP package:
 *   {consignmentId}/
 *     Consignment_Report.pdf
 *     documents/...
 *     request-documents/...   (when promoted from a request)
 */
export async function downloadConsignmentReport({
  shipmentId,
  shipment: shipmentInput = null,
  documents: documentsInput = null,
  clearanceHistory: historyInput = null,
  assignments: assignmentsInput = null,
  sourceRequest: sourceRequestInput = undefined,
  generatedBy = '',
  onProgress = null,
} = {}) {
  if (!shipmentId && !shipmentInput?.id) {
    throw new Error('Shipment id is required')
  }

  const id = shipmentId || shipmentInput.id
  const report = (msg) => {
    if (typeof onProgress === 'function') onProgress(msg)
  }

  report('Loading consignment data…')
  const [shipment, documents, clearanceHistory, assignments, sourceRequest, logoDataUrl] =
    await Promise.all([
      shipmentInput ? Promise.resolve(shipmentInput) : shipmentsAPI.get(id),
      documentsInput
        ? Promise.resolve(documentsInput)
        : complianceAPI.getShipmentDocuments(id).catch(() => []),
      historyInput
        ? Promise.resolve(historyInput)
        : shipmentsAPI.getClearanceHistory(id).catch(() => []),
      assignmentsInput
        ? Promise.resolve(assignmentsInput)
        : shipmentsAPI.listClearanceActivityAssignments(id).catch(() => []),
      sourceRequestInput !== undefined
        ? Promise.resolve(sourceRequestInput)
        : consignmentRequestsAPI.getByShipment(id).catch(() => null),
      loadEpaLogoDataUrl(),
    ])

  const docs = Array.isArray(documents) ? documents : documents?.items || []
  const history = Array.isArray(clearanceHistory) ? clearanceHistory : []
  const assigns = Array.isArray(assignments) ? assignments : []
  const requestDocs = Array.isArray(sourceRequest?.documents) ? sourceRequest.documents : []

  const folder = folderNameForShipment(shipment, id)

  report('Building PDF report…')
  const pdf = buildConsignmentReportPdf({
    shipment,
    documents: docs,
    clearanceHistory: history,
    assignments: assigns,
    sourceRequest,
    logoDataUrl,
    generatedBy,
  })
  const pdfBytes = pdf.output('arraybuffer')

  const zip = new JSZip()
  const root = zip.folder(folder)
  root.file('Consignment_Report.pdf', pdfBytes)

  const docsFolder = root.folder('documents')
  const usedNames = new Set()

  const uniqueName = (name) => {
    let candidate = name
    let i = 2
    while (usedNames.has(candidate.toLowerCase())) {
      const parts = name.split('.')
      if (parts.length > 1) {
        const ext = parts.pop()
        candidate = `${parts.join('.')}_${i}.${ext}`
      } else {
        candidate = `${name}_${i}`
      }
      i += 1
    }
    usedNames.add(candidate.toLowerCase())
    return candidate
  }

  report(`Downloading ${docs.length} operational document(s)…`)
  const missing = []
  for (let i = 0; i < docs.length; i += 1) {
    const meta = docs[i]
    try {
      report(`Downloading document ${i + 1} of ${docs.length}…`)
      const file = await resolveOperationalDocBytes(meta)
      const prefix = String(i + 1).padStart(2, '0')
      const typePart = safeFileName(meta.document_type || 'doc')
      const name = uniqueName(`${prefix}_${typePart}_${file.fileName}`)
      docsFolder.file(name, file.bytes)
    } catch (err) {
      missing.push(
        `documents/${meta.id} (${meta.title || meta.document_type || 'document'}): ${err.message || err}`
      )
    }
  }

  if (sourceRequest && requestDocs.length) {
    const reqFolder = root.folder('request-documents')
    report(`Downloading ${requestDocs.length} request document(s)…`)
    for (let i = 0; i < requestDocs.length; i += 1) {
      const meta = requestDocs[i]
      try {
        report(`Downloading request document ${i + 1} of ${requestDocs.length}…`)
        const file = await resolveRequestDocBytes(sourceRequest.id, meta)
        const prefix = String(i + 1).padStart(2, '0')
        const name = uniqueName(`${prefix}_${safeFileName(file.title)}_${file.fileName}`)
        reqFolder.file(name, file.bytes)
      } catch (err) {
        missing.push(
          `request-documents/${meta.id} (${meta.title || 'request doc'}): ${err.message || err}`
        )
      }
    }
  }

  if (missing.length) {
    root.file(
      '_MISSING_DOCUMENTS.txt',
      [
        'These documents could not be included in this package.',
        'They are usually missing from server storage and need to be re-uploaded.',
        '',
        ...missing.map((line, idx) => `${idx + 1}. ${line}`),
        '',
      ].join('\n')
    )
  }

  report('Packaging ZIP…')
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const zipName = `${folder}.zip`
  triggerBlobDownload(zipBlob, zipName)

  return {
    filename: zipName,
    folder,
    shipment,
    documents: docs,
    clearanceHistory: history,
    sourceRequest,
    missingCount: missing.length,
    missing,
  }
}
