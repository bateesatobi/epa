/** Required operational document slots — shared by field staff and admin compliance. */
export const REQUIRED_DOC_TYPES = [
  { value: 't1_document', label: 'T1 Document' },
  { value: 'certificate_of_origin', label: 'Certificate of Origin' },
  { value: 'bill_of_lading', label: 'Bill of Lading' },
  { value: 'packing_list', label: 'Packing List' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'pvoc', label: 'PVOC' },
  { value: 'proof_of_payment', label: 'Proof of Payment' },
  { value: 'im8', label: 'IM8' },
]

export const ACCEPTED_DOCUMENT_FILES =
  '.pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*'
