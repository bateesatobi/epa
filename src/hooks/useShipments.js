import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shipmentsAPI } from '../services/api'
import { toast } from 'react-toastify'

// Query keys for consistent cache management
export const shipmentKeys = {
  all: ['shipments'],
  lists: () => [...shipmentKeys.all, 'list'],
  list: (filters) => [...shipmentKeys.lists(), filters],
  details: () => [...shipmentKeys.all, 'detail'],
  detail: (id) => [...shipmentKeys.details(), id],
  timeline: (id) => [...shipmentKeys.all, 'timeline', id],
  history: (id) => [...shipmentKeys.all, 'history', id],
  assignments: (id) => [...shipmentKeys.all, 'assignments', id],
  activityCounts: () => [...shipmentKeys.all, 'activity-counts'],
}

/**
 * Fetch shipments list with caching
 * @param {Object} filters - Query filters (skip, limit, status, etc.)
 * @param {Object} options - React Query options
 */
export const useShipments = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: shipmentKeys.list(filters),
    queryFn: () => shipmentsAPI.list(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 min
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for 5 min
    ...options,
  })
}

/**
 * Fetch single shipment details with caching
 * @param {number} shipmentId - Shipment ID
 * @param {Object} options - React Query options
 */
export const useShipment = (shipmentId, options = {}) => {
  return useQuery({
    queryKey: shipmentKeys.detail(shipmentId),
    queryFn: () => shipmentsAPI.get(shipmentId),
    enabled: !!shipmentId, // Only fetch if shipmentId exists
    staleTime: 10 * 60 * 1000, // 10 minutes - shipment details change less frequently
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  })
}

/**
 * Fetch shipment timeline
 */
export const useShipmentTimeline = (shipmentId, options = {}) => {
  return useQuery({
    queryKey: shipmentKeys.timeline(shipmentId),
    queryFn: () => shipmentsAPI.getTimeline(shipmentId).catch(() => []),
    enabled: !!shipmentId,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch clearance history
 */
export const useClearanceHistory = (shipmentId, options = {}) => {
  return useQuery({
    queryKey: shipmentKeys.history(shipmentId),
    queryFn: () => shipmentsAPI.getClearanceHistory(shipmentId).catch(() => []),
    enabled: !!shipmentId,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch activity assignments
 */
export const useActivityAssignments = (shipmentId, options = {}) => {
  return useQuery({
    queryKey: shipmentKeys.assignments(shipmentId),
    queryFn: () => shipmentsAPI.listClearanceActivityAssignments(shipmentId).catch(() => []),
    enabled: !!shipmentId,
    staleTime: 2 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch clearance activity counts (for tabs)
 */
export const useActivityCounts = (options = {}) => {
  return useQuery({
    queryKey: shipmentKeys.activityCounts(),
    queryFn: () => shipmentsAPI.getClearanceActivityCounts(),
    staleTime: 1 * 60 * 1000, // 1 minute - counts change frequently
    gcTime: 3 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    ...options,
  })
}

/**
 * Create shipment mutation
 */
export const useCreateShipment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => shipmentsAPI.create(data),
    onSuccess: () => {
      // Invalidate shipments list to refetch
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.activityCounts() })
      toast.success('Shipment created successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create shipment')
    },
  })
}

/**
 * Update shipment mutation
 */
export const useUpdateShipment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }) => shipmentsAPI.update(id, data),
    onSuccess: (data, variables) => {
      // Update cache for this specific shipment
      queryClient.setQueryData(shipmentKeys.detail(variables.id), data)
      // Invalidate list to ensure consistency
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() })
      toast.success('Shipment updated successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update shipment')
    },
  })
}

/**
 * Delete shipment mutation
 */
export const useDeleteShipment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id) => shipmentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.activityCounts() })
      toast.success('Shipment deleted successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete shipment')
    },
  })
}

