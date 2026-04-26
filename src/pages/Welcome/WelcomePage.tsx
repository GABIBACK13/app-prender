import { Box, Button, Container, Typography, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import AppLogo from '../../components/AppLogo/AppLogo'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded'

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background: 'linear-gradient(160deg, #E3F2FD 0%, #E0F7FA 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={4} sx={{ alignItems: 'center', textAlign: 'center' }}>
          {/* Logo + ícone decorativo */}
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(21, 101, 192, 0.35)',
              mb: -1,
            }}
          >
            <AutoStoriesRoundedIcon sx={{ fontSize: 64, color: '#fff' }} />
          </Box>

          <AppLogo size="large" />

          <Typography
            variant="h5"
            sx={{
              fontFamily: '"Fredoka", sans-serif',
              fontWeight: 500,
              color: 'text.secondary',
              lineHeight: 1.4,
            }}
          >
            Aprenda, jogue e ganhe recompensas! 🏆
          </Typography>

          {/* Cartão de boas-vindas */}
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 5,
              p: { xs: 3, sm: 4 },
              width: '100%',
              boxShadow: '0 8px 40px rgba(13, 27, 42, 0.10)',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"Fredoka", sans-serif',
                fontWeight: 700,
                color: 'text.primary',
                mb: 1,
              }}
            >
              Bem-vindo(a)! 👋
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                mb: 3,
                fontFamily: '"Nunito", sans-serif',
              }}
            >
              Você é novo(a) por aqui?
            </Typography>

            <Stack spacing={2}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                startIcon={<SchoolRoundedIcon />}
                onClick={() => navigate('/login')}
                sx={{ py: 1.5 }}
              >
                Sim, quero começar a aprender!
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                fullWidth
                startIcon={<LoginRoundedIcon />}
                onClick={() => navigate('/sign-in')}
                sx={{ py: 1.5 }}
              >
                Não, já tenho uma conta
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
