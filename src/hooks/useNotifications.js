import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { API_BASE_URL, notificationsAPI } from '../services/api'

export const notificationKeys = {
  all: ['notifications'],
  unreadCount: () => [...notificationKeys.all, 'unreadCount'],
  unread: () => [...notificationKeys.all, 'unread'],
  list: (tab) => [...notificationKeys.all, 'list', tab],
}

export function invalidateNotifications(queryClient) {
  return queryClient.invalidateQueries({ queryKey: notificationKeys.all })
}

const POLL_MS = 15_000

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const data = await notificationsAPI.getUnreadCount()
      return data?.count || 0
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  })
}

export function useUnreadNotifications(limit = 50) {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async () => {
      const data = await notificationsAPI.getUnread(limit)
      return Array.isArray(data) ? data : []
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  })
}

export function useNotificationList(tabValue = 0) {
  return useQuery({
    queryKey: notificationKeys.list(tabValue),
    queryFn: async () => {
      const statusParam = tabValue === 1 ? 'unread' : tabValue === 2 ? 'read' : undefined
      const response = await notificationsAPI.list({ status: statusParam, limit: 100 })
      return Array.isArray(response) ? response : (response?.items || [])
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  })
}

function parseSseChunk(buffer) {
  const events = []
  const parts = buffer.split('\n\n')
  const rest = parts.pop() || ''
  for (const block of parts) {
    let event = 'message'
    const dataLines = []
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
    }
    if (!dataLines.length) continue
    try {
      events.push({ event, data: JSON.parse(dataLines.join('\n')) })
    } catch {
      // ignore malformed frames
    }
  }
  return { events, rest }
}

/** Live stream with polling fallback. New events invalidate the shared cache. */
export function useNotificationStream(enabled = true) {
  const queryClient = useQueryClient()
  const lastToastId = useRef(null)

  useEffect(() => {
    if (!enabled) return undefined
    const token = localStorage.getItem('token')
    if (!token) return undefined

    const controller = new AbortController()
    let stopped = false
    let retryMs = 3000

    const onNotification = (item) => {
      invalidateNotifications(queryClient)
      if (item?.id && item.id !== lastToastId.current) {
        lastToastId.current = item.id
        toast.info(item.title || 'New notification', {
          autoClose: 4000,
        })
      }
    }

    const connect = async () => {
      while (!stopped) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/notifications/stream`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
            signal: controller.signal,
          })
          if (!response.ok || !response.body) {
            throw new Error(`stream ${response.status}`)
          }
          retryMs = 3000
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          while (!stopped) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const parsed = parseSseChunk(buffer)
            buffer = parsed.rest
            for (const frame of parsed.events) {
              if (frame.event === 'notification') onNotification(frame.data)
            }
          }
        } catch (err) {
          if (stopped || err?.name === 'AbortError') break
        }
        if (stopped) break
        await new Promise((resolve) => setTimeout(resolve, retryMs))
        retryMs = Math.min(retryMs * 2, 30000)
      }
    }

    connect()
    return () => {
      stopped = true
      controller.abort()
    }
  }, [enabled, queryClient])
}

export function useAdminNotifications() {
  const queryClient = useQueryClient()
  const countQuery = useUnreadNotificationCount()
  const unreadQuery = useUnreadNotifications()
  useNotificationStream(true)

  return {
    unreadCount: countQuery.data || 0,
    unreadNotifications: unreadQuery.data || [],
    unreadLoading: unreadQuery.isFetching,
    refetchUnread: () => {
      countQuery.refetch()
      unreadQuery.refetch()
    },
    invalidate: () => invalidateNotifications(queryClient),
  }
}
