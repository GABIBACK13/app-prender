import { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Fade,
  LinearProgress,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
  Zoom,
  Snackbar,
  Alert,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";
import ShieldIcon from "@mui/icons-material/Shield";
import { useAuth } from "../../contexts/AuthContext";
import { generateQuestion, generateRoundQueue, updateUserAfterAnswer } from "../../models/questions";
import { syncFirestore } from "../../lib/syncManager";
import { updateStreak, saveStreak, applyMilestoneReward, todayISO } from "../../models/streak";
import { saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from "../../lib/localStorage";
import type { QuestionResult, QuestionType } from "../../models/questions";
import type { User } from "../../models/auth";
import type { DailyProgress, AnswerRecord } from "../../types/localStorage";

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIMER_START_DELAY = 3500; // 3.5s parados
const TIMER_DECAY_RATE = 0.2; // 20% por segundo
const TIMER_INTERVAL = 100; // atualiza a cada 100ms
const CONSECUTIVE_ERROR_THRESHOLD = 5;
const CONSECUTIVE_ERROR_PENALTY = 200;

// ─── Helpers de exibição ──────────────────────────────────────────────────────

const OP_LABEL: Record<string, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
  ask_number: "🔢",
};

const TYPE_LABEL: Record<string, string> = {
  ask_number: "número falado",
  "+": "adição (+)",
  "-": "subtração (−)",
  "*": "multiplicação (×)",
  "/": "divisão (÷)",
};

const TYPE_RATING_RAW: Record<string, number> = {
  ask_number: 1000,
  "+": 1700,
  "-": 2000,
  "*": 3000,
  "/": 4000,
};
const MAX_RATING_RAW: Record<string, number> = {
  "5": 300,
  "10": 600,
  "50": 3000,
  "500": 8000,
};
const MODIFIER_RATING_RAW: Record<string, number> = {
  normal: 0,
  negative: 1250,
};

function queueToTotal(queue: QuestionType[]): Partial<Record<QuestionType, number>> {
  const counts: Partial<Record<QuestionType, number>> = {};
  for (const t of queue) counts[t] = (counts[t] ?? 0) + 1;
  return counts;
}

type Phase = "question" | "feedback";

// ─── Helpers de dificuldade e streak ─────────────────────────────────────────

function getDifficultyLabel(diff: number): { label: string; color: string } {
  if (diff < -50) return { label: "Muito Fácil", color: "#4CAF50" };
  if (diff < 0) return { label: "Fácil", color: "#8BC34A" };
  if (diff < 50) return { label: "Normal", color: "#FFC107" };
  if (diff < 100) return { label: "Difícil", color: "#FF9800" };
  return { label: "Muito Difícil", color: "#F44336" };
}

function getStreakMessage(streak: number): string {
  if (streak >= 20) return "LENDÁRIO! 🔥🔥🔥";
  if (streak >= 10) return "INCRÍVEL! 🌟🌟";
  if (streak >= 5) return "EXCELENTE! ⭐";
  return "";
}

function playStreakSound(streak: number) {
  if (streak === 5) {
    try {
      new Audio("/audio/streak-5.mp3").play().catch(() => {});
    } catch {
      /* ignore */
    }
  } else if (streak === 10) {
    try {
      new Audio("/audio/streak-10.mp3").play().catch(() => {});
    } catch {
      /* ignore */
    }
  } else if (streak === 20) {
    try {
      new Audio("/audio/streak-20.mp3").play().catch(() => {});
    } catch {
      /* ignore */
    }
  }
}

function playAnswerSound(isCorrect: boolean) {
  try {
    const audio = new Audio(isCorrect ? "/audio/correct.mp3" : "/audio/wrong.mp3");
    audio.play().catch(() => {
      /* ignore */
    });
  } catch {
    /* ignore */
  }
}

// ─── Debug card ───────────────────────────────────────────────────────────────

function DebugRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
      <Typography variant="caption" sx={{ color: "text.disabled", fontFamily: "monospace" }} noWrap>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 600, textAlign: "right" }}>
        {value}
      </Typography>
    </Box>
  );
}

function DebugSection({ title }: { title: string }) {
  return (
    <Typography
      variant="caption"
      sx={{
        fontFamily: "monospace",
        color: "text.secondary",
        display: "block",
        fontWeight: 700,
        mt: 0.5,
        mb: 0.25,
      }}
    >
      {title}
    </Typography>
  );
}

function DebugCard({
  localUser,
  question,
  previewGain,
  previewLoss,
  previewPointsGain,
  roundQueue,
  roundTotal,
  roundNumber,
}: {
  localUser: User;
  question: QuestionResult;
  previewGain: number;
  previewLoss: number;
  previewPointsGain: number;
  roundQueue: QuestionType[];
  roundTotal: Partial<Record<QuestionType, number>>;
  roundNumber: number;
}) {
  const { type, maxStr, modifier, questionRating, meta } = question;
  const typeRating = TYPE_RATING_RAW[type] ?? 0;
  const maxRating = MAX_RATING_RAW[maxStr] ?? 0;
  const modRating = MODIFIER_RATING_RAW[modifier] ?? 0;
  const recomputed = Math.round((typeRating + maxRating + modRating) / localUser.age);
  const diff = questionRating - localUser.rating;
  const stale = recomputed !== questionRating;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5, bgcolor: "grey.50" }}>
      <DebugSection title="Usuário" />
      <DebugRow label="rating" value={localUser.rating} />
      <DebugRow label="level" value={localUser.level.toFixed(2)} />
      <DebugRow label="pontos" value={localUser.points} />
      <DebugRow label="idade" value={`${localUser.age} anos`} />

      <Divider sx={{ my: 1 }} />

      <DebugSection title="Geração" />
      <DebugRow label="score" value={`${localUser.age} × ${localUser.rating} = ${meta.score}`} />
      <DebugRow label="janela" value={`[${meta.minQR}, ${meta.maxQR}]`} />
      <DebugRow label="tipo" value={TYPE_LABEL[type] ?? type} />
      <DebugRow label="max" value={maxStr} />
      <DebugRow label="modifier" value={modifier} />
      <DebugRow
        label="Q calculado"
        value={
          <span>
            ({typeRating} + {maxRating} + {modRating}) / {localUser.age} ={" "}
            <strong style={{ color: stale ? "#E53935" : "#43A047" }}>{recomputed}</strong>
            {stale && <span style={{ color: "#E53935" }}> ≠ {questionRating} ⚠️</span>}
          </span>
        }
      />

      <Divider sx={{ my: 1 }} />

      <DebugSection title="Resultado" />
      <DebugRow label="diff" value={`${questionRating} − ${localUser.rating} = ${diff >= 0 ? "+" : ""}${diff}`} />
      <DebugRow
        label="acertar"
        value={
          <span style={{ color: "#43A047" }}>
            +{previewGain} rating, +{previewPointsGain} pontos
          </span>
        }
      />
      <DebugRow label="errar" value={<span style={{ color: "#E53935" }}>−{previewLoss} rating</span>} />

      <Divider sx={{ my: 1 }} />

      <DebugSection title={`Pool — rodada ${roundNumber}`} />
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        {(Object.entries(roundTotal) as [QuestionType, number][]).map(([t, total]) => {
          const remaining = roundQueue.filter((x) => x === t).length;
          const done = total - remaining;
          return (
            <Box key={t} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                {OP_LABEL[t]}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  color: done >= total ? "success.main" : "text.primary",
                }}
              >
                {done}/{total}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PlayPage() {
  const { user, patchUser } = useAuth();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const [localUser, setLocalUser] = useState<User>(() => ({
    ...user!,
    offensive: user?.offensive ?? 0,
    last_day: user?.last_day ?? null,
    offensive_guards: user?.offensive_guards ?? 0,
  }));

  const [roundQueue, setRoundQueue] = useState<QuestionType[]>(() => generateRoundQueue(user!));
  const [roundTotal, setRoundTotal] = useState<Partial<Record<QuestionType, number>>>(() =>
    queueToTotal(generateRoundQueue(user!)),
  );
  const [roundNumber, setRoundNumber] = useState(1);

  const [question, setQuestion] = useState<QuestionResult>(() =>
    generateQuestion(user!, generateRoundQueue(user!)[0] ?? "+"),
  );
  const [phase, setPhase] = useState<Phase>("question");
  const [selected, setSelected] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [delta, setDelta] = useState({ rating: 0, level: 0, points: 0 });

  // Timer system
  const [timerPercent, setTimerPercent] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartTimeRef = useRef<number>(0);

  // Streak & consecutive errors
  const [streak, setStreak] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [showStreakEffect, setShowStreakEffect] = useState(false);

  // Daily streak system — inicializa do localStorage para sobreviver a recargas
  const [dailyStreakChecked, setDailyStreakChecked] = useState(() => {
    if (user?.last_day === todayISO()) return true;
    const saved = loadFromLocalStorage<DailyProgress>(STORAGE_KEYS.DAILY_PROGRESS);
    return !!(saved?.date === todayISO() && saved.completed);
  });
  const [dailyQuestionsCount, setDailyQuestionsCount] = useState(() => {
    const saved = loadFromLocalStorage<DailyProgress>(STORAGE_KEYS.DAILY_PROGRESS);
    return saved?.date === todayISO() ? saved.questionsCount : 0;
  });
  const [dailyCorrectCount, setDailyCorrectCount] = useState(() => {
    const saved = loadFromLocalStorage<DailyProgress>(STORAGE_KEYS.DAILY_PROGRESS);
    return saved?.date === todayISO() ? saved.correctCount : 0;
  });
  const [milestoneSnackbar, setMilestoneSnackbar] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });
  const [syncSnackbar, setSyncSnackbar] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });

  // Sincroniza localUser com user do contexto (atualizado via localStorage)
  useEffect(() => {
    if (user) {
      setLocalUser((prev) => ({
        ...prev,
        offensive: user.offensive ?? prev.offensive ?? 0,
        last_day: user.last_day ?? prev.last_day,
        offensive_guards: user.offensive_guards ?? prev.offensive_guards ?? 0,
      }));
    }
  }, [user?.offensive, user?.last_day, user?.offensive_guards]);

  // Verifica se a meta diária já foi concluída hoje
  useEffect(() => {
    if (localUser.last_day && localUser.last_day === todayISO()) {
      setDailyStreakChecked(true);
    }
  }, [localUser.last_day]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Inicia o timer quando a questão muda para 'question'
  useEffect(() => {
    if (phase !== "question") return;

    // Reset timer
    setTimerPercent(100);
    questionStartTimeRef.current = Date.now();

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    // Aguarda 3.5s antes de começar a decair
    const startTimeout = setTimeout(() => {
      const startTime = Date.now();

      timerIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000; // segundos
        const decayed = elapsed * TIMER_DECAY_RATE * 100; // 20% por segundo
        const newPercent = Math.max(0, 100 - decayed);
        setTimerPercent(newPercent);

        if (newPercent <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
      }, TIMER_INTERVAL);
    }, TIMER_START_DELAY);

    return () => {
      clearTimeout(startTimeout);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [phase, question]);

  function handleAnswer(option: number) {
    if (phase !== "question") return;

    // Para o timer
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const isCorrect = option === question.answer;
    const timerMultiplier = Math.max(0.05, timerPercent / 100); // mínimo 5%

    // Toca som de acerto/erro
    playAnswerSound(isCorrect);

    // Calcula ganhos base
    const baseStats = updateUserAfterAnswer(localUser, question.questionRating, isCorrect);
    let finalRating = baseStats.rating;
    let finalLevel = baseStats.level;
    let finalPoints = baseStats.points;

    // Se acertou: aplica multiplicador do timer aos ganhos
    if (isCorrect) {
      const baseGain = baseStats.rating - localUser.rating;
      const baseLevelGain = baseStats.level - localUser.level;
      const basePointsGain = baseStats.points - localUser.points;
      const bonusRating = Math.round(baseGain * timerMultiplier);
      const bonusLevel = baseLevelGain * timerMultiplier;
      const bonusPoints = Math.floor(basePointsGain * timerMultiplier);

      finalRating = localUser.rating + bonusRating;
      finalLevel = localUser.level + bonusLevel;
      finalPoints = localUser.points + bonusPoints;
    }

    let updated: User = { ...localUser, rating: finalRating, level: finalLevel, points: finalPoints };

    // Atualiza streak e consecutive errors
    let newStreak = streak;
    let newConsecutiveErrors = consecutiveErrors;

    if (isCorrect) {
      newStreak = streak + 1;
      newConsecutiveErrors = 0;

      // Efeito visual e som para milestones
      if (newStreak === 5 || newStreak === 10 || newStreak === 20) {
        setShowStreakEffect(true);
        playStreakSound(newStreak);
        setTimeout(() => setShowStreakEffect(false), 2000);
      }
    } else {
      newStreak = 0;
      newConsecutiveErrors = consecutiveErrors + 1;

      // Penalidade por 5 erros consecutivos
      if (newConsecutiveErrors >= CONSECUTIVE_ERROR_THRESHOLD) {
        updated = {
          ...updated,
          rating: Math.max(1, updated.rating - CONSECUTIVE_ERROR_PENALTY),
        };
        newConsecutiveErrors = 0; // reseta após aplicar penalidade
      }
    }

    setStreak(newStreak);
    setConsecutiveErrors(newConsecutiveErrors);

    // Incrementa contadores diários
    const newDailyQuestions = dailyQuestionsCount + 1;
    const newDailyCorrect = dailyCorrectCount + (isCorrect ? 1 : 0);
    setDailyQuestionsCount(newDailyQuestions);
    setDailyCorrectCount(newDailyCorrect);

    // Verifica se atingiu meta diária (15 questões OU 7 acertos)
    const shouldCheckStreak = !dailyStreakChecked && (newDailyQuestions >= 15 || newDailyCorrect >= 7);

    const dRating = updated.rating - localUser.rating;
    const dLevel = +(updated.level - localUser.level).toFixed(2);
    const dPoints = updated.points - localUser.points;

    // Persiste progresso diário no localStorage
    saveToLocalStorage(STORAGE_KEYS.DAILY_PROGRESS, {
      date: todayISO(),
      questionsCount: newDailyQuestions,
      correctCount: newDailyCorrect,
      completed: dailyStreakChecked || shouldCheckStreak,
    } satisfies DailyProgress);

    // Registra a resposta no histórico local (sincronizado com Firestore no próximo sync)
    const questionText =
      question.type === "ask_number"
        ? `Número: ${question.answer}`
        : `${question.a} ${OP_LABEL[question.type] ?? question.type} ${question.b}`;
    const answerRecord: AnswerRecord = {
      id: crypto.randomUUID(),
      user_id: localUser.id,
      question: questionText,
      answer: option,
      alternatives: [...question.options],
      is_correct: isCorrect,
      reward_xp: dPoints,
      question_rating: question.questionRating,
      user_rating: updated.rating,
      bonus: Math.round(timerPercent),
      current_stack: newStreak,
      data_registro: new Date().toISOString(),
      synced: false,
    };
    const existingAnswers = loadFromLocalStorage<AnswerRecord[]>(STORAGE_KEYS.ANSWER_HISTORY) ?? [];
    saveToLocalStorage(STORAGE_KEYS.ANSWER_HISTORY, [...existingAnswers, answerRecord]);

    setSelected(option);
    setWasCorrect(isCorrect);
    setDelta({ rating: dRating, level: dLevel, points: dPoints });
    setPhase("feedback");
    setLocalUser(updated);
    patchUser({ rating: updated.rating, level: updated.level, points: updated.points });

    // Avança a fila
    const nextQueue = roundQueue.slice(1);

    // REMOVED: saveUserStats - sincroniza apenas ao completar rodada

    timerRef.current = setTimeout(() => {
      setPhase("question");
      setSelected(null);

      // Verifica e atualiza streak diária se atingiu a meta
      if (shouldCheckStreak) {
        setDailyStreakChecked(true);

        // Atualiza streak
        const streakData = updateStreak(updated);

        // Atualiza localUser com streak
        const updatedWithStreak = {
          ...updated,
          offensive: streakData.offensive,
          last_day: streakData.last_day,
          offensive_guards: streakData.offensive_guards,
        };
        setLocalUser(updatedWithStreak);

        // Salva no Firestore
        saveStreak(updated.id, streakData).catch(() => {
          console.error("Erro ao salvar streak");
        });

        // Atualiza user global (salva no localStorage via patchUser)
        patchUser({
          offensive: streakData.offensive,
          last_day: streakData.last_day,
          offensive_guards: streakData.offensive_guards,
        });

        // Se atingiu milestone, aplica recompensa
        if (streakData.milestoneReached) {
          applyMilestoneReward(updated.id, updatedWithStreak, streakData.milestoneReached)
            .then((updates) => {
              // Atualiza localUser com recompensas
              setLocalUser((prev) => ({ ...prev, ...updates }));
              // Atualiza user global
              patchUser(updates);

              // Mostra notificação de milestone
              setMilestoneSnackbar({
                open: true,
                message: streakData.milestoneReached!.label,
              });
            })
            .catch((err) => {
              console.error("Erro ao aplicar milestone:", err);
            });
        }
      }

      // Se houve 5 erros consecutivos, regenera pool (reset)
      if (!isCorrect && consecutiveErrors + 1 >= CONSECUTIVE_ERROR_THRESHOLD) {
        const resetQueue = generateRoundQueue(updated);
        setRoundQueue(resetQueue);
        setRoundTotal(queueToTotal(resetQueue));
        setRoundNumber((r) => r + 1);
        setQuestion(generateQuestion(updated, resetQueue[0] ?? "+"));
      } else if (nextQueue.length === 0) {
        // Rodada completa: gera nova fila
        const newQueue = generateRoundQueue(updated);
        setRoundQueue(newQueue);
        setRoundTotal(queueToTotal(newQueue));
        setRoundNumber((r) => r + 1);
        setQuestion(generateQuestion(updated, newQueue[0] ?? "+"));

        // Sincronizar progresso com Firebase ao completar rodada
        syncFirestore(updated.id)
          .then(() => {
            console.log("[PlayPage] Progresso sincronizado com Firebase");
            setSyncSnackbar({
              open: true,
              message: "✅ Progresso salvo!",
            });
          })
          .catch((error) => {
            console.error("[PlayPage] Erro ao sincronizar:", error);
          });
      } else {
        setRoundQueue(nextQueue);
        setQuestion(generateQuestion(updated, nextQueue[0]));
      }
    }, 1800);
  }

  function playAudio() {
    if (!question.audio) return;
    try {
      new Audio(question.audio).play().catch(() => {});
    } catch {
      // ignora se browser bloquear sem interação
    }
  }

  const isAskNumber = question.type === "ask_number";

  const ifCorrect = updateUserAfterAnswer(localUser, question.questionRating, true);
  const ifWrong = updateUserAfterAnswer(localUser, question.questionRating, false);
  const previewGain = ifCorrect.rating - localUser.rating;
  const previewLoss = localUser.rating - ifWrong.rating;
  const previewPointsGain = ifCorrect.points - localUser.points;

  const diff = question.questionRating - localUser.rating;
  const difficulty = getDifficultyLabel(diff);
  const streakMsg = getStreakMessage(streak);

  // Cor do timer baseada na porcentagem
  const timerColor = timerPercent > 60 ? "#4CAF50" : timerPercent > 30 ? "#FFC107" : "#F44336";

  return (
    <Box sx={{ position: "relative" }}>
      {/* ── Barra de timer (topo fixo) ────────────────────────────────────── */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
        }}
      >
        <LinearProgress
          variant="determinate"
          value={timerPercent}
          sx={{
            height: 6,
            bgcolor: "rgba(0,0,0,0.1)",
            "& .MuiLinearProgress-bar": {
              bgcolor: timerColor,
              transition: "background-color 0.3s ease",
            },
          }}
        />
      </Box>

      {/* ── Ofensiva diária (header fixo — desktop only) ──────────────── */}
      <Box
        sx={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 1000,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          gap: 1,
          alignItems: "flex-end",
        }}
      >
        {/* Contador de ofensiva */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: "background.paper",
            px: 2,
            py: 1,
            borderRadius: 3,
            boxShadow: 3,
          }}
        >
          <WhatshotRoundedIcon sx={{ color: "#FF6B6B", fontSize: 24 }} />
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"Fredoka", sans-serif',
              fontWeight: 700,
              color: "text.primary",
            }}
          >
            {localUser.offensive ?? 0}
          </Typography>
          {(localUser.offensive_guards ?? 0) > 0 && (
            <Chip
              icon={<ShieldIcon sx={{ fontSize: 16 }} />}
              label={localUser.offensive_guards}
              size="small"
              color="primary"
              sx={{
                height: 24,
                "& .MuiChip-label": { px: 1, fontSize: "0.75rem" },
              }}
            />
          )}
        </Box>

        {/* Progresso diário */}
        <Box
          sx={{
            bgcolor: "background.paper",
            px: 2,
            py: 1,
            borderRadius: 3,
            boxShadow: 2,
            minWidth: 150,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: "block",
              fontFamily: '"Fredoka", sans-serif',
              fontWeight: 600,
              color: "text.secondary",
              mb: 0.5,
            }}
          >
            Meta diária
          </Typography>
          {dailyStreakChecked ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "center" }}>
              <CheckCircleRoundedIcon sx={{ color: "success.main", fontSize: 18 }} />
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"Fredoka", sans-serif',
                  fontWeight: 600,
                  color: "success.main",
                }}
              >
                Concluída!
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1, justifyContent: "space-between" }}>
              <Chip
                label={`${dailyQuestionsCount}/15 questões`}
                size="small"
                color={dailyQuestionsCount >= 15 ? "success" : "default"}
                sx={{ fontSize: "0.7rem" }}
              />
              <Chip
                label={`${dailyCorrectCount}/7 ✓`}
                size="small"
                color={dailyCorrectCount >= 7 ? "success" : "default"}
                sx={{ fontSize: "0.7rem" }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Debug card (desktop apenas) ────────────────────────────────── */}
      {isDesktop && (
        <Box
          sx={{
            position: "fixed",
            top: 70,
            right: 16,
            maxWidth: 300,
            zIndex: 999,
          }}
        >
          <DebugCard
            localUser={localUser}
            question={question}
            previewGain={previewGain}
            previewLoss={previewLoss}
            previewPointsGain={previewPointsGain}
            roundQueue={roundQueue}
            roundTotal={roundTotal}
            roundNumber={roundNumber}
          />
        </Box>
      )}

      {/* ── Conteúdo principal ──────────────────────────────────────────── */}
      <Box
        sx={{
          p: 2,
          pt: 4,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          maxWidth: 560,
          mx: "auto",
          pb: { xs: "220px", md: 2 },
        }}
      >
        {/* ── Ofensiva + meta diária (mobile, fluxo normal) ──────────────── */}
        {!isDesktop && (
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "background.paper",
                px: 2,
                py: 1,
                borderRadius: 3,
                boxShadow: 2,
                flexShrink: 0,
              }}
            >
              <WhatshotRoundedIcon sx={{ color: "#FF6B6B", fontSize: 22 }} />
              <Typography variant="h6" sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 700, color: "text.primary" }}>
                {localUser.offensive ?? 0}
              </Typography>
              {(localUser.offensive_guards ?? 0) > 0 && (
                <Chip
                  icon={<ShieldIcon sx={{ fontSize: 16 }} />}
                  label={localUser.offensive_guards}
                  size="small"
                  color="primary"
                  sx={{ height: 24, "& .MuiChip-label": { px: 1, fontSize: "0.75rem" } }}
                />
              )}
            </Box>
            <Box sx={{ bgcolor: "background.paper", px: 2, py: 1, borderRadius: 3, boxShadow: 2, flex: 1 }}>
              <Typography
                variant="caption"
                sx={{ display: "block", fontFamily: '"Fredoka", sans-serif', fontWeight: 600, color: "text.secondary", mb: 0.5 }}
              >
                Meta diária
              </Typography>
              {dailyStreakChecked ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CheckCircleRoundedIcon sx={{ color: "success.main", fontSize: 18 }} />
                  <Typography variant="caption" sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 600, color: "success.main" }}>
                    Concluída!
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={`${dailyQuestionsCount}/15`}
                    size="small"
                    color={dailyQuestionsCount >= 15 ? "success" : "default"}
                    sx={{ fontSize: "0.7rem" }}
                  />
                  <Chip
                    label={`${dailyCorrectCount}/7 ✓`}
                    size="small"
                    color={dailyCorrectCount >= 7 ? "success" : "default"}
                    sx={{ fontSize: "0.7rem" }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* ── Indicador de dificuldade ────────────────────────────────────── */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: -1 }}>
          <Chip
            label={difficulty.label}
            size="small"
            sx={{
              bgcolor: difficulty.color,
              color: "white",
              fontFamily: '"Fredoka", sans-serif',
              fontWeight: 700,
              fontSize: "0.75rem",
            }}
          />
        </Box>

        {/* ── Questão ─────────────────────────────────────────────────────── */}
        <Paper
          elevation={3}
          sx={{
            borderRadius: 4,
            p: { xs: 3, sm: 5 },
            textAlign: "center",
            background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          }}
        >
          {isAskNumber ? (
            <Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<VolumeUpRoundedIcon />}
                onClick={playAudio}
                sx={{ fontFamily: '"Fredoka", sans-serif', fontSize: "1.2rem", borderRadius: 3 }}
              >
                Ouvir número
              </Button>
            </Box>
          ) : (
            <Typography
              variant="h3"
              sx={{
                fontFamily: '"Fredoka", sans-serif',
                fontWeight: 700,
                color: "primary.dark",
              }}
            >
              {question.a} {OP_LABEL[question.type]} {question.b} = ?
            </Typography>
          )}
        </Paper>

        {/* ── Streak / erros consecutivos (abaixo da questão) ─────────────── */}
        {(streak >= 3 || consecutiveErrors >= 3) && (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}>
            {streak >= 3 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  bgcolor: "warning.main",
                  color: "white",
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 3,
                  fontFamily: '"Fredoka", sans-serif',
                  fontWeight: 700,
                }}
              >
                <WhatshotRoundedIcon fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {streak} seguidos
                </Typography>
              </Box>
            )}
            {consecutiveErrors >= 3 && (
              <Box
                sx={{
                  bgcolor: "error.main",
                  color: "white",
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 3,
                  fontFamily: '"Fredoka", sans-serif',
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                ⚠️ {consecutiveErrors} erros! Cuidado!
              </Box>
            )}
          </Box>
        )}

        {/* ── Alternativas 2 × 2 ──────────────────────────────────────────────── */}
        <Box
          sx={{
            position: { xs: "fixed", md: "relative" },
            bottom: { xs: "56px", md: "auto" },
            left: { xs: 0, md: "auto" },
            right: { xs: 0, md: "auto" },
            zIndex: { xs: 999, md: "auto" },
            p: { xs: 2, md: 0 },
            bgcolor: { xs: "background.default", md: "transparent" },
            boxShadow: "none",
          }}
        >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1.5,
          }}
        >
          {question.options.map((opt) => {
            let color: "primary" | "success" | "error" | "inherit" = "primary";
            let opacity = 1;
            if (phase === "feedback") {
              if (opt === question.answer) color = "success";
              else if (opt === selected) color = "error";
              else opacity = 0.35;
            }
            return (
              <Button
                key={opt}
                variant={phase === "feedback" ? "contained" : "outlined"}
                color={color}
                disabled={phase === "feedback" && opt !== question.answer && opt !== selected}
                onClick={() => handleAnswer(opt)}
                sx={{
                  fontFamily: '"Fredoka", sans-serif',
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  py: 2,
                  borderRadius: 3,
                  opacity,
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  borderWidth: 2,
                  borderColor: phase === "question" ? "primary.main" : undefined,
                  bgcolor: phase === "question" ? "background.paper" : undefined,
                  boxShadow: phase === "question" ? "0 2px 8px rgba(0,0,0,0.08)" : undefined,
                  "&:hover": {
                    borderWidth: 2,
                    transform: phase === "question" ? "translateY(-2px)" : undefined,
                    boxShadow: phase === "question" ? "0 4px 16px rgba(0,0,0,0.15)" : undefined,
                    bgcolor: phase === "question" ? "primary.main" : undefined,
                    color: phase === "question" ? "white" : undefined,
                  },
                  "&:active": {
                    transform: "scale(0.97)",
                  },
                }}
              >
                {opt}
              </Button>
            );
          })}
        </Box>
        </Box>

        {/* ── Feedback ─────────────────────────────────────────────────────────── */}
        <Fade in={phase === "feedback"}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: 2,
              textAlign: "center",
              bgcolor: wasCorrect ? "success.main" : "error.main",
              color: "white",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
              {wasCorrect ? <CheckCircleRoundedIcon /> : <CancelRoundedIcon />}
              <Typography sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 700, fontSize: "1.2rem" }}>
                {wasCorrect ? "Correto!" : "Errou!"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}>
              <Chip
                label={`${delta.rating >= 0 ? "+" : ""}${delta.rating} rating`}
                sx={{
                  bgcolor: "rgba(255,255,255,0.25)",
                  color: "white",
                  fontFamily: '"Fredoka", sans-serif',
                  fontWeight: 700,
                }}
              />
              {wasCorrect && (
                <>
                  <Chip
                    label={`+${delta.level.toFixed(2)} level`}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.25)",
                      color: "white",
                      fontFamily: '"Fredoka", sans-serif',
                      fontWeight: 700,
                    }}
                  />
                  <Chip
                    label={`+${delta.points} pontos`}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.25)",
                      color: "white",
                      fontFamily: '"Fredoka", sans-serif',
                      fontWeight: 700,
                    }}
                  />
                </>
              )}
              {wasCorrect && timerPercent < 100 && (
                <Chip
                  label={`⏱️ ${Math.round(timerPercent)}% bônus`}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.35)",
                    color: "white",
                    fontFamily: '"Fredoka", sans-serif',
                    fontWeight: 700,
                    fontSize: "0.75rem",
                  }}
                />
              )}
            </Box>
          </Paper>
        </Fade>
      </Box>

      {/* ── Efeito de streak milestone ──────────────────────────────────── */}
      {/* Mobile: overlay fullscreen */}
      <Fade in={showStreakEffect && !isDesktop} timeout={300} unmountOnExit>
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            background:
              streak >= 20
                ? "linear-gradient(135deg, #7B1FA2 0%, #E91E63 100%)"
                : streak >= 10
                  ? "linear-gradient(135deg, #E64A19 0%, #E91E63 100%)"
                  : "linear-gradient(135deg, #F9A825 0%, #EF6C00 100%)",
            color: "white",
            textAlign: "center",
            px: 4,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Fredoka", sans-serif',
              fontWeight: 700,
              fontSize: "4rem",
              lineHeight: 1,
              textShadow: "0 2px 12px rgba(0,0,0,0.25)",
            }}
          >
            {streak >= 20 ? "🔥🔥🔥" : streak >= 10 ? "🌟🌟" : "⭐"}
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Fredoka", sans-serif',
              fontWeight: 700,
              textShadow: "0 2px 12px rgba(0,0,0,0.25)",
            }}
          >
            {streakMsg}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "rgba(255,255,255,0.2)",
              px: 3,
              py: 1.5,
              borderRadius: 4,
            }}
          >
            <WhatshotRoundedIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: '"Fredoka", sans-serif' }}>
              {streak} seguidos!
            </Typography>
          </Box>
        </Box>
      </Fade>
      {/* Desktop: card centralizado */}
      <Zoom in={showStreakEffect && isDesktop}>
        <Paper
          elevation={6}
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2000,
            bgcolor: "warning.main",
            color: "white",
            px: 4,
            py: 3,
            borderRadius: 4,
            textAlign: "center",
            boxShadow: "0 8px 32px rgba(255,152,0,0.4)",
          }}
        >
          <Typography variant="h3" sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 700, mb: 1 }}>
            {streakMsg}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <WhatshotRoundedIcon fontSize="large" />
            <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: '"Fredoka", sans-serif' }}>
              {streak} seguidos!
            </Typography>
          </Box>
        </Paper>
      </Zoom>

      {/* ── Notificação de milestone ────────────────────────────────────── */}
      <Snackbar
        open={milestoneSnackbar.open}
        autoHideDuration={5000}
        onClose={() => setMilestoneSnackbar({ open: false, message: "" })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setMilestoneSnackbar({ open: false, message: "" })}
          severity="success"
          sx={{
            fontSize: "1rem",
            fontFamily: '"Fredoka", sans-serif',
            fontWeight: 600,
          }}
        >
          {milestoneSnackbar.message}
        </Alert>
      </Snackbar>

      {/* ── Notificação de sincronização ────────────────────────────────────── */}
      <Snackbar
        open={syncSnackbar.open}
        autoHideDuration={3000}
        onClose={() => setSyncSnackbar({ open: false, message: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSyncSnackbar({ open: false, message: "" })}
          severity="info"
          sx={{
            fontSize: "0.95rem",
            fontFamily: '"Nunito", sans-serif',
          }}
        >
          {syncSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
