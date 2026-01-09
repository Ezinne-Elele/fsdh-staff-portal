import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse,
} from '@mui/material';
import { AlertTriangle, CheckCircle2, Clock, FilePlus2, Search, RefreshCw, Filter, X } from 'lucide-react';
import { exceptionService } from '../../services/exceptionService';
import { CircularProgress } from '@mui/material';

const severityColors = {
  critical: { bg: 'hsla(0, 65%, 55%, 0.15)', color: 'hsl(0, 65%, 40%)' },
  high: { bg: 'hsla(0, 65%, 55%, 0.1)', color: 'hsl(0, 65%, 45%)' },
  medium: { bg: 'hsla(38, 92%, 50%, 0.1)', color: 'hsl(38, 92%, 45%)' },
  low: { bg: 'hsla(142, 52%, 45%, 0.1)', color: 'hsl(142, 52%, 35%)' },
};

const CATEGORY_ASSIGNMENTS = {
  settlements: 'Chinenye O.',
  reconciliation: 'David K.',
  corporate_actions: 'Ify M.',
  custody: 'Bola S.',
  default: 'Ops Triage',
};

export default function Exceptions() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [slaAlerts, setSlaAlerts] = useState([]);
  const [dialogState, setDialogState] = useState({ open: false, exception: null, rootCause: '', resolution: '' });

  useEffect(() => {
    fetchExceptions();
    const timer = setInterval(() => {
      tickSlaTimers();
      fetchExceptions(); // Refresh data periodically
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(timer);
  }, []);

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await exceptionService.getExceptions({ page: 1, limit: 100 });
      const exceptionsData = response.exceptions || response.data || [];
      
      // Calculate SLA remaining for each exception
      const exceptionsWithSLA = exceptionsData.map(exc => {
        const createdAt = new Date(exc.createdAt);
        const targetTime = exc.sla?.targetResolutionTime ? new Date(exc.sla.targetResolutionTime) : null;
        let minutesRemaining = null;
        
        if (targetTime && exc.status !== 'resolved') {
          const now = new Date();
          const remainingMs = targetTime.getTime() - now.getTime();
          minutesRemaining = Math.max(0, remainingMs / (1000 * 60));
        }
        
        return {
          ...exc,
          createdAt,
          minutesRemaining,
          categoryLabel: exc.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || exc.category,
        };
      });
      
      setExceptions(exceptionsWithSLA);
    } catch (err) {
      setError(err.message || 'Failed to load exceptions');
      console.error('Error fetching exceptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const tickSlaTimers = () => {
    setExceptions((prev) => {
      const updated = prev.map((exc) => {
        if (exc.status === 'resolved') return exc;
        
        const targetTime = exc.sla?.targetResolutionTime ? new Date(exc.sla.targetResolutionTime) : null;
        let minutesRemaining = null;
        
        if (targetTime) {
          const now = new Date();
          const remainingMs = targetTime.getTime() - now.getTime();
          minutesRemaining = Math.max(0, remainingMs / (1000 * 60));
        }
        
        return {
          ...exc,
          minutesRemaining,
        };
      });

      setSlaAlerts(
        updated
          .filter((exc) => exc.status !== 'resolved' && exc.minutesRemaining !== null && exc.minutesRemaining <= 15)
          .map((exc) => ({
            id: exc.exceptionId,
            message: `${exc.exceptionId} at risk • ${Math.round(exc.minutesRemaining)}m left`,
          }))
      );

      return updated;
    });
  };

  const stats = useMemo(() => {
    return exceptions.reduce(
      (acc, exc) => {
        acc[exc.status] = (acc[exc.status] || 0) + 1;
        return acc;
      },
      { open: 0, resolved: 0, escalated: 0 }
    );
  }, [exceptions]);

  // Get unique values for filter options
  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(exceptions.map(exc => exc.status).filter(Boolean))];
    return statuses.sort();
  }, [exceptions]);
  
  const uniqueCategories = useMemo(() => {
    const categories = [...new Set(exceptions.map(exc => exc.category).filter(Boolean))];
    return categories.sort();
  }, [exceptions]);
  
  const uniqueAssignedTo = useMemo(() => {
    const assigned = [...new Set(exceptions.map(exc => exc.assignedTo).filter(Boolean))];
    return assigned.sort();
  }, [exceptions]);

  const filteredExceptions = useMemo(() => {
    return exceptions.filter((exc) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        exc.exceptionId?.toLowerCase().includes(searchLower) ||
        exc.category?.toLowerCase().includes(searchLower) ||
        exc.description?.toLowerCase().includes(searchLower) ||
        exc.tradeId?.toLowerCase().includes(searchLower);
      
      // Severity filter
      const matchesSeverity = severityFilter === 'all' || exc.severity === severityFilter;
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || exc.status === statusFilter;
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || exc.category === categoryFilter;
      
      // Assigned To filter
      const assignedLower = (exc.assignedTo || '').toLowerCase();
      const matchesAssigned = !assignedToFilter || assignedLower.includes(assignedToFilter.toLowerCase());
      
      return matchesSearch && matchesSeverity && matchesStatus && matchesCategory && matchesAssigned;
    });
  }, [exceptions, searchTerm, severityFilter, statusFilter, categoryFilter, assignedToFilter]);
  
  const clearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setSeverityFilter('all');
    setAssignedToFilter('');
    setSearchTerm('');
  };
  
  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'all' || severityFilter !== 'all' || assignedToFilter || searchTerm;

  const handleRootCause = (exception) => {
    setDialogState({
      open: true,
      exception,
      rootCause: exception.rootCause || '',
      resolution: exception.resolution || '',
    });
  };

  const handleDialogSubmit = async () => {
    if (!dialogState.exception || !dialogState.rootCause || !dialogState.resolution) {
      return;
    }
    
    try {
      await exceptionService.resolveException(dialogState.exception.exceptionId, {
        rootCause: dialogState.rootCause,
        resolution: dialogState.resolution,
      });
      await fetchExceptions();
      setDialogState({ open: false, exception: null, rootCause: '', resolution: '' });
    } catch (err) {
      setError(err.message || 'Failed to resolve exception');
    }
  };

  const handleEscalationAcknowledge = (id) => {
    setSlaAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  if (loading && exceptions.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Header stats={stats} onRefresh={fetchExceptions} />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {slaAlerts.length > 0 && (
        <Alert severity="warning" icon={<Clock size={18} />} sx={{ mb: 2 }}>
          SLA Alerts:{' '}
          {slaAlerts.map((alert) => (
            <Chip
              key={alert.id}
              label={alert.message}
              onDelete={() => handleEscalationAcknowledge(alert.id)}
              sx={{ ml: 1, background: 'hsla(38, 92%, 50%, 0.15)', color: 'hsl(38, 92%, 35%)' }}
            />
          ))}
        </Alert>
      )}

      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        <TextField
          placeholder="Search by exception ID, category, description, trade ID..."
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
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {uniqueCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={severityFilter}
                  label="Severity"
                  onChange={(e) => setSeverityFilter(e.target.value)}
                >
                  <MenuItem value="all">All Severities</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Assigned To"
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
                size="small"
                fullWidth
                placeholder="Filter by assignee..."
              />
            </Grid>
          </Grid>
        </Box>
      </Collapse>

      <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', mb: 2 }}>
            Exception Queue
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Exception ID</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>SLA Remaining</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExceptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'hsl(222, 20%, 40%)' }}>
                      {searchTerm || severityFilter !== 'all' ? 'No exceptions match the current filters.' : 'No exceptions found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExceptions.map((exc) => {
                    const createdAt = exc.createdAt
                      ? new Date(exc.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-';
                    
                    const slaRemaining = exc.status === 'resolved'
                      ? 'Resolved'
                      : exc.minutesRemaining === null
                      ? 'N/A'
                      : exc.minutesRemaining <= 0
                      ? 'Breached'
                      : `${Math.round(exc.minutesRemaining)} min`;
                    
                    return (
                      <TableRow key={exc.exceptionId || exc._id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {exc.exceptionId}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {exc.categoryLabel || exc.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={exc.severity}
                            size="small"
                            sx={{
                              background: severityColors[exc.severity]?.bg,
                              color: severityColors[exc.severity]?.color,
                              textTransform: 'capitalize',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={exc.status}
                            size="small"
                            sx={{
                              background:
                                exc.status === 'resolved'
                                  ? 'hsla(142, 52%, 45%, 0.12)'
                                  : exc.status === 'escalated'
                                  ? 'hsla(0, 65%, 55%, 0.12)'
                                  : 'hsla(221, 83%, 53%, 0.12)',
                              color:
                                exc.status === 'resolved'
                                  ? 'hsl(142, 52%, 35%)'
                                  : exc.status === 'escalated'
                                  ? 'hsl(0, 65%, 45%)'
                                  : 'hsl(221, 83%, 45%)',
                              textTransform: 'capitalize',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>{exc.assignedTo || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem', color: 'hsl(222, 20%, 40%)' }}>
                          {createdAt}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color:
                                exc.status === 'resolved'
                                  ? 'hsl(142, 52%, 35%)'
                                  : exc.minutesRemaining !== null && exc.minutesRemaining <= 0
                                  ? 'hsl(0, 65%, 45%)'
                                  : exc.minutesRemaining !== null && exc.minutesRemaining <= 15
                                  ? 'hsl(38, 92%, 45%)'
                                  : 'hsl(222, 20%, 40%)',
                              fontWeight: exc.minutesRemaining !== null && exc.minutesRemaining <= 15 ? 600 : 400,
                            }}
                          >
                            {slaRemaining}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {exc.status !== 'resolved' && (
                            <Button size="small" onClick={() => handleRootCause(exc)}>
                              {exc.rootCause ? 'Update' : 'Resolve'}
                            </Button>
                          )}
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

      <RootCauseDialog
        state={dialogState}
        onClose={() => setDialogState({ open: false, exception: null, rootCause: '', resolution: '' })}
        onSubmit={handleDialogSubmit}
        setState={setDialogState}
      />
    </Box>
  );
}

function Header({ stats, onRefresh }) {
  const cards = [
    { label: 'Open', value: stats.open || 0, icon: <FilePlus2 size={18} />, color: 'hsl(221, 83%, 53%)' },
    { label: 'Resolved', value: stats.resolved || 0, icon: <CheckCircle2 size={18} />, color: 'hsl(142, 52%, 45%)' },
    { label: 'Escalated', value: stats.escalated || 0, icon: <AlertTriangle size={18} />, color: 'hsl(0, 65%, 55%)' },
  ];

  return (
    <Box mb={3}>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
            Exception Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Auto-generate, assign, and resolve operational exceptions with SLA tracking.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={onRefresh} startIcon={<RefreshCw size={16} />}>
          Refresh
        </Button>
      </Box>
      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid item xs={12} sm={4} key={card.label}>
            <Card sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  {card.icon}
                  <Typography variant="caption" color="text.secondary">
                    {card.label}
                  </Typography>
                </Stack>
                <Typography variant="h5" sx={{ fontFamily: '"Space Grotesk", sans-serif', color: card.color }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}


function RootCauseDialog({ state, setState, onClose, onSubmit }) {
  return (
    <Dialog open={state.open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Resolve Exception</DialogTitle>
      <DialogContent>
        {state.exception && (
          <Stack spacing={2} mt={1}>
            <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)' }}>
              Exception: <strong>{state.exception.exceptionId}</strong> • {state.exception.categoryLabel || state.exception.category}
            </Typography>
            <TextField
              label="Root Cause *"
              multiline
              minRows={3}
              value={state.rootCause}
              onChange={(e) => setState((prev) => ({ ...prev, rootCause: e.target.value }))}
              helperText="Required to resolve exception"
              required
            />
            <TextField
              label="Resolution *"
              multiline
              minRows={3}
              value={state.resolution}
              onChange={(e) => setState((prev) => ({ ...prev, resolution: e.target.value }))}
              helperText="Describe how the exception was resolved"
              required
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={onSubmit} 
          disabled={!state.rootCause || !state.resolution}
        >
          Resolve Exception
        </Button>
      </DialogActions>
    </Dialog>
  );
}


