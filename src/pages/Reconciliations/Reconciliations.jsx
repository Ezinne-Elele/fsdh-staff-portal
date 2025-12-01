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
import {
  FileUp,
  RefreshCw,
  AlertTriangle,
  Mail,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';

const CLIENTS = ['Zenith Pensions', 'Unity Insurance', 'Sterling Asset', 'Nova Capital', 'FSDH Treasury'];
const INSTRUMENTS = ['ZENITHBANK', 'GTCO', 'DANGCEM', 'UBA', 'MTNN', 'WAPCO'];

export default function Reconciliations() {
  const [sourceFiles, setSourceFiles] = useState({ cscs: [], ngx: [], flexcube: [] });
  const [matches, setMatches] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [emailStatus, setEmailStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [cutoffPassed, setCutoffPassed] = useState(false);

  useEffect(() => {
    runFullImport();
  }, []);

  const runFullImport = () => {
    setLoading(true);
    setEmailStatus('');
    setCutoffPassed(Math.random() > 0.6);
    setTimeout(() => {
      const cscs = generatePositionFile('CSCS');
      const ngx = generatePositionFile('NGX');
      const flexcube = generateCashFile();
      const { matchedPositions, breaks } = reconcilePositions(cscs, ngx);
      setSourceFiles({ cscs, ngx, flexcube });
      setMatches(matchedPositions);
      setBreaks(breaks);
      setExceptions([]);
      setLoading(false);
    }, 350);
  };

  const stats = useMemo(() => {
    const totalPositions = sourceFiles.cscs.length;
    const matched = matches.length;
    const openBreaks = breaks.filter((b) => b.status === 'open').length;
    const cashVariance = sourceFiles.flexcube.reduce((sum, entry) => sum + Math.abs(entry.variance), 0);
    return { totalPositions, matched, openBreaks, cashVariance };
  }, [sourceFiles, matches, breaks]);

  const handleCreateExceptions = () => {
    const tickets = breaks
      .filter((b) => b.status === 'open' && (cutoffPassed || b.ageHours > 6))
      .map((b) => ({
        id: randomId('EXC'),
        breakId: b.id,
        clientName: b.clientName,
        instrument: b.instrument,
        severity: b.severity,
        createdAt: new Date(),
        status: 'open',
      }));
    setExceptions(tickets);
  };

  const resolveBreak = (breakId) => {
    setBreaks((prev) => prev.map((b) => (b.id === breakId ? { ...b, status: 'resolved' } : b)));
    setExceptions((prev) => prev.map((exc) => (exc.breakId === breakId ? { ...exc, status: 'resolved' } : exc)));
  };

  const handleSendReport = () => {
    setEmailStatus('Sending...');
    setTimeout(() => {
      setEmailStatus(`Report emailed to ops@fsdh.com at ${new Date().toLocaleTimeString()}`);
    }, 600);
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
      <Header onImport={runFullImport} cutoffPassed={cutoffPassed} />
      <StatsGrid stats={stats} />

      <Grid container spacing={2} mt={1}>
        <Grid item xs={12} md={5}>
          <FileImportCard sourceFiles={sourceFiles} onImport={runFullImport} />
          <CashVarianceCard cashEntries={sourceFiles.flexcube} />
          <AutomationCard emailStatus={emailStatus} onSendReport={handleSendReport} />
        </Grid>
        <Grid item xs={12} md={7}>
          <ReconciliationTable data={matches.concat(breaks)} onResolve={resolveBreak} />
          <BreakSummary breaks={breaks} onCreateExceptions={handleCreateExceptions} />
          <ExceptionPanel exceptions={exceptions} />
        </Grid>
      </Grid>
    </Box>
  );
}

function Header({ onImport, cutoffPassed }) {
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
          Reconciliation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Import CSCS, NGX, and Flexcube files, detect breaks, and generate exception tickets before cutoff.
        </Typography>
        {cutoffPassed && (
          <Alert severity="warning" sx={{ mt: 1, border: '1px solid hsl(38, 92%, 50%)' }}>
            Cutoff passed. Outstanding breaks must become exception tickets.
          </Alert>
        )}
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={onImport}>
          Re-run Matching
        </Button>
      </Stack>
    </Box>
  );
}

function StatsGrid({ stats }) {
  const cards = [
    {
      label: 'Positions Imported',
      value: stats.totalPositions,
      color: 'hsl(221, 83%, 53%)',
      icon: <FileUp size={18} />,
    },
    {
      label: 'Matched Records',
      value: stats.matched,
      color: 'hsl(142, 52%, 45%)',
      icon: <CheckCircle2 size={18} />,
    },
    {
      label: 'Open Breaks',
      value: stats.openBreaks,
      color: 'hsl(0, 65%, 55%)',
      icon: <AlertTriangle size={18} />,
    },
    {
      label: 'Cash Variance (₦)',
      value: stats.cashVariance.toFixed(0),
      color: 'hsl(38, 92%, 50%)',
      icon: <ClipboardList size={18} />,
    },
  ];
  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid item xs={12} sm={6} md={3} key={card.label}>
          <Card sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center">
                {card.icon}
                <Typography variant="caption" color="text.secondary">
                  {card.label}
                </Typography>
              </Stack>
              <Typography variant="h5" sx={{ fontFamily: '"Space Grotesk", sans-serif', color: card.color }}>
                {card.label.includes('Cash') ? `₦${Number(card.value).toLocaleString()}` : card.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function FileImportCard({ sourceFiles, onImport }) {
  const files = [
    { name: 'CSCS Positions', rows: sourceFiles.cscs.length, source: 'CSCS' },
    { name: 'NGX Positions', rows: sourceFiles.ngx.length, source: 'NGX' },
    { name: 'Flexcube Cash', rows: sourceFiles.flexcube.length, source: 'Flexcube' },
  ];
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', mb: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <div>
            <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>
              File Imports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Latest mock uploads stored in memory
            </Typography>
          </div>
          <Button size="small" startIcon={<FileUp size={14} />} onClick={onImport}>
            Import Again
          </Button>
        </Stack>
        <Stack spacing={1.5} mt={2}>
          {files.map((file) => (
            <Box
              key={file.name}
              sx={{
                border: '1px solid hsl(214, 32%, 91%)',
                borderRadius: 2,
                p: 1.5,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {file.rows} rows • {new Date().toLocaleTimeString()}
              </Typography>
              <Chip
                label="In-memory"
                size="small"
                sx={{ mt: 1, background: 'hsla(221, 83%, 53%, 0.12)', color: 'hsl(221, 83%, 53%)' }}
              />
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function CashVarianceCard({ cashEntries }) {
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', mb: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>
          Flexcube Cash
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Intraday balances vs settlements
        </Typography>
        <TableContainer sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell align="right">Ledger (₦)</TableCell>
                <TableCell align="right">Expected</TableCell>
                <TableCell align="right">Variance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cashEntries.map((entry) => (
                <TableRow key={entry.account}>
                  <TableCell>{entry.account}</TableCell>
                  <TableCell align="right">₦{formatCurrency(entry.ledger)}</TableCell>
                  <TableCell align="right">₦{formatCurrency(entry.expected)}</TableCell>
                  <TableCell align="right" sx={{ color: entry.variance >= 0 ? 'hsl(38, 92%, 40%)' : 'hsl(0, 65%, 55%)' }}>
                    ₦{formatCurrency(entry.variance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

function AutomationCard({ emailStatus, onSendReport }) {
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>
          Daily Automation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Email summary once reconciliation completes
        </Typography>
        <Button variant="contained" startIcon={<Mail size={16} />} sx={{ mt: 2 }} onClick={onSendReport}>
          Email Daily Report
        </Button>
        {emailStatus && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {emailStatus}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function ReconciliationTable({ data, onResolve }) {
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', mb: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', mb: 2 }}>
          Position Matching by ISIN
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Instrument</TableCell>
                <TableCell align="right">CSCS Qty</TableCell>
                <TableCell align="right">NGX Qty</TableCell>
                <TableCell align="right">Variance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.clientName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.isin}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.instrument}</TableCell>
                  <TableCell align="right">{row.cscsQty.toLocaleString()}</TableCell>
                  <TableCell align="right">{row.ngxQty.toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ color: row.type === 'break' ? 'hsl(0, 65%, 55%)' : 'hsl(142, 52%, 45%)' }}>
                    {row.varianceQty.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.type === 'break' ? row.status : 'matched'}
                      size="small"
                      sx={{
                        background: row.type === 'break' ? 'hsla(0, 65%, 55%, 0.12)' : 'hsla(142, 52%, 45%, 0.12)',
                        color: row.type === 'break' ? 'hsl(0, 65%, 55%)' : 'hsl(142, 52%, 35%)',
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {row.type === 'break' && row.status === 'open' && (
                      <Button size="small" onClick={() => onResolve(row.id)}>
                        Mark Resolved
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

function BreakSummary({ breaks, onCreateExceptions }) {
  const openBreaks = breaks.filter((b) => b.status === 'open');
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', mb: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <div>
            <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>
              Breaks & Variances
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Auto-flagged mismatches awaiting review
            </Typography>
          </div>
          <Button variant="outlined" size="small" onClick={onCreateExceptions} disabled={openBreaks.length === 0}>
            Create Exception Tickets
          </Button>
        </Stack>
        {openBreaks.length === 0 ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            No outstanding breaks. Great job!
          </Alert>
        ) : (
          <Stack spacing={1.5} mt={2}>
            {openBreaks.map((bk) => (
              <Box
                key={`break-${bk.id}`}
                sx={{
                  border: '1px solid hsl(214, 32%, 91%)',
                  borderRadius: 2,
                  p: 1.5,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {bk.clientName} • {bk.instrument}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Quantity variance {bk.varianceQty.toLocaleString()} • Value ₦{formatCurrency(Math.abs(bk.varianceValue))}
                </Typography>
                <Chip
                  label={`${bk.severity.toUpperCase()} • ${bk.ageHours}h old`}
                  size="small"
                  sx={{ mt: 1, background: 'hsla(0, 65%, 55%, 0.12)', color: 'hsl(0, 65%, 55%)' }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function ExceptionPanel({ exceptions }) {
  return (
    <Card sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>
          Exception Tickets
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generated for breaks unresolved after cutoff
        </Typography>
        {exceptions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No exception tickets raised yet.
          </Typography>
        ) : (
          <Stack spacing={1.5} mt={2}>
            {exceptions.map((exc) => (
              <Box key={exc.id} sx={{ borderBottom: '1px solid hsl(214, 32%, 91%)', pb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {exc.id} • {exc.instrument}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {exc.clientName} • {exc.createdAt.toLocaleTimeString()}
                </Typography>
                <Chip
                  label={exc.status}
                  size="small"
                  sx={{
                    mt: 0.5,
                    background:
                      exc.status === 'resolved' ? 'hsla(142, 52%, 45%, 0.12)' : 'hsla(38, 92%, 50%, 0.12)',
                    color: exc.status === 'resolved' ? 'hsl(142, 52%, 35%)' : 'hsl(38, 92%, 40%)',
                    textTransform: 'capitalize',
                  }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function generatePositionFile(source) {
  return INSTRUMENTS.map((symbol, idx) => {
    const baseQty = 500000 + idx * 30000;
    const noise = Math.floor(Math.random() * 8000) * (Math.random() > 0.5 ? 1 : -1);
    const quantity = source === 'CSCS' ? baseQty : baseQty + noise;
    const price = 20 + idx * 3;
    return {
      id: `${source}-${symbol}`,
      clientName: CLIENTS[idx % CLIENTS.length],
      instrument: symbol,
      isin: `NG${(100000 + idx * 137).toString().padStart(6, '0')}`,
      quantity,
      value: quantity * price,
      fileSource: source,
    };
  });
}

function generateCashFile() {
  return CLIENTS.slice(0, 3).map((client, idx) => {
    const ledger = 150000000 + idx * 20000000 + Math.random() * 5000000;
    const expected = ledger - (Math.random() * 2000000 - 1000000);
    return {
      account: `${client.split(' ')[0]}-CASH-${200 + idx}`,
      ledger,
      expected,
      variance: ledger - expected,
    };
  });
}

function reconcilePositions(cscs, ngx) {
  const matchedPositions = [];
  const breaks = [];
  cscs.forEach((record) => {
    const peer = ngx.find((item) => item.isin === record.isin);
    const varianceQty = peer ? peer.quantity - record.quantity : -record.quantity;
    const varianceValue = peer ? peer.value - record.value : -record.value;
    const isBreak = Math.abs(varianceQty) > record.quantity * 0.01 || Math.abs(varianceValue) > record.value * 0.01;
    if (isBreak) {
      breaks.push({
        id: randomId('BRK'),
        type: 'break',
        clientName: record.clientName,
        instrument: record.instrument,
        isin: record.isin,
        cscsQty: record.quantity,
        ngxQty: peer?.quantity || 0,
        varianceQty,
        varianceValue,
        severity: Math.abs(varianceQty) > record.quantity * 0.05 ? 'high' : 'medium',
        status: 'open',
        ageHours: Math.floor(Math.random() * 10) + 1,
      });
    } else {
      matchedPositions.push({
        id: randomId('MAT'),
        type: 'match',
        clientName: record.clientName,
        instrument: record.instrument,
        isin: record.isin,
        cscsQty: record.quantity,
        ngxQty: peer?.quantity || record.quantity,
        varianceQty,
      });
    }
  });
  return { matchedPositions, breaks };
}

function randomId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function formatCurrency(value) {
  return Number(value).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

