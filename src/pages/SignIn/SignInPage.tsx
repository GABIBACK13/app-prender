import { useState } from 'react'
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  TextField,
  Alert,
  InputAdornment,
  IconButton,
  Link,
  Snackbar,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import AppLogo from '../../components/AppLogo/AppLogo'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import { signIn, forgotPassword } from '../../models/auth'
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton'

export default function SignInPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotSnack, setForgotSnack] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.includes('@')) {
      setError('Digite um e-mail válido.')
      return
    }
    if (!password) {
      setError('Digite sua senha.')
      return
    }

    setLoading(true)
    try {
      await signIn(email.trim(), password)
      navigate('/main')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!email.includes('@')) {
      setError('Digite seu e-mail acima primeiro.')
      return
    }
    await forgotPassword(email.trim())
    setForgotSnack(true)
  }

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
        <Stack spacing={3} sx={{ alignItems: 'center' }}>
          <AppLogo size="medium" />

          <Box
            component="form"
            onSubmit={handleSubmit}
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
                textAlign: 'center',
                mb: 0.5,
              }}
            >
              Bem-vindo(a) de volta! 🎉
            </Typography>
            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
                mb: 3,
                fontFamily: '"Nunito", sans-serif',
              }}
            >
              Peça ajuda a um adulto se precisar 😊
            </Typography>

            <Stack spacing={2.5}>
              <TextField
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                fullWidth
                autoFocus
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon color="primary" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((s) => !s)}
                          edge="end"
                          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {error && (
                <Alert severity="error" sx={{ borderRadius: 3 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                loading={loading}
                startIcon={<LoginRoundedIcon />}
                sx={{ py: 1.5 }}
              >
                Entrar!
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  underline="hover"
                  onClick={handleForgotPassword}
                  sx={{
                    fontFamily: '"Nunito", sans-serif',
                    fontWeight: 600,
                    color: 'secondary.main',
                    cursor: 'pointer',
                  }}
                >
                  Esqueci minha senha
                </Link>
              </Box>

              <Button
                variant="text"
                color="inherit"
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate('/')}
                sx={{ color: 'text.secondary' }}
              >
                Voltar
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Nunito", sans-serif', whiteSpace: 'nowrap' }}>ou entre com</Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
              </Box>

              <GoogleSignInButton />
            </Stack>
          </Box>
        </Stack>
      </Container>

      <Snackbar
        open={forgotSnack}
        autoHideDuration={4000}
        onClose={() => setForgotSnack(false)}
        message="E-mail de recuperação enviado! Verifique sua caixa de entrada 📧"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
