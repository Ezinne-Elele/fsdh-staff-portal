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
  Chip,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  RefreshCw,
  Factory,
  TrendingUp,
  Hash,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { tradeService } from '../../services/tradeService';

const sources = [
  { key: 'swift', label: 'SWIFT', icon: <Factory size={14} /> },
  { key: 'ngx', label: 'NGX', icon: <TrendingUp size={14} /> },
  { key: 'fmdq', label: 'FMDQ', icon: <BarChart3 size={14} /> },
  { key: 'afex', label: 'AFEX', icon: <Sparkles size={14} /> },
];

const defaultInstruments = [
  {
    name: 'FSDH Holdings Plc',
    isin: 'NGFSDH000001',
    assetType: 'equity',
    market: 'NGX',
    priceSource: 'NGX',
    currency: 'NGN',
    price: 24.5,
    lastUpdated: new Date(),
  },
  {
    name: 'FGN 10.5% 2030 Bond',
    isin: 'NGFGN2030BND',
    assetType: 'bond',
    market: 'FMDQ',
    priceSource: 'FMDQ',
    currency: 'NGN',
    price: 101.2,
    lastUpdated: new Date(),
  },
  {
    name: 'AFEX Sorghum Contract',
    isin: 'NGAFEXSORGHM',
    assetType: 'commodity',
    market: 'AFEX',
    priceSource: 'AFEX',
    currency: 'NGN',
    price: 1_250_000,
    lastUpdated: new Date(),
  },
  {
    name: 'NGX Index Futures',
    isin: 'NGNDEXFUT01',
    assetType: 'derivative',
    market: 'NGX',
    priceSource: 'SWIFT',
    currency: 'NGN',
    price: 560,
    lastUpdated: new Date(),
  },
  {
    name: 'FSDH Infrastructure Fund',
    isin: 'NGFSDHALT01',
    assetType: 'alternative',
    market: 'Private',
    priceSource: 'Internal',
    currency: 'NGN',
    price: 1_050,
    lastUpdated: new Date(),
  },
];

const assetColors = {
  equity: 'primary',
  bond: 'success',
  commodity: 'warning',
  derivative: 'info',
  alternative: 'default',
};

export default function InstrumentCoverage() {
  const [instruments, setInstruments] = useState([]);
  const [formData, setFormData] = useState(initialFormState());
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    const loadInstruments = async () => {
      try {
        setLoading(true);
        const response = await tradeService.getInstruments().catch(() => null);
        if (response?.instruments?.length) {
          setInstruments(
            response.instruments.map((inst) => ({
              ...inst,
              lastUpdated: new Date(inst.lastUpdated || Date.now()),
            }))
          );
        } else {
          setInstruments(defaultInstruments);
        }
      } catch (err) {
        setError('Failed to load instruments, showing mock data');
        setInstruments(defaultInstruments);
      } finally {
        setLoading(false);
      }
    };

    loadInstruments();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setInstruments((prev) =>
        prev.map((inst) => ({
          ...inst,
          price: randomizePrice(inst.price),
          lastUpdated: new Date(),
        }))
      );
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    return instruments.reduce(
      (acc, inst) => {
        acc.total++;
        acc[inst.assetType] = (acc[inst.assetType] || 0) + 1;
        return acc;
      },
      { total: 0 }
    );
  }, [instruments]);

  const handleSourceRefresh = (source) => {
    setInstruments((prev) =>
      prev.map((inst) =>
        inst.priceSource.toLowerCase() === source
          ? {
              ...inst,
              price: randomizePrice(inst.price, { aggressive: true }),
              lastUpdated: new Date(),
            }
          : inst
      )
    );
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateIsin = () => {
    setFormData((prev) => ({ ...prev, isin: generateFakeISIN() }));
  };

  const handleAddInstrument = (event) => {
    event.preventDefault();
    const errors = validateInstrument(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    const newInstrument = {
      ...formData,
      price: Number(formData.price),
      lastUpdated: new Date(),
    };
    setInstruments((prev) => [newInstrument, ...prev]);
    setFormData(initialFormState());
    setFormErrors({});
    setIsAddDialogOpen(false);
  };

  const filtered = instruments.sort((a, b) => b.lastUpdated - a.lastUpdated);

  return (
    <Box>
      <Dialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
          Add Instrument
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="add-instrument-form" onSubmit={handleAddInstrument}>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Instrument Name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.name)}
                  helperText={formErrors.name}
                  fullWidth
                  required
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
                  required
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
                  select
                  SelectProps={{ native: true }}
                  label="Asset Type"
                  name="assetType"
                  value={formData.assetType}
                  onChange={handleFormChange}
                  fullWidth
                  required
                >
                  <option value="equity">Equity</option>
                  <option value="bond">Bond</option>
                  <option value="commodity">Commodity</option>
                  <option value="derivative">Derivative</option>
                  <option value="alternative">Alternative</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Market"
                  name="market"
                  value={formData.market}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.market)}
                  helperText={formErrors.market}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Price Source"
                  name="priceSource"
                  value={formData.priceSource}
                  onChange={handleFormChange}
                  error={Boolean(formErrors.priceSource)}
                  helperText={formErrors.priceSource}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleFormChange}
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
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
          <Button type="submit" form="add-instrument-form" variant="contained">
            Add Instrument
          </Button>
        </DialogActions>
      </Dialog>

      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2} mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'hsl(222, 47%, 11%)', mb: 0.5 }}>
            Instrument Coverage
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage multi-asset instruments and simulate market data feeds.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Hash size={16} />}
            onClick={() => {
              setFormData(initialFormState());
              setFormErrors({});
              setIsAddDialogOpen(true);
            }}
          >
            Add Instrument
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={2.4}>
          <StatCard title="Total Instruments" value={stats.total || 0} />
        </Grid>
        <Grid item xs={12} md={2.4}>
          <StatCard title="Equities" value={stats.equity || 0} />
        </Grid>
        <Grid item xs={12} md={2.4}>
          <StatCard title="Bonds" value={stats.bond || 0} />
        </Grid>
        <Grid item xs={12} md={2.4}>
          <StatCard title="Commodities" value={stats.commodity || 0} />
        </Grid>
        <Grid item xs={12} md={2.4}>
          <StatCard title="Derivatives/Alt" value={(stats.derivative || 0) + (stats.alternative || 0)} />
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, mb: 2 }}>
                Price Feeds
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {sources.map((source) => (
                  <Button
                    key={source.key}
                    variant="outlined"
                    onClick={() => handleSourceRefresh(source.key)}
                    startIcon={source.icon}
                  >
                    Refresh {source.label}
                  </Button>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, mb: 2 }}>
            Instruments
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>ISIN</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Market</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell>Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((inst) => (
                    <TableRow key={inst.isin}>
                      <TableCell>{inst.name}</TableCell>
                      <TableCell sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>{inst.isin}</TableCell>
                      <TableCell>
                        <Chip
                          label={inst.assetType}
                          size="small"
                          color={assetColors[inst.assetType] || 'default'}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>{inst.market}</TableCell>
                      <TableCell>{inst.priceSource}</TableCell>
                      <TableCell align="right">
                        {new Intl.NumberFormat('en-NG', { style: 'currency', currency: inst.currency || 'NGN' }).format(inst.price)}
                      </TableCell>
                      <TableCell>
                        {inst.lastUpdated ? new Date(inst.lastUpdated).toLocaleTimeString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

const initialFormState = () => ({
  name: '',
  isin: '',
  assetType: 'equity',
  market: '',
  priceSource: '',
  currency: 'NGN',
  price: '',
});

const validateInstrument = (data) => {
  const errors = {};
  if (!data.name.trim()) errors.name = 'Name required';
  if (!data.isin.trim()) errors.isin = 'ISIN required';
  if (!data.market.trim()) errors.market = 'Market required';
  if (!data.priceSource.trim()) errors.priceSource = 'Price source required';
  if (!data.price || Number(data.price) <= 0) errors.price = 'Price must be positive';
  return errors;
};

const randomizePrice = (price, { aggressive = false } = {}) => {
  const factor = aggressive ? 0.1 : 0.03;
  const change = 1 + (Math.random() * factor - factor / 2);
  return Math.max(price * change, 0.01);
};

const generateFakeISIN = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const prefix = Array.from({ length: 2 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const body = Array.from({ length: 9 }, () => digits[Math.floor(Math.random() * digits.length)]).join('');
  return `${prefix}${body}`;
};

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

