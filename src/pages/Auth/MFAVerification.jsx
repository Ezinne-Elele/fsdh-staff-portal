import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function MFAVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyMFA } = useAuth();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const userId = location.state?.userId;

  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyMFA(userId, token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid MFA token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setCountdown(60);
    setError('');
    alert('OTP has been resent to your registered email/phone');
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
          <Typography 
            variant="h5" 
            align="center"
            sx={{
              fontFamily: '"Space Grotesk", sans-serif',
              color: 'hsl(222, 47%, 11%)',
              fontWeight: 700,
              mb: 1,
            }}
          >
            Multi-Factor Authentication
          </Typography>
          <Typography 
            variant="body2" 
            align="center" 
            sx={{ 
              mb: 4,
              color: 'hsl(222, 20%, 40%)',
            }}
          >
            Enter the 6-digit code sent to your registered email/phone
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="token"
              label="MFA Code"
              name="token"
              autoFocus
              value={token}
              onChange={(e) => setToken(e.target.value)}
              inputProps={{ maxLength: 6 }}
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || token.length !== 6}
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
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={handleResend}
              disabled={countdown > 0}
              sx={{
                color: 'hsl(221, 83%, 53%)',
                fontSize: '0.875rem',
                '&:disabled': {
                  color: 'hsl(222, 20%, 60%)',
                },
              }}
            >
              {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

