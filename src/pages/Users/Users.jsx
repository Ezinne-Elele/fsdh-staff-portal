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
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { Plus as AddIcon } from 'lucide-react';
import { userService } from '../../services/userService';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userService.getUsers();
      setUsers(response.users || response.data || []);
    } catch (err) {
      setError('Failed to load users');
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography 
          variant="h4"
          sx={{
            fontFamily: '"Space Grotesk", sans-serif',
            color: 'hsl(222, 47%, 11%)',
            fontWeight: 700,
          }}
        >
          Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon size={18} />}
          sx={{
            background: 'hsl(221, 83%, 53%)',
            '&:hover': {
              background: 'hsl(221, 83%, 48%)',
            },
          }}
        >
          Add User
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ background: '#ffffff', border: '1px solid hsl(214, 32%, 91%)' }}>
        <CardContent>
          <TableContainer component={Paper} sx={{ background: '#ffffff', border: '1px solid hsl(214, 32%, 91%)' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>User ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: 'hsl(222, 20%, 40%)', py: 3 }}>
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.userId || user.id}>
                      <TableCell sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                        {user.userId || user.id}
                      </TableCell>
                      <TableCell>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || '-'}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role || 'viewer'}
                          size="small"
                          sx={{
                            background: 'hsla(221, 83%, 53%, 0.1)',
                            color: 'hsl(221, 83%, 53%)',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            background: user.isActive 
                              ? 'hsla(142, 52%, 45%, 0.1)'
                              : 'hsla(0, 65%, 55%, 0.1)',
                            color: user.isActive 
                              ? 'hsl(142, 52%, 45%)'
                              : 'hsl(0, 65%, 55%)',
                          }}
                        />
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

