import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
} from '@mui/material';
import { Building2 as AccountBalance } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.requiresMFA) {
        navigate('/mfa-verify', { state: { userId: data.user.userId } });
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(210, 40%, 98%)',
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: 5,
            width: '100%',
            background: '#ffffff',
            border: '1px solid hsl(214, 32%, 91%)',
            borderRadius: 8,
            boxShadow: 'none',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <AccountBalance 
              size={48}
              style={{ 
                color: 'hsl(221, 83%, 53%)',
                marginBottom: 16,
              }} 
            />
            <Typography 
              component="h1" 
              variant="h4" 
              sx={{ 
                fontFamily: '"Space Grotesk", sans-serif',
                color: 'hsl(222, 47%, 11%)',
                fontWeight: 700,
                mb: 1,
                letterSpacing: '-0.01em',
              }}
            >
              FSDH Staff Portal
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'hsl(222, 20%, 40%)',
              }}
            >
              Sign in to your account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 2,
                  mb: 2,
                  py: 1.25,
                  background: 'hsl(221, 83%, 53%)',
                  boxShadow: 'none',
                  '&:hover': {
                    background: 'hsl(221, 83%, 48%)',
                  },
                  '&:disabled': {
                    background: 'hsl(221, 83%, 80%)',
                  },
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

