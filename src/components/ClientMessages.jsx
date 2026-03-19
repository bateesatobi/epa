import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  TextField,
  Button,
  CircularProgress,
  alpha,
  Chip
} from '@mui/material';
import { Chat, Send, Person, ManageAccounts } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { complianceAPI } from '../services/api';
import { toast } from 'react-toastify';

const ClientMessages = ({ shipmentId, clientId, isAdmin }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await complianceAPI.getClientCommunications(clientId, shipmentId);
      setMessages(data || []);
    } catch (error) {
      console.error('Failed to load client messages:', error);
      toast.error('Failed to load client messages');
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    if (clientId && shipmentId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [clientId, shipmentId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSubmitting(true);
    try {
      await complianceAPI.queryClient(clientId, {
        shipment_id: shipmentId,
        subject: 'Dashboard Reply',
        message: newMessage.trim(),
      });
      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chat sx={{ color: '#01A3DA' }} /> CLIENT MESSAGES
        </Typography>
        <Chip label={`${messages.length} Messages`} sx={{ bgcolor: alpha('#01A3DA', 0.1), color: '#01A3DA', fontWeight: 700 }} />
      </Stack>

      {/* Chat Area */}
      <Paper variant="outlined" sx={{ height: 400, display: 'flex', flexDirection: 'column', bgcolor: '#F8F9FA', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {messages.length === 0 ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
              <Chat sx={{ fontSize: 48, mb: 1, color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary">
                No chat history with the client for this shipment.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {messages.map((msg) => {
                const isSystemOrAdmin = msg.sender_type !== 'client';
                return (
                  <Box 
                    key={msg.id} 
                    sx={{ 
                      alignSelf: isSystemOrAdmin ? 'flex-end' : 'flex-start',
                      maxWidth: '80%'
                    }}
                  >
                    <Stack direction={isSystemOrAdmin ? "row-reverse" : "row"} spacing={1.5} alignItems="flex-end">
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          bgcolor: isSystemOrAdmin ? 'primary.main' : 'secondary.main',
                          border: '2px solid #FFF'
                        }}
                      >
                        {isSystemOrAdmin ? <ManageAccounts fontSize="small" /> : <Person fontSize="small" />}
                      </Avatar>
                      <Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            mb: 0.5, 
                            textAlign: isSystemOrAdmin ? 'right' : 'left',
                            color: 'text.secondary',
                            fontWeight: 600,
                            fontSize: '0.65rem'
                          }}
                        >
                          {isSystemOrAdmin ? 'Administration' : 'Client Mobile App'} • {formatDistanceToNow(new Date(msg.created_at))} ago
                        </Typography>
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2, 
                            borderRadius: 3,
                            borderTopRightRadius: isSystemOrAdmin ? 4 : 24,
                            borderTopLeftRadius: !isSystemOrAdmin ? 4 : 24,
                            bgcolor: isSystemOrAdmin ? '#01A3DA' : '#FFF',
                            color: isSystemOrAdmin ? '#FFF' : 'text.primary',
                            border: isSystemOrAdmin ? 'none' : '1px solid',
                            borderColor: 'divider',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                          }}
                        >
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                            {msg.message}
                          </Typography>
                        </Paper>
                      </Box>
                    </Stack>
                  </Box>
                )
              })}
              <div ref={messagesEndRef} />
            </Stack>
          )}
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, bgcolor: '#FFF', borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} alignItems="flex-end">
            <TextField
              fullWidth
              size="small"
              placeholder="Message the client..."
              multiline
              maxRows={4}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={submitting || !isAdmin}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: '#F8F9FA'
                }
              }}
            />
            <Button
              variant="contained"
              disabled={!newMessage.trim() || submitting || !isAdmin}
              onClick={handleSend}
              sx={{ 
                minWidth: 48, 
                width: 48, 
                height: 48, 
                borderRadius: '50%', 
                p: 0,
                flexShrink: 0
              }}
            >
              {submitting ? <CircularProgress size={20} color="inherit" /> : <Send sx={{ ml: 0.5 }} />}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default ClientMessages;
