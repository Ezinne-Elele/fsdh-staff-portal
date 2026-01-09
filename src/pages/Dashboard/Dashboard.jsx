import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  DollarSign,
  PiggyBank,
  Users,
  ClipboardCheck,
  Repeat,
  TrendingUp,
  AlertTriangle,
  CalendarClock,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
// Using mock data - no backend API calls
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  Tooltip,
} from 'recharts';

const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
});

const StatCard = ({ title, value, icon, footer }) => (
  <Card sx={{ border: '1px solid hsl(214, 32%, 91%)', height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {icon}
      </Box>
      <Typography variant="h5" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
        {value}
      </Typography>
      {footer && (
        <Typography variant="caption" color="text.secondary">
          {footer}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setSummary(generateMockDashboardSummary());
      setLoading(false);
    }, 300);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const totals = summary?.totals || {};
  const instructions = summary?.instructions || {};
  const trades = summary?.trades || {};
  const alerts = summary?.alerts || {};
  const settlementSeries = summary?.settlementSeries || [];
  const recentActivity = summary?.recentActivity || [];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: 'hsl(222, 47%, 11%)', mb: 0.5 }}>
        Dashboard
      </Typography>
      <Typography variant="body2" sx={{ color: 'hsl(222, 20%, 40%)', mb: 3 }}>
        Welcome back, {user?.firstName || 'User'}
      </Typography>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={4} lg={4}>
          <StatCard
            title="Total Assets"
            value={currencyFormatter.format(Number(totals.assets || 0))}
            icon={<DollarSign size={18} />}
            footer="Client portfolios under custody"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={4}>
          <StatCard
            title="Cash Balances"
            value={currencyFormatter.format(Number(totals.cash || 0))}
            icon={<PiggyBank size={18} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={4}>
          <StatCard
            title="Active Clients"
            value={(totals.clients || 0).toLocaleString()}
            icon={<Users size={18} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={4}>
          <StatCard
            title="Pending Instructions"
            value={(instructions.pendingApproval || 0).toLocaleString()}
            icon={<ClipboardCheck size={18} />}
            footer={`${instructions.completed || 0} completed`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={4}>
          <StatCard
            title="Pending Settlements"
            value={(trades.pendingSettlements || 0).toLocaleString()}
            icon={<Repeat size={18} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={4}>
          <StatCard
            title="Settlement Rate"
            value={`${trades.settlementRate || 0}%`}
            icon={<TrendingUp size={18} />}
            footer={`Today's volume ${currencyFormatter.format(Number(trades.todaysVolume || 0))}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={4}>
          <StatCard
            title="Open Exceptions"
            value={(alerts.openExceptions || 0).toLocaleString()}
            icon={<AlertTriangle size={18} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={4}>
          <StatCard
            title="Pending Recons"
            value={(alerts.pendingReconciliations || 0).toLocaleString()}
            icon={<Repeat size={18} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={4}>
          <StatCard
            title="Upcoming Corp Actions"
            value={(alerts.upcomingCorporateActions || 0).toLocaleString()}
            icon={<CalendarClock size={18} />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card   sx={{ border: '1px solid hsl(214, 32%, 91%)', height: '100%', width: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, mb: 1 }}>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Latest events across trades, exceptions, and corporate actions
              </Typography>
              <List dense>
                {recentActivity.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No recent activity.
                  </Typography>
                ) : (
                  recentActivity.map((item, idx) => (
                    <ListItem key={`${item.type}-${idx}`} sx={{ borderBottom: '1px solid hsl(214, 32%, 91%)' }}>
                      <ListItemIcon>
                        <Activity size={16} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.title}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {item.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
                            </Typography>
                          </>
                        }
                      />
                      {item.status && (
                        <Chip label={item.status} size="small" sx={{ textTransform: 'capitalize' }} />
                      )}
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function generateMockDashboardSummary() {
  const today = new Date();
  const settlementSeries = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - idx));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.floor(Math.random() * 500000000) + 200000000,
    };
  });

  const recentActivity = [
    {
      type: 'trade',
      title: 'Trade TRD-000123 settled',
      description: 'SWIFT confirmation received for Zenith Pensions',
      timestamp: new Date(Date.now() - 15 * 60000),
      status: 'settled',
    },
    {
      type: 'exception',
      title: 'Exception raised for TRD-000124',
      description: 'Settlement failed - manual review required',
      timestamp: new Date(Date.now() - 45 * 60000),
      status: 'open',
    },
    {
      type: 'corporate_action',
      title: 'New dividend event from NGX',
      description: 'DIVIDEND FOR NG000123456 - Ex-date: 2024-02-15',
      timestamp: new Date(Date.now() - 2 * 3600000),
      status: 'pending',
    },
    {
      type: 'reconciliation',
      title: 'Daily reconciliation completed',
      description: 'All positions matched - no breaks detected',
      timestamp: new Date(Date.now() - 4 * 3600000),
      status: 'completed',
    },
    {
      type: 'instruction',
      title: 'Instruction INS-004567 approved',
      description: 'Client: Unity Insurance - Buy 10,000 units',
      timestamp: new Date(Date.now() - 6 * 3600000),
      status: 'approved',
    },
  ];

  return {
    totals: {
      assets: 8500000000,
      cash: 1200000000,
      clients: 45,
    },
    instructions: {
      pendingApproval: 12,
      completed: 234,
    },
    trades: {
      pendingSettlements: 8,
      settlementRate: 98.5,
      todaysVolume: 1250000000,
    },
    alerts: {
      openExceptions: 3,
      pendingReconciliations: 2,
      upcomingCorporateActions: 5,
    },
    settlementSeries,
    recentActivity,
  };
}


