import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
} from '@mui/material';
import { FileText } from 'lucide-react';
import { reportService } from '../../services/reportService';

export default function Reports() {
  const [reportTypes, setReportTypes] = useState([]);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [types, summary] = await Promise.all([
          reportService.getReportTypes(),
          reportService.generateReport('trade_summary', { limit: 10 }, 'json').catch(() => null),
        ]);
        setReportTypes(types);
        setGeneratedReport(summary);
      } catch (err) {
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGenerate = async (reportType) => {
    try {
      setGenerating(true);
      const result = await reportService.generateReport(reportType.id, {}, 'json');
      setGeneratedReport(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography 
        variant="h4"
        sx={{
          fontFamily: '"Space Grotesk", sans-serif',
          color: 'hsl(222, 47%, 11%)',
          fontWeight: 700,
          mb: 3,
        }}
      >
        Reporting & Analytics
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={2} mb={3}>
        {reportTypes.map((report) => (
          <Grid item xs={12} md={4} key={report.id}>
            <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <FileText size={20} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 }}>
                      {report.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Category: {report.category}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => handleGenerate(report)}
                  disabled={generating}
                >
                  Generate
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {generatedReport && (
        <Card sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 }}>
                  {generatedReport.reportType.replace('_', ' ').toUpperCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Generated at {new Date(generatedReport.generatedAt).toLocaleString()}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Format: {generatedReport.format?.toUpperCase()}
              </Typography>
            </Box>
            {generatedReport.data?.summary && (
              <Grid container spacing={2} mb={2}>
                {Object.entries(generatedReport.data.summary).map(([key, value]) => {
                  let displayValue = value;
                  if (typeof value === 'number') {
                    displayValue = value.toLocaleString();
                  } else if (typeof value === 'object' && value !== null) {
                    displayValue = Object.entries(value)
                      .map(([innerKey, innerValue]) => `${innerKey}: ${innerValue}`)
                      .join(' • ');
                  }

                  return (
                    <Grid item xs={12} sm={3} key={key}>
                      <Typography variant="caption" color="text.secondary" textTransform="capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </Typography>
                      <Typography variant="h6">
                        {displayValue}
                      </Typography>
                    </Grid>
                  );
                })}
              </Grid>
            )}
            {generatedReport.data?.trades && (
              <TableContainer component={Paper} sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Trade ID</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {generatedReport.data.trades.slice(0, 10).map((trade) => (
                      <TableRow key={trade.tradeId}>
                        <TableCell>{trade.tradeId}</TableCell>
                        <TableCell>{trade.clientId}</TableCell>
                        <TableCell>{trade.tradeType}</TableCell>
                        <TableCell align="right">{trade.totalValue?.toLocaleString()}</TableCell>
                        <TableCell>{trade.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}


