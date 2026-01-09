import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
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
  IconButton,
  FormControlLabel,
  Checkbox,
  Stack,
  Tabs,
  Tab,
  Grid,
} from '@mui/material';
import {
  Plus as AddIcon,
  Edit as EditIcon,
  Trash2 as DeleteIcon,
  Shield as PermissionsIcon,
  RefreshCw as RefreshIcon,
} from 'lucide-react';
import { userService } from '../../services/userService';

const AVAILABLE_PERMISSIONS = [
  { value: 'approve_instructions', label: 'Approve Instructions' },
  { value: 'create_trades', label: 'Create Trades' },
  { value: 'view_all', label: 'View All' },
  { value: 'manage_users', label: 'Manage Users' },
  { value: 'manage_settings', label: 'Manage Settings' },
];

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'checker', label: 'Checker' },
  { value: 'maker', label: 'Maker' },
  { value: 'viewer', label: 'Viewer' },
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'viewer',
    permissions: [],
  });

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

  const handleAddUser = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'viewer',
      permissions: [],
    });
    setAddDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      permissions: user.permissions || [],
    });
    setEditDialogOpen(true);
  };

  const handlePermissions = (user) => {
    setSelectedUser(user);
    setFormData({
      permissions: user.permissions || [],
    });
    setPermissionsDialogOpen(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionToggle = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmitAdd = async () => {
    try {
      setError('');
      await userService.createUser(formData);
      setSuccess('User created successfully');
      setAddDialogOpen(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create user');
    }
  };

  const handleSubmitEdit = async () => {
    try {
      setError('');
      await userService.updateUser(selectedUser.userId, formData);
      setSuccess('User updated successfully');
      setEditDialogOpen(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update user');
    }
  };

  const handleSubmitPermissions = async () => {
    try {
      setError('');
      await userService.updatePermissions(selectedUser.userId, formData.permissions);
      setSuccess('Permissions updated successfully');
      setPermissionsDialogOpen(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update permissions');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setError('');
      await userService.deleteUser(selectedUser.userId);
      setSuccess('User deleted successfully');
      setDeleteDialogOpen(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete user');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await userService.toggleActive(user.userId);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to toggle user status');
    }
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
          User Management
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon size={18} />}
            onClick={fetchUsers}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon size={18} />}
            onClick={handleAddUser}
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
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card sx={{ background: '#ffffff', border: '1px solid hsl(214, 32%, 91%)' }}>
        <CardContent>
          <TableContainer component={Paper} sx={{ background: '#ffffff', border: '1px solid hsl(214, 32%, 91%)' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Permissions</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: 'hsl(222, 20%, 40%)', py: 3 }}>
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.userId || user.id}>
                      <TableCell>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || '-'}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role || 'viewer'}
                          size="small"
                          sx={{
                            background: 'hsla(221, 83%, 53%, 0.1)',
                            color: 'hsl(221, 83%, 53%)',
                            textTransform: 'capitalize',
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
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditUser(user)}
                            sx={{ color: 'hsl(221, 83%, 53%)' }}
                          >
                            <EditIcon size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handlePermissions(user)}
                            sx={{ color: 'hsl(38, 92%, 50%)' }}
                          >
                            <PermissionsIcon size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteUser(user)}
                            sx={{ color: 'hsl(0, 65%, 55%)' }}
                          >
                            <DeleteIcon size={16} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleFormChange('password', e.target.value)}
              fullWidth
              required
              helperText="Minimum 8 characters"
            />
            <TextField
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleFormChange('firstName', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleFormChange('lastName', e.target.value)}
              fullWidth
              required
            />
            <TextField
              select
              label="Role"
              value={formData.role}
              onChange={(e) => handleFormChange('role', e.target.value)}
              fullWidth
              required
            >
              {ROLES.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitAdd}>
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleFormChange('firstName', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleFormChange('lastName', e.target.value)}
              fullWidth
              required
            />
            <TextField
              select
              label="Role"
              value={formData.role}
              onChange={(e) => handleFormChange('role', e.target.value)}
              fullWidth
              required
            >
              {ROLES.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitEdit}>
            Update User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onClose={() => setPermissionsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Manage Permissions - {selectedUser && `${selectedUser.firstName} ${selectedUser.lastName}`}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Select permissions for this user. Users with "Approve Instructions" permission can access the Authorization Queue.
            </Typography>
            {AVAILABLE_PERMISSIONS.map((permission) => (
              <FormControlLabel
                key={permission.value}
                control={
                  <Checkbox
                    checked={formData.permissions.includes(permission.value)}
                    onChange={() => handlePermissionToggle(permission.value)}
                  />
                }
                label={permission.label}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitPermissions}>
            Update Permissions
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedUser && `${selectedUser.firstName} ${selectedUser.lastName}`}?
            This will deactivate the user account.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

