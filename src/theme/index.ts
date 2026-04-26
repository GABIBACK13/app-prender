import { createTheme, responsiveFontSizes } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Theme {
    appMedia: {
      mobile: string
      tablet: string
      desktop: string
    }
  }
  interface ThemeOptions {
    appMedia?: {
      mobile?: string
      tablet?: string
      desktop?: string
    }
  }
}

const BASE_THEME = createTheme({
  palette: {
    primary: {
      main: '#1565C0',
      light: '#5E92F3',
      dark: '#003c8f',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00ACC1',
      light: '#5DDEF4',
      dark: '#007C91',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#E3F2FD',
      paper: '#FFFFFF',
    },
    success: {
      main: '#43A047',
    },
    error: {
      main: '#E53935',
    },
    warning: {
      main: '#FFC107',
    },
    text: {
      primary: '#0D1B2A',
      secondary: '#37474F',
    },
  },

  typography: {
    fontFamily: '"Nunito", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Fredoka", "Nunito", sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Fredoka", "Nunito", sans-serif',
      fontWeight: 600,
    },
    h3: {
      fontFamily: '"Fredoka", "Nunito", sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Fredoka", "Nunito", sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Fredoka", "Nunito", sans-serif',
      fontWeight: 500,
    },
    h6: {
      fontFamily: '"Fredoka", "Nunito", sans-serif',
      fontWeight: 500,
    },
    button: {
      fontFamily: '"Fredoka", "Nunito", sans-serif',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: 0.5,
    },
  },

  shape: {
    borderRadius: 16,
  },

  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 28,
          paddingRight: 28,
          fontSize: '1.05rem',
          boxShadow: '0 4px 14px rgba(21, 101, 192, 0.25)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(21, 101, 192, 0.35)',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 24px rgba(13, 27, 42, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 50,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          fontFamily: '"Fredoka", "Nunito", sans-serif',
          fontWeight: 600,
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 -4px 20px rgba(13, 27, 42, 0.1)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          fontFamily: '"Fredoka", "Nunito", sans-serif',
          fontWeight: 600,
          fontSize: '0.75rem',
          minWidth: 60,
          '&.Mui-selected': {
            color: '#1565C0',
          },
        },
        label: {
          fontFamily: '"Fredoka", "Nunito", sans-serif',
          fontWeight: 600,
          fontSize: '0.72rem',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: '0 24px 24px 0',
          width: 260,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(13, 27, 42, 0.1)',
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontFamily: '"Fredoka", "Nunito", sans-serif',
          fontWeight: 600,
        },
      },
    },
  },

  appMedia: {
    mobile: '@media (max-width: 599px)',
    tablet: '@media (min-width: 600px) and (max-width: 899px)',
    desktop: '@media (min-width: 900px)',
  },
})

export const theme = responsiveFontSizes(BASE_THEME)
