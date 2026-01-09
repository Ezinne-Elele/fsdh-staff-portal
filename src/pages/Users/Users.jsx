import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import UserManagement from './UserManagement';
import ViewUsers from './ViewUsers';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Users() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography 
        variant="h4"
        sx={{
          fontFamily: '"Space Grotesk", sans-serif',
          color: 'hsl(222, 47%, 11%)',
          fontWeight: 700,
          mb: 3,
        }}
      >
        Users
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="View Users" />
        <Tab label="Manage Users" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <ViewUsers />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <UserManagement />
      </TabPanel>
    </Box>
  );
}

