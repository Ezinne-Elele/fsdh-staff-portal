import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
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
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Search,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { userService } from '../../services/userService';

export default function ViewUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userService.getUsers({ limit: 100 });
      console.log('Users API response:', response); // Debug log
      
      // Handle different response formats
      if (Array.isArray(response)) {
        setUsers(response);
      } else if (response?.users) {
        setUsers(response.users);
      } else if (response?.data) {
        setUsers(Array.isArray(response.data) ? response.data : []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load users';
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.userId?.toLowerCase().includes(searchLower) ||
        user.role?.toLowerCase().includes(searchLower) ||
        (user.permissions || []).some(perm => perm.toLowerCase().includes(searchLower))
      );
    });
  }, [users, searchTerm]);

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  if (loading && users.length === 0) {
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
          View Users
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshCw size={18} />}
          onClick={fetchUsers}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ background: '#ffffff', border: '1px solid hsl(214, 32%, 91%)' }}>
        <CardContent>
          <Box display="flex" gap={2} mb={2}>
            <TextField
              placeholder="Search by name, email, role, permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
          </Box>

          <TableContainer component={Paper} sx={{ background: '#ffffff', border: '1px solid hsl(214, 32%, 91%)' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>User ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Permissions</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ color: 'hsl(222, 20%, 40%)', py: 3 }}>
                      {searchTerm ? 'No users found matching your search' : 'No users found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.userId || user.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {user.userId || user.id || '-'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {`${user.firstName || ''} ${user.lastName || ''}`.trim() || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role || 'viewer'}
                          size="small"
                          sx={{
                            background: 'hsla(221, 83%, 53%, 0.1)',
                            color: 'hsl(221, 83%, 53%)',
                            textTransform: 'capitalize',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap" sx={{ maxWidth: '300px' }}>
                          {(user.permissions || []).length > 0 ? (
                            (user.permissions || []).map((perm) => (
                              <Chip
                                key={perm}
                                label={perm.replace(/_/g, ' ')}
                                size="small"
                                sx={{
                                  background: 'hsla(142, 52%, 45%, 0.1)',
                                  color: 'hsl(142, 52%, 45%)',
                                  fontSize: '0.7rem',
                                  fontWeight: 500,
                                }}
                              />
                            ))
                          ) : (
                            <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', fontStyle: 'italic' }}>
                              No permissions
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive !== false ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            background: user.isActive !== false 
                              ? 'hsla(142, 52%, 45%, 0.1)'
                              : 'hsla(0, 65%, 55%, 0.1)',
                            color: user.isActive !== false 
                              ? 'hsl(142, 52%, 45%)'
                              : 'hsl(0, 65%, 55%)',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: 'hsl(222, 20%, 40%)' }}>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Eye size={14} />}
                          onClick={() => handleViewDetails(user)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
            User Details
          </Typography>
          <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', fontFamily: 'monospace' }}>
            {selectedUser?.userId || selectedUser?.id}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    User ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                    {selectedUser.userId || selectedUser.id || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedUser.email || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    First Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedUser.firstName || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Last Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedUser.lastName || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Role
                  </Typography>
                  <Chip
                    label={selectedUser.role || 'viewer'}
                    size="small"
                    sx={{
                      background: 'hsla(221, 83%, 53%, 0.1)',
                      color: 'hsl(221, 83%, 53%)',
                      textTransform: 'capitalize',
                      fontWeight: 600,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Status
                  </Typography>
                  <Chip
                    label={selectedUser.isActive !== false ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      background: selectedUser.isActive !== false 
                        ? 'hsla(142, 52%, 45%, 0.1)'
                        : 'hsla(0, 65%, 55%, 0.1)',
                      color: selectedUser.isActive !== false 
                        ? 'hsl(142, 52%, 45%)'
                        : 'hsl(0, 65%, 55%)',
                      fontWeight: 600,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Created At
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 0.5 }}>
                    Last Login
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedUser.lastLogin
                      ? new Date(selectedUser.lastLogin).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: 'hsl(222, 20%, 40%)', display: 'block', mb: 1 }}>
                    Permissions
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {(selectedUser.permissions || []).length > 0 ? (
                      (selectedUser.permissions || []).map((perm) => (
                        <Chip
                          key={perm}
                          label={perm.replace(/_/g, ' ')}
                          size="small"
                          sx={{
                            background: 'hsla(142, 52%, 45%, 0.1)',
                            color: 'hsl(142, 52%, 45%)',
                            fontWeight: 500,
                          }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)', fontStyle: 'italic' }}>
                        No permissions assigned
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

