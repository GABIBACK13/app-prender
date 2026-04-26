import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import Header from '../Header/Header'
import Navigation from '../Navigation/Navigation'

export default function MainLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* AppBar visível apenas em desktop */}
      <Header />

      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flex: 1,
          pt: { xs: 2, md: 10 },
          pb: { xs: 10, md: 4 },
          px: { xs: 2, sm: 3, md: 4 },
          maxWidth: 1200,
          width: '100%',
          mx: 'auto',
        }}
      >
        <Outlet />
      </Box>

      {/* BottomNavigation visível apenas em mobile */}
      <Navigation />
    </Box>
  )
}
