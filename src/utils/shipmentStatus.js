/** Shared consignment / mission status helpers for admin, field staff, and client UIs. */

export function formatShipmentStatusLabel(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'closed') return 'Mission closed'
  if (s === 'cancelled') return 'Cancelled'
  if (s === 'on_hold') return 'On hold'
  if (s === 'awaiting_release') return 'Awaiting release'
  if (s === 'at_customs') return 'At customs'
  if (s === 'in_transit') return 'In transit'
  if (s === 'delivered') return 'Delivered'
  if (s === 'pending') return 'Pending'
  return String(status || 'unknown').replace(/_/g, ' ')
}

export function shipmentStatusChipColor(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'closed') return 'default'
  if (s === 'delivered') return 'success'
  if (s === 'cancelled') return 'error'
  if (s === 'on_hold') return 'warning'
  if (s === 'in_transit' || s === 'at_customs' || s === 'awaiting_release') return 'info'
  if (s === 'pending') return 'warning'
  return 'default'
}

export function isMissionTerminal(status) {
  const s = String(status || '').toLowerCase()
  return s === 'closed' || s === 'cancelled'
}

export function isMissionClosed(status) {
  return String(status || '').toLowerCase() === 'closed'
}
