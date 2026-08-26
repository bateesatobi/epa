const MS_PER_DAY = 24 * 60 * 60 * 1000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function parseArrivalDate(value) {
  if (!value) return null
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

export function daysUntilArrival(value) {
  const arrival = parseArrivalDate(value)
  if (!arrival) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((arrival.getTime() - today.getTime()) / MS_PER_DAY)
}

export function isDeliveredStatus(status) {
  return String(status || '').toLowerCase() === 'delivered'
}

export function arrivalCountdownLabel(value, { delivered = false } = {}) {
  if (delivered) return 'Arrived'
  const days = daysUntilArrival(value)
  if (days == null) return '—'
  if (days === 0) return 'Arrives today'
  if (days > 0) return `${days}d remaining`
  return `Overdue ${Math.abs(days)}d`
}

export function arrivalCountdownTone(value, { delivered = false } = {}) {
  if (delivered) return 'success'
  const days = daysUntilArrival(value)
  if (days == null) return 'neutral'
  if (days < 0) return 'error'
  if (days <= 3) return 'warning'
  return 'primary'
}

export function formatArrivalDate(value) {
  const d = parseArrivalDate(value)
  if (!d) return '—'
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
}

export function toDateInputValue(value) {
  const d = parseArrivalDate(value)
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function toEstimatedDeliveryPayload(dateInput) {
  const v = String(dateInput || '').trim()
  if (!v) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T12:00:00`
  return v
}
