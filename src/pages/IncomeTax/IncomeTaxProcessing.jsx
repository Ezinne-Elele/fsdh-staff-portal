import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Calculator, FileText, PiggyBank, TrendingUp } from 'lucide-react';
import { generateMockCorporateActions } from '../../mocks/corporateActions';

const TAX_RATES = {
  equity: 0.1,
  bond: 0.075,
  commodity: 0.08,
  derivative: 0.12,
  alternative: 0.09,
  default: 0.1,
};

const CLIENTS = ['Zenith Pensions', 'Unity Insurance', 'Sterling Asset', 'Nova Capital', 'FSDH Treasury Desk'];

export default function IncomeTaxProcessing() {
  const [incomeEvents, setIncomeEvents] = useState([]);
  const [glPostings, setGlPostings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [reconciliation, setReconciliation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const corpActions = generateMockCorporateActions(10);
      const incomes = buildIncomeEvents(corpActions);
      setIncomeEvents(incomes);
      setGlPostings(buildGlPostings(incomes));
      setReconciliation(buildMonthlyReconciliation(incomes));
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    return incomeEvents.reduce(
      (acc, event) => {
        acc.gross += event.grossIncome;
        acc.tax += event.taxAmount;
        acc.net += event.netIncome;
        return acc;
      },
      { gross: 0, tax: 0, net: 0 }
    );
  }, [incomeEvents]);

  const recordAudit = (action, reference, notes) => {
    setAuditLogs((prev) => [{ id: randomId('AUD'), action, reference, notes, timestamp: new Date() }, ...prev].slice(0, 8));
  };

  const handleAdjustment = (event) => {
    const delta = (Math.random() * 5000 - 2500).toFixed(2);
    setIncomeEvents((prev) =>
      prev.map((item) =>
        item.id === event.id
          ? {
              ...item,
              grossIncome: parseFloat((item.grossIncome + Number(delta)).toFixed(2)),
              netIncome: parseFloat((item.netIncome + Number(delta)).toFixed(2)),
              adjusted: true,
            }
          : item
      )
    );
    recordAudit('adjustment', event.id, `Manual adjustment of ₦${formatCurrency(Math.abs(delta))}`);
  };

  const handlePostGL = (postingId) => {
    setGlPostings((prev) =>
      prev.map((posting) => (posting.id === postingId ? { ...posting, status: 'posted' } : posting))
    );
    const posting = glPostings.find((item) => item.id === postingId);
    if (posting) {
      recordAudit('gl_posting', posting.reference, `Posted ₦${formatCurrency(posting.netAmount)} to GL`);
    }
  };

  const handleMonthlyRun = () => {
    const summary = buildMonthlyReconciliation(incomeEvents, true);
    setReconciliation(summary);
    recordAudit('monthly_recon', summary.month, `Variance ${summary.variance >= 0 ? '+' : ''}${summary.variance.toFixed(2)}%`);
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="420px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Header stats={stats} onRunMonthly={handleMonthlyRun} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', mb: 2 }}>
            <CardContent>
              <SectionTitle title="Derived Income Events" subtitle="Generated directly from approved corporate actions" />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Client</TableCell>
                      <TableCell>Instrument</TableCell>
                      <TableCell align="right">Gross (₦)</TableCell>
                      <TableCell align="right">Tax</TableCell>
                      <TableCell align="right">Net</TableCell>
                      <TableCell>Source Action</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {incomeEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {event.clientName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {event.assetType.toUpperCase()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{event.instrument}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Tax {Math.round(event.taxRate * 100)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">₦{formatCurrency(event.grossIncome)}</TableCell>
                        <TableCell align="right" sx={{ color: 'hsl(38, 92%, 35%)' }}>
                          ₦{formatCurrency(event.taxAmount)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'hsl(142, 52%, 35%)', fontWeight: 600 }}>
                          ₦{formatCurrency(event.netIncome)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.corporateActionId}
                            size="small"
                            sx={{ background: 'hsla(221, 83%, 53%, 0.12)', color: 'hsl(221, 83%, 53%)' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => handleAdjustment(event)}>
                            Adjust
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
          <Card sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
            <CardContent>
              <SectionTitle title="Client Statement Preview" subtitle="Gross, tax, and net entries ready for dispatch" />
              {incomeEvents.slice(0, 3).map((event) => (
                <Box
                  key={`statement-${event.id}`}
                  sx={{
                    borderBottom: '1px solid hsl(214, 32%, 91%)',
                    py: 1.5,
                    '&:last-of-type': { borderBottom: 'none' },
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {event.clientName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.instrument} • {new Date(event.paymentDate).toLocaleDateString()}
                  </Typography>
                  <Stack direction="row" spacing={3} mt={1}>
                    <StatementValue label="Gross Income" value={event.grossIncome} tone="primary" />
                    <StatementValue label="Withholding Tax" value={event.taxAmount} tone="warning" />
                    <StatementValue label="Net Remittance" value={event.netIncome} tone="success" />
                  </Stack>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', mb: 2 }}>
            <CardContent>
              <SectionTitle title="GL Postings" subtitle="Mock entries ready for posting" />
              <Stack spacing={1.5}>
                {glPostings.map((posting) => (
                  <Box
                    key={posting.id}
                    sx={{
                      border: '1px solid hsl(214, 32%, 91%)',
                      borderRadius: 2,
                      p: 1.5,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {posting.reference}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Dr {posting.debitAccount} / Cr {posting.creditAccount}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      Net: ₦{formatCurrency(posting.netAmount)}
                    </Typography>
                    <Chip
                      size="small"
                      label={posting.status}
                      sx={{
                        mt: 1,
                        background:
                          posting.status === 'posted' ? 'hsla(142, 52%, 45%, 0.15)' : 'hsla(221, 83%, 53%, 0.12)',
                        textTransform: 'capitalize',
                      }}
                    />
                    {posting.status === 'pending' && (
                      <Button size="small" sx={{ mt: 1 }} onClick={() => handlePostGL(posting.id)}>
                        Post to GL
                      </Button>
                    )}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
          <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', mb: 2 }}>
            <CardContent>
              <SectionTitle title="Monthly Reconciliation" subtitle="Simulated GL tie-out" />
              {reconciliation ? (
                <Box>
                  <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                    {reconciliation.month}
                  </Typography>
                  <Stack spacing={1} mt={1}>
                    <ReconRow label="Gross Income" value={reconciliation.grossTotal} />
                    <ReconRow label="GL Balance" value={reconciliation.glBalance} />
                    <ReconRow label="Variance %" value={reconciliation.variance} suffix="%" />
                  </Stack>
                  <Chip
                    label={reconciliation.status}
                    size="small"
                    sx={{
                      mt: 2,
                      background:
                        reconciliation.status === 'balanced'
                          ? 'hsla(142, 52%, 45%, 0.15)'
                          : 'hsla(38, 92%, 50%, 0.18)',
                      textTransform: 'capitalize',
                    }}
                  />
                </Box>
              ) : (
                <Alert severity="info">Run reconciliation to generate summary</Alert>
              )}
            </CardContent>
          </Card>
          <Card sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
            <CardContent>
              <SectionTitle title="Audit Trail" subtitle="All adjustments & postings logged" />
              {auditLogs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No audit entries recorded yet.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {auditLogs.map((log) => (
                    <Box key={log.id} sx={{ borderBottom: '1px solid hsl(214, 32%, 91%)', pb: 1 }}>
                      <Typography variant="body2">
                        <strong>{log.action}</strong> • {log.notes}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.reference} • {log.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function Header({ stats, onRunMonthly }) {
  const cards = [
    {
      label: 'Gross Income',
      value: stats.gross,
      icon: <TrendingUp size={18} />,
      color: 'hsl(221, 83%, 53%)',
    },
    {
      label: 'Withholding Tax',
      value: stats.tax,
      icon: <Calculator size={18} />,
      color: 'hsl(38, 92%, 40%)',
    },
    {
      label: 'Net Remittance',
      value: stats.net,
      icon: <PiggyBank size={18} />,
      color: 'hsl(142, 52%, 45%)',
    },
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
          Income & Tax Processing
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Derive income from corporate actions, apply withholding tax, and simulate GL tie-outs.
        </Typography>
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        {cards.map((card) => (
          <Box
            key={card.label}
            sx={{
              border: '1px solid hsl(214, 32%, 91%)',
              borderRadius: 2,
              p: 2,
              minWidth: 160,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              {card.icon}
              <Typography variant="caption" color="text.secondary">
                {card.label}
              </Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontFamily: '"Space Grotesk", sans-serif', color: card.color }}>
              ₦{formatCurrency(card.value)}
            </Typography>
          </Box>
        ))}
      </Stack>
      <Button variant="contained" startIcon={<FileText size={16} />} onClick={onRunMonthly}>
        Run Monthly Reconciliation
      </Button>
    </Box>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <Box mb={2}>
      <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Box>
  );
}

function StatementValue({ label, value, tone }) {
  const colors = {
    primary: 'hsl(221, 83%, 53%)',
    warning: 'hsl(38, 92%, 40%)',
    success: 'hsl(142, 52%, 45%)',
  };
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600, color: colors[tone] }}>
        ₦{formatCurrency(value)}
      </Typography>
    </Box>
  );
}

function ReconRow({ label, value, suffix }) {
  return (
    <Box display="flex" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {suffix ? `${value.toFixed(2)}${suffix}` : `₦${formatCurrency(value)}`}
      </Typography>
    </Box>
  );
}

function buildIncomeEvents(actions) {
  return actions.map((action, index) => {
    const clientName = CLIENTS[index % CLIENTS.length];
    const taxRate = TAX_RATES[action.assetType] ?? TAX_RATES.default;
    const gross = Number((120000 + Math.random() * 80000).toFixed(2));
    const taxAmount = Number((gross * taxRate).toFixed(2));
    const netIncome = Number((gross - taxAmount).toFixed(2));

    return {
      id: randomId('INC'),
      corporateActionId: action.actionId,
      clientName,
      instrument: action.title,
      assetType: action.assetType || 'equity',
      grossIncome: gross,
      taxAmount,
      netIncome,
      taxRate,
      paymentDate: action.paymentDate,
    };
  });
}

function buildGlPostings(events) {
  return events.slice(0, 6).map((event) => ({
    id: randomId('GL'),
    reference: `GL-${event.corporateActionId}`,
    debitAccount: '3101 - Income Receivable',
    creditAccount: '2205 - Income Payable',
    netAmount: event.netIncome,
    status: Math.random() > 0.6 ? 'posted' : 'pending',
  }));
}

function buildMonthlyReconciliation(events, forceNew = false) {
  if (!events.length) return null;
  const grossTotal = events.reduce((sum, e) => sum + e.grossIncome, 0);
  const glBalance = grossTotal - Math.random() * 5000;
  const variance = forceNew ? Number((Math.random() * 0.5).toFixed(2)) : 0.12;
  return {
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    grossTotal,
    glBalance,
    variance,
    status: variance < 0.3 ? 'balanced' : 'review',
  };
}

function formatCurrency(value) {
  return value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function randomId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

