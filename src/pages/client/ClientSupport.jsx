import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Send, SupportAgent } from '@mui/icons-material'
import { format } from 'date-fns'
import { clientPortalAPI } from '../../services/clientPortalApi'
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts'

export default function ClientSupport() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const load = () => {
    clientPortalAPI
      .getSupportMessages()
      .then((data) => setMessages(Array.isArray(data) ? data : data.items || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const send = async () => {
    if (!message.trim()) {
      showErrorAlert('Required', 'Please enter a message')
      return
    }
    setSending(true)
    try {
      await clientPortalAPI.sendSupportMessage({
        subject: subject.trim() || 'General Support',
        message: message.trim(),
      })
      showSuccessAlert('Sent', 'Your message has been sent to the support team')
      setMessage('')
      setSubject('')
      load()
    } catch (e) {
      showErrorAlert('Failed', e.response?.data?.detail || 'Could not send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #01A3DA 0%, #0178A3 100%)',
          color: '#fff',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <SupportAgent />
          <Typography variant="h4" fontWeight={800}>
            Feedback & Support
          </Typography>
        </Stack>
        <Typography sx={{ opacity: 0.9, mt: 1 }}>
          We&apos;re here to help with your consignments and compliance.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 3, border: '1px solid #E9ECEF', mb: 3 }} elevation={0}>
        <CardContent>
          <Typography fontWeight={700} gutterBottom>
            New message
          </Typography>
          <Stack spacing={2}>
            <TextField label="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} fullWidth />
            <TextField
              label="Message"
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              required
            />
            <Button variant="contained" startIcon={<Send />} onClick={send} disabled={sending}>
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        {messages.map((m) => {
          const isClient = m.sender_type === 'client'
          return (
            <Box
              key={m.id}
              sx={{
                alignSelf: isClient ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                ml: isClient ? 'auto' : 0,
              }}
            >
              <Card
                sx={{
                  borderRadius: 3,
                  bgcolor: isClient ? 'primary.light' : '#fff',
                  border: '1px solid #E9ECEF',
                }}
                elevation={0}
              >
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    {isClient ? 'You' : 'EPA Support'}
                  </Typography>
                  {m.subject && (
                    <Typography variant="subtitle2" fontWeight={600}>
                      {m.subject}
                    </Typography>
                  )}
                  <Typography variant="body2">{m.message}</Typography>
                  <Typography variant="caption" color="text.disabled">
                    {m.created_at ? format(new Date(m.created_at), 'PPp') : ''}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )
        })}
      </Stack>
    </Box>
  )
}
