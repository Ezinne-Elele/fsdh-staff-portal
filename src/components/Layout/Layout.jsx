import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  LayoutDashboard as DashboardIcon,
  ArrowLeftRight as TradeIcon,
  ClipboardList as InstructionsIcon,
  RefreshCw as ReconciliationIcon,
  AlertTriangle as ExceptionsIcon,
  Users as UsersIcon,
  Briefcase as CorporateIcon,
  FileText as ReportsIcon,
  ShieldCheck as ComplianceIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  LogOut as LogoutIcon,
  UserCircle as AccountIcon,
  Bell as NotificationsIcon,
  PiggyBank as IncomeIcon,
  CreditCard as BillingIcon,
  CheckCircle2 as AuthorizationIcon,
  FileCheck as SettlementIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['admin', 'maker', 'checker', 'viewer'] },
  { text: 'Trade Operations', icon: <TradeIcon />, path: '/trades', roles: ['admin', 'maker', 'checker', 'viewer'] },
  { text: 'Instrument Coverage', icon: <CorporateIcon />, path: '/instruments', roles: ['admin', 'maker', 'checker', 'viewer'] },
  { text: 'Client Instructions', icon: <InstructionsIcon />, path: '/instructions', roles: ['admin', 'maker', 'checker', 'viewer'] },
  { text: 'Settlement Instructions', icon: <SettlementIcon />, path: '/settlement-authorization', roles: ['admin', 'maker', 'checker', 'viewer'] },
  { text: 'Corporate Actions', icon: <CorporateIcon />, path: '/corporate-actions', roles: ['admin', 'maker', 'checker', 'viewer'] },
  { text: 'Income & Tax', icon: <IncomeIcon />, path: '/income-tax', roles: ['admin', 'checker'] },
  { text: 'Clients', icon: <UsersIcon />, path: '/clients', roles: ['admin', 'maker', 'viewer'] },
  { text: 'Billing & Invoicing', icon: <BillingIcon />, path: '/billing', roles: ['admin', 'maker', 'checker'] },
  { text: 'Reconciliations', icon: <ReconciliationIcon />, path: '/reconciliations', roles: ['admin', 'maker', 'checker', 'viewer'] },
  { text: 'Exceptions', icon: <ExceptionsIcon />, path: '/exceptions', roles: ['admin', 'maker', 'checker', 'viewer'] },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports', roles: ['admin', 'checker', 'viewer'] },
  { text: 'Compliance', icon: <ComplianceIcon />, path: '/compliance', roles: ['admin', 'checker'] },
  { text: 'Authorization Queue', icon: <AuthorizationIcon />, path: '/authorization-queue', roles: ['admin', 'checker'] },
  { text: 'Users', icon: <UsersIcon />, path: '/users', roles: ['admin'] },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings', roles: ['admin'] },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter menu items based on user role and permissions
  const filteredMenuItems = menuItems.filter(item => {
    const userRole = user?.role || 'viewer';
    const userPermissions = user?.permissions || [];
    
    // Check role-based access
    if (item.roles.includes(userRole)) {
      return true;
    }
    
    // Check permission-based access for Authorization Queue
    if (item.path === '/authorization-queue' && userPermissions.includes('approve_instructions')) {
      return true;
    }
    
    return false;
  });

  const drawer = (
    <>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 2,
        }}
      >
        <Typography 
          variant="h6" 
          noWrap 
          component="div"
          sx={{ 
            fontFamily: '"Space Grotesk", sans-serif',
            color: 'hsl(222, 47%, 11%)',
            fontWeight: 700,
            fontSize: '1.25rem',
            letterSpacing: '-0.01em',
          }}
        >
          FSDH Staff
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'hsl(214, 32%, 91%)', mx: 2 }} />
      <List sx={{ px: 1, py: 1 }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                color: location.pathname === item.path 
                  ? 'hsl(221, 83%, 53%)' 
                  : 'hsl(222, 20%, 40%)',
                '& .MuiListItemIcon-root': {
                  color: location.pathname === item.path 
                    ? 'hsl(221, 83%, 53%)' 
                    : 'hsl(222, 20%, 40%)',
                },
                '& .MuiListItemText-primary': {
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  fontSize: '0.875rem',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              color: 'hsl(222, 47%, 11%)',
            }}
          >
            <MenuIcon size={24} />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontFamily: '"Space Grotesk", sans-serif',
              color: 'hsl(222, 47%, 11%)',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Staff Portal
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => navigate('/notifications')}
            sx={{ 
              mr: 2,
              color: 'hsl(222, 47%, 11%)',
            }}
          >
            <Badge 
              badgeContent={0} 
              sx={{
                '& .MuiBadge-badge': {
                  background: 'hsl(0, 65%, 55%)',
                  color: '#ffffff',
                  fontSize: '0.625rem',
                },
              }}
            >
              <NotificationsIcon size={20} />
            </Badge>
          </IconButton>
          <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'hsl(221, 83%, 53%)',
                border: '1px solid hsl(214, 32%, 91%)',
                fontWeight: 600,
                color: '#ffffff',
                width: 32,
                height: 32,
                fontSize: '0.875rem',
              }}
            >
              {user?.firstName?.[0] || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                background: '#ffffff',
                border: '1px solid hsl(214, 32%, 91%)',
                mt: 1,
                boxShadow: 'none',
              },
            }}
          >
            <MenuItem 
              onClick={() => { navigate('/account'); handleMenuClose(); }}
              sx={{ color: 'hsl(222, 47%, 11%)', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}
            >
              <AccountIcon size={16} style={{ marginRight: 8 }} /> Account
            </MenuItem>
            <MenuItem 
              onClick={handleLogout}
              sx={{ color: 'hsl(222, 47%, 11%)', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}
            >
              <LogoutIcon size={16} style={{ marginRight: 8 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              background: '#ffffff',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              background: '#ffffff',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

