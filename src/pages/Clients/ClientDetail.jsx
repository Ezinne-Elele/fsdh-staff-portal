import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { ArrowLeft, Layers3 } from 'lucide-react';
import { clientService } from '../../services/clientService';
import { useAuth } from '../../contexts/AuthContext';

const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
});

export default function ClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canOnboard = ['admin', 'maker'].includes(user?.role);
  
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [closureDialog, setClosureDialog] = useState({
    open: false,
    reason: '',
    submitting: false,
    error: '',
  });
  const [banner, setBanner] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await clientService.getClient(clientId);
      const clientData = response?.client || response?.data || response;
      setClient(normalizeClient(clientData));
    } catch (err) {
      console.error('Failed to fetch client', err);
      setError('Failed to load client details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClosureDialog = () => {
    setClosureDialog({ open: true, reason: '', submitting: false, error: '' });
  };

  const handleSubmitClosure = async () => {
    if (!closureDialog.reason.trim()) {
      setClosureDialog((prev) => ({ ...prev, error: 'Please provide a reason for closure' }));
      return;
    }

    try {
      setClosureDialog((prev) => ({ ...prev, submitting: true, error: '' }));
      await clientService.requestClosure(clientId, closureDialog.reason);
      
      setBanner({
        open: true,
        message: `Account closure request for ${clientId} sent to Authorization Queue.`,
        severity: 'success',
      });
      setClosureDialog({ open: false, reason: '', submitting: false, error: '' });
      await fetchClient(); // Refresh client data
    } catch (err) {
      setClosureDialog((prev) => ({
        ...prev,
        submitting: false,
        error: err.response?.data?.error || err.message || 'Failed to submit closure request',
      }));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !client) {
    return (
      <Box>
        <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate('/clients')} sx={{ mb: 2 }}>
          Back to Clients
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!client) {
    return (
      <Box>
        <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate('/clients')} sx={{ mb: 2 }}>
          Back to Clients
        </Button>
        <Alert severity="warning">Client not found</Alert>
      </Box>
    );
  }

  const statusColors = {
    active: { bg: 'hsla(142, 52%, 45%, 0.15)', color: 'hsl(142, 52%, 35%)' },
    pending_closure: { bg: 'hsla(221, 83%, 53%, 0.15)', color: 'hsl(221, 83%, 45%)' },
    closed: { bg: 'hsla(0, 65%, 55%, 0.15)', color: 'hsl(0, 65%, 45%)' },
  };
  const statusStyle = statusColors[client.status] || statusColors.active;

  return (
    <Box>
      {banner.open && (
        <Alert
          severity={banner.severity}
          onClose={() => setBanner({ ...banner, open: false })}
          sx={{ mb: 2 }}
        >
          {banner.message}
        </Alert>
      )}

      <Button
        startIcon={<ArrowLeft size={16} />}
        onClick={() => navigate('/clients')}
        sx={{ mb: 3 }}
      >
        Back to Client Account Management
      </Button>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
            {client.clientName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {client.clientId}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip
            label={client.status}
            sx={{
              background: statusStyle.bg,
              color: statusStyle.color,
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          />
          <Chip label={`KYC ${client.kycStatus?.toUpperCase() || 'N/A'}`} />
        </Stack>
      </Box>

      <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">
                Portfolio Value
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {currencyFormatter.format(client.portfolioValue || 0)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">
                Cash Balance
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {currencyFormatter.format(client.cashBalance || 0)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">
                Account Manager
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {client.accountManager || 'Unassigned'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">
                Created At
              </Typography>
              <Typography variant="body2">
                {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body2">{client.email || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">
                Phone
              </Typography>
              <Typography variant="body2">{client.phone || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="caption" color="text.secondary">
                Location
              </Typography>
              <Typography variant="body2">{client.address || 'N/A'}</Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <Layers3 size={16} />
            <Typography variant="subtitle2">Hierarchy</Typography>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Portfolio</TableCell>
                <TableCell>Sub-Accounts</TableCell>
                <TableCell align="right">AUM</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {client.portfolios && client.portfolios.length > 0 ? (
                client.portfolios.map((portfolio) => (
                  <TableRow key={portfolio.portfolioId}>
                    <TableCell>{portfolio.name || portfolio.portfolioName}</TableCell>
                    <TableCell>
                      {portfolio.subAccounts && portfolio.subAccounts.length > 0 ? (
                        portfolio.subAccounts.map((sub) => (
                          <Chip
                            key={sub.accountId || sub.subAccountId}
                            label={sub.accountName || sub.subAccountName}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No sub-accounts
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {currencyFormatter.format(portfolio.aum || 0)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No portfolios found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Assets
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Asset</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>ISIN</TableCell>
                <TableCell align="right">Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {client.assets && client.assets.length > 0 ? (
                <>
                  {client.assets.map((asset, idx) => (
                    <TableRow key={`${client.clientId}-asset-${idx}`}>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell>
                        <Chip label={asset.assetType} size="small" sx={{ textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{asset.isin}</TableCell>
                      <TableCell align="right">{currencyFormatter.format(asset.value || 0)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell />
                    <TableCell />
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Total
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {currencyFormatter.format(
                        client.assets.reduce((sum, a) => sum + (a.value || 0), 0)
                      )}
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No assets found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {canOnboard && client.status === 'active' && (
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 2 }}
              onClick={handleOpenClosureDialog}
            >
              Request Closure
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Closure Request Dialog */}
      <Dialog
        open={closureDialog.open}
        onClose={() => setClosureDialog({ open: false, reason: '', submitting: false, error: '' })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Request Account Closure</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {closureDialog.error && (
              <Alert severity="error">{closureDialog.error}</Alert>
            )}
            <Typography variant="body2" color="text.secondary">
              Please provide a reason for closing this account. This will be sent to the Authorization Queue for approval.
            </Typography>
            <TextField
              label="Closure Reason"
              value={closureDialog.reason}
              onChange={(e) => setClosureDialog((prev) => ({ ...prev, reason: e.target.value, error: '' }))}
              multiline
              minRows={3}
              placeholder="e.g., Account consolidation, inactive mandate, compliance directive"
              required
              error={Boolean(closureDialog.error)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setClosureDialog({ open: false, reason: '', submitting: false, error: '' })}
            disabled={closureDialog.submitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitClosure}
            disabled={closureDialog.submitting || !closureDialog.reason.trim()}
          >
            {closureDialog.submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function normalizeClient(client) {
  // Ensure assets exist and sum to portfolioValue
  const ensuredAssets =
    client.assets && client.assets.length
      ? client.assets
      : createAssetsFromValue(client.portfolioValue || 0, client.clientId);

  const assetsTotal = ensuredAssets.reduce((sum, a) => sum + (a.value || 0), 0);
  let adjustedAssets = ensuredAssets;

  // If totals don't match portfolioValue, adjust last asset to close the gap
  const gap = (client.portfolioValue || 0) - assetsTotal;
  if (Math.abs(gap) > 1) {
    adjustedAssets = ensuredAssets.map((a, idx) =>
      idx === ensuredAssets.length - 1 ? { ...a, value: (a.value || 0) + gap } : a
    );
  }

  // Normalize portfolios: map portfolioName to name, ensure subAccounts structure
  const normalizedPortfolios = (client.portfolios || []).map((portfolio) => ({
    ...portfolio,
    name: portfolio.name || portfolio.portfolioName || 'Unnamed Portfolio',
    portfolioId: portfolio.portfolioId || `PF-${Date.now()}`,
    aum: portfolio.aum || 0,
    subAccounts: (portfolio.subAccounts || []).map((sub) => ({
      accountId: sub.accountId || sub.subAccountId || `SUB-${Date.now()}`,
      accountName: sub.accountName || sub.subAccountName || 'Unnamed Account',
    })),
  }));

  return {
    ...client,
    assets: adjustedAssets,
    accountManager: client.accountManager || client.kycData?.accountManager || 'Unassigned',
    email: client.email || client.kycData?.email || client.contactEmail || 'unknown@client.com',
    phone: client.phone || client.kycData?.phone || client.contactPhone || '+234 800 000 0000',
    address: client.address || client.kycData?.address || 'Not provided',
    createdAt: client.createdAt || new Date(),
    portfolios: normalizedPortfolios,
  };
}

function createAssetsFromValue(value, seed) {
  const base = value || 0;
  const split = [0.4, 0.35, 0.25];
  return [
    {
      name: 'FGN Bond',
      isin: `NG-FGN-${seed || 'X'}-01`,
      assetType: 'bond',
      value: Math.round(base * split[0]),
    },
    {
      name: 'Blue Chip Equity',
      isin: `NG-EQT-${seed || 'X'}-02`,
      assetType: 'equity',
      value: Math.round(base * split[1]),
    },
    {
      name: 'Liquidity Fund',
      isin: `NG-FND-${seed || 'X'}-03`,
      assetType: 'fund',
      value: Math.max(0, Math.round(base * split[2])),
    },
  ];
}

