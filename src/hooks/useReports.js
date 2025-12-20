import { useQuery } from '@tanstack/react-query'
import { reportsAPI } from '../services/api'

export const reportKeys = {
  all: ['reports'],
  kpis: () => [...reportKeys.all, 'kpis'],
  activityAnalytics: () => [...reportKeys.all, 'activity-analytics'],
  fieldStaffAnalytics: () => [...reportKeys.all, 'field-staff-analytics'],
  overdueAnalytics: () => [...reportKeys.all, 'overdue-analytics'],
  timelineAnalytics: (days) => [...reportKeys.all, 'timeline-analytics', days],
  alerts: () => [...reportKeys.all, 'alerts'],
}

/**
 * Fetch KPIs with aggressive caching (backend also caches)
 */
export const useKPIs = (options = {}) => {
  return useQuery({
    queryKey: reportKeys.kpis(),
    queryFn: () => reportsAPI.getKPIs(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    ...options,
  })
}

/**
 * Fetch activity analytics
 */
export const useActivityAnalytics = (options = {}) => {
  return useQuery({
    queryKey: reportKeys.activityAnalytics(),
    queryFn: () => reportsAPI.getActivityAnalytics(),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch field staff analytics
 */
export const useFieldStaffAnalytics = (options = {}) => {
  return useQuery({
    queryKey: reportKeys.fieldStaffAnalytics(),
    queryFn: () => reportsAPI.getFieldStaffAnalytics(),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch overdue analytics
 */
export const useOverdueAnalytics = (options = {}) => {
  return useQuery({
    queryKey: reportKeys.overdueAnalytics(),
    queryFn: () => reportsAPI.getOverdueAnalytics(),
    staleTime: 2 * 60 * 1000, // 2 minutes - overdue data changes more frequently
    ...options,
  })
}

/**
 * Fetch timeline analytics
 */
export const useTimelineAnalytics = (days = 30, options = {}) => {
  return useQuery({
    queryKey: reportKeys.timelineAnalytics(days),
    queryFn: () => reportsAPI.getTimelineAnalytics(days),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Fetch control room alerts
 */
export const useAlerts = (options = {}) => {
  return useQuery({
    queryKey: reportKeys.alerts(),
    queryFn: () => reportsAPI.getControlRoomAlerts(),
    staleTime: 1 * 60 * 1000, // 1 minute - alerts are time-sensitive
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    ...options,
  })
}

