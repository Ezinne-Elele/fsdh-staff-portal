import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: 'hsl(221, 83%, 53%)', // Royal Blue
      light: 'hsl(221, 83%, 63%)',
      dark: 'hsl(221, 83%, 43%)',
    },
    secondary: {
      main: 'hsl(221, 83%, 53%)',
      light: 'hsl(221, 83%, 63%)',
      dark: 'hsl(221, 83%, 43%)',
    },
    success: {
      main: 'hsl(142, 52%, 45%)', // Muted Emerald Green
      light: 'hsl(142, 52%, 55%)',
      dark: 'hsl(142, 52%, 35%)',
    },
    warning: {
      main: 'hsl(38, 92%, 50%)', // Warm Amber
      light: 'hsl(38, 92%, 60%)',
      dark: 'hsl(38, 92%, 40%)',
    },
    error: {
      main: 'hsl(0, 65%, 55%)', // Desaturated Red
      light: 'hsl(0, 65%, 65%)',
      dark: 'hsl(0, 65%, 45%)',
    },
    background: {
      default: 'hsl(210, 40%, 98%)', // Very pale cool grey-blue
      paper: '#ffffff',
    },
    text: {
      primary: 'hsl(222, 47%, 11%)', // Deep Navy
      secondary: 'hsl(222, 20%, 40%)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", "Inter", sans-serif',
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: 'hsl(222, 47%, 11%)',
    },
    h2: {
      fontFamily: '"Space Grotesk", "Inter", sans-serif',
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      color: 'hsl(222, 47%, 11%)',
    },
    h3: {
      fontFamily: '"Space Grotesk", "Inter", sans-serif',
      fontSize: '1.75rem',
      fontWeight: 600,
      color: 'hsl(222, 47%, 11%)',
    },
    h4: {
      fontFamily: '"Space Grotesk", "Inter", sans-serif',
      fontSize: '1.5rem',
      fontWeight: 600,
      color: 'hsl(222, 47%, 11%)',
    },
    h5: {
      fontFamily: '"Space Grotesk", "Inter", sans-serif',
      fontSize: '1.25rem',
      fontWeight: 600,
      color: 'hsl(222, 47%, 11%)',
    },
    h6: {
      fontFamily: '"Space Grotesk", "Inter", sans-serif',
      fontSize: '1rem',
      fontWeight: 600,
      color: 'hsl(222, 47%, 11%)',
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.5,
      color: 'hsl(222, 47%, 11%)',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.4,
      color: 'hsl(222, 20%, 40%)',
    },
    button: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'hsl(210, 40%, 98%)',
          minHeight: '100vh',
          color: 'hsl(222, 47%, 11%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#ffffff',
          border: '1px solid hsl(214, 32%, 91%)',
          boxShadow: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: '#ffffff',
          border: '1px solid hsl(214, 32%, 91%)',
        },
        elevation1: {
          boxShadow: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#ffffff',
          border: 'none',
          borderBottom: '1px solid hsl(214, 32%, 91%)',
          boxShadow: 'none',
          color: 'hsl(222, 47%, 11%)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#ffffff',
          border: 'none',
          borderRight: '1px solid hsl(214, 32%, 91%)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          padding: '8px 16px',
          fontWeight: 600,
          fontSize: '0.875rem',
          '&.MuiButton-contained': {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            padding: '8px 16px',
            fontSize: '0.875rem',
            borderColor: 'hsl(214, 32%, 91%)',
          },
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'hsl(222, 20%, 40%)',
            backgroundColor: 'hsl(210, 40%, 98%)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: '#ffffff',
            borderRadius: 6,
            '& fieldset': {
              borderColor: 'hsl(214, 32%, 91%)',
            },
            '&:hover fieldset': {
              borderColor: 'hsl(221, 83%, 53%)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'hsl(221, 83%, 53%)',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'hsl(222, 20%, 40%)',
          },
          '& .MuiInputBase-input': {
            color: 'hsl(222, 47%, 11%)',
            fontFamily: '"Inter", sans-serif',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          background: 'hsla(221, 83%, 53%, 0.1)',
          border: 'none',
          color: 'hsl(221, 83%, 53%)',
          fontWeight: 500,
          fontSize: '0.75rem',
          height: 24,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '2px 8px',
          padding: '8px 12px',
          '&.Mui-selected': {
            background: 'hsla(221, 83%, 53%, 0.1)',
            color: 'hsl(221, 83%, 53%)',
            '&:hover': {
              background: 'hsla(221, 83%, 53%, 0.15)',
            },
          },
          '&:hover': {
            background: 'hsla(221, 83%, 53%, 0.05)',
          },
        },
      },
    },
  },
});

