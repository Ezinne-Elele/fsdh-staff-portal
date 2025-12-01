import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
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
  XCircle,
  Bell,
} from 'lucide-react';
// Using mock data - no backend API calls

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
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const mockTrades = generateMockTrades();
      setTrades(mockTrades);
      setLoading(false);
    }, 300);
  }, []);

  const pendingSettlements = useMemo(
    () => trades.filter((trade) => ['validated', 'matched'].includes(trade.status)).length,
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
        trade.clientId?.toLowerCase().includes(searchTerm.toLowerCase());

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

  const handleCaptureTrade = () => {
    const errors = validateTradeInputs(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length) {
      return;
    }

    const quantity = Number(formData.quantity);
    const price = Number(formData.price);
    const newTrade = {
      tradeId: randomId(),
      clientId: formData.clientId.trim(),
      isin: formData.isin.trim().toUpperCase(),
      tradeType: formData.tradeType,
      tradeDate: formData.tradeDate,
      settlementDate: formData.settlementDate,
      quantity,
      price,
      totalValue: quantity * price,
      counterparty: formData.counterparty.trim(),
      status: 'draft',
      history: [{ status: 'draft', timestamp: new Date(), note: 'Trade captured' }],
    };

    setTrades((prev) => [newTrade, ...prev]);
    setFormData(createInitialForm());
    setFormErrors({});
    addNotification(`Trade ${newTrade.tradeId} captured`, 'success');
    recordAudit('captured', newTrade.tradeId, `Created ${newTrade.tradeType} trade for ${newTrade.clientId}`);
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      addNotification('CSCS sync completed (mock)', 'success');
      recordAudit('sync', 'CSCS', 'Mock CSCS synchronization executed');
    }, 1200);
  };

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

  const updateTrade = (tradeId, updater) => {
    setTrades((prev) =>
      prev.map((trade) => (trade.tradeId === tradeId ? { ...trade, ...updater(trade) } : trade))
    );
  };

  const handleValidate = (trade) => {
    if (trade.quantity > MAX_QUANTITY || trade.totalValue > MAX_VALUE) {
      raiseException(trade, 'Trade exceeds configured limits');
      return;
    }
    updateTrade(trade.tradeId, (current) => ({
      ...current,
      ...appendHistory(current, 'validated', 'Trade validated'),
    }));
    addNotification(`Trade ${trade.tradeId} validated`, 'info');
    recordAudit('validated', trade.tradeId, 'Trade passed validation checks');
  };

  const handleMatch = (trade) => {
    updateTrade(trade.tradeId, (current) => ({
      ...current,
      ...appendHistory(current, 'matched', 'Trade matched via mock FMDQ'),
    }));
    addNotification(`Trade ${trade.tradeId} matched`, 'info');
    recordAudit('matched', trade.tradeId, 'Trade matched stage complete');
  };

  const handleSettle = (trade) => {
    const swiftId = `SW-${randomId().slice(-6)}`;
    updateTrade(trade.tradeId, (current) => ({
      ...current,
      swiftMessageId: swiftId,
      ...appendHistory(current, 'settlement_pending', 'Awaiting SWIFT confirmation'),
    }));
    addNotification(`SWIFT message ${swiftId} sent for ${trade.tradeId}`, 'info');
    recordAudit('settlement_initiated', trade.tradeId, `SWIFT message ${swiftId} dispatched`);

    setTimeout(() => {
      const success = Math.random() > 0.2;
      if (success) {
        updateTrade(trade.tradeId, (current) => ({
          ...current,
          ...appendHistory(current, 'settled', 'SWIFT confirmation received'),
        }));
        addNotification(`Trade ${trade.tradeId} settled successfully`, 'success');
        recordAudit('settled', trade.tradeId, `SWIFT ${swiftId} confirmed`);
      } else {
        updateTrade(trade.tradeId, (current) => ({
          ...current,
          ...appendHistory(current, 'failed', 'SWIFT confirmation failed'),
        }));
        raiseException(trade, 'SWIFT confirmation failed. Settlement aborted.');
      }
    }, 2000);
  };

  const handleClose = (trade) => {
    updateTrade(trade.tradeId, (current) => ({
      ...current,
      ...appendHistory(current, 'closed', 'Trade archive complete'),
    }));
    addNotification(`Trade ${trade.tradeId} closed`, 'success');
    recordAudit('closed', trade.tradeId, 'Trade lifecycle completed');
  };

  const handleDownloadConfirmation = (trade) => {
    const rows = [
      ['Trade ID', trade.tradeId],
      ['Client', trade.clientId],
      ['ISIN', trade.isin],
      ['Type', trade.tradeType],
      ['Quantity', trade.quantity],
      ['Price', trade.price],
      ['Value', trade.totalValue],
      ['Status', trade.status],
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
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? 'Syncing…' : 'Sync CSCS'}
          </Button>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={handleCaptureTrade}>
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

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, mb: 2 }}>
                Capture Trade
              </Typography>
              <Box component="form" onSubmit={(event) => { event.preventDefault(); handleCaptureTrade(); }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Client ID"
                      name="clientId"
                      value={formData.clientId}
                      onChange={handleFormChange}
                      error={Boolean(formErrors.clientId)}
                      helperText={formErrors.clientId}
                      fullWidth
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
                      label="Counterparty"
                      name="counterparty"
                      value={formData.counterparty}
                      onChange={handleFormChange}
                      error={Boolean(formErrors.counterparty)}
                      helperText={formErrors.counterparty}
                      fullWidth
                    />
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
                <Stack direction="row" justifyContent="flex-end" spacing={1} mt={3}>
                  <Button type="submit" variant="contained" startIcon={<Plus size={16} />}>
                    Save Draft
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, mb: 1 }}>
                Notifications
              </Typography>
              {notifications.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No notifications
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {notifications.map((note) => (
                    <Alert
                      key={note.id}
                      severity={note.severity}
                      icon={<Bell size={16} />}
                      onClose={() => dismissNotification(note.id)}
                    >
                      <Typography variant="body2">{note.message}</Typography>
                      <Typography variant="caption">{note.timestamp.toLocaleTimeString()}</Typography>
                    </Alert>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, mb: 1 }}>
                Exceptions
              </Typography>
              {exceptions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No open exceptions
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {exceptions.map((exc) => (
                    <Alert
                      key={exc.id}
                      severity="error"
                      icon={<XCircle size={16} />}
                      onClose={() => dismissException(exc.id)}
                    >
                      <Typography variant="body2">
                        Trade {exc.tradeId}: {exc.reason}
                      </Typography>
                      <Typography variant="caption">{exc.timestamp.toLocaleTimeString()}</Typography>
                    </Alert>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
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
                <option value="settled">Settled</option>
                <option value="failed">Failed</option>
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
                  <TableCell>Reference</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>ISIN</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'hsl(222, 20%, 40%)' }}>
                      No trades found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrades.map((trade) => {
                    const statusStyle = statusColors[trade.status] || statusColors.draft;
                    return (
                      <TableRow key={trade.tradeId}>
                        <TableCell sx={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.85rem' }}>
                          {trade.tradeId}
                        </TableCell>
                        <TableCell>{trade.clientId}</TableCell>
                        <TableCell>{trade.isin}</TableCell>
                        <TableCell>
                          <Chip
                            label={trade.tradeType?.toUpperCase()}
                            size="small"
                            sx={{ background: 'hsla(221, 83%, 53%, 0.1)', color: 'hsl(221, 83%, 53%)', fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right">{Number(trade.quantity || 0).toLocaleString()}</TableCell>
                        <TableCell align="right">{currencyFormatter.format(Number(trade.price || 0))}</TableCell>
                        <TableCell align="right">{currencyFormatter.format(Number(trade.totalValue || 0))}</TableCell>
                        <TableCell>
                          <Chip
                            label={trade.status}
                            size="small"
                            sx={{
                              background: statusStyle.bg,
                              color: statusStyle.color,
                              fontWeight: 600,
                              textTransform: 'capitalize',
                            }}
                          />
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
                            <Button
                              size="small"
                              color="secondary"
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

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, mb: 2 }}>
            Audit Trail
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
                    <TableCell>{log.timestamp.toLocaleTimeString()}</TableCell>
                    <TableCell>{log.tradeId}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        icon={<CheckCircle2 size={12} />}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{log.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
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
    clientId: '',
    isin: '',
    tradeDate: format(tradeDate),
    settlementDate: format(settlement),
    tradeType: 'buy',
    quantity: '',
    price: '',
    counterparty: '',
  };
};

const validateTradeInputs = (formData) => {
  const errors = {};
  if (!formData.clientId.trim()) errors.clientId = 'Client ID is required';
  if (!formData.isin.trim()) errors.isin = 'ISIN is required';
  if (!formData.tradeDate) errors.tradeDate = 'Trade date is required';
  if (!formData.settlementDate) errors.settlementDate = 'Settlement date is required';
  if (!formData.counterparty.trim()) errors.counterparty = 'Counterparty is required';

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

const generateMockTrades = () => {
  const clients = ['CL-201', 'CL-202', 'CL-203', 'CL-204', 'CL-205'];
  const statuses = ['draft', 'validated', 'matched', 'settlement_pending', 'settled', 'closed'];
  const tradeTypes = ['buy', 'sell'];
  const counterparties = ['Goldman Sachs', 'JP Morgan', 'Morgan Stanley', 'Credit Suisse', 'Barclays'];

  return Array.from({ length: 12 }, (_, idx) => {
    const tradeDate = new Date();
    tradeDate.setDate(tradeDate.getDate() - Math.floor(Math.random() * 30));
    const settlementDate = new Date(tradeDate);
    settlementDate.setDate(settlementDate.getDate() + 2);
    const quantity = Math.floor(Math.random() * 500000) + 10000;
    const price = Number((Math.random() * 50 + 10).toFixed(2));
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      tradeId: `TRD-${String(idx + 1).padStart(6, '0')}`,
      clientId: clients[idx % clients.length],
      isin: generateFakeISIN(),
      tradeType: tradeTypes[Math.floor(Math.random() * tradeTypes.length)],
      tradeDate: tradeDate.toISOString().split('T')[0],
      settlementDate: settlementDate.toISOString().split('T')[0],
      quantity,
      price,
      totalValue: quantity * price,
      counterparty: counterparties[Math.floor(Math.random() * counterparties.length)],
      status,
      history: [
        { status: 'draft', timestamp: tradeDate, note: 'Trade captured' },
        ...(status !== 'draft' ? [{ status: 'validated', timestamp: new Date(tradeDate.getTime() + 3600000), note: 'Trade validated' }] : []),
        ...(['matched', 'settlement_pending', 'settled', 'closed'].includes(status) ? [{ status: 'matched', timestamp: new Date(tradeDate.getTime() + 7200000), note: 'Trade matched' }] : []),
        ...(['settlement_pending', 'settled', 'closed'].includes(status) ? [{ status: 'settlement_pending', timestamp: new Date(tradeDate.getTime() + 10800000), note: 'SWIFT message sent' }] : []),
        ...(['settled', 'closed'].includes(status) ? [{ status: 'settled', timestamp: new Date(tradeDate.getTime() + 14400000), note: 'SWIFT confirmation received' }] : []),
        ...(status === 'closed' ? [{ status: 'closed', timestamp: new Date(tradeDate.getTime() + 18000000), note: 'Trade archived' }] : []),
      ],
      swiftMessageId: ['settlement_pending', 'settled', 'closed'].includes(status) ? `SW-${randomId().slice(-6)}` : null,
    };
  });
};


