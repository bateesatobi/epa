import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  MarkEmailRead as ReadIcon,
  Reply as ReplyIcon,
  ChatBubbleOutline as ChatIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { complianceAPI } from '../services/api';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function Feedback() {
  const [tabValue, setTabValue] = useState(0);
  
  // Reply Modal State
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedComm, setSelectedComm] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // View Conversation Modal State
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [conversationMessages, setConversationMessages] = useState([]);

  const queryClient = useQueryClient();

  const { data: communications = [], isLoading: loading, error: queryError, refetch: fetchCommunications } = useQuery({
    queryKey: ['communicationsList'],
    queryFn: async () => {
      const data = await complianceAPI.getAllCommunications();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const error = queryError ? 'Failed to load feedback messages. Please try again.' : null;

  const handleMarkRead = async (id) => {
    try {
      await complianceAPI.markCommunicationRead(id);
      queryClient.setQueryData(['communicationsList'], (old) => 
        old ? old.map(c => 
          c.id === id ? { ...c, is_read: true, read_at: new Date().toISOString() } : c
        ) : old
      );
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleOpenReply = (comm) => {
    setSelectedComm(comm);
    setReplyMessage('');
    setReplyDialogOpen(true);
  };

  const handleViewConversation = (comm) => {
    setSelectedComm(comm);
    // Filter messages for this client and subject (or shipment)
    const thread = communications
      .filter(c => 
        c.client_id === comm.client_id && 
        (c.subject === comm.subject || c.shipment_id === comm.shipment_id)
      )
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    setConversationMessages(thread);
    setViewDialogOpen(true);
    
    // Auto-mark as read if viewing an unread client message
    if (!comm.is_read && comm.sender_type === 'client') {
      handleMarkRead(comm.id);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;
    
    setSendingReply(true);
    try {
      await complianceAPI.queryClient(selectedComm.client_id, {
        shipment_id: selectedComm.shipment_id,
        subject: selectedComm.subject || 'Support Query',
        message: replyMessage
      });
      setReplyDialogOpen(false);
      setViewDialogOpen(false);
      fetchCommunications(); // Refresh to show new message
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const filteredCommunications = communications.filter(comm => {
    if (tabValue === 0) return true; // All
    if (tabValue === 1) return !comm.is_read && comm.sender_type === 'client'; // Unread
    if (tabValue === 2) return comm.is_read || comm.sender_type === 'admin'; // Read/Archived
    return true;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="700" color="primary">
          Feedback & Support Inbox
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          variant="outlined" 
          onClick={fetchCommunications}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, val) => setTabValue(val)} 
          indicatorColor="primary" 
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Messages" />
          <Tab label={`New Feedback (${communications.filter(c => !c.is_read && c.sender_type === 'client').length})`} />
          <Tab label="Handled" />
        </Tabs>

        {loading ? (
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress />
          </Box>
        ) : filteredCommunications.length === 0 ? (
          <Box textAlign="center" p={5}>
            <ChatIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No messages found in this category.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Latest Message</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCommunications.map((comm) => (
                  <TableRow 
                    key={comm.id} 
                    hover
                    sx={{ 
                      bgcolor: !comm.is_read && comm.sender_type === 'client' ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleViewConversation(comm)}
                  >
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {format(new Date(comm.created_at), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: comm.sender_type === 'client' ? 'primary.main' : 'secondary.main', fontSize: '0.875rem' }}>
                          {comm.sender_name?.[0]?.toUpperCase() || 'C'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={!comm.is_read ? 'bold' : 'normal'}>
                            {comm.sender_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {comm.client_id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={!comm.is_read ? 'bold' : 'normal'}>
                        {comm.subject || 'General Feedback'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography variant="body2" noWrap color="text.secondary">
                        {comm.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {comm.sender_type === 'admin' ? (
                        <Chip label="Replied" size="small" color="info" variant="outlined" />
                      ) : !comm.is_read ? (
                        <Chip label="New" size="small" color="primary" />
                      ) : (
                        <Chip label="Read" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
                        {comm.sender_type === 'client' && (
                          <>
                            <Tooltip title="Reply">
                              <IconButton color="primary" onClick={() => handleOpenReply(comm)}>
                                <ReplyIcon />
                              </IconButton>
                            </Tooltip>
                            {!comm.is_read && (
                              <Tooltip title="Mark as Read">
                                <IconButton color="success" onClick={() => handleMarkRead(comm.id)}>
                                  <ReadIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </>
                        )}
                        <Tooltip title="View History">
                          <IconButton onClick={() => handleViewConversation(comm)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* View Conversation Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)} 
        fullWidth 
        maxWidth="md"
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 2 }}>
          Conversation with {selectedComm?.sender_name}
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
            Subject: {selectedComm?.subject || 'Support Query'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#f4f7f9', minHeight: '400px' }}>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {conversationMessages.map((msg) => (
              <Box 
                key={msg.id}
                alignSelf={msg.sender_type === 'admin' ? 'flex-end' : 'flex-start'}
                maxWidth="80%"
              >
                <Paper 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    bgcolor: msg.sender_type === 'admin' ? 'primary.main' : 'white',
                    color: msg.sender_type === 'admin' ? 'white' : 'text.primary',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {msg.message}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      textAlign: 'right', 
                      mt: 1, 
                      opacity: 0.7 
                    }}
                  >
                    {format(new Date(msg.created_at), 'MMM dd, HH:mm')}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'white' }}>
          <TextField
            fullWidth
            placeholder="Type your response..."
            size="small"
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendReply();
              }
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleSendReply}
            disabled={!replyMessage.trim() || sendingReply}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Legacy Reply Dialog (for quick actions) */}
      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Quick Reply to {selectedComm?.sender_name}</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            label="Response"
            fullWidth
            multiline
            rows={4}
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSendReply} variant="contained" disabled={!replyMessage.trim() || sendingReply}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
