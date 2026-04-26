import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Button,
  Container,
  Fade,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  generateRoundQueue,
  generateQuestion,
  updateUserAfterAnswer,
} from '../../models/questions'
import { onboardUser } from '../../models/auth'
import type { QuestionResult, QuestionType } from '../../models/questions'
import type { User } from '../../models/auth'

// ─── Constantes ───────────────────────────────────────────────────────────────

const QUIZ_SIZE = 8
const PLACEMENT_MULTIPLIER = 5

const OP_LABEL: Record<string, string> = {
  '+': '+', '-': '−', '*': '×', '/': '÷', ask_number: '🔢',
}

const AGE_EMOJI: Record<number, string> = {
  5: '🐣', 6: '🐥', 7: '🦊', 8: '🐶', 9: '🦁',
  10: '🚀', 11: '⭐', 12: '🎯', 13: '🔥', 14: '💫', 15: '🦅',
}

const CORRECT_MSGS = [
  'Incrível! 🌟', 'Muito bem! 🎉', 'Mandou bem! 🚀',
  'Que ótimo! ⭐', 'Arrasou! 🎊', 'Show de bola! 🏆',
]
const WRONG_MSGS = [
  'Quase lá! 💪', 'Não desiste! 🌈',
  'Continue assim! 🎯', 'Boa tentativa! 😊',
]

type Step = 'age' | 'quiz' | 'done'
type Phase = 'question' | 'feedback'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeLocalUser(user: User, age: number): User {
  return { ...user, rating: 150, level: 1, age }
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function playAnswerSound(isCorrect: boolean) {
  try {
    const audio = new Audio(isCorrect ? '/audio/correct.mp3' : '/audio/wrong.mp3')
    audio.play().catch(() => { /* ignore */ })
  } catch { /* ignore */ }
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { user, patchUser } = useAuth()
  const navigate = useNavigate()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const needsAge = !user || user.age === 0

  // Usuário local com rating base (150) para o placement quiz
  const [localUser, setLocalUser] = useState<User>(() =>
    makeLocalUser(user!, needsAge ? 7 : user!.age),
  )

  const [step, setStep] = useState<Step>(needsAge ? 'age' : 'quiz')
  const [selectedAge, setSelectedAge] = useState(7)

  // Estado do quiz
  const [quizIndex, setQuizIndex] = useState(0)
  const [question, setQuestion] = useState<QuestionResult | null>(null)
  const [phase, setPhase] = useState<Phase>('question')
  const [selected, setSelected] = useState<number | null>(null)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')

  // Inicializa o quiz quando não há etapa de idade
  useEffect(() => {
    if (step !== 'quiz') return
    const queue = generateRoundQueue(localUser)
    setQuestion(generateQuestion(localUser, queue[0]))
    setQuizIndex(0)
    setPhase('question')
    setSelected(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // ── Etapa de idade ────────────────────────────────────────────────────────

  function startQuiz() {
    const lu = makeLocalUser(user!, selectedAge)
    setLocalUser(lu)
    // O useEffect acima inicializará o quiz quando step mudar para 'quiz'
    setStep('quiz')
  }

  // ── Etapa de quiz ─────────────────────────────────────────────────────────

  function handleAnswer(opt: number) {
    if (!question || phase === 'feedback') return

    const isCorrect = opt === question.answer
    playAnswerSound(isCorrect)

    const newStats = updateUserAfterAnswer(localUser, question.questionRating, isCorrect, PLACEMENT_MULTIPLIER)
    const updated: User = { ...localUser, ...newStats }

    setSelected(opt)
    setWasCorrect(isCorrect)
    setFeedbackMsg(isCorrect ? randomFrom(CORRECT_MSGS) : randomFrom(WRONG_MSGS))
    setPhase('feedback')
    setLocalUser(updated)

    timerRef.current = setTimeout(() => {
      const nextIndex = quizIndex + 1
      if (nextIndex >= QUIZ_SIZE) {
        setStep('done')
      } else {
        // Regenera a pool com o rating atualizado — acertos desbloqueiam tipos mais difíceis
        const nextQueue = generateRoundQueue(updated)
        setQuizIndex(nextIndex)
        setQuestion(generateQuestion(updated, nextQueue[0]))
        setPhase('question')
        setSelected(null)
      }
    }, 1600)
  }

  function playAudio() {
    if (!question?.audio) return
    try { new Audio(question.audio).play().catch(() => {}) } catch { /* ignore */ }
  }

  // ── Etapa de conclusão ────────────────────────────────────────────────────

  function handleGoToMain() {
    const finalUser: User = {
      ...user!,
      age: localUser.age,
      rating: localUser.rating,
      level: localUser.level,
      onboarded: true,
    }
    patchUser(finalUser)
    onboardUser(finalUser).catch(() => { /* best-effort */ })
    navigate('/main')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const bgStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #E3F2FD 0%, #E0F7FA 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    px: 2,
  }

  // ── Tela: Escolha de idade ────────────────────────────────────────────────

  if (step === 'age') {
    return (
      <Box sx={bgStyle}>
        <Container maxWidth="sm">
          <Paper
            sx={{
              borderRadius: 5,
              p: { xs: 3, sm: 4 },
              boxShadow: '0 8px 40px rgba(13,27,42,0.10)',
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
              Quantos anos você tem? 🎂
            </Typography>
            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
                fontFamily: '"Nunito", sans-serif',
                mb: 3,
              }}
            >
              Isso nos ajuda a criar os desafios certos para você!
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 1.5,
                mb: 3,
              }}
            >
              {Array.from({ length: 11 }, (_, i) => i + 5).map((age) => (
                <Button
                  key={age}
                  variant={selectedAge === age ? 'contained' : 'outlined'}
                  onClick={() => setSelectedAge(age)}
                  sx={{
                    flexDirection: 'column',
                    gap: 0.25,
                    py: 1.5,
                    borderRadius: 3,
                    fontFamily: '"Fredoka", sans-serif',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    transition: 'all 0.15s ease',
                    ...(selectedAge === age && {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      transform: 'scale(1.06)',
                    }),
                  }}
                >
                  <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>
                    {AGE_EMOJI[age] ?? '😊'}
                  </span>
                  {age}
                </Button>
              ))}
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={startQuiz}
              sx={{
                borderRadius: 3,
                fontFamily: '"Fredoka", sans-serif',
                fontSize: '1.2rem',
                py: 1.5,
              }}
            >
              Pronto! Vamos lá! 🚀
            </Button>
          </Paper>
        </Container>
      </Box>
    )
  }

  // ── Tela: Quiz concluído ──────────────────────────────────────────────────

  if (step === 'done') {
    return (
      <Box sx={bgStyle}>
        <Container maxWidth="sm">
          <Paper
            sx={{
              borderRadius: 5,
              p: { xs: 3, sm: 5 },
              boxShadow: '0 8px 40px rgba(13,27,42,0.10)',
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontSize: '4rem', mb: 1 }}>🎉</Typography>
            <Typography
              variant="h4"
              sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 700, mb: 1 }}
            >
              Nível identificado!
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: 'text.secondary', fontFamily: '"Nunito", sans-serif', mb: 0.5 }}
            >
              Seu rating inicial é
            </Typography>
            <Typography
              variant="h3"
              color="primary"
              sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 700, mb: 3 }}
            >
              {localUser.rating} ⭐
            </Typography>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleGoToMain}
              sx={{
                borderRadius: 3,
                fontFamily: '"Fredoka", sans-serif',
                fontSize: '1.2rem',
                py: 1.5,
              }}
            >
              Começar a jogar! 🚀
            </Button>
          </Paper>
        </Container>
      </Box>
    )
  }

  // ── Tela: Quiz ────────────────────────────────────────────────────────────

  if (!question) return null

  const progress = (quizIndex / QUIZ_SIZE) * 100
  const isAskNumber = question.type === 'ask_number'

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #E3F2FD 0%, #E0F7FA 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Barra de progresso ───────────────────────────────────────────── */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Container maxWidth="sm" disableGutters>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
            <Typography
              sx={{
                fontFamily: '"Fredoka", sans-serif',
                fontWeight: 700,
                color: 'primary.main',
                fontSize: '1rem',
                whiteSpace: 'nowrap',
              }}
            >
              {quizIndex + 1} / {QUIZ_SIZE}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                flex: 1,
                height: 14,
                borderRadius: 7,
                bgcolor: 'rgba(0,0,0,0.08)',
                '& .MuiLinearProgress-bar': { borderRadius: 7 },
              }}
            />
          </Box>
          <Typography
            variant="caption"
            sx={{
              fontFamily: '"Nunito", sans-serif',
              color: 'text.secondary',
              display: 'block',
            }}
          >
            Agora vamos responder algumas questões para identificar o seu nível ✨
          </Typography>
        </Container>
      </Box>

      {/* ── Conteúdo da questão ───────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          pt: 1,
        }}
      >
        <Container maxWidth="sm" disableGutters>
          <Stack spacing={2}>
            {/* Cartão da questão */}
            <Paper
              elevation={3}
              sx={{
                borderRadius: 4,
                p: { xs: 3, sm: 5 },
                textAlign: 'center',
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              }}
            >
              {isAskNumber ? (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<VolumeUpRoundedIcon />}
                  onClick={playAudio}
                  sx={{
                    fontFamily: '"Fredoka", sans-serif',
                    fontSize: '1.2rem',
                    borderRadius: 3,
                  }}
                >
                  Ouvir número
                </Button>
              ) : (
                <Typography
                  variant="h3"
                  fontFamily='"Fredoka", sans-serif'
                  fontWeight={700}
                  color="primary.dark"
                >
                  {question.a} {OP_LABEL[question.type]} {question.b} = ?
                </Typography>
              )}
            </Paper>

            {/* Alternativas 2×2 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              {question.options.map((opt) => {
                let color: 'primary' | 'success' | 'error' = 'primary'
                let opacity = 1
                if (phase === 'feedback') {
                  if (opt === question.answer) color = 'success'
                  else if (opt === selected) color = 'error'
                  else opacity = 0.35
                }
                return (
                  <Button
                    key={opt}
                    variant={phase === 'feedback' ? 'contained' : 'outlined'}
                    color={color}
                    disabled={phase === 'feedback' && opt !== question.answer && opt !== selected}
                    onClick={() => handleAnswer(opt)}
                    sx={{
                      fontFamily: '"Fredoka", sans-serif',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      py: 2,
                      borderRadius: 3,
                      opacity,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {opt}
                  </Button>
                )
              })}
            </Box>

            {/* Feedback */}
            <Fade in={phase === 'feedback'}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  p: 2,
                  textAlign: 'center',
                  bgcolor: wasCorrect ? 'success.main' : 'error.main',
                  color: 'white',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  {wasCorrect ? <CheckCircleRoundedIcon /> : <CancelRoundedIcon />}
                  <Typography
                    fontFamily='"Fredoka", sans-serif'
                    fontWeight={700}
                    fontSize="1.2rem"
                  >
                    {feedbackMsg}
                  </Typography>
                </Box>
              </Paper>
            </Fade>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
