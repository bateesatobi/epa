import React from 'react'
import { Chip, Stack } from '@mui/material'

function chipSx(filled, tone) {
  const colors =
    tone === 'feedback'
      ? { bg: '#f59e0b', fg: '#111' }
      : { bg: '#ef4444', fg: '#fff' }
  return filled
    ? {
        height: 20,
        fontSize: '0.65rem',
        fontWeight: 800,
        bgcolor: colors.bg,
        color: colors.fg,
        '& .MuiChip-label': { px: 0.75 },
      }
    : {
        height: 20,
        fontSize: '0.65rem',
        fontWeight: 800,
        borderColor: colors.bg,
        color: tone === 'feedback' ? '#b45309' : '#b91c1c',
        '& .MuiChip-label': { px: 0.75 },
      }
}

export default function ResourceAlertBadges({
  queries = 0,
  feedback = 0,
  unreadQueries = 0,
  unreadFeedback = 0,
  onQueryClick,
  onFeedbackClick,
}) {
  const queryCount = Number(queries) || 0
  const feedbackCount = Number(feedback) || 0
  const qUnread = Number(unreadQueries) || 0
  const fUnread = Number(unreadFeedback) || 0
  const showQueries = queryCount > 0 || qUnread > 0
  const showFeedback = feedbackCount > 0 || fUnread > 0
  if (!showQueries && !showFeedback) return null

  const queryLabel = qUnread
    ? `${qUnread} new ${qUnread === 1 ? 'query' : 'queries'}`
    : `${queryCount} ${queryCount === 1 ? 'query' : 'queries'}`
  const feedbackLabel = fUnread
    ? `${fUnread} new feedback`
    : `${feedbackCount} feedback`

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {showQueries && (
        <Chip
          size="small"
          label={queryLabel}
          variant={qUnread ? 'filled' : 'outlined'}
          onClick={
            onQueryClick
              ? (e) => {
                  e.stopPropagation()
                  onQueryClick(e)
                }
              : undefined
          }
          sx={chipSx(Boolean(qUnread), 'query')}
        />
      )}
      {showFeedback && (
        <Chip
          size="small"
          label={feedbackLabel}
          variant={fUnread ? 'filled' : 'outlined'}
          onClick={
            onFeedbackClick
              ? (e) => {
                  e.stopPropagation()
                  onFeedbackClick(e)
                }
              : undefined
          }
          sx={chipSx(Boolean(fUnread), 'feedback')}
        />
      )}
    </Stack>
  )
}
