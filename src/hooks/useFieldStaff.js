import { useQuery } from '@tanstack/react-query'
import { shipmentsAPI } from '../services/api'

export const fieldStaffKeys = {
  all: ['fieldStaff'],
  assignments: () => [...fieldStaffKeys.all, 'assignments'],
  incoming: () => [...fieldStaffKeys.all, 'incoming'],
}

export function useMyAssignments(options = {}) {
  const { activeOnly = false } = options
  return useQuery({
    queryKey: [...fieldStaffKeys.assignments(), { activeOnly }],
    queryFn: async () => {
      const data = await shipmentsAPI.getMyAssignments()
      if (!activeOnly) return data
      return data.filter((a) => String(a.status || '').toLowerCase() !== 'completed')
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
}

export function uniqueConsignmentsFromAssignments(assignments = []) {
  const map = new Map()
  for (const item of assignments) {
    const id = item.shipment_id || item.id
    if (!id || map.has(id)) continue
    map.set(id, item)
  }
  return Array.from(map.values())
}

export function statusColor(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'completed' || s === 'delivered') return 'success'
  if (s === 'closed') return 'default'
  if (s === 'in_progress' || s === 'in_transit' || s === 'at_customs') return 'info'
  if (s === 'pending' || s === 'on_hold' || s === 'awaiting_release') return 'warning'
  if (s === 'cancelled') return 'error'
  return 'default'
}

export function formatStatusLabel(status) {
  const s = String(status || 'unknown').toLowerCase()
  if (s === 'closed') return 'Mission closed'
  return s.replace(/_/g, ' ')
}
