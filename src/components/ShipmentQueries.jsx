import React, { useState, useEffect } from 'react';
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
  Button,
  Chip,
  IconButton,
  Stack,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Reply,
  CheckCircle,
  ErrorOutline,
  Description,
  Assignment,
  Person,
  Schedule,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { queriesAPI } from '../services/api';
import { toast } from 'react-toastify';

const ShipmentQueries = ({ shipmentId, isAdmin, user }) => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [openReply, setOpenReply] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    declaration_ref: '',
    office_code: 'UGKLA',
    subject: '',
    items: [{ item_no: '1', details: '' }]
  });
  
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [replies, setReplies] = useState({});

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const data = await queriesAPI.listByShipment(shipmentId);
      setQueries(data);
    } catch (error) {
      toast.error('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shipmentId) fetchQueries();
  }, [shipmentId]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { item_no: (formData.items.length + 1).toString(), details: '' }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async () => {
    if (!formData.subject && !formData.declaration_ref) {
      toast.warning('Please provide at least a subject or declaration reference');
      return;
    }
    
    setSubmitting(true);
    try {
      if (formData.id) {
        await queriesAPI.update(formData.id, { ...formData, shipment_id: shipmentId });
        toast.success('Query updated');
      } else {
        await queriesAPI.create({ ...formData, shipment_id: shipmentId });
        toast.success('Query created');
      }
      setOpenForm(false);
      fetchQueries();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join('; ')
        : (detail || error.message || 'Failed to save query');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    setSubmitting(true);
    try {
      const replyData = Object.entries(replies).map(([itemId, text]) => ({
        item_id: parseInt(itemId),
        client_reply: text
      }));
      
      await queriesAPI.reply(selectedQuery.id, replyData);
      toast.success('Reply submitted');
      setOpenReply(false);
      fetchQueries();
    } catch (error) {
      toast.error('Failed to submit reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this query?')) {
      try {
        await queriesAPI.delete(id);
        toast.success('Query deleted');
        fetchQueries();
      } catch (error) {
        toast.error('Failed to delete query');
      }
    }
  };

  const statusColors = {
    sent: 'info',
    replied: 'warning',
    resolved: 'success',
    closed: 'default',
  };

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700} display="flex" alignItems="center" gap={1}>
          <Assignment color="primary" /> Compliance Queries
        </Typography>
        {isAdmin && (
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => {
              setFormData({
                declaration_ref: '',
                office_code: 'UGKLA',
                subject: '',
                items: [{ item_no: '1', details: '' }]
              });
              setOpenForm(true);
            }}
          >
            New Query
          </Button>
        )}
      </Stack>

      {queries.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: '#F8F9FA' }}>
          <Description sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">No structured queries found for this shipment.</Typography>
        </Paper>
      ) : (
        <Box sx={{ maxHeight: 600, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#000', 0.1), borderRadius: 3 } }}>
          <Stack spacing={3}>
            {queries.map((query) => (
              <Paper key={query.id} variant="outlined" sx={{ overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                {/* Query Header */}
                <Box sx={{ p: 2, bgcolor: '#F8F9FA', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>OFFICE / REF</Typography>
                      <Typography variant="body2" fontWeight={700}>{query.office_code} - {query.declaration_ref || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>SUBJECT</Typography>
                    <Typography variant="body2" fontWeight={600}>{query.subject || 'General Compliance'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                      <Chip 
                        label={(query.status || 'sent').toUpperCase()} 
                        size="small" 
                        color={statusColors[query.status] || 'default'}
                        sx={{ fontWeight: 800, fontSize: '0.65rem' }} 
                      />
                      {isAdmin && (
                        <>
                          <IconButton size="small" onClick={() => { setFormData(query); setOpenForm(true); }}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(query.id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </Box>

              {/* Items Table */}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#EDF2F7' }}>
                      <TableCell sx={{ fontWeight: 700, width: 80 }}>Item No.</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Query Details</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Client Reply</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(query.items || []).map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.item_no}</TableCell>
                        <TableCell><Typography variant="body2">{item.details}</Typography></TableCell>
                        <TableCell>
                          {item.client_reply ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                              <Typography variant="body2" color="success.main" fontSize="0.8rem">{item.client_reply}</Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.disabled italic">Waiting for reply...</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Footer */}
              <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={2}>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Person sx={{ fontSize: 14 }} /> Raised by: {query.officer_name || 'System'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Schedule sx={{ fontSize: 14 }} /> {format(new Date(query.created_at), 'MMM dd, HH:mm')}
                  </Typography>
                </Stack>
                {(!isAdmin && query.status !== 'resolved') && (
                  <Button 
                    size="small" 
                    startIcon={<Reply />} 
                    variant="outlined"
                    onClick={() => {
                      setSelectedQuery(query);
                      const initialReplies = {};
                      query.items.forEach(item => {
                        initialReplies[item.id] = item.client_reply || '';
                      });
                      setReplies(initialReplies);
                      setOpenReply(true);
                    }}
                  >
                    Reply
                  </Button>
                )}
              </Box>
            </Paper>
          ))}
        </Stack>
      </Box>
    )}

      {/* Query Form Dialog (Admin Only) */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {formData.id ? 'Edit Query' : 'New Compliance Query'}
          <Typography variant="body2" color="text.secondary">Part A: Query Details (ASYCUDA Style)</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={4}>
              <TextField 
                label="Office Code" 
                value={formData.office_code} 
                onChange={(e) => setFormData({...formData, office_code: e.target.value})}
                fullWidth size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField 
                label="Declaration Ref" 
                placeholder="e.g. 2026/C/32733"
                value={formData.declaration_ref} 
                onChange={(e) => setFormData({...formData, declaration_ref: e.target.value})}
                fullWidth size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField 
                label="Subject" 
                value={formData.subject} 
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                fullWidth size="small"
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={700} mb={1}>Query Items</Typography>
          <Stack spacing={2}>
            {formData.items.map((item, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2, bgcolor: '#F8F9FA' }}>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={2}>
                    <TextField 
                      label="No." 
                      value={item.item_no} 
                      onChange={(e) => handleItemChange(index, 'item_no', e.target.value)}
                      fullWidth size="small"
                    />
                  </Grid>
                  <Grid item xs={9}>
                    <TextField 
                      label="Query Details" 
                      multiline rows={2}
                      value={item.details} 
                      onChange={(e) => handleItemChange(index, 'details', e.target.value)}
                      fullWidth size="small"
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton color="error" onClick={() => handleRemoveItem(index)} disabled={formData.items.length === 1}>
                      <Delete />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
          <Button startIcon={<Add />} onClick={handleAddItem} sx={{ mt: 2 }}>Add Item</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : (formData.id ? 'Save Changes' : 'Send Query')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reply Dialog (Client Only) */}
      <Dialog open={openReply} onClose={() => setOpenReply(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reply to Query: {selectedQuery?.subject || selectedQuery?.declaration_ref}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {selectedQuery?.items.map(item => (
              <Box key={item.id}>
                <Typography variant="body2" fontWeight={700} color="primary" mb={0.5}>
                  Item {item.item_no}
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, bgcolor: '#F8F9FA' }}>
                  <Typography variant="body2">{item.details}</Typography>
                </Paper>
                <TextField 
                  label="Your Reply" 
                  fullWidth multiline rows={3} 
                  value={replies[item.id] || ''}
                  onChange={(e) => setReplies({...replies, [item.id]: e.target.value})}
                />
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReply(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleReply} disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Submit Replies'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShipmentQueries;
