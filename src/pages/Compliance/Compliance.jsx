import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from '@mui/material';
import { ShieldCheck, UserCheck, Lock } from 'lucide-react';
import { auditService } from '../../services/auditService';
import { exceptionService } from '../../services/exceptionService';

export default function Compliance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exceptionSummary, setExceptionSummary] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [auditLogs, exceptionStats] = await Promise.all([
          auditService.getAuditLogs({ limit: 50 }),
          exceptionService.getDashboardSummary(),
        ]);
        setLogs(auditLogs.logs || auditLogs.data || []);
        setExceptionSummary(exceptionStats);
      } catch (err) {
        setError('Failed to load compliance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeSessions = new Set(logs.map((log) => log.userId)).size;
  const failedLogins = logs.filter((log) => log.action?.toLowerCase().includes('login_failed')).length;
  const systemSecure = (exceptionSummary?.summary?.open || 0) === 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'hsl(222, 47%, 11%)', mb: 3 }}>
        Compliance & Security
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="text.secondary">System Health</Typography>
                <ShieldCheck size={18} color={systemSecure ? 'hsl(142, 52%, 45%)' : 'hsl(38, 92%, 50%)'} />
              </Box>
              <Typography variant="h5" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
                {systemSecure ? 'Secure' : 'Attention Needed'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {exceptionSummary?.summary?.open || 0} open exceptions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="text.secondary">Active Sessions</Typography>
                <UserCheck size={18} />
              </Box>
              <Typography variant="h5" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
                {activeSessions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Users interacting in the last 50 actions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="text.secondary">Failed Logins (sample)</Typography>
                <Lock size={18} color="hsl(38, 92%, 50%)" />
              </Box>
              <Typography variant="h5" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
                {failedLogins}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Logged authentication failures
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ border: '1px solid hsl(214, 32%, 91%)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, mb: 2 }}>
            Audit Trail
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>IP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No audit logs available.</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log._id || log.id}>
                    <TableCell sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.userId}</TableCell>
                    <TableCell>
                      <Chip label={log.userRole} size="small" sx={{ textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell>{log.responseStatus || 'N/A'}</TableCell>
                    <TableCell>{log.ipAddress || 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}


