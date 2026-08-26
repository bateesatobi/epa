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

export function isAssignmentActive(assignment) {
  const s = String(assignment?.status || '').toLowerCase()
  return s !== 'completed' && s !== 'cancelled'
}

export function groupConsignmentsFromAssignments(assignments = []) {
  const map = new Map()
  for (const item of assignments) {
    const id = item.shipment_id || item.id
    if (!id) continue
    const existing = map.get(id)
    if (!existing) {
      map.set(id, { ...item, shipment_id: id, activities: [item] })
      continue
    }
    existing.activities.push(item)
    const existingAt = new Date(existing.assigned_at || 0).getTime()
    const nextAt = new Date(item.assigned_at || 0).getTime()
    if (nextAt >= existingAt) {
      const activities = existing.activities
      Object.assign(existing, item, { shipment_id: id, activities })
    }
  }

  return Array.from(map.values()).map((consignment) => {
    const activities = consignment.activities || []
    const activityNames = [
      ...new Set(
        activities
          .map((a) => a.clearance_activity_name || a.activity_name)
          .filter(Boolean)
      ),
    ]
    return {
      ...consignment,
      hasActive: activities.some(isAssignmentActive),
      activity_names: activityNames,
    }
  })
}

export function uniqueConsignmentsFromAssignments(assignments = []) {
  return groupConsignmentsFromAssignments(assignments)
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
