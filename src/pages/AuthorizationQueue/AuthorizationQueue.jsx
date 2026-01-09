import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse,
} from '@mui/material';
import {
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Clock,
  Filter,
  X,
} from 'lucide-react';
import { authorizationService } from '../../services/authorizationService';

const statusColors = {
  submitted: { bg: 'hsla(221, 83%, 53%, 0.1)', color: 'hsl(221, 83%, 53%)' },
  pending_approval: { bg: 'hsla(38, 92%, 50%, 0.15)', color: 'hsl(38, 92%, 45%)' },
  approved: { bg: 'hsla(142, 52%, 45%, 0.15)', color: 'hsl(142, 52%, 35%)' },
  rejected: { bg: 'hsla(0, 65%, 55%, 0.15)', color: 'hsl(0, 65%, 45%)' },
};

const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
});

export default function AuthorizationQueue() {
  const [authorizations, setAuthorizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuth, setSelectedAuth] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Filter states
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [makerFilter, setMakerFilter] = useState('');

  useEffect(() => {
    fetchAuthorizations();
    const interval = setInterval(fetchAuthorizations, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchAuthorizations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authorizationService.getPendingAuthorizations({ page: 1, limit: 100 });
      // Handle different response formats
      const auths = response?.authorizations || response?.instructions || response || [];
      setAuthorizations(Array.isArray(auths) ? auths : []);
    } catch (err) {
      console.error('Error fetching authorizations:', err);
      if (err.response?.status === 403) {
        setError('Access denied. You need checker or admin role to view authorizations.');
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Unable to connect to the server. Please check if the backend is running.');
      } else {
        setError(err.message || 'Failed to load pending authorizations');
      }
      setAuthorizations([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredAuthorizations = useMemo(() => {
    if (!Array.isArray(authorizations)) return [];
    return authorizations.filter((auth) => {
      if (!auth) return false;
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        auth.instructionId?.toLowerCase().includes(searchLower) ||
        auth.requestId?.toLowerCase().includes(searchLower) ||
        auth.clientId?.toLowerCase().includes(searchLower) ||
        auth.clientName?.toLowerCase().includes(searchLower) ||
        auth.maker?.toLowerCase().includes(searchLower) ||
        auth.module?.toLowerCase().includes(searchLower) ||
        auth.action?.toLowerCase().includes(searchLower) ||
        auth.isin?.toLowerCase().includes(searchLower) ||
        auth.instrumentName?.toLowerCase().includes(searchLower) ||
        auth.status?.toLowerCase().includes(searchLower);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || auth.status === statusFilter;
      
      // Module filter
      const matchesModule = moduleFilter === 'all' || auth.module === moduleFilter;
      
      // Action filter
      const matchesAction = actionFilter === 'all' || auth.action === actionFilter;
      
      // Maker filter
      const makerLower = (auth.maker || '').toLowerCase();
      const matchesMaker = !makerFilter || makerLower.includes(makerFilter.toLowerCase());
      
      return matchesSearch && matchesStatus && matchesModule && matchesAction && matchesMaker;
    });
  }, [authorizations, searchTerm, statusFilter, moduleFilter, actionFilter, makerFilter]);
  
  // Get unique values for filter options
  const uniqueStatuses = useMemo(() => {
    if (!Array.isArray(authorizations)) return [];
    const statuses = [...new Set(authorizations.map(auth => auth?.status).filter(Boolean))];
    return statuses.sort();
  }, [authorizations]);
  
  const uniqueModules = useMemo(() => {
    if (!Array.isArray(authorizations)) return [];
    const modules = [...new Set(authorizations.map(auth => auth?.module).filter(Boolean))];
    return modules.sort();
  }, [authorizations]);
  
  const uniqueActions = useMemo(() => {
    if (!Array.isArray(authorizations)) return [];
    const actions = [...new Set(authorizations.map(auth => auth?.action).filter(Boolean))];
    return actions.sort();
  }, [authorizations]);
  
  const clearFilters = () => {
    setStatusFilter('all');
    setModuleFilter('all');
    setActionFilter('all');
    setMakerFilter('');
    setSearchTerm('');
  };
  
  const hasActiveFilters = statusFilter !== 'all' || moduleFilter !== 'all' || actionFilter !== 'all' || makerFilter || searchTerm;

  const handleViewDetails = (auth) => {
    setSelectedAuth(auth);
    setViewDialogOpen(true);
    // Reset approval/rejection state when opening view
    setComments('');
    setRejectionReason('');
  };

  const handleApprove = () => {
    if (!selectedAuth) return;
    setViewDialogOpen(false); // Close view dialog
    setApproveDialogOpen(true);
  };

  const handleReject = () => {
    if (!selectedAuth) return;
    setViewDialogOpen(false); // Close view dialog
    setRejectDialogOpen(true);
  };

  const submitApproval = async () => {
    if (!selectedAuth) return;
    
    setActionLoading(true);
    try {
      const result = await authorizationService.approveAuthorization(
        selectedAuth.instructionId || selectedAuth.requestId, 
        comments,
        selectedAuth.type
      );
      const authId = selectedAuth.instructionId || selectedAuth.requestId;
      if (selectedAuth.type === 'account_closure') {
        addNotification(
          `Account closure request ${authId} approved. Client account has been closed.`,
          'success'
        );
      } else {
        addNotification(
          `Instruction ${authId} approved. Trade ${result.trade?.tradeId} created.`,
          'success'
        );
      }
      setApproveDialogOpen(false);
      setViewDialogOpen(false);
      setSelectedAuth(null);
      setComments('');
      await fetchAuthorizations();
    } catch (err) {
      addNotification(`Failed to approve: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const submitRejection = async () => {
    if (!selectedAuth || !rejectionReason.trim()) {
      addNotification('Please provide a rejection reason', 'warning');
      return;
    }
    
    setActionLoading(true);
    try {
      await authorizationService.rejectAuthorization(
        selectedAuth.instructionId || selectedAuth.requestId, 
        rejectionReason,
        selectedAuth.type
      );
      const authId = selectedAuth.instructionId || selectedAuth.requestId;
      if (selectedAuth.type === 'account_closure') {
        addNotification(`Account closure request ${authId} rejected`, 'info');
      } else {
        addNotification(`Instruction ${authId} rejected`, 'info');
      }
      setRejectDialogOpen(false);
      setViewDialogOpen(false);
      setSelectedAuth(null);
      setRejectionReason('');
      await fetchAuthorizations();
    } catch (err) {
      addNotification(`Failed to reject: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const addNotification = (message, severity = 'info') => {
    setNotifications((prev) => [{ id: Date.now(), message, severity, timestamp: new Date() }, ...prev].slice(0, 5));
  };

  const pendingCount = useMemo(() => authorizations.length, [authorizations]);

  if (loading && authorizations.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2} mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'hsl(222, 47%, 11%)' }}>
            Authorization Queue
          </Typography>
          <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)' }}>
            Review and approve client instructions. All system authorizations are processed here.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshCw size={16} />}
          onClick={fetchAuthorizations}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {notifications.length > 0 && (
        <Stack spacing={1} mb={2}>
          {notifications.map((note) => (
            <Alert
              key={note.id}
              severity={note.severity}
              onClose={() => setNotifications((prev) => prev.filter((n) => n.id !== note.id))}
            >
              {note.message}
            </Alert>
          ))}
        </Stack>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)', mb: 1 }}>
                Pending Authorization
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'hsl(38, 92%, 45%)' }}>
                {pendingCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
            <TextField
              placeholder="Search by instruction ID, maker, module, action, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flexGrow: 1, minWidth: '250px' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant={filtersOpen ? 'contained' : 'outlined'}
              startIcon={<Filter size={16} />}
              onClick={() => setFiltersOpen(!filtersOpen)}
              size="small"
            >
              Filters
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<X size={16} />}
                onClick={clearFilters}
                size="small"
              >
                Clear
              </Button>
            )}
          </Box>

          {/* Filter Panel */}
          <Collapse in={filtersOpen}>
            <Box
              sx={{
                p: 2,
                mb: 2,
                border: '1px solid hsl(214, 32%, 91%)',
                borderRadius: 1,
                backgroundColor: 'hsl(210, 40%, 98%)',
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Statuses</MenuItem>
                      {uniqueStatuses.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Module</InputLabel>
                    <Select
                      value={moduleFilter}
                      label="Module"
                      onChange={(e) => setModuleFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Modules</MenuItem>
                      {uniqueModules.map((module) => (
                        <MenuItem key={module} value={module}>
                          {module}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Action</InputLabel>
                    <Select
                      value={actionFilter}
                      label="Action"
                      onChange={(e) => setActionFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Actions</MenuItem>
                      {uniqueActions.map((action) => (
                        <MenuItem key={action} value={action}>
                          {action}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Maker"
                    value={makerFilter}
                    onChange={(e) => setMakerFilter(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="Filter by maker..."
                  />
                </Grid>
              </Grid>
            </Box>
          </Collapse>

          <TableContainer component={Paper} sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Queue ID</TableCell>
                  <TableCell>Maker</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAuthorizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'hsl(222, 20%, 40%)' }}>
                      No pending authorizations
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAuthorizations.map((auth, index) => {
                    const statusStyle = statusColors[auth.status] || statusColors.pending_approval;
                    const createdAt = auth.createdAt
                      ? new Date(auth.createdAt).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric'
                        })
                      : '-';
                    
                    // Generate Queue ID based on index (1-based)
                    const queueId = `QUEUE-${String(index + 1).padStart(3, '0')}`;
                    const authId = auth.instructionId || auth.requestId || auth.id;
                    
                    // Get maker, module, and action from auth object
                    const maker = auth.maker || auth.clientId || auth.requestedByUsername || auth.requestedBy || 'N/A';
                    const module = auth.module || 'N/A';
                    const action = auth.action || 'N/A';

                    return (
                      <TableRow key={authId}>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {queueId}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {maker}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)' }}>
                            {module}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)' }}>
                            {action}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={auth.status?.replace('_', ' ')}
                            size="small"
                            sx={{
                              background: statusStyle.bg,
                              color: statusStyle.color,
                              fontWeight: 600,
                              textTransform: 'capitalize',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem', color: 'hsl(222, 20%, 40%)' }}>
                          {createdAt}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Eye size={14} />}
                            onClick={() => handleViewDetails(auth)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
            {selectedAuth?.type === 'account_closure' ? 'Account Closure Request Details' : 'Client Instruction Details'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', fontFamily: 'monospace' }}>
            {selectedAuth?.instructionId || selectedAuth?.requestId}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedAuth && selectedAuth.type === 'account_closure' ? (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Client ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedAuth.clientId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Client Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedAuth.clientName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Requested By
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedAuth.maker || selectedAuth.requestedByUsername || selectedAuth.requestedBy}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Status
                  </Typography>
                  <Chip
                    label={selectedAuth.status?.replace('_', ' ')}
                    size="small"
                    sx={{
                      background: statusColors[selectedAuth.status]?.bg || statusColors.pending_approval.bg,
                      color: statusColors[selectedAuth.status]?.color || statusColors.pending_approval.color,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  />
                </Grid>
                {selectedAuth.reason && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                      Reason for Closure
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: 'hsl(222, 20%, 40%)' }}>
                      {selectedAuth.reason}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          ) : selectedAuth ? (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Client ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedAuth.clientId || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Instruction Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedAuth.instructionType?.toUpperCase() || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Security
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedAuth.instrumentName || 'N/A'}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'hsl(222, 20%, 40%)' }}>
                    {selectedAuth.isin || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Quantity
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {Number(selectedAuth.quantity || 0).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Price
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedAuth.price ? currencyFormatter.format(Number(selectedAuth.price)) : 'Market'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Settlement Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedAuth.settlementDate
                      ? new Date(selectedAuth.settlementDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : 'T+2 (Default)'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Priority
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                    {selectedAuth.priority || 'normal'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Status
                  </Typography>
                  <Chip
                    label={selectedAuth.status?.replace('_', ' ')}
                    size="small"
                    sx={{
                      background: statusColors[selectedAuth.status]?.bg || statusColors.pending_approval.bg,
                      color: statusColors[selectedAuth.status]?.color || statusColors.pending_approval.color,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  />
                </Grid>
                {selectedAuth.makerComments && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                      Client Comments
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: 'hsl(222, 20%, 40%)' }}>
                      {selectedAuth.makerComments}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          ) : (
            <Box sx={{ mt: 2, p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No details available
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<XCircle size={16} />}
            onClick={handleReject}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle2 size={16} />}
            onClick={handleApprove}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Approve {selectedAuth?.type === 'account_closure' ? 'Account Closure' : 'Client Instruction'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'hsl(222, 20%, 40%)' }}>
            {selectedAuth?.type === 'account_closure' 
              ? `Request ID: ${selectedAuth?.requestId}`
              : `Instruction ID: ${selectedAuth?.instructionId}`}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'hsl(222, 20%, 40%)' }}>
            {selectedAuth?.type === 'account_closure'
              ? 'This will permanently close the client account. This action cannot be undone.'
              : 'This will create a trade in draft status. The trade will need to be validated before settlement.'}
          </Typography>
          <TextField
            label="Comments (Optional)"
            multiline
            rows={4}
            fullWidth
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add any comments about this approval..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button onClick={submitApproval} variant="contained" color="success" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : selectedAuth?.type === 'account_closure' ? 'Approve Closure' : 'Approve & Create Trade'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject {selectedAuth?.type === 'account_closure' ? 'Account Closure' : 'Client Instruction'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'hsl(222, 20%, 40%)' }}>
            {selectedAuth?.type === 'account_closure' 
              ? `Request ID: ${selectedAuth?.requestId}`
              : `Instruction ID: ${selectedAuth?.instructionId}`}
          </Typography>
          <TextField
            label="Rejection Reason *"
            multiline
            rows={4}
            fullWidth
            required
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejecting this instruction..."
            error={!rejectionReason.trim()}
            helperText={!rejectionReason.trim() ? 'Rejection reason is required' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={submitRejection}
            variant="contained"
            color="error"
            disabled={actionLoading || !rejectionReason.trim()}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

