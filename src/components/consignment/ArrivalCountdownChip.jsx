import React from 'react'
import { Chip, Stack, Typography } from '@mui/material'
import {
  arrivalCountdownLabel,
  arrivalCountdownTone,
  formatArrivalDate,
  isDeliveredStatus,
} from '../../utils/arrivalCountdown'

export default function ArrivalCountdownChip({ date, status, size = 'small' }) {
  const delivered = isDeliveredStatus(status)
  if (!date && !delivered) {
    return (
      <Typography component="span" variant="body2" color="text.secondary">
        —
      </Typography>
    )
  }

  const tone = arrivalCountdownTone(date, { delivered })
  return (
    <Chip
      size={size}
      color={tone === 'neutral' ? 'default' : tone}
      label={arrivalCountdownLabel(date, { delivered })}
      sx={{ fontWeight: 700 }}
    />
  )
}

export function ArrivalMeta({ date, status, sx, onDark = false }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={sx}>
      <Typography
        variant="body2"
        fontWeight={600}
        color={onDark ? undefined : 'text.secondary'}
        sx={onDark ? { color: 'rgba(255,255,255,0.92)' } : undefined}
      >
        Arrival {formatArrivalDate(date)}
      </Typography>
      <ArrivalCountdownChip date={date} status={status} />
    </Stack>
  )
}
