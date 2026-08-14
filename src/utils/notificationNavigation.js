/** Shared admin notification click-through targets and alert counts. */

const SHIPMENT_TYPES = new Set([
  'shipment',
  'shipment_update',
  'assignment',
  'compliance',
  'document_request',
  'document',
  'query',
  'comment',
])

const REQUEST_TYPES = new Set([
  'consignment_request',
  'consignment_request_query',
])

const QUERY_TYPES = new Set(['query', 'consignment_request_query'])
const FEEDBACK_TYPES = new Set(['comment', 'feedback'])

export function notificationKind(item) {
  const type = String(item?.resource_type || item?.type || '').toLowerCase()
  const title = String(item?.title || '').toLowerCase()

  if (FEEDBACK_TYPES.has(type)) return 'feedback'
  if (
    title.includes('comment') ||
    title.includes('feedback') ||
    title.includes('sent a message')
  ) {
    return 'feedback'
  }
  if (title.includes('replied on a consignment') && !title.includes('query')) {
    return 'feedback'
  }
  if (QUERY_TYPES.has(type) || title.includes('query')) return 'query'
  if (type === 'consignment_request') return 'request'
  if (SHIPMENT_TYPES.has(type) || type.includes('shipment')) return 'consignment'
  return 'other'
}

export function notificationCategory(resourceTypeOrItem) {
  const item =
    resourceTypeOrItem && typeof resourceTypeOrItem === 'object'
      ? resourceTypeOrItem
      : { resource_type: resourceTypeOrItem }
  const kind = notificationKind(item)
  if (kind === 'query') return 'queries'
  if (kind === 'feedback') return 'feedback'
  if (kind === 'request') return 'requests'
  if (kind === 'consignment') return 'consignments'
  return 'other'
}

export function notificationKindLabel(item) {
  const kind = notificationKind(item)
  if (kind === 'query') return 'Query'
  if (kind === 'feedback') return 'Feedback'
  if (kind === 'request') return 'Request'
  if (kind === 'consignment') return 'Consignment'
  return 'Other'
}

export function getAdminNotificationTarget(notification) {
  if (!notification) return null
  const type = String(notification.resource_type || notification.type || '').toLowerCase()
  const id = notification.resource_id
  const kind = notificationKind(notification)

  if (type === 'feedback' || (kind === 'feedback' && !id)) {
    return { pathname: '/dashboard/feedback' }
  }
  if (!id) return null

  if (type === 'consignment_request_query' || (kind === 'query' && type.includes('request'))) {
    return {
      pathname: '/dashboard/consignment-requests',
      state: { requestId: id, focusQueries: true },
    }
  }
  if (type === 'consignment_request') {
    return {
      pathname: '/dashboard/consignment-requests',
      state: { requestId: id },
    }
  }
  if (kind === 'feedback' || type === 'comment') {
    return { pathname: `/dashboard/shipments/${id}`, search: '?tab=comments' }
  }
  if (kind === 'query' || type === 'query') {
    return { pathname: `/dashboard/shipments/${id}`, search: '?tab=queries' }
  }
  if (SHIPMENT_TYPES.has(type) || type.includes('shipment')) {
    const search = ['compliance', 'document_request', 'document'].includes(type)
      ? '?tab=documents'
      : ''
    return { pathname: `/dashboard/shipments/${id}`, search }
  }
  if (type === 'report') {
    return { pathname: '/dashboard/reports' }
  }
  if (type === 'user' || type === 'role') {
    return { pathname: '/dashboard/users' }
  }
  return null
}

export function getSidebarAlertCounts(unreadItems = [], totalUnread = 0) {
  const counts = {
    notifications: totalUnread || 0,
    requests: 0,
    consignments: 0,
    queries: 0,
    feedback: 0,
    consignmentQueries: 0,
    consignmentFeedback: 0,
    requestQueries: 0,
  }
  for (const item of unreadItems) {
    const type = String(item.resource_type || item.type || '').toLowerCase()
    const kind = notificationKind(item)
    const isRequest = REQUEST_TYPES.has(type)

    if (kind === 'query') {
      counts.queries += 1
      if (isRequest) {
        counts.requestQueries += 1
        counts.requests += 1
      } else {
        counts.consignmentQueries += 1
        counts.consignments += 1
      }
    } else if (kind === 'feedback') {
      if (!item.resource_id || type === 'feedback') {
        counts.feedback += 1
      } else {
        counts.consignmentFeedback += 1
        counts.consignments += 1
      }
    } else if (isRequest) {
      counts.requests += 1
    } else if (SHIPMENT_TYPES.has(type) || type.includes('shipment')) {
      counts.consignments += 1
    }
  }
  if (!counts.notifications) {
    counts.notifications = unreadItems.length
  }
  return counts
}

export function indexResourceAlerts(unreadItems = []) {
  const byId = {}
  for (const item of unreadItems) {
    const id = Number(item.resource_id)
    if (!id) continue
    if (!byId[id]) byId[id] = { queries: 0, feedback: 0 }
    const kind = notificationKind(item)
    if (kind === 'query') byId[id].queries += 1
    else if (kind === 'feedback') byId[id].feedback += 1
  }
  return byId
}

export function formatAlertCount(count) {
  const n = Number(count) || 0
  if (n <= 0) return ''
  if (n > 99) return '99+'
  return String(n)
}

export function navigateFromAdminNotification(navigate, notification) {
  const target = getAdminNotificationTarget(notification)
  if (!target) return false
  navigate(`${target.pathname}${target.search || ''}`, { state: target.state })
  return true
}
