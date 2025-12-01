import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Bell, Calendar, CheckCircle2, Download } from 'lucide-react';
import { generateMockCorporateAction, generateMockCorporateActions } from '../../mocks/corporateActions';

const statusColors = {
  pending: 'hsla(38, 92%, 50%, 0.15)',
  active: 'hsla(221, 83%, 53%, 0.15)',
  closed: 'hsla(142, 52%, 45%, 0.15)',
  cancelled: 'hsla(0, 65%, 55%, 0.15)',
};

export default function CorporateActionsPage() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [openElection, setOpenElection] = useState(null);
  const [electionChoice, setElectionChoice] = useState('cash');
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const timer = setTimeout(() => {
      try {
        setActions(generateMockCorporateActions());
      } catch (err) {
        setError('Failed to load mock corporate actions');
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const newAction = generateMockCorporateAction();
      setActions((prev) => [newAction, ...prev].slice(0, 20));
      addNotification(`New ${newAction.actionType} from ${newAction.source}`, 'info');
      recordAudit('auto_generated', newAction.actionId, 'Mock feed injected event');
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(
    () =>
      actions.reduce(
        (acc, action) => {
          acc.total += 1;
          acc[action.status] = (acc[action.status] || 0) + 1;
          return acc;
        },
        { total: 0, pending: 0, active: 0, closed: 0 }
      ),
    [actions]
  );

  const addNotification = (message, severity = 'info') => {
    setNotifications((prev) => [{ id: randomId(), message, severity, timestamp: new Date() }, ...prev].slice(0, 5));
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((note) => note.id !== id));
  };

  const recordAudit = (action, targetId, notes) => {
    setAuditLogs((prev) => [{ id: randomId(), action, targetId, notes, timestamp: new Date() }, ...prev].slice(0, 8));
  };

  const handleGenerateEvent = () => {
    const action = generateMockCorporateAction();
    setActions((prev) => [action, ...prev]);
    addNotification(`Generated ${action.actionType} (${action.actionId})`, 'success');
    recordAudit('manual_generate', action.actionId, 'User triggered SWIFT mock');
  };

  const handleNotify = (action, channel) => {
    const message = `Notified clients via ${channel.toUpperCase()} for ${action.actionId}`;
    addNotification(message, channel === 'email' ? 'info' : 'success');
    recordAudit('notification', action.actionId, message);
  };

  const handleRemind = (action) => {
    addNotification(`Reminder scheduled for ${action.actionId}`, 'warning');
    recordAudit('reminder', action.actionId, 'Timer-based reminder');
  };

  const handleReconcile = (action) => {
    const matched = Math.random() > 0.2;
    if (matched) {
      addNotification(`Reconciled entitlements for ${action.actionId}`, 'success');
      recordAudit('reconciled', action.actionId, 'Ledger matched mock upstream');
    } else {
      addNotification(`Mismatch detected for ${action.actionId}`, 'error');
      recordAudit('reconciliation_failed', action.actionId, 'Mock mismatch flagged');
    }
  };

  const handleOpenElection = (action) => {
    setOpenElection(action);
    setElectionChoice('cash');
  };

  const handleSubmitElection = () => {
    if (!openElection) return;
    setActions((prev) =>
      prev.map((action) =>
        action.actionId === openElection.actionId
          ? { ...action, electionStatus: 'submitted', chosenOption: electionChoice }
          : action
      )
    );
    addNotification(`Election submitted for ${openElection.actionId}`, 'success');
    recordAudit('election', openElection.actionId, `Client opted for ${electionChoice}`);
    setOpenElection(null);
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="420px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Header onGenerate={handleGenerateEvent} />
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={7}>
          <Grid container spacing={2}>
            {actions.length === 0 ? (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">No corporate actions available.</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              actions.map((action) => (
                <Grid item xs={12} md={6} key={action.actionId}>
                  <ActionCard
                    action={action}
                    onOpenElection={handleOpenElection}
                    onNotify={handleNotify}
                    onRemind={handleRemind}
                    onReconcile={handleReconcile}
                  />
                </Grid>
              ))
            )}
          </Grid>
        </Grid>
        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            <StatsCard stats={stats} />
            <NotificationCenter notifications={notifications} onDismiss={dismissNotification} />
            <AuditLogCard auditLogs={auditLogs} />
          </Stack>
        </Grid>
      </Grid>

      <ElectionDialog
        action={openElection}
        choice={electionChoice}
        onChange={setElectionChoice}
        onClose={() => setOpenElection(null)}
        onSubmit={handleSubmitElection}
      />
    </Box>
  );
}

function Header({ onGenerate }) {
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
        <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'hsl(222, 47%, 11%)' }}>
          Corporate Actions
        </Typography>
        <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)' }}>
          Monitor dividends, bonus issues, splits, and entitlements across all custodial accounts.
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" startIcon={<Download size={16} />}>
          Export Schedule
        </Button>
        <Button variant="contained" startIcon={<Bell size={16} />} onClick={onGenerate}>
          Generate Event
        </Button>
      </Stack>
    </Box>
  );
}

function ActionCard({ action, onOpenElection, onNotify, onRemind, onReconcile }) {
  const statusColor = statusColors[action.status] || 'hsl(214, 32%, 91%)';
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Chip
            label={action.source || action.actionType?.toUpperCase()}
            size="small"
            sx={{ background: 'hsla(221, 83%, 53%, 0.1)', color: 'hsl(221, 83%, 53%)', fontWeight: 600 }}
          />
          <Chip label={action.status} size="small" sx={{ background: statusColor, textTransform: 'capitalize' }} />
        </Box>
        <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 }}>
          {action.title || `${action.actionType?.toUpperCase()} – ${action.isin}`}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          ISIN: {action.isin}
        </Typography>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <DateLabel label="Ex-Date" date={action.exDate} />
          <DateLabel label="Payment Date" date={action.paymentDate} />
        </Box>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Entitlement: {action.entitlement || 'N/A'}
        </Typography>
        <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
          <Button size="small" onClick={() => onOpenElection(action)} disabled={action.status !== 'pending'}>
            Election Form
          </Button>
          <Button size="small" onClick={() => onNotify(action, 'portal')}>
            Portal Alert
          </Button>
          <Button size="small" onClick={() => onNotify(action, 'email')}>
            Email Clients
          </Button>
          <Button size="small" onClick={() => onRemind(action)}>
            Reminder
          </Button>
          <Button size="small" onClick={() => onReconcile(action)}>
            Reconcile
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function StatsCard({ stats }) {
  const items = [
    { label: 'Total', value: stats.total, color: 'hsl(221, 83%, 53%)' },
    { label: 'Pending', value: stats.pending, color: 'hsl(38, 92%, 50%)' },
    { label: 'Active', value: stats.active, color: 'hsl(221, 83%, 53%)' },
    { label: 'Closed', value: stats.closed, color: 'hsl(142, 52%, 45%)' },
  ];
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Lifecycle Status
        </Typography>
        <Grid container spacing={1}>
          {items.map((item) => (
            <Grid item xs={6} key={item.label}>
              <Box>
                <Typography variant="h5" sx={{ fontFamily: '"Space Grotesk", sans-serif', color: item.color }}>
                  {item.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

function NotificationCenter({ notifications, onDismiss }) {
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Notifications
        </Typography>
        {notifications.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No notifications yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {notifications.map((note) => (
              <Alert
                key={note.id}
                icon={note.severity === 'success' ? <CheckCircle2 size={16} /> : <Bell size={16} />}
                severity={note.severity === 'error' ? 'error' : note.severity === 'warning' ? 'warning' : 'info'}
                action={
                  <Button color="inherit" size="small" onClick={() => onDismiss(note.id)}>
                    Dismiss
                  </Button>
                }
              >
                <Typography variant="body2">{note.message}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {note.timestamp.toLocaleTimeString()}
                </Typography>
              </Alert>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function AuditLogCard({ auditLogs }) {
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
      <CardContent>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Audit Trail
        </Typography>
        {auditLogs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No activity recorded yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {auditLogs.map((log) => (
              <Box key={log.id} sx={{ borderBottom: '1px solid hsl(214, 32%, 91%)', pb: 1 }}>
                <Typography variant="body2">
                  <strong>{log.action}</strong> – {log.notes}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {log.timestamp.toLocaleTimeString()} • {log.targetId}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function ElectionDialog({ action, choice, onChange, onClose, onSubmit }) {
  return (
    <Dialog open={Boolean(action)} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Corporate Action Election</DialogTitle>
      <DialogContent>
        {action && (
          <Stack spacing={2} mt={1}>
            <Typography variant="body2">Event: {action.title}</Typography>
            <Typography variant="body2">ISIN: {action.isin}</Typography>
            <TextField
              select
              SelectProps={{ native: true }}
              label="Election Choice"
              value={choice}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="cash">Cash Option</option>
              <option value="stock">Stock Option</option>
              <option value="default">Default Instruction</option>
            </TextField>
            <TextField label="Additional Notes (optional)" multiline minRows={2} />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit}>
          Submit Election
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DateLabel({ label, date }) {
  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <Calendar size={14} />
      <Typography variant="caption">
        {label}: {new Date(date).toLocaleDateString()}
      </Typography>
    </Box>
  );
}

function randomId() {
  return `EV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
