import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Divider,
  Grid,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { ClipboardList, Layers3, RefreshCw, Search, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { clientService } from '../../services/clientService';

const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
});

export default function Clients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canOnboard = ['admin', 'maker'].includes(user?.role);
  const canApproveClosure = ['admin', 'checker'].includes(user?.role);

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [amlStatus, setAmlStatus] = useState({ checking: false, result: null });
  const [formState, setFormState] = useState(getInitialFormState());
  const [formOpen, setFormOpen] = useState(false);
  const [clientType, setClientType] = useState(null); // 'existing' or 'new'
  const [syncState, setSyncState] = useState({ lastRun: null, status: 'idle' });
  const [closureDialog, setClosureDialog] = useState({
    open: false,
    clientId: null,
    reason: '',
    submitting: false,
    error: '',
  });
  const [banner, setBanner] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true);
        const response = await clientService.getClients({ limit: 100 });
        const list = response?.clients || response?.data?.clients || [];
        if (list.length) {
          setClients(list.map(normalizeClient));
        } else {
          setClients(seedClients().map(normalizeClient));
          setBanner({
            open: true,
            message: 'No clients returned from server; showing sample data.',
            severity: 'warning',
          });
        }
      } catch (err) {
        console.error('Failed to fetch clients', err);
        setClients(seedClients().map(normalizeClient));
        setBanner({
          open: true,
          message: 'Could not reach backend; showing sample clients.',
          severity: 'warning',
        });
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
    runFlexcubeSync();
    const timer = setInterval(runFlexcubeSync, 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const handleFormChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleValidateKYC = () => {
    setAmlStatus({ checking: true, result: null });
    setTimeout(() => {
      const passed = Math.random() > 0.2;
      setAmlStatus({
        checking: false,
        result: passed
          ? { level: formState.riskRating, message: 'AML/KYC validation passed (mock).' }
          : { level: 'critical', message: 'Potential match found. Manual review required.' },
      });
    }, 1200);
  };

  const handleOpenForm = (type) => {
    setClientType(type);
    setFormOpen(true);
    setFormState(getInitialFormState());
    setAmlStatus({ checking: false, result: null });
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setClientType(null);
    setFormState(getInitialFormState());
    setAmlStatus({ checking: false, result: null });
  };

  const handleOnboard = () => {
    const newClient = buildClientFromForm(formState, amlStatus.result, clientType === 'existing');
    setClients((prev) => [newClient, ...prev]);
    handleCloseForm();
  };

  const handleOpenClosureDialog = (clientId) => {
    setClosureDialog({ open: true, clientId, reason: '', submitting: false, error: '' });
  };

  const handleSubmitClosure = async () => {
    if (!closureDialog.reason.trim()) {
      setBanner({ open: true, message: 'Please provide a reason for closure.', severity: 'warning' });
      return;
    }

    setClosureDialog((prev) => ({ ...prev, submitting: true, error: '' }));
    try {
      const { client } = await clientService.requestClosure(closureDialog.clientId, closureDialog.reason);

      // Update local list with latest status
      setClients((prev) =>
        prev.map((c) => (c.clientId === client.clientId ? { ...c, ...client } : c))
      );

      setBanner({
        open: true,
        message: `Account closure request for ${closureDialog.clientId} sent to Authorization Queue.`,
        severity: 'success',
      });
      setClosureDialog({ open: false, clientId: null, reason: '', submitting: false });
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Failed to submit closure request.';
      setBanner({
        open: true,
        message,
        severity: 'error',
      });
      setClosureDialog((prev) => ({ ...prev, submitting: false, error: message }));
      console.error('Request closure failed', err);
    }
  };

  function runFlexcubeSync() {
    setSyncState((prev) => ({ lastRun: prev.lastRun, status: 'syncing' }));
    setTimeout(() => {
      setSyncState({ lastRun: new Date(), status: 'success' });
    }, 800);
  }

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

      <Header syncState={syncState} onSync={runFlexcubeSync} />

      {canOnboard && (
        <Box mb={3}>
          <Button
            variant="contained"
            startIcon={<UserPlus size={16} />}
            onClick={() => setFormOpen(true)}
            sx={{ mb: 2 }}
          >
            Create Client
          </Button>
        </Box>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12}>
          <FilterBar
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            onSearchChange={setSearchTerm}
            onStatusChange={setStatusFilter}
          />
        </Grid>
      </Grid>

      {loadingClients ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="240px">
          <CircularProgress />
        </Box>
      ) : (
        <Card sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, mb: 2 }}>
              Clients
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Client Name</TableCell>
                  <TableCell>Client ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>KYC</TableCell>
                  <TableCell align="right">Portfolio Value</TableCell>
                  <TableCell align="right">Cash Balance</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.clientId} hover>
                    <TableCell>{client.clientName}</TableCell>
                    <TableCell>{client.clientId}</TableCell>
                    <TableCell>
                      <Chip
                        label={client.status}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          backgroundColor:
                            client.status === 'active'
                              ? 'hsla(142, 52%, 45%, 0.15)'
                              : client.status === 'pending_closure'
                              ? 'hsla(221, 83%, 53%, 0.12)'
                              : 'hsla(0, 65%, 55%, 0.15)',
                          color:
                            client.status === 'active'
                              ? 'hsl(142, 52%, 35%)'
                              : client.status === 'pending_closure'
                              ? 'hsl(221, 83%, 45%)'
                              : 'hsl(0, 65%, 45%)',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={client.kycStatus?.toUpperCase()} size="small" />
                    </TableCell>
                    <TableCell align="right">{currencyFormatter.format(client.portfolioValue || 0)}</TableCell>
                    <TableCell align="right">{currencyFormatter.format(client.cashBalance || 0)}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button size="small" onClick={() => navigate(`/clients/${client.clientId}`)}>
                          View
                        </Button>
                        {canOnboard && client.status === 'active' && (
                          <Button size="small" variant="outlined" onClick={() => handleOpenClosureDialog(client.clientId)}>
                            Request Closure
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Client Creation Dialog */}
      {formOpen && (
        <ClientCreationDialog
          open={formOpen}
          onClose={handleCloseForm}
          onSelectType={setClientType}
          clientType={clientType}
          formState={formState}
          onChange={handleFormChange}
          amlStatus={amlStatus}
          onValidate={handleValidateKYC}
          onSubmit={handleOnboard}
          disabled={clientType === 'new' && (!amlStatus.result?.level || amlStatus.result?.message?.includes('manual'))}
        />
      )}

      <Dialog
        open={closureDialog.open}
        onClose={() => setClosureDialog({ open: false, clientId: null, reason: '' })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Request Account Closure</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Please provide a reason for closing this account. This will be sent to the Authorization Queue for approval.
            </Typography>
            <TextField
              label="Closure Reason"
              value={closureDialog.reason}
              onChange={(e) => setClosureDialog((prev) => ({ ...prev, reason: e.target.value }))}
              multiline
              minRows={3}
              placeholder="e.g., Account consolidation, inactive mandate, compliance directive"
              required
            />
            {closureDialog.error && (
              <Alert severity="error">
                {closureDialog.error}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClosureDialog({ open: false, clientId: null, reason: '', submitting: false, error: '' })}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmitClosure} disabled={closureDialog.submitting}>
            {closureDialog.submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function Header({ syncState, onSync }) {
  return (
    <Box
      display="flex"
      flexDirection={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      gap={2}
      mb={2}
    >
      <Box>
        <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
          Client Account Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Maintain KYC profiles, nested portfolios, approvals, and Flexcube sync.
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          icon={<RefreshCw size={14} />}
          label={
            syncState.status === 'syncing'
              ? 'Flexcube Syncing...'
              : syncState.lastRun
              ? `Last sync ${syncState.lastRun.toLocaleTimeString()}`
              : 'No sync yet'
          }
          sx={{
            background: 'hsla(221, 83%, 53%, 0.12)',
            color: 'hsl(221, 83%, 45%)',
          }}
        />
        <Button size="small" onClick={onSync} startIcon={<RefreshCw size={14} />}>
          Sync Now
        </Button>
      </Stack>
    </Box>
  );
}

function FilterBar({ searchTerm, statusFilter, onSearchChange, onStatusChange }) {
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
      <CardContent>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            placeholder="Search by name or client ID..."
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
            label="Status"
            size="small"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            sx={{ width: 200 }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending_closure">Pending Closure</option>
            <option value="closed">Closed</option>
          </TextField>
        </Stack>
      </CardContent>
    </Card>
  );
}

function KycForm({ formState, onChange, amlStatus, onValidate, onSubmit, disabled, isExisting = false }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>
          {isExisting ? 'Onboard Existing Client' : 'KYC & AML Onboarding'}
        </Typography>
        {!isExisting && <Chip label={formState.kycTier.toUpperCase()} size="small" />}
      </Stack>
      {isExisting && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This client already has KYC documentation. Basic information only is required.
        </Alert>
      )}
      <Stack spacing={1.5}>
          <TextField
            label="Client Name"
            value={formState.clientName}
            onChange={(e) => onChange('clientName', e.target.value)}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              label="Client Type"
              select
              SelectProps={{ native: true }}
              value={formState.clientType}
              onChange={(e) => onChange('clientType', e.target.value)}
              sx={{ flex: 1 }}
            >
              <option value="institutional">Institutional</option>
              <option value="pension">Pension</option>
              <option value="corporate">Corporate</option>
            </TextField>
            <TextField
              label="RC Number"
              value={formState.rcNumber}
              onChange={(e) => onChange('rcNumber', e.target.value)}
              sx={{ flex: 1 }}
            />
          </Stack>
          <TextField
            label="Registered Address"
            multiline
            minRows={2}
            value={formState.address}
            onChange={(e) => onChange('address', e.target.value)}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              label="Contact Email"
              type="email"
              value={formState.email}
              onChange={(e) => onChange('email', e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Phone"
              value={formState.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              sx={{ flex: 1 }}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              label="KYC Tier"
              select
              SelectProps={{ native: true }}
              value={formState.kycTier}
              onChange={(e) => onChange('kycTier', e.target.value)}
              sx={{ flex: 1 }}
            >
              <option value="tier1">Tier 1 – Simplified</option>
              <option value="tier2">Tier 2 – Standard</option>
              <option value="tier3">Tier 3 – Enhanced</option>
            </TextField>
            <TextField
              label="Risk Rating"
              select
              SelectProps={{ native: true }}
              value={formState.riskRating}
              onChange={(e) => onChange('riskRating', e.target.value)}
              sx={{ flex: 1 }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </TextField>
          </Stack>
          {!isExisting && (
            <>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<ShieldCheck size={16} />}
                  onClick={onValidate}
                  disabled={amlStatus.checking || !formState.clientName}
                >
                  {amlStatus.checking ? 'Checking...' : 'Validate AML/KYC'}
                </Button>
              </Stack>
              {amlStatus.result && (
                <Alert
                  severity={amlStatus.result.message.includes('manual') ? 'warning' : 'success'}
                  icon={<ShieldCheck size={18} />}
                >
                  {amlStatus.result.message}
                </Alert>
              )}
            </>
          )}
        </Stack>
    </Box>
  );
}

function HierarchyDetails({ client, canRequestClosure, onRequestClosure }) {
  return (
    <Box>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
          <Typography variant="caption" color="text.secondary">
            Portfolio Value
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {currencyFormatter.format(client.portfolioValue)}
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="caption" color="text.secondary">
            Cash Balance
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {currencyFormatter.format(client.cashBalance)}
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
      <Divider sx={{ my: 1 }} />
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
          {client.portfolios.map((portfolio) => (
            <TableRow key={portfolio.portfolioId}>
              <TableCell>{portfolio.name}</TableCell>
              <TableCell>
                {portfolio.subAccounts.map((sub) => (
                  <Chip
                    key={sub.accountId}
                    label={sub.accountName}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </TableCell>
              <TableCell align="right">{currencyFormatter.format(portfolio.aum)}</TableCell>
            </TableRow>
          ))}
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
          {client.assets?.map((asset, idx) => (
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
              {currencyFormatter.format(client.assets?.reduce((sum, a) => sum + (a.value || 0), 0))}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {canRequestClosure && (
        <Button
          variant="outlined"
          size="small"
          sx={{ mt: 2 }}
          onClick={() => onRequestClosure(client.clientId)}
        >
          Request Closure
        </Button>
      )}
    </Box>
  );
}


function seedClients() {
  return Array.from({ length: 5 }, (_, idx) => ({
    clientId: `CL-${200 + idx}`,
    clientName: ['Zenith Pensions', 'Unity Insurance', 'Sterling Asset', 'Nova Capital', 'Fidelity Custody'][idx],
    status: idx === 3 ? 'pending_closure' : 'active',
    kycStatus: idx % 2 === 0 ? 'tier2' : 'tier3',
    portfolioValue: 500000000 + idx * 120000000,
    cashBalance: 90000000 + idx * 15000000,
    accountManager: ['Ade Onu', 'Chi Okafor', 'Bola Ajayi', 'Timi Bada', 'Lara Eze'][idx],
    email: ['zenith@fsdh.com', 'unity@fsdh.com', 'sterling@fsdh.com', 'nova@fsdh.com', 'fidelity@fsdh.com'][idx],
    phone: ['+234 801 000 0001', '+234 801 000 0002', '+234 801 000 0003', '+234 801 000 0004', '+234 801 000 0005'][idx],
    address: ['Lagos, Nigeria', 'Abuja, Nigeria', 'PH, Nigeria', 'Ibadan, Nigeria', 'Lagos, Nigeria'][idx],
    createdAt: new Date(Date.now() - (idx + 3) * 86400000),
    portfolios: Array.from({ length: 2 }, (_, pIdx) => ({
      portfolioId: `PF-${idx}${pIdx}`,
      name: pIdx === 0 ? 'Core Holdings' : 'Liquidity Sleeve',
      aum: 250000000 + pIdx * 80000000,
      subAccounts: ['NGX-CUSTODY', 'CSCS-SETTLEMENT', 'FX-ALT'].map((code, sIdx) => ({
        accountId: `${code}-${idx}${pIdx}${sIdx}`,
        accountName: `${code}-${sIdx + 1}`,
      })),
    })),
    assets: [
      {
        name: 'FGN 2030 Bond',
        isin: `NGFGN2030BND-${idx}`,
        assetType: 'bond',
        value: 200000000 + idx * 20000000,
      },
      {
        name: 'FSDH Holdings Plc',
        isin: `NGFSDH00000${idx}`,
        assetType: 'equity',
        value: 180000000 + idx * 15000000,
      },
      {
        name: 'Liquidity Fund',
        isin: `NGFUNDLQ${idx}`,
        assetType: 'fund',
        value: 120000000 + idx * 10000000,
      },
    ],
  }));
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

function getInitialFormState() {
  return {
    clientName: '',
    clientType: 'institutional',
    rcNumber: '',
    address: '',
    email: '',
    phone: '',
    kycTier: 'tier2',
    riskRating: 'medium',
  };
}

function buildClientFromForm(formState, amlResult, isExisting = false) {
  const basePortfolioValue = 0;
  const newClient = {
    clientId: `CL-${Math.floor(Math.random() * 900 + 100)}`,
    clientName: formState.clientName,
    status: 'active',
    kycStatus: isExisting ? 'approved' : formState.kycTier, // Existing clients don't need KYC
    portfolioValue: basePortfolioValue,
    cashBalance: 0,
    portfolios: [
      {
        portfolioId: 'PF-NEW',
        name: 'Primary Portfolio',
        aum: 0,
        subAccounts: [
          { accountId: 'NGX-NEW', accountName: 'NGX Settlement' },
          { accountId: 'CSCS-NEW', accountName: 'CSCS Custody' },
        ],
      },
    ],
    email: formState.email,
    phone: formState.phone,
    address: formState.address,
    accountManager: 'Unassigned',
    createdAt: new Date(),
    amlResult,
  };
  return normalizeClient(newClient);
}

function ClientCreationDialog({ 
  open, 
  onClose, 
  onSelectType, 
  clientType, 
  formState, 
  onChange, 
  amlStatus, 
  onValidate, 
  onSubmit, 
  disabled 
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Client</DialogTitle>
      <DialogContent>
        {!clientType ? (
          <Box sx={{ py: 3 }}>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              Select the type of client you want to onboard:
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={() => onSelectType('existing')}
                sx={{ py: 2, textAlign: 'left', justifyContent: 'flex-start' }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Onboard Existing Client
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Client already has KYC documentation. No KYC validation required.
                  </Typography>
                </Box>
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={() => onSelectType('new')}
                sx={{ py: 2, textAlign: 'left', justifyContent: 'flex-start' }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Onboard New Client
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New client requires full KYC validation and AML checks.
                  </Typography>
                </Box>
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <KycForm
              formState={formState}
              onChange={onChange}
              amlStatus={amlStatus}
              onValidate={onValidate}
              onSubmit={onSubmit}
              disabled={clientType === 'new' && disabled}
              isExisting={clientType === 'existing'}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {clientType && (
          <Button variant="contained" onClick={onSubmit} disabled={clientType === 'new' && disabled}>
            Onboard Client
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
