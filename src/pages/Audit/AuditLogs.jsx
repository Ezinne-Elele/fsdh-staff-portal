import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { auditService } from '../../services/auditService';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await auditService.getAuditLogs();
      setLogs(response.logs || response.data || []);
    } catch (err) {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
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
        Audit Logs
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ background: '#ffffff', border: '1px solid hsl(214, 32%, 91%)' }}>
        <CardContent>
          <TableContainer component={Paper} sx={{ background: '#ffffff', border: '1px solid hsl(214, 32%, 91%)' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Resource</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: 'hsl(222, 20%, 40%)', py: 3 }}>
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.logId || log.id}>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>{log.userId || '-'}</TableCell>
                      <TableCell>{log.action || '-'}</TableCell>
                      <TableCell>{log.resource || '-'}</TableCell>
                      <TableCell>{log.status || 'success'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

