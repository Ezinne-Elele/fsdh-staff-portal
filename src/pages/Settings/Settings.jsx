import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
} from '@mui/material';

export default function Settings() {
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
        Settings
      </Typography>

      <Card sx={{ background: '#ffffff', border: '1px solid hsl(214, 32%, 91%)' }}>
        <CardContent>
          <Typography>System settings interface coming soon...</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

