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
} from '@mui/material';
import { AlertTriangle, CheckCircle2, Clock, FilePlus2, Search } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [slaAlerts, setSlaAlerts] = useState([]);
  const [dialogState, setDialogState] = useState({ open: false, exception: null, rootCause: '', approver: '' });

  useEffect(() => {
    seedExceptions();
    const timer = setInterval(() => tickSlaTimers(), 10000);
    return () => clearInterval(timer);
  }, []);

  const seedExceptions = () => {
    const seeded = Array.from({ length: 8 }, () => generateException());
    setExceptions(seeded);
  };

  const tickSlaTimers = () => {
    setExceptions((prev) => {
      const updated = prev.map((exc) => {
        if (exc.status === 'closed') return exc;
        const elapsedMinutes = (Date.now() - exc.createdAt.getTime()) / 60000;
        const remaining = Math.max(exc.slaMinutes - elapsedMinutes, 0);
        const shouldEscalate = remaining <= 15 && exc.status !== 'escalated';
        return {
          ...exc,
          minutesRemaining: remaining,
          status: shouldEscalate && exc.status === 'in_progress' ? 'escalated' : exc.status,
        };
      });

      setSlaAlerts(
        updated
          .filter((exc) => exc.status !== 'closed' && exc.minutesRemaining <= 15)
          .map((exc) => ({
            id: exc.id,
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
      { open: 0, in_progress: 0, escalated: 0, closed: 0 }
    );
  }, [exceptions]);

  const filteredExceptions = useMemo(() => {
    return exceptions.filter((exc) => {
      const matchesSearch =
        exc.exceptionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exc.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = severityFilter === 'all' ? true : exc.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [exceptions, searchTerm, severityFilter]);

  const handleAutoCreate = () => {
    setExceptions((prev) => [generateException(), ...prev]);
  };

  const handleRootCause = (exception) => {
    setDialogState({
      open: true,
      exception,
      rootCause: exception.rootCause || '',
      approver: exception.approvedBy || '',
    });
  };

  const handleDialogSubmit = () => {
    setExceptions((prev) =>
      prev.map((exc) =>
        exc.id === dialogState.exception.id
          ? {
              ...exc,
              rootCause: dialogState.rootCause,
              approvedBy: dialogState.approver,
              status: dialogState.approver ? 'closed' : 'awaiting_approval',
            }
          : exc
      )
    );
    setDialogState({ open: false, exception: null, rootCause: '', approver: '' });
  };

  const handleEscalationAcknowledge = (id) => {
    setExceptions((prev) =>
      prev.map((exc) => (exc.id === id ? { ...exc, status: 'in_progress', minutesRemaining: exc.minutesRemaining } : exc))
    );
    setSlaAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <Box>
      <Header stats={stats} onAutoCreate={handleAutoCreate} />
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

      <FilterBar
        searchTerm={searchTerm}
        severityFilter={severityFilter}
        onSearchChange={setSearchTerm}
        onSeverityChange={setSeverityFilter}
      />

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
                  <TableCell>SLA Remaining</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExceptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      No exceptions match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExceptions.map((exc) => (
                    <TableRow key={exc.id}>
                      <TableCell sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>{exc.exceptionId}</TableCell>
                      <TableCell>{exc.categoryLabel}</TableCell>
                      <TableCell>
                        <Chip
                          label={exc.severity}
                          size="small"
                          sx={{
                            background: severityColors[exc.severity]?.bg,
                            color: severityColors[exc.severity]?.color,
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={exc.status.replace('_', ' ')}
                          size="small"
                          sx={{
                            background:
                              exc.status === 'closed'
                                ? 'hsla(142, 52%, 45%, 0.12)'
                                : exc.status === 'escalated'
                                ? 'hsla(0, 65%, 55%, 0.12)'
                                : 'hsla(221, 83%, 53%, 0.12)',
                            color:
                              exc.status === 'closed'
                                ? 'hsl(142, 52%, 35%)'
                                : exc.status === 'escalated'
                                ? 'hsl(0, 65%, 45%)'
                                : 'hsl(221, 83%, 45%)',
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell>{exc.assignedTo}</TableCell>
                      <TableCell>
                        {exc.status === 'closed'
                          ? 'Closed'
                          : exc.minutesRemaining <= 0
                          ? 'Breached'
                          : `${Math.round(exc.minutesRemaining)} min`}
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => handleRootCause(exc)}>
                          {exc.rootCause ? 'Update' : 'Add Root Cause'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <RootCauseDialog
        state={dialogState}
        onClose={() => setDialogState({ open: false, exception: null, rootCause: '', approver: '' })}
        onSubmit={handleDialogSubmit}
        setState={setDialogState}
      />
    </Box>
  );
}

function Header({ stats, onAutoCreate }) {
  const cards = [
    { label: 'Open / New', value: stats.open || 0, icon: <FilePlus2 size={18} />, color: 'hsl(221, 83%, 53%)' },
    { label: 'In Progress', value: stats.in_progress || 0, icon: <Clock size={18} />, color: 'hsl(38, 92%, 50%)' },
    { label: 'Escalated', value: stats.escalated || 0, icon: <AlertTriangle size={18} />, color: 'hsl(0, 65%, 55%)' },
    { label: 'Closed', value: stats.closed || 0, icon: <CheckCircle2 size={18} />, color: 'hsl(142, 52%, 45%)' },
  ];

  return (
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
      <Button variant="contained" onClick={onAutoCreate} startIcon={<FilePlus2 size={16} />}>
        Auto-Create Exception
      </Button>
      <Grid container spacing={2} sx={{ mt: { xs: 2, md: 0 }, flex: 1 }}>
        {cards.map((card) => (
          <Grid item xs={6} md={3} key={card.label}>
            <Card sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
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

function FilterBar({ searchTerm, severityFilter, onSearchChange, onSeverityChange }) {
  return (
    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} mb={3}>
      <TextField
        placeholder="Search by exception ID or category..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        size="small"
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={16} />
            </InputAdornment>
          ),
        }}
      />
      <TextField
        select
        SelectProps={{ native: true }}
        label="Severity"
        size="small"
        value={severityFilter}
        onChange={(e) => onSeverityChange(e.target.value)}
        sx={{ width: 200 }}
      >
        <option value="all">All severities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </TextField>
    </Box>
  );
}

function RootCauseDialog({ state, setState, onClose, onSubmit }) {
  return (
    <Dialog open={state.open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Root Cause & Closure Approval</DialogTitle>
      <DialogContent>
        {state.exception && (
          <Stack spacing={2} mt={1}>
            <Typography variant="body2">
              Exception: {state.exception.exceptionId} • {state.exception.categoryLabel}
            </Typography>
            <TextField
              label="Root Cause"
              multiline
              minRows={3}
              value={state.rootCause}
              onChange={(e) => setState((prev) => ({ ...prev, rootCause: e.target.value }))}
              helperText="Required before closure"
            />
            <TextField
              label="Approved By"
              placeholder="e.g. Head of Ops"
              value={state.approver}
              onChange={(e) => setState((prev) => ({ ...prev, approver: e.target.value }))}
              helperText="Enter approver to finalize closure"
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit} disabled={!state.rootCause}>
          {state.approver ? 'Close Exception' : 'Submit for Approval'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function generateException() {
  const categories = [
    { key: 'settlements', label: 'Settlements' },
    { key: 'reconciliation', label: 'Reconciliation' },
    { key: 'corporate_actions', label: 'Corporate Actions' },
    { key: 'custody', label: 'Custody Operations' },
  ];
  const severities = ['critical', 'high', 'medium', 'low'];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const slaMinutes = severity === 'critical' ? 60 : severity === 'high' ? 120 : 240;
  const createdAt = new Date(Date.now() - Math.random() * 60 * 60 * 1000);

  return {
    id: randomId(),
    exceptionId: `EXC-${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`,
    category: category.key,
    categoryLabel: category.label,
    severity,
    status: 'in_progress',
    assignedTo: CATEGORY_ASSIGNMENTS[category.key] || CATEGORY_ASSIGNMENTS.default,
    createdAt,
    slaMinutes,
    minutesRemaining: slaMinutes - (Date.now() - createdAt.getTime()) / 60000,
    rootCause: '',
    approvedBy: '',
  };
}

function randomId() {
  return `EX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

