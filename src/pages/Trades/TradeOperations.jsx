import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
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
} from '@mui/material';
import {
  Search,
  Filter,
  RefreshCw,
  Plus,
  Hash,
  FileDown,
  CheckCircle2,
} from 'lucide-react';
import { tradeService } from '../../services/tradeService';
import { counterpartyService } from '../../services/counterpartyService';

const statusColors = {
  draft: { bg: 'hsl(210, 40%, 98%)', color: 'hsl(222, 20%, 40%)' },
  validated: { bg: 'hsla(221, 83%, 53%, 0.1)', color: 'hsl(221, 83%, 53%)' },
  matched: { bg: 'hsla(38, 92%, 50%, 0.15)', color: 'hsl(38, 92%, 45%)' },
  settlement_pending: { bg: 'hsla(38, 92%, 50%, 0.1)', color: 'hsl(38, 92%, 45%)' },
  settled: { bg: 'hsla(142, 52%, 45%, 0.15)', color: 'hsl(142, 52%, 35%)' },
  closed: { bg: 'hsla(222, 47%, 11%, 0.08)', color: 'hsl(222, 47%, 11%)' },
  failed: { bg: 'hsla(0, 65%, 55%, 0.15)', color: 'hsl(0, 65%, 45%)' },
  cancelled: { bg: 'hsla(222, 20%, 40%, 0.1)', color: 'hsl(222, 20%, 40%)' },
};

const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
});

export default function TradeOperations() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState(() => createInitialForm());
  const [formErrors, setFormErrors] = useState({});
  const [isCaptureDialogOpen, setCaptureDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [counterparties, setCounterparties] = useState([]);

  useEffect(() => {
    fetchTrades();
    fetchCounterparties();
  }, []);

  const fetchCounterparties = async () => {
    try {
      const response = await counterpartyService.getCounterparties({ status: 'active', limit: 100 });
      setCounterparties(response.counterparties || []);
    } catch (err) {
      console.error('Error fetching counterparties:', err);
      addNotification('Failed to load counterparties. Please refresh the page.', 'warning');
      // Set empty array - user will need to refresh
      setCounterparties([]);
    }
  };

  const fetchTrades = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await tradeService.getTrades({ page: 1, limit: 100 });
      setTrades(response.trades || []);
    } catch (err) {
      // Don't set error state for 401 - let the interceptor handle redirect
      if (err.response?.status === 401) {
        // Authentication will be handled by API interceptor
        return;
      }
      setError(err.message || 'Failed to load trades');
      console.error('Error fetching trades:', err);
      // Show user-friendly error
      if (err.code === 'ERR_NETWORK') {
        addNotification('Cannot connect to backend. Please ensure services are running.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const pendingSettlements = useMemo(
    () => trades.filter((trade) => ['validated', 'matched', 'settlement_pending'].includes(trade.status)).length,
    [trades]
  );
  const validatedTrades = useMemo(
    () => trades.filter((trade) => trade.status === 'validated').length,
    [trades]
  );
  const settledTrades = useMemo(
    () => trades.filter((trade) => trade.status === 'settled').length,
    [trades]
  );

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const matchesSearch =
        trade.tradeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.isin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.clientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.accountId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.cscsRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.swiftMessageId?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' ? true : trade.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [trades, searchTerm, statusFilter]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateIsin = () => {
    setFormData((prev) => ({ ...prev, isin: generateFakeISIN() }));
  };

  const handleCaptureTrade = async () => {
    const errors = validateTradeInputs(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      return;
    }

    setLoading(true);
    try {
      const quantity = Number(formData.quantity);
      const price = Number(formData.price);
      const tradeData = {
        accountId: formData.accountId.trim(),
        clientId: formData.clientId.trim(),
        isin: formData.isin.trim().toUpperCase(),
        tradeType: formData.tradeType,
        tradeDate: formData.tradeDate,
        settlementDate: formData.settlementDate,
        quantity,
        price,
        counterpartyId: formData.counterpartyId.trim(),
        brokerId: formData.counterpartyId.trim(), // Set brokerId automatically from counterpartyId
        createdBy: 'current_user', // Should come from auth context
      };

      const newTrade = await tradeService.createTrade(tradeData);
      setTrades((prev) => [newTrade, ...prev]);
      setFormData(createInitialForm());
      setFormErrors({});
      addNotification(`Trade ${newTrade.tradeId} captured`, 'success');
      recordAudit('captured', newTrade.tradeId, `Created ${newTrade.tradeType} trade for ${newTrade.clientId}`);
      setCaptureDialogOpen(false);
      await fetchTrades(); // Refresh to get latest data
    } catch (err) {
      setError(err.message || 'Failed to create trade');
      addNotification(`Failed to create trade: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Removed handleSync - refresh button now calls fetchTrades

  const addNotification = (message, severity = 'info') => {
    setNotifications((prev) => [{ id: randomId(), message, severity, timestamp: new Date() }, ...prev].slice(0, 5));
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((note) => note.id !== id));
  };

  const recordAudit = (action, tradeId, notes) => {
    setAuditLogs((prev) => [{ id: randomId(), action, tradeId, notes, timestamp: new Date() }, ...prev].slice(0, 10));
  };

  const raiseException = (trade, reason) => {
    setExceptions((prev) => [{ id: randomId(), tradeId: trade.tradeId, reason, timestamp: new Date() }, ...prev].slice(0, 5));
    addNotification(`Exception raised for ${trade.tradeId}: ${reason}`, 'error');
    recordAudit('exception', trade.tradeId, reason);
  };

  const dismissException = (id) => {
    setExceptions((prev) => prev.filter((exc) => exc.id !== id));
  };

  // Removed updateTrade - now using API calls directly

  const handleValidate = async (trade) => {
    try {
      const updatedTrade = await tradeService.validateTrade(trade.tradeId);
      setTrades((prev) => prev.map((t) => (t.tradeId === trade.tradeId ? updatedTrade : t)));
      addNotification(`Trade ${trade.tradeId} validated`, 'success');
      recordAudit('validated', trade.tradeId, 'Trade passed validation checks');
      await fetchTrades(); // Refresh to get latest status
    } catch (err) {
      addNotification(`Failed to validate trade: ${err.message}`, 'error');
      raiseException(trade, err.message || 'Validation failed');
    }
  };

  const handleMatch = async (trade) => {
    try {
      const updatedTrade = await tradeService.matchTrade(trade.tradeId);
      setTrades((prev) => prev.map((t) => (t.tradeId === trade.tradeId ? updatedTrade : t)));
      addNotification(`Trade ${trade.tradeId} matched`, 'success');
      recordAudit('matched', trade.tradeId, 'Trade matched stage complete');
      await fetchTrades();
    } catch (err) {
      addNotification(`Failed to match trade: ${err.message}`, 'error');
    }
  };

  const handleSettle = async (trade) => {
    try {
      const updatedTrade = await tradeService.settleTrade(trade.tradeId);
      setTrades((prev) => prev.map((t) => (t.tradeId === trade.tradeId ? updatedTrade : t)));
      addNotification(`Trade ${trade.tradeId} settled successfully`, 'success');
      recordAudit('settled', trade.tradeId, 'Trade settled successfully');
      await fetchTrades();
    } catch (err) {
      addNotification(`Failed to settle trade: ${err.message}`, 'error');
      raiseException(trade, err.message || 'Settlement failed');
      await fetchTrades(); // Refresh to see failed status
    }
  };

  const handleClose = async (trade) => {
    try {
      const updatedTrade = await tradeService.closeTrade(trade.tradeId);
      setTrades((prev) => prev.map((t) => (t.tradeId === trade.tradeId ? updatedTrade : t)));
      addNotification(`Trade ${trade.tradeId} closed`, 'success');
      recordAudit('closed', trade.tradeId, 'Trade lifecycle completed');
      await fetchTrades();
    } catch (err) {
      addNotification(`Failed to close trade: ${err.message}`, 'error');
    }
  };

  const handleDownloadConfirmation = (trade) => {
    const settlementDate = trade.settlementDate 
      ? new Date(trade.settlementDate).toLocaleDateString()
      : 'N/A';
    const tradeDate = trade.tradeDate 
      ? new Date(trade.tradeDate).toLocaleDateString()
      : 'N/A';
    const rows = [
      ['Trade ID', trade.tradeId],
      ['Account ID', trade.accountId || 'N/A'],
      ['Client ID', trade.clientId],
      ['ISIN', trade.isin],
      ['Type', trade.tradeType?.toUpperCase() || 'N/A'],
      ['Trade Date', tradeDate],
      ['Settlement Date', settlementDate],
      ['Quantity', trade.quantity],
      ['Price', currencyFormatter.format(trade.price)],
      ['Total Value', currencyFormatter.format(trade.totalValue)],
      ['Status', trade.status],
      ['Settlement Status', trade.settlementStatus || 'N/A'],
      ['CSCS Reference', trade.cscsRef || 'N/A'],
      ['SWIFT Message ID', trade.swiftMessageId || 'N/A'],
      ['Settlement Mode', trade.settlementMode || 'N/A'],
      ['Counterparty', trade.counterparty || 'N/A'],
      ['Counterparty ID', trade.counterpartyId || trade.brokerId || 'N/A'],
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${trade.tradeId}-confirmation.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    recordAudit('confirmation', trade.tradeId, 'Confirmation exported');
    addNotification(`Confirmation for ${trade.tradeId} exported`, 'info');
  };

  const appendHistory = (trade, status, note) => ({
    status,
    history: [...(trade.history || []), { status, timestamp: new Date(), note }],
  });

  const StatCard = ({ title, value }) => (
    <Card>
      <CardContent>
        <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Dialog
        open={isCaptureDialogOpen}
        onClose={() => setCaptureDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
          Quick Capture Trade
        </DialogTitle>
        <DialogContent dividers>
          <Box
            component="form"
            id="trade-capture-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleCaptureTrade();
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Account ID"
                  name="accountId"
                  value={formData.accountId}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.accountId)}
                  helperText={formErrors.accountId || 'Account where trade will be settled'}
                  fullWidth
                  required
                  placeholder="ACC-CLIENT-XXX-SEC"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Client ID"
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.clientId)}
                  helperText={formErrors.clientId}
                  fullWidth
                  required
                  placeholder="CLIENT-XXX"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="ISIN"
                  name="isin"
                  value={formData.isin}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.isin)}
                  helperText={formErrors.isin}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button size="small" onClick={handleGenerateIsin} startIcon={<Hash size={14} />}>
                          Generate
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Trade Date"
                  type="date"
                  name="tradeDate"
                  value={formData.tradeDate}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(formErrors.tradeDate)}
                  helperText={formErrors.tradeDate}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Settlement Date"
                  type="date"
                  name="settlementDate"
                  value={formData.settlementDate}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(formErrors.settlementDate)}
                  helperText={formErrors.settlementDate}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  name="tradeType"
                  label="Trade Type"
                  value={formData.tradeType}
                  onChange={handleFormChange}
                  fullWidth
                  SelectProps={{ native: true }}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  name="counterpartyId"
                  label="Counterparty"
                  value={formData.counterpartyId}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.counterpartyId)}
                  helperText={
                    formErrors.counterpartyId
                      ? formErrors.counterpartyId
                      : formData.counterpartyId
                        ? `Counterparty ID: ${formData.counterpartyId}`
                        : 'Select a counterparty'
                  }
                  fullWidth
                  required
                  SelectProps={{ native: true }}
                >
                  <option value="">-- Select Counterparty --</option>
                  {counterparties.map((cp) => (
                    <option key={cp.counterpartyId} value={cp.counterpartyId}>
                      {cp.counterpartyId} - {cp.name}
                    </option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.quantity)}
                  helperText={formErrors.quantity}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.price)}
                  helperText={formErrors.price}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCaptureDialogOpen(false)}>Cancel</Button>
          <Button
            type="submit"
            form="trade-capture-form"
            variant="contained"
            startIcon={<Plus size={16} />}
          >
            Save Draft
          </Button>
        </DialogActions>
      </Dialog>

      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2} mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'hsl(222, 47%, 11%)' }}>
            Trade Operations
          </Typography>
          <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)' }}>
            Monitor trade lifecycle from capture to settlement.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={fetchTrades}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => {
              setFormData(createInitialForm());
              setFormErrors({});
              setCaptureDialogOpen(true);
            }}
          >
            Quick Capture
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={4}>
          <StatCard title="Pending Settlements" value={pendingSettlements.toLocaleString()} />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard title="Validated Trades" value={validatedTrades.toLocaleString()} />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard title="Settled" value={settledTrades.toLocaleString()} />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" mb={2}>
            <Box display="flex" gap={2} flex={1}>
              <TextField
                placeholder="Search by trade ID, ISIN, client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
                sx={{ width: 180 }}
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="validated">Validated</option>
                <option value="matched">Matched</option>
                <option value="settlement_pending">Settlement Pending</option>
                <option value="settled">Settled</option>
                <option value="failed">Failed</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </TextField>
            </Box>
            <Button variant="outlined" startIcon={<Filter size={16} />}>
              Advanced Filters
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Trade ID</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>ISIN</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell>Settlement Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Settlement Ref</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 4, color: 'hsl(222, 20%, 40%)' }}>
                      No trades found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrades.map((trade) => {
                    const statusStyle = statusColors[trade.status] || statusColors.draft;
                    const settlementRef = trade.cscsRef || trade.swiftMessageId || '-';
                    const settlementDate = trade.settlementDate 
                      ? new Date(trade.settlementDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '-';
                    
                    return (
                      <TableRow key={trade.tradeId}>
                        <TableCell sx={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.85rem' }}>
                          {trade.tradeId}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem', color: 'hsl(222, 20%, 40%)' }}>
                          {trade.accountId || '-'}
                        </TableCell>
                        <TableCell>{trade.clientId}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{trade.isin}</TableCell>
                        <TableCell>
                          <Chip
                            label={trade.tradeType?.toUpperCase()}
                            size="small"
                            sx={{ background: 'hsla(221, 83%, 53%, 0.1)', color: 'hsl(221, 83%, 53%)', fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right">{Number(trade.quantity || 0).toLocaleString()}</TableCell>
                        <TableCell align="right">{currencyFormatter.format(Number(trade.price || 0))}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 }}>
                          {currencyFormatter.format(Number(trade.totalValue || 0))}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{settlementDate}</TableCell>
                        <TableCell>
                          <Chip
                            label={trade.status?.replace('_', ' ')}
                            size="small"
                            sx={{
                              background: statusStyle.bg,
                              color: statusStyle.color,
                              fontWeight: 600,
                              textTransform: 'capitalize',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'hsl(222, 20%, 40%)' }}>
                          {settlementRef}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {trade.status === 'draft' && (
                              <Button size="small" onClick={() => handleValidate(trade)}>
                                Validate
                              </Button>
                            )}
                            {trade.status === 'validated' && (
                              <Button size="small" onClick={() => handleMatch(trade)}>
                                Match
                              </Button>
                            )}
                            {trade.status === 'matched' && (
                              <Button size="small" onClick={() => handleSettle(trade)}>
                                Settle
                              </Button>
                            )}
                            {trade.status === 'settled' && (
                              <Button size="small" onClick={() => handleClose(trade)}>
                                Close
                              </Button>
                            )}
                            {trade.status === 'settlement_pending' && (
                              <Button size="small" variant="outlined" onClick={() => handleSettle(trade)}>
                                Check Settlement
                              </Button>
                            )}
                            {trade.status === 'failed' && (
                              <Button size="small" color="error" variant="outlined">
                                View Exception
                              </Button>
                            )}
                            <Button
                              size="small"
                              color="secondary"
                              variant="outlined"
                              startIcon={<FileDown size={14} />}
                              onClick={() => handleDownloadConfirmation(trade)}
                            >
                              PDF
                            </Button>
                          </Stack>
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

      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, mb: 2 }}>
                Recent Audit Trail
              </Typography>
              {auditLogs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No audit events captured yet.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Trade ID</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell sx={{ fontSize: '0.85rem' }}>
                          {log.timestamp?.toLocaleTimeString?.() || new Date(log.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.tradeId}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.action}
                            size="small"
                            icon={<CheckCircle2 size={12} />}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{log.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, mb: 2 }}>
                Trade Statistics
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Trades
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
                    {trades.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Pending Settlements
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'hsl(38, 92%, 45%)' }}>
                    {pendingSettlements}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Failed Trades
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'hsl(0, 65%, 45%)' }}>
                    {trades.filter((t) => t.status === 'failed').length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

const MAX_QUANTITY = 1_000_000;
const MAX_VALUE = 100_000_000;

const randomId = () =>
  crypto?.randomUUID?.() ?? `TRD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const createInitialForm = () => {
  const tradeDate = new Date();
  const settlement = new Date(tradeDate.getTime() + 2 * 24 * 60 * 60 * 1000);
  const format = (date) => date.toISOString().slice(0, 10);
  return {
    accountId: '',
    clientId: '',
    isin: '',
    tradeDate: format(tradeDate),
    settlementDate: format(settlement),
    tradeType: 'buy',
    quantity: '',
    price: '',
    counterpartyId: '',
  };
};

const validateTradeInputs = (formData) => {
  const errors = {};
  if (!formData.accountId.trim()) errors.accountId = 'Account ID is required';
  if (!formData.clientId.trim()) errors.clientId = 'Client ID is required';
  if (!formData.isin.trim()) errors.isin = 'ISIN is required';
  if (!formData.tradeDate) errors.tradeDate = 'Trade date is required';
  if (!formData.settlementDate) errors.settlementDate = 'Settlement date is required';
  if (!formData.counterpartyId || !formData.counterpartyId.trim()) errors.counterpartyId = 'Counterparty is required';

  const quantity = Number(formData.quantity);
  const price = Number(formData.price);
  if (!quantity || quantity <= 0) errors.quantity = 'Quantity must be positive';
  if (quantity > MAX_QUANTITY) errors.quantity = `Quantity cannot exceed ${MAX_QUANTITY.toLocaleString()}`;
  if (!price || price <= 0) errors.price = 'Price must be positive';
  if (quantity * price > MAX_VALUE) errors.price = `Trade value cannot exceed ${MAX_VALUE.toLocaleString()}`;

  const tradeDate = new Date(formData.tradeDate);
  const settlementDate = new Date(formData.settlementDate);
  if (settlementDate < tradeDate) errors.settlementDate = 'Settlement date must be after trade date';

  return errors;
};

const generateFakeISIN = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const prefix = Array.from({ length: 2 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const body = Array.from({ length: 9 }, () => digits[Math.floor(Math.random() * digits.length)]).join('');
  return `${prefix}${body}`;
};

// Removed generateMockTrades - now using API


