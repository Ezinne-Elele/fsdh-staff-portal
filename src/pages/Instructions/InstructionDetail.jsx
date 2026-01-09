import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ArrowLeft as BackIcon, Check as ApproveIcon, X as RejectIcon } from 'lucide-react';
import { instructionService } from '../../services/instructionService';
import { useAuth } from '../../contexts/AuthContext';

const steps = ['Draft', 'Submitted', 'Pending Approval', 'Approved', 'Completed'];

export default function InstructionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [instruction, setInstruction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchInstruction();
    const interval = setInterval(fetchInstruction, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchInstruction = async () => {
    try {
      const data = await instructionService.getInstruction(id);
      setInstruction(data.instruction || data);
    } catch (err) {
      setError('Failed to load instruction details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await instructionService.approveInstruction(id, approvalComment);
      setApproveDialog(false);
      setApprovalComment('');
      fetchInstruction();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve instruction');
    }
  };

  const handleReject = async () => {
    try {
      await instructionService.rejectInstruction(id, rejectionReason);
      setRejectDialog(false);
      setRejectionReason('');
      fetchInstruction();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject instruction');
    }
  };

  const handleComplete = async () => {
    try {
      await instructionService.completeInstruction(id);
      fetchInstruction();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete instruction');
    }
  };

  const getActiveStep = () => {
    const statusMap = {
      draft: 0,
      submitted: 1,
      pending_approval: 2,
      approved: 3,
      completed: 4,
    };
    return statusMap[instruction?.status] || 0;
  };

  const canApprove = (user?.role === 'checker' || user?.role === 'admin') && 
    (instruction?.status === 'submitted' || instruction?.status === 'pending_approval');
  const canReject = (user?.role === 'checker' || user?.role === 'admin') && 
    (instruction?.status === 'submitted' || instruction?.status === 'pending_approval');
  const canComplete = (user?.role === 'checker' || user?.role === 'admin') &&
    instruction?.status === 'approved';

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !instruction) {
    return <Alert severity="error">{error || 'Instruction not found'}</Alert>;
  }

  return (
    <Box>
      <Button
        startIcon={<BackIcon size={18} />}
        onClick={() => navigate('/instructions')}
        sx={{ 
          mb: 2,
          color: 'hsl(222, 47%, 11%)',
        }}
      >
        Back to Instructions
      </Button>

      <Card sx={{ background: '#ffffff', border: '1px solid hsl(214, 32%, 91%)', mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography 
              variant="h5"
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                color: 'hsl(222, 47%, 11%)',
                fontWeight: 700,
              }}
            >
              Instruction Details
            </Typography>
            <Chip
              label={instruction.status || 'draft'}
              sx={{
                background: instruction.status === 'completed' 
                  ? 'hsla(142, 52%, 45%, 0.1)'
                  : instruction.status === 'rejected'
                  ? 'hsla(0, 65%, 55%, 0.1)'
                  : 'hsla(221, 83%, 53%, 0.1)',
                color: instruction.status === 'completed' 
                  ? 'hsl(142, 52%, 45%)'
                  : instruction.status === 'rejected'
                  ? 'hsl(0, 65%, 55%)'
                  : 'hsl(221, 83%, 53%)',
              }}
            />
          </Box>

          <Stepper activeStep={getActiveStep()} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)', mb: 0.5 }}>
                Instruction ID
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: '"Space Grotesk", sans-serif', mb: 2 }}>
                {instruction.instructionId || instruction.id}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)', mb: 0.5 }}>
                Client ID
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {instruction.clientId || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)', mb: 0.5 }}>
                Type
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {instruction.instructionType || 'trade'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)', mb: 0.5 }}>
                ISIN
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: '"Space Grotesk", sans-serif', mb: 2 }}>
                {instruction.isin || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)', mb: 0.5 }}>
                Quantity
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: '"Space Grotesk", sans-serif', mb: 2 }}>
                {instruction.quantity?.toLocaleString() || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)', mb: 0.5 }}>
                Price
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: '"Space Grotesk", sans-serif', mb: 2 }}>
                {instruction.price ? `NGN ${instruction.price.toLocaleString()}` : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)', mb: 0.5 }}>
                Created
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {instruction.createdAt
                  ? new Date(instruction.createdAt).toLocaleString()
                  : '-'}
              </Typography>
            </Grid>
          </Grid>

          {(canApprove || canReject || canComplete) && (
            <Box display="flex" gap={2} mt={4}>
              {canApprove && (
                <Button
                  variant="contained"
                  startIcon={<ApproveIcon size={18} />}
                  onClick={() => setApproveDialog(true)}
                  sx={{
                    background: 'hsl(142, 52%, 45%)',
                    '&:hover': {
                      background: 'hsl(142, 52%, 40%)',
                    },
                  }}
                >
                  Approve
                </Button>
              )}
              {canReject && (
                <Button
                  variant="contained"
                  startIcon={<RejectIcon size={18} />}
                  onClick={() => setRejectDialog(true)}
                  sx={{
                    background: 'hsl(0, 65%, 55%)',
                    '&:hover': {
                      background: 'hsl(0, 65%, 50%)',
                    },
                  }}
                >
                  Reject
                </Button>
              )}
              {canComplete && (
                <Button
                  variant="outlined"
                  onClick={handleComplete}
                >
                  Mark Completed
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialog} onClose={() => setApproveDialog(false)}>
        <DialogTitle>Approve Instruction</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Approval Comment"
            value={approvalComment}
            onChange={(e) => setApprovalComment(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(false)}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained" sx={{ background: 'hsl(142, 52%, 45%)' }}>
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)}>
        <DialogTitle>Reject Instruction</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleReject} 
            variant="contained" 
            disabled={!rejectionReason}
            sx={{ background: 'hsl(0, 65%, 55%)' }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

