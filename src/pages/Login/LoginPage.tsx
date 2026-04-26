import { useState } from 'react'
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Alert,
  InputAdornment,
  IconButton,
  Slider,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import AppLogo from '../../components/AppLogo/AppLogo'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import EmojiEmotionsRoundedIcon from '@mui/icons-material/EmojiEmotionsRounded'
import EmailRoundedIcon from '@mui/icons-material/EmailRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import CakeRoundedIcon from '@mui/icons-material/CakeRounded'
import SupervisorAccountRoundedIcon from '@mui/icons-material/SupervisorAccountRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { register } from '../../models/auth'
import GoogleSignInButton from '../../components/GoogleSignInButton/GoogleSignInButton'

const STEPS = ['Seu nome', 'Sua idade', 'Seu apelido', 'Acesso']

export default function LoginPage() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    name: '',
    age: 7,
    nickname: '',
    email: '',
    password: '',
  })

  function handleChange(field: keyof typeof form, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  function validateStep(): boolean {
    switch (activeStep) {
      case 0:
        if (!form.name.trim() || form.name.trim().length < 2) {
          setError('Digite seu nome completo.')
          return false
        }
        break
      case 1:
        if (form.age < 5 || form.age > 15) {
          setError('Selecione uma idade entre 5 e 15 anos.')
          return false
        }
        break
      case 2:
        if (!form.nickname.trim() || form.nickname.trim().length < 2) {
          setError('Escolha um apelido com pelo menos 2 letras.')
          return false
        }
        break
      case 3:
        if (!form.email.includes('@')) {
          setError('Digite um e-mail válido.')
          return false
        }
        if (form.password.length < 6) {
          setError('A senha precisa ter pelo menos 6 caracteres.')
          return false
        }
        break
    }
    return true
  }

  async function handleNext() {
    if (!validateStep()) return
    if (activeStep < STEPS.length - 1) {
      setActiveStep((s) => s + 1)
      return
    }
    // Último step: registrar
    setLoading(true)
    try {
      await register({
        name: form.name.trim(),
        age: form.age,
        nickname: form.nickname.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      navigate('/main')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    if (activeStep === 0) {
      navigate('/')
      return
    }
    setActiveStep((s) => s - 1)
    setError('')
  }

  const ageEmoji = form.age <= 7 ? '🐣' : form.age <= 10 ? '🐥' : form.age <= 12 ? '🦊' : '🦁'

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
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 5,
              p: { xs: 3, sm: 4 },
              width: '100%',
              boxShadow: '0 8px 40px rgba(13, 27, 42, 0.10)',
            }}
          >
            {/* Aviso para adultos */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 3,
                p: 1.5,
                borderRadius: 3,
                bgcolor: 'warning.light',
                opacity: 0.9,
              }}
            >
              <SupervisorAccountRoundedIcon sx={{ color: 'warning.dark', fontSize: 22 }} />
              <Typography
                variant="caption"
                sx={{
                  color: 'warning.dark',
                  fontFamily: '"Nunito", sans-serif',
                  fontWeight: 700,
                }}
              >
                Peça ajuda a um adulto se precisar! 😊
              </Typography>
            </Box>

            <GoogleSignInButton label="Criar conta com Google" />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: '"Nunito", sans-serif', whiteSpace: 'nowrap' }}>ou preencha os dados</Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            </Box>

            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Conteúdo de cada step */}
            <Stack spacing={3}>
              {activeStep === 0 && (
                <>
                  <Typography
                    variant="h5"
                    sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 700, textAlign: 'center' }}
                  >
                    Qual é o seu nome? 😊
                  </Typography>
                  <TextField
                    label="Nome completo"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    fullWidth
                    autoFocus
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonRoundedIcon color="primary" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </>
              )}

              {activeStep === 1 && (
                <>
                  <Typography
                    variant="h5"
                    sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 700, textAlign: 'center' }}
                  >
                    Quantos anos você tem? {ageEmoji}
                  </Typography>
                  <Box sx={{ px: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <CakeRoundedIcon color="secondary" />
                      <Typography
                        variant="h4"
                        sx={{
                          fontFamily: '"Fredoka", sans-serif',
                          fontWeight: 700,
                          color: 'primary.main',
                        }}
                      >
                        {form.age} anos
                      </Typography>
                    </Box>
                    <Slider
                      value={form.age}
                      min={5}
                      max={15}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      onChange={(_, val) => handleChange('age', val as number)}
                      color="primary"
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">5</Typography>
                      <Typography variant="caption" color="text.secondary">15</Typography>
                    </Box>
                  </Box>
                </>
              )}

              {activeStep === 2 && (
                <>
                  <Typography
                    variant="h5"
                    sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 700, textAlign: 'center' }}
                  >
                    Como quer ser chamado(a)? 🌟
                  </Typography>
                  <TextField
                    label="Apelido"
                    value={form.nickname}
                    onChange={(e) => handleChange('nickname', e.target.value)}
                    fullWidth
                    autoFocus
                    helperText="Esse é o nome que aparecerá no app!"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmojiEmotionsRoundedIcon color="secondary" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </>
              )}

              {activeStep === 3 && (
                <>
                  <Typography
                    variant="h5"
                    sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 700, textAlign: 'center' }}
                  >
                    Como você quer entrar? 🔑
                  </Typography>
                  <TextField
                    label="E-mail"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    fullWidth
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
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
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
                </>
              )}

              {error && (
                <Alert severity="error" sx={{ borderRadius: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Botões de navegação */}
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleBack}
                  startIcon={<ArrowBackRoundedIcon />}
                  sx={{ flex: 1 }}
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  loading={loading}
                  sx={{ flex: 2 }}
                >
                  {activeStep === STEPS.length - 1 ? 'Criar conta! 🚀' : 'Próximo →'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
