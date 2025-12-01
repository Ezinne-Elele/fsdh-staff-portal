import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Calculator, DollarSign, Mail, Receipt, ShieldCheck, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const PRODUCTS = ['Custody', 'Securities Lending', 'FX Settlement', 'Corporate Actions'];
const CLIENTS = ['Zenith Pensions', 'Unity Insurance', 'Nova Capital', 'Sterling Asset'];

export default function Billing() {
  const { user } = useAuth();
  const canOverride = ['admin', 'checker'].includes(user?.role);
  const canApprove = ['admin'].includes(user?.role);

  const [templates, setTemplates] = useState(seedTemplates());
  const [formState, setFormState] = useState(getInitialTemplate());
  const [calculations, setCalculations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [glMatches, setGlMatches] = useState(seedGlMatches());
  const [adjustments, setAdjustments] = useState([]);
  const [adjustmentForm, setAdjustmentForm] = useState({ invoiceId: '', amount: '', reason: '' });
  const [overrideQueue, setOverrideQueue] = useState([]);

  const billingStats = useMemo(() => {
    const totalFees = calculations.reduce((sum, calc) => sum + calc.totalFee, 0);
    const pendingInvoices = invoices.filter((inv) => inv.status !== 'paid').length;
    return { templates: templates.length, totalFees, pendingInvoices };
  }, [templates, calculations, invoices]);

  const handleTemplateChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTemplate = () => {
    setTemplates((prev) => [{ ...formState, templateId: randomId('TMP') }, ...prev]);
    setFormState(getInitialTemplate());
  };

  const handleComputeFees = () => {
    const newCalcs = CLIENTS.map((client) => {
      const template = templates.find((tpl) => tpl.client === client) || templates[0];
      const baseAssets = 1500000000 + Math.random() * 500000000;
      const baseFee = (baseAssets * (template?.basisPoints || 10)) / 10000;
      const perfFee = baseFee * (template?.performanceSplit || 0);
      return {
        id: randomId('FEE'),
        client,
        product: template?.product || 'Custody',
        assetBase: baseAssets,
        baseFee,
        perfFee,
        totalFee: baseFee + perfFee + (template?.flatFee || 0),
      };
    });
    setCalculations(newCalcs);
  };

  const handleGenerateInvoices = () => {
    const newInvoices = calculations.map((calc) => ({
      invoiceId: randomId('INV'),
      client: calc.client,
      product: calc.product,
      amount: calc.totalFee,
      status: 'draft',
      emailed: false,
    }));
    setInvoices(newInvoices);
  };

  const handleSendInvoice = (invoiceId) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.invoiceId === invoiceId ? { ...inv, emailed: true, status: 'sent' } : inv
      )
    );
  };

  const handleAdjustmentChange = (field, value) => {
    setAdjustmentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAdjustment = () => {
    const amount = Number(adjustmentForm.amount || 0);
    const entry = {
      id: randomId('ADJ'),
      invoiceId: adjustmentForm.invoiceId,
      amount,
      reason: adjustmentForm.reason,
      createdAt: new Date(),
      status: amount > 100000 ? 'awaiting_approval' : 'applied',
    };
    setAdjustments((prev) => [entry, ...prev]);

    if (amount > 100000) {
      setOverrideQueue((prev) => [
        ...prev,
        {
          id: randomId('OVR'),
          invoiceId: adjustmentForm.invoiceId,
          amount,
          reason: adjustmentForm.reason,
          requestedBy: user?.firstName || 'Ops User',
          status: 'pending',
        },
      ]);
    }

    setAdjustmentForm({ invoiceId: '', amount: '', reason: '' });
  };

  const handleOverrideDecision = (overrideId, decision) => {
    if (!canApprove) return;
    setOverrideQueue((prev) =>
      prev.map((ovr) => (ovr.id === overrideId ? { ...ovr, status: decision } : ovr))
    );
    setAdjustments((prev) =>
      prev.map((adj) =>
        adj.id === overrideId.replace('OVR', 'ADJ')
          ? { ...adj, status: decision === 'approved' ? 'applied' : 'rejected' }
          : adj
      )
    );
  };

  return (
    <Box>
      <Header stats={billingStats} onCompute={handleComputeFees} onInvoice={handleGenerateInvoices} />

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={5}>
          <TemplateForm
            formState={formState}
            onChange={handleTemplateChange}
            onAdd={handleAddTemplate}
          />
        </Grid>
        <Grid item xs={12} md={7}>
          <TemplateList templates={templates} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FeePreview calculations={calculations} />
        </Grid>
        <Grid item xs={12} md={6}>
          <InvoicePanel invoices={invoices} onSend={handleSendInvoice} />
        </Grid>
      </Grid>

      <Grid container spacing={2} mt={1}>
        <Grid item xs={12} md={6}>
          <GlReconciliation glMatches={glMatches} />
        </Grid>
        <Grid item xs={12} md={6}>
          <AdjustmentPanel
            formState={adjustmentForm}
            onChange={handleAdjustmentChange}
            onSubmit={handleAddAdjustment}
            adjustments={adjustments}
          />
        </Grid>
      </Grid>

      <OverrideQueue
        overrides={overrideQueue}
        canApprove={canApprove}
        onDecision={handleOverrideDecision}
        canOverride={canOverride}
      />
    </Box>
  );
}

function Header({ stats, onCompute, onInvoice }) {
  const cards = [
    { label: 'Templates', value: stats.templates, icon: <Upload size={16} /> },
    { label: 'Fees Pending', value: `₦${stats.totalFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: <Calculator size={16} /> },
    { label: 'Open Invoices', value: stats.pendingInvoices, icon: <Receipt size={16} /> },
  ];
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
          Billing & Invoicing
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Maintain fee templates, compute billing, and reconcile against GL balances.
        </Typography>
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button variant="outlined" startIcon={<Calculator size={16} />} onClick={onCompute}>
          Compute Fees
        </Button>
        <Button variant="contained" startIcon={<DollarSign size={16} />} onClick={onInvoice}>
          Generate Invoices
        </Button>
      </Stack>
      <Grid container spacing={1} sx={{ flex: 1 }}>
        {cards.map((card) => (
          <Grid item xs={4} key={card.label}>
            <Card sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  {card.icon}
                  <Typography variant="caption" color="text.secondary">
                    {card.label}
                  </Typography>
                </Stack>
                <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>
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

function TemplateForm({ formState, onChange, onAdd }) {
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', mb: 1 }}>
          Fee Template
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            label="Client"
            select
            SelectProps={{ native: true }}
            value={formState.client}
            onChange={(e) => onChange('client', e.target.value)}
          >
            {CLIENTS.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </TextField>
          <TextField
            label="Product"
            select
            SelectProps={{ native: true }}
            value={formState.product}
            onChange={(e) => onChange('product', e.target.value)}
          >
            {PRODUCTS.map((product) => (
              <option key={product} value={product}>
                {product}
              </option>
            ))}
          </TextField>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              label="Basis Points"
              type="number"
              value={formState.basisPoints}
              onChange={(e) => onChange('basisPoints', Number(e.target.value))}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Performance Split"
              type="number"
              helperText="Enter decimal e.g. 0.2"
              value={formState.performanceSplit}
              onChange={(e) => onChange('performanceSplit', Number(e.target.value))}
              sx={{ flex: 1 }}
            />
          </Stack>
          <TextField
            label="Flat Fee (₦)"
            type="number"
            value={formState.flatFee}
            onChange={(e) => onChange('flatFee', Number(e.target.value))}
          />
          <TextField
            label="Billing Frequency"
            select
            SelectProps={{ native: true }}
            value={formState.frequency}
            onChange={(e) => onChange('frequency', e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </TextField>
          <Button variant="contained" onClick={onAdd}>
            Save Template
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function TemplateList({ templates }) {
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', mb: 1 }}>
          Active Templates
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Product</TableCell>
              <TableCell align="right">bps</TableCell>
              <TableCell align="right">Flat Fee</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((tpl) => (
              <TableRow key={tpl.templateId}>
                <TableCell>{tpl.client}</TableCell>
                <TableCell>{tpl.product}</TableCell>
                <TableCell align="right">{tpl.basisPoints}</TableCell>
                <TableCell align="right">₦{tpl.flatFee.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function FeePreview({ calculations }) {
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', mb: 1 }}>
          Fee Calculation Preview
        </Typography>
        {calculations.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Run a computation to preview fees.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">Assets (₦)</TableCell>
                <TableCell align="right">Total Fee (₦)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calculations.map((calc) => (
                <TableRow key={calc.id}>
                  <TableCell>{calc.client}</TableCell>
                  <TableCell>{calc.product}</TableCell>
                  <TableCell align="right">{calc.assetBase.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell align="right">{calc.totalFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function InvoicePanel({ invoices, onSend }) {
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>
            Generated Invoices
          </Typography>
          <Chip label={`${invoices.length} items`} size="small" />
        </Stack>
        {invoices.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Generate invoices to review.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Client</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Email</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.invoiceId}>
                  <TableCell>{invoice.invoiceId}</TableCell>
                  <TableCell>{invoice.client}</TableCell>
                  <TableCell align="right">₦{invoice.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<Mail size={14} />}
                      onClick={() => onSend(invoice.invoiceId)}
                      disabled={invoice.emailed}
                    >
                      {invoice.emailed ? 'Sent' : 'Send'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function GlReconciliation({ glMatches }) {
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', mb: 1 }}>
          GL Reconciliation
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Invoice</TableCell>
              <TableCell>GL Account</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {glMatches.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.invoiceId}</TableCell>
                <TableCell>{entry.account}</TableCell>
                <TableCell align="right">₦{entry.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                <TableCell>
                  <Chip
                    label={entry.status}
                    size="small"
                    sx={{
                      background:
                        entry.status === 'matched'
                          ? 'hsla(142, 52%, 45%, 0.12)'
                          : 'hsla(38, 92%, 50%, 0.12)',
                      textTransform: 'capitalize',
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AdjustmentPanel({ formState, onChange, onSubmit, adjustments }) {
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', mb: 1 }}>
          Manual Adjustments
        </Typography>
        <Stack spacing={1.5} mb={2}>
          <TextField
            label="Invoice ID"
            value={formState.invoiceId}
            onChange={(e) => onChange('invoiceId', e.target.value)}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              label="Amount (₦)"
              type="number"
              value={formState.amount}
              onChange={(e) => onChange('amount', e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Reason"
              value={formState.reason}
              onChange={(e) => onChange('reason', e.target.value)}
              sx={{ flex: 1 }}
            />
          </Stack>
          <Button variant="outlined" onClick={onSubmit}>
            Log Adjustment
          </Button>
        </Stack>
        {adjustments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No adjustments logged.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {adjustments.map((adj) => (
                <TableRow key={adj.id}>
                  <TableCell>{adj.invoiceId}</TableCell>
                  <TableCell align="right">₦{Number(adj.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={adj.status}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function OverrideQueue({ overrides, canApprove, onDecision, canOverride }) {
  if (!canOverride) {
    return null;
  }

  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', mt: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', mb: 1 }}>
          Supervisor Overrides
        </Typography>
        {overrides.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No overrides pending.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {overrides.map((ovr) => (
              <Box key={ovr.id} sx={{ border: '1px solid hsl(214, 32%, 91%)', borderRadius: 2, p: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {ovr.invoiceId} • ₦{ovr.amount.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {ovr.reason} • Requested by {ovr.requestedBy}
                </Typography>
                <Stack direction="row" spacing={1} mt={1}>
                  <Chip label={ovr.status} size="small" sx={{ textTransform: 'capitalize' }} />
                  {canApprove && ovr.status === 'pending' && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ShieldCheck size={14} />}
                        onClick={() => onDecision(ovr.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button size="small" onClick={() => onDecision(ovr.id, 'rejected')}>
                        Reject
                      </Button>
                    </>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function seedTemplates() {
  return PRODUCTS.slice(0, 3).map((product, idx) => ({
    templateId: randomId('TMP'),
    client: CLIENTS[idx],
    product,
    basisPoints: 12 + idx * 2,
    performanceSplit: 0.1 * idx,
    flatFee: 250000 * (idx + 1),
    frequency: 'monthly',
  }));
}

function getInitialTemplate() {
  return {
    client: CLIENTS[0],
    product: PRODUCTS[0],
    basisPoints: 10,
    performanceSplit: 0.2,
    flatFee: 150000,
    frequency: 'monthly',
  };
}

function seedGlMatches() {
  return Array.from({ length: 4 }, (_, idx) => ({
    id: randomId('GL'),
    invoiceId: `INV-${300 + idx}`,
    account: idx % 2 === 0 ? '3101 - Custody Income' : '3103 - Lending Income',
    amount: 2500000 + idx * 150000,
    status: idx % 3 === 0 ? 'pending' : 'matched',
  }));
}

function randomId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

