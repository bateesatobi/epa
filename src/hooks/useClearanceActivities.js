import { useQuery } from '@tanstack/react-query'
import { clearanceActivitiesAPI } from '../services/api'

export const clearanceActivityKeys = {
  all: ['clearance-activities'],
  lists: () => [...clearanceActivityKeys.all, 'list'],
  list: (filters) => [...clearanceActivityKeys.lists(), filters],
}

/**
 * Fetch clearance activities with long cache (rarely changes)
 */
export const useClearanceActivities = (filters = { is_active: true }, options = {}) => {
  return useQuery({
    queryKey: clearanceActivityKeys.list(filters),
    queryFn: () => clearanceActivitiesAPI.list(filters),
    staleTime: 30 * 60 * 1000, // 30 minutes - activities rarely change
    gcTime: 60 * 60 * 1000, // 1 hour - keep in cache for 1 hour
    ...options,
  })
}

