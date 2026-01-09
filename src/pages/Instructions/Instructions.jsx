import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  Grid,
} from '@mui/material';
import { Eye as ViewIcon, Search as SearchIcon } from 'lucide-react';
import { instructionService } from '../../services/instructionService';
import { useAuth } from '../../contexts/AuthContext';

export default function Instructions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchInstructions();
    const interval = setInterval(fetchInstructions, 30000);
    return () => clearInterval(interval);
  }, [filterStatus]);

    const fetchInstructions = async () => {
    try {
      setLoading(true);
      // Only fetch pending and approved instructions
      const params = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      // Backend will filter to only pending and approved by default
      const response = await instructionService.getInstructions(params);
      const data =
        response.instructions ||
        response.data ||
        (Array.isArray(response) ? response : []);
      // Additional client-side filter to ensure only pending, approved, and rejected
      const filtered = data.filter(inst => 
        ['pending_approval', 'submitted', 'pending', 'approved', 'rejected'].includes(inst.status)
      );
      setInstructions(filtered);
    } catch (err) {
      setError('Failed to load instructions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      draft: 'default',
      submitted: 'primary',
      pending_approval: 'warning',
      pending: 'warning', // Alias for pending_approval
      approved: 'success',
      rejected: 'error',
      completed: 'success',
    };
    return statusMap[status] || 'default';
  };

  const getDisplayStatus = (status) => {
    // Map backend status to display status
    if (status === 'pending_approval' || status === 'submitted') {
      return 'Pending';
    }
    return status?.charAt(0).toUpperCase() + status?.slice(1) || status;
  };

  const filteredInstructions = instructions.filter((instruction) => {
    const matchesSearch = 
      instruction.instructionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instruction.clientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instruction.isin?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading && instructions.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography 
            variant="h4"
            sx={{
              fontFamily: '"Space Grotesk", sans-serif',
              color: 'hsl(222, 47%, 11%)',
              fontWeight: 700,
            }}
          >
            Client Instructions
          </Typography>
          <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)', mt: 0.5 }}>
            View client instructions. Approve/reject in Authorization Queue.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/authorization-queue')}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Go to Authorization Queue
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> This page displays all client instructions. To approve or reject instructions, 
          please use the <strong>Authorization Queue</strong> page. Instructions with status "Pending" are awaiting your review.
        </Typography>
      </Alert>

      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Pending', value: instructions.filter((i) => i.status === 'pending_approval' || i.status === 'submitted' || i.status === 'pending').length },
          { label: 'Approved', value: instructions.filter((i) => i.status === 'approved').length },
          { label: 'Rejected', value: instructions.filter((i) => i.status === 'rejected').length },
        ].map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.label}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h5" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
                  {item.value.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card
        sx={{
          background: '#ffffff',
          border: '1px solid hsl(214, 32%, 91%)',
          mb: 3,
        }}
      >
        <CardContent>
          <Box display="flex" gap={2} mb={2} flexDirection={{ xs: 'column', sm: 'row' }}>
            <TextField
              placeholder="Search instructions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon size={18} />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            <TextField
              select
              SelectProps={{ native: true }}
              label="Status"
              size="small"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ width: 200 }}
            >
              <option value="all">All</option>
              <option value="pending_approval">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </TextField>
          </Box>

          <TableContainer component={Paper} sx={{ background: '#ffffff', border: '1px solid hsl(214, 32%, 91%)' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Instruction ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Client ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>ISIN</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Quantity</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInstructions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ color: 'hsl(222, 20%, 40%)', py: 3 }}>
                      No instructions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInstructions.map((instruction) => (
                    <TableRow 
                      key={instruction.instructionId || instruction.id}
                      sx={{
                        '&:hover': {
                          background: 'hsl(210, 40%, 98%)',
                        },
                      }}
                    >
                      <TableCell sx={{ color: 'hsl(222, 47%, 11%)', fontFamily: '"Space Grotesk", sans-serif' }}>
                        {instruction.instructionId || instruction.id}
                      </TableCell>
                      <TableCell sx={{ color: 'hsl(222, 47%, 11%)' }}>
                        {instruction.clientId || '-'}
                      </TableCell>
                      <TableCell sx={{ color: 'hsl(222, 47%, 11%)' }}>
                        {instruction.instructionType || 'trade'}
                      </TableCell>
                      <TableCell sx={{ color: 'hsl(222, 47%, 11%)', fontFamily: '"Space Grotesk", sans-serif' }}>
                        {instruction.isin || '-'}
                      </TableCell>
                      <TableCell sx={{ color: 'hsl(222, 47%, 11%)', fontFamily: '"Space Grotesk", sans-serif' }}>
                        {instruction.quantity?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={instruction.status || 'draft'}
                          size="small"
                          sx={{
                            background: getStatusColor(instruction.status) === 'success' 
                              ? 'hsla(142, 52%, 45%, 0.1)'
                              : getStatusColor(instruction.status) === 'warning'
                              ? 'hsla(38, 92%, 50%, 0.1)'
                              : getStatusColor(instruction.status) === 'error'
                              ? 'hsla(0, 65%, 55%, 0.1)'
                              : 'hsla(221, 83%, 53%, 0.1)',
                            color: getStatusColor(instruction.status) === 'success' 
                              ? 'hsl(142, 52%, 45%)'
                              : getStatusColor(instruction.status) === 'warning'
                              ? 'hsl(38, 92%, 50%)'
                              : getStatusColor(instruction.status) === 'error'
                              ? 'hsl(0, 65%, 55%)'
                              : 'hsl(221, 83%, 53%)',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: 24,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'hsl(222, 47%, 11%)', fontSize: '0.875rem' }}>
                        {instruction.createdAt
                          ? new Date(instruction.createdAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/instructions/${instruction.instructionId || instruction.id}`)}
                          sx={{
                            color: 'hsl(221, 83%, 53%)',
                            '&:hover': {
                              background: 'hsla(221, 83%, 53%, 0.1)',
                            },
                          }}
                        >
                          <ViewIcon size={18} />
                        </IconButton>
                      </TableCell>
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

