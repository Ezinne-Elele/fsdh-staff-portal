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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { settlementInstructionService } from '../../services/settlementInstructionService';

const statusColors = {
  pending: { bg: 'hsla(38, 92%, 50%, 0.15)', color: 'hsl(38, 92%, 45%)' },
  matched: { bg: 'hsla(142, 52%, 45%, 0.15)', color: 'hsl(142, 52%, 35%)' },
  settled: { bg: 'hsla(142, 52%, 45%, 0.15)', color: 'hsl(142, 52%, 35%)' },
  failed: { bg: 'hsla(0, 65%, 55%, 0.15)', color: 'hsl(0, 65%, 45%)' },
  cancelled: { bg: 'hsla(222, 20%, 40%, 0.1)', color: 'hsl(222, 20%, 40%)' },
};

const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
});

export default function SettlementAuthorization() {
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending_authorization');
  const [selectedInstruction, setSelectedInstruction] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchInstructions();
  }, [statusFilter]);

  const fetchInstructions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await settlementInstructionService.getSettlementInstructions({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: 1,
        limit: 100,
      });
      setInstructions(response.instructions || []);
    } catch (err) {
      setError(err.message || 'Failed to load settlement instructions');
      console.error('Error fetching settlement instructions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstructions = useMemo(() => {
    return instructions.filter((inst) => {
      const matchesSearch =
        inst.instructionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.tradeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.isin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.securityName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [instructions, searchTerm]);

  const handleViewDetails = (instruction) => {
    setSelectedInstruction(instruction);
    setViewDialogOpen(true);
  };

  const [notifications, setNotifications] = useState([]);
  const addNotification = (message, severity = 'info') => {
    setNotifications((prev) => [{ id: Date.now(), message, severity, timestamp: new Date() }, ...prev].slice(0, 5));
  };

  const pendingCount = useMemo(() => instructions.filter(i => i.status === 'pending').length, [instructions]);

  if (loading) {
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
            Settlement Instructions
          </Typography>
          <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)' }}>
            Track settlement instructions sent to CSD and their matching status
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshCw size={16} />}
          onClick={fetchInstructions}
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
                Pending Match
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'hsl(38, 92%, 45%)' }}>
                {pendingCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)', mb: 1 }}>
                Matched
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'hsl(142, 52%, 35%)' }}>
                {instructions.filter(i => i.status === 'matched').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)', mb: 1 }}>
                Total Instructions
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
                {instructions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box mb={2}>
            <Tabs value={tabValue} onChange={(e, v) => { setTabValue(v); setStatusFilter(v === 0 ? 'pending' : v === 1 ? 'matched' : 'all'); }}>
              <Tab label="Pending" />
              <Tab label="Matched" />
              <Tab label="All" />
            </Tabs>
          </Box>

          <Box display="flex" gap={2} mb={2}>
            <TextField
              placeholder="Search by instruction ID, trade ID, ISIN..."
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
          </Box>

          <TableContainer component={Paper} sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Instruction ID</TableCell>
                  <TableCell>Trade ID</TableCell>
                  <TableCell>Security</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell>Settlement Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInstructions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'hsl(222, 20%, 40%)' }}>
                      No settlement instructions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInstructions.map((inst) => {
                    const statusStyle = statusColors[inst.status] || statusColors.pending_authorization;
                    const settlementDate = inst.settlementDate
                      ? new Date(inst.settlementDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '-';

                    return (
                      <TableRow key={inst.instructionId}>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {inst.instructionId}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {inst.tradeId}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {inst.securityName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', fontFamily: 'monospace' }}>
                            {inst.isin}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={inst.instructionType}
                            size="small"
                            sx={{ background: 'hsla(221, 83%, 53%, 0.1)', color: 'hsl(221, 83%, 53%)', fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right">{Number(inst.quantity || 0).toLocaleString()}</TableCell>
                        <TableCell align="right">{currencyFormatter.format(Number(inst.price || 0))}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 }}>
                          {currencyFormatter.format(Number(inst.grossConsideration || 0))}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{settlementDate}</TableCell>
                        <TableCell>
                          <Chip
                            label={inst.status?.replace('_', ' ')}
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
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Eye size={14} />}
                              onClick={() => handleViewDetails(inst)}
                            >
                              View
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

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Settlement Instruction Details</Typography>
          <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)' }}>
            {selectedInstruction?.instructionId}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedInstruction && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)' }}>Trade ID</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{selectedInstruction.tradeId}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)' }}>Instruction Type</Typography>
                <Typography variant="body1">{selectedInstruction.instructionType}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)' }}>Security</Typography>
                <Typography variant="body1">{selectedInstruction.securityName}</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{selectedInstruction.isin}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)' }}>Settlement Method</Typography>
                <Typography variant="body1">{selectedInstruction.settlementMethod}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)' }}>Quantity</Typography>
                <Typography variant="body1">{Number(selectedInstruction.quantity).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)' }}>Price</Typography>
                <Typography variant="body1">{currencyFormatter.format(selectedInstruction.price)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)' }}>Settlement Amount</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {currencyFormatter.format(selectedInstruction.settlementAmount)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)' }}>Receiving Custodian</Typography>
                <Typography variant="body1">{selectedInstruction.receivingCustodian}</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'hsl(222, 20%, 40%)' }}>
                  CSCS Account: {selectedInstruction.receivingCscsAccount}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)' }}>Delivering Custodian</Typography>
                <Typography variant="body1">{selectedInstruction.deliveringCustodian}</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'hsl(222, 20%, 40%)' }}>
                  CSCS Account: {selectedInstruction.deliveringCscsAccount}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)' }}>Status</Typography>
                <Chip
                  label={selectedInstruction.status}
                  size="small"
                  sx={{
                    background: statusColors[selectedInstruction.status]?.bg || statusColors.pending.bg,
                    color: statusColors[selectedInstruction.status]?.color || statusColors.pending.color,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)' }}>CSD Reference</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {selectedInstruction.cscsRef || selectedInstruction.swiftMessageId || 'N/A'}
                </Typography>
              </Grid>
              {selectedInstruction.matchedAt && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)' }}>Matched At</Typography>
                  <Typography variant="body1">
                    {new Date(selectedInstruction.matchedAt).toLocaleString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

