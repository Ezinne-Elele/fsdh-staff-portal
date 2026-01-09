import React, { useMemo, useState, useEffect } from 'react';
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
} from '@mui/material';
import { ClipboardList, Layers3, RefreshCw, Search, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
});

export default function Clients() {
  const { user } = useAuth();
  const canOnboard = ['admin', 'maker'].includes(user?.role);
  const canApproveClosure = ['admin', 'checker'].includes(user?.role);

  const [clients, setClients] = useState(() => seedClients());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [amlStatus, setAmlStatus] = useState({ checking: false, result: null });
  const [formState, setFormState] = useState(getInitialFormState());
  const [formOpen, setFormOpen] = useState(false);
  const [clientType, setClientType] = useState(null); // 'existing' or 'new'
  const [syncState, setSyncState] = useState({ lastRun: null, status: 'idle' });

  useEffect(() => {
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

  const handleRequestClosure = (clientId) => {
    // Update client status to pending_closure
    // The actual request will be created in the authorization queue via API
    setClients((prev) =>
      prev.map((client) =>
        client.clientId === clientId ? { ...client, status: 'pending_closure' } : client
      )
    );
    // Note: In production, this would call the API to create the closure request
    alert(`Account closure request for ${clientId} has been submitted to the Authorization Queue.`);
  };

  function runFlexcubeSync() {
    setSyncState((prev) => ({ lastRun: prev.lastRun, status: 'syncing' }));
    setTimeout(() => {
      setSyncState({ lastRun: new Date(), status: 'success' });
    }, 800);
  }

  return (
    <Box>
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

      <Grid container spacing={2}>
        {filteredClients.map((client) => (
          <Grid item xs={12} md={6} key={client.clientId}>
            <HierarchyCard
              client={client}
              canRequestClosure={canOnboard && client.status === 'active'}
              onRequestClosure={handleRequestClosure}
            />
          </Grid>
        ))}
      </Grid>

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

function HierarchyCard({ client, canRequestClosure, onRequestClosure }) {
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 }}>
              {client.clientName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {client.clientId}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip label={client.status} sx={{ textTransform: 'capitalize' }} />
            <Chip label={`KYC ${client.kycStatus.toUpperCase()}`} />
          </Stack>
        </Stack>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Portfolio Value
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {currencyFormatter.format(client.portfolioValue)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              Cash Balance
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {currencyFormatter.format(client.cashBalance)}
            </Typography>
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
      </CardContent>
    </Card>
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
    portfolios: Array.from({ length: 2 }, (_, pIdx) => ({
      portfolioId: `PF-${idx}${pIdx}`,
      name: pIdx === 0 ? 'Core Holdings' : 'Liquidity Sleeve',
      aum: 250000000 + pIdx * 80000000,
      subAccounts: ['NGX-CUSTODY', 'CSCS-SETTLEMENT', 'FX-ALT'].map((code, sIdx) => ({
        accountId: `${code}-${idx}${pIdx}${sIdx}`,
        accountName: `${code}-${sIdx + 1}`,
      })),
    })),
  }));
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
  return {
    clientId: `CL-${Math.floor(Math.random() * 900 + 100)}`,
    clientName: formState.clientName,
    status: 'active',
    kycStatus: isExisting ? 'approved' : formState.kycTier, // Existing clients don't need KYC
    portfolioValue: 0,
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
    amlResult,
  };
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
