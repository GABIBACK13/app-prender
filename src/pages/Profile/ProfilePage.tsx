import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Link,
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Paper,
  Grid,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  logout,
  deleteAccount,
  validateParentPassword,
  reauthenticateUser,
  reauthenticateGoogle,
  isGoogleUser,
} from "../../models/auth";
import { syncFirestore } from "../../lib/syncManager";
import { todayISO } from "../../models/streak";
import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import CakeRoundedIcon from "@mui/icons-material/CakeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import ShieldIcon from "@mui/icons-material/Shield";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloudSyncRoundedIcon from "@mui/icons-material/CloudSyncRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";

const AVERAGE_RATING = 400; // Rating médio para comparação

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [reauthDialogOpen, setReauthDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reauthEmail, setReauthEmail] = useState("");
  const [reauthPassword, setReauthPassword] = useState("");
  const [reauthError, setReauthError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<"success" | "error" | null>(null);

  // Verifica se meta diária foi concluída (dados do localStorage via AuthContext)
  const [isDailyGoalCompleted, setIsDailyGoalCompleted] = useState(false);

  useEffect(() => {
    if (user?.last_day && user.last_day === todayISO()) {
      setIsDailyGoalCompleted(true);
    } else {
      setIsDailyGoalCompleted(false);
    }
  }, [user?.last_day]);

  if (!user) return null;

  const isAboveAverage = user.rating > AVERAGE_RATING;

  async function handleLogout() {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      setError("Erro ao sair. Tente novamente.");
    }
  }

  function handleDeleteConfirm() {
    if (!user) return;
    if (!validateParentPassword(user.parentPassword ?? "", password)) {
      setError("Senha incorreta.");
      return;
    }
    setDeleteDialogOpen(false);
    setPassword("");
    setError("");
    setReauthEmail(user.email ?? "");
    setReauthPassword("");
    setReauthError("");
    setReauthDialogOpen(true);
  }

  async function handleGoogleReauth() {
    setLoading(true);
    setReauthError("");
    try {
      await reauthenticateGoogle();
      await doDeleteAccount();
    } catch (err) {
      setReauthError(err instanceof Error ? err.message : "Erro ao autenticar. Tente novamente.");
      setLoading(false);
    }
  }

  async function handleEmailReauth() {
    setLoading(true);
    setReauthError("");
    try {
      await reauthenticateUser(reauthEmail, reauthPassword);
      await doDeleteAccount();
    } catch (err) {
      setReauthError(err instanceof Error ? err.message : "Erro ao autenticar. Tente novamente.");
      setLoading(false);
    }
  }

  async function doDeleteAccount() {
    if (!user) return;
    try {
      await deleteAccount(user.id);
      navigate("/", { replace: true });
    } catch (err) {
      setReauthError(err instanceof Error ? err.message : "Erro ao excluir conta. Tente novamente.");
      setLoading(false);
    }
  }

  function openDeleteDialog() {
    if (!user) return;
    if (!user.parentPassword) {
      setError("Configure uma senha na loja antes de excluir a conta.");
      return;
    }
    setDeleteDialogOpen(true);
    setPassword("");
    setError("");
  }

  async function handleSync() {
    if (!user) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      await syncFirestore(user.id);
      setSyncResult("success");
    } catch {
      setSyncResult("error");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(null), 4000);
    }
  }

  function openLogoutDialog() {
    setLogoutDialogOpen(true);
  }

  return (
    <Box
      sx={{
        minHeight: "78vh",
        bgcolor: "background.default",
        background: "linear-gradient(160deg, #FFF3E0 0%, #FFE0B2 100%)",
        py: { xs: 2, sm: 4 },
        px: { xs: 1.5, sm: 2 },
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={{ xs: 2, sm: 3 }}>
          {/* Header com botão voltar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => navigate("/main")}
              sx={{ bgcolor: "background.paper" }}
              size={isMobile ? "small" : "medium"}
            >
              <ArrowBackRoundedIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
            <Typography
              variant={isMobile ? "h4" : "h3"}
              sx={{
                fontFamily: '"Fredoka", sans-serif',
                fontWeight: 700,
                color: "text.primary",
              }}
            >
              Meu Perfil
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={
                <CloudSyncRoundedIcon
                  sx={{
                    animation: syncing ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                  }}
                />
              }
              onClick={handleSync}
              disabled={syncing}
              color={syncResult === "error" ? "error" : syncResult === "success" ? "success" : "primary"}
              sx={{
                ml: "auto",
                fontFamily: '"Fredoka", sans-serif',
                fontWeight: 600,
                fontSize: { xs: "0.75rem", sm: "0.85rem" },
                borderRadius: 3,
                py: 0.75,
                px: { xs: 1.5, sm: 2 },
                whiteSpace: "nowrap",
              }}
            >
              {syncing
                ? "Salvando..."
                : syncResult === "success"
                  ? "Salvo!"
                  : syncResult === "error"
                    ? "Erro"
                    : "Sincronizar"}
            </Button>
          </Box>

          {/* Card de informações principais */}
          <Paper
            elevation={3}
            sx={{
              p: { xs: 1.5, sm: 3 },
              borderRadius: { xs: 3, sm: 5 },
              background: "linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)",
            }}
          >
            <Stack spacing={{ xs: 1.5, sm: 2.5 }}>
              {/* Nome e apelido */}
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant={isMobile ? "h6" : "h5"}
                  sx={{
                    fontFamily: '"Fredoka", sans-serif',
                    fontWeight: 700,
                    color: "primary.main",
                    mb: 0.25,
                  }}
                >
                  {user.nickname} 👋
                </Typography>
                <Typography
                  variant={isMobile ? "body2" : "body1"}
                  sx={{
                    fontFamily: '"Nunito", sans-serif',
                    color: "text.secondary",
                  }}
                >
                  {user.name}
                </Typography>
              </Box>

              {/* Grid de estatísticas */}
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                {/* Pontos */}
                <Grid size={{ xs: 6, sm: 6 }}>
                  <Box
                    sx={{
                      bgcolor: "#FFF9C4",
                      borderRadius: { xs: 2, sm: 3 },
                      p: { xs: 1.5, sm: 3 },
                      textAlign: "center",
                      border: { xs: "2px solid #FBC02D", sm: "3px solid #FBC02D" },
                      boxShadow: "0 4px 20px rgba(251, 192, 45, 0.3)",
                    }}
                  >
                    <EmojiEventsRoundedIcon
                      sx={{ fontSize: { xs: 22, sm: 40 }, color: "#F57F17", mb: { xs: 0.5, sm: 1 } }}
                    />
                    <Typography
                      variant={isMobile ? "h6" : "h4"}
                      sx={{
                        fontFamily: '"Fredoka", sans-serif',
                        fontWeight: 700,
                        color: "#F57F17",
                      }}
                    >
                      {user.points}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: '"Fredoka", sans-serif',
                        fontWeight: 600,
                        color: "#F57F17",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontSize: { xs: "0.65rem", sm: "0.75rem" },
                      }}
                    >
                      Pontos
                    </Typography>
                  </Box>
                </Grid>

                {/* Rating */}
                <Grid size={{ xs: 6, sm: 6 }}>
                  <Box
                    sx={{
                      bgcolor: isAboveAverage ? "#E1F5FE" : "#FCE4EC",
                      borderRadius: { xs: 2, sm: 3 },
                      p: { xs: 1.5, sm: 3 },
                      textAlign: "center",
                      border: {
                        xs: `2px solid ${isAboveAverage ? "#0288D1" : "#F06292"}`,
                        sm: `3px solid ${isAboveAverage ? "#0288D1" : "#F06292"}`,
                      },
                      boxShadow: `0 4px 20px ${isAboveAverage ? "rgba(2, 136, 209, 0.3)" : "rgba(240, 98, 146, 0.3)"}`,
                    }}
                  >
                    <StarRoundedIcon
                      sx={{
                        fontSize: { xs: 22, sm: 40 },
                        color: isAboveAverage ? "#01579B" : "#C2185B",
                        mb: { xs: 0.25, sm: 0.75 },
                      }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                      <Typography
                        variant={isMobile ? "h6" : "h4"}
                        sx={{
                          fontFamily: '"Fredoka", sans-serif',
                          fontWeight: 700,
                          color: isAboveAverage ? "#01579B" : "#C2185B",
                        }}
                      >
                        {user.rating}
                      </Typography>
                      {isAboveAverage ? (
                        <TrendingUpRoundedIcon sx={{ fontSize: { xs: 20, sm: 32 }, color: "#4CAF50" }} />
                      ) : (
                        <TrendingDownRoundedIcon sx={{ fontSize: { xs: 20, sm: 32 }, color: "#FF9800" }} />
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: '"Fredoka", sans-serif',
                        fontWeight: 600,
                        color: isAboveAverage ? "#01579B" : "#C2185B",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontSize: { xs: "0.65rem", sm: "0.75rem" },
                      }}
                    >
                      Rating
                    </Typography>
                    {!isMobile && (
                      <Chip
                        label={isAboveAverage ? "Acima da média! 🌟" : "Continue praticando! 💪"}
                        size="small"
                        sx={{
                          mt: 1,
                          fontFamily: '"Nunito", sans-serif',
                          fontWeight: 600,
                          bgcolor: isAboveAverage ? "#4CAF50" : "#FF9800",
                          color: "#fff",
                        }}
                      />
                    )}
                  </Box>
                </Grid>

                {/* Idade */}
                <Grid size={{ xs: 6, sm: 6 }}>
                  <Box
                    sx={{
                      bgcolor: "#F3E5F5",
                      borderRadius: { xs: 2, sm: 3 },
                      p: { xs: 1.5, sm: 3 },
                      textAlign: "center",
                      border: { xs: "2px solid #AB47BC", sm: "3px solid #AB47BC" },
                      boxShadow: "0 4px 20px rgba(171, 71, 188, 0.3)",
                    }}
                  >
                    <CakeRoundedIcon sx={{ fontSize: { xs: 22, sm: 40 }, color: "#6A1B9A", mb: { xs: 0.5, sm: 1 } }} />
                    <Typography
                      variant={isMobile ? "h6" : "h4"}
                      sx={{
                        fontFamily: '"Fredoka", sans-serif',
                        fontWeight: 700,
                        color: "#6A1B9A",
                      }}
                    >
                      {user.age}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: '"Fredoka", sans-serif',
                        fontWeight: 600,
                        color: "#6A1B9A",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontSize: { xs: "0.65rem", sm: "0.75rem" },
                      }}
                    >
                      Anos
                    </Typography>
                  </Box>
                </Grid>

                {/* Ofensiva */}
                <Grid size={{ xs: 6, sm: 6 }}>
                  <Box
                    sx={{
                      bgcolor: isDailyGoalCompleted ? "#FFEBEE" : "#E0E0E0",
                      borderRadius: { xs: 2, sm: 3 },
                      p: { xs: 1.5, sm: 3 },
                      textAlign: "center",
                      border: {
                        xs: `2px solid ${isDailyGoalCompleted ? "#FF6B6B" : "#9E9E9E"}`,
                        sm: `3px solid ${isDailyGoalCompleted ? "#FF6B6B" : "#9E9E9E"}`,
                      },
                      boxShadow: isDailyGoalCompleted
                        ? "0 4px 20px rgba(255, 107, 107, 0.4)"
                        : "0 4px 20px rgba(158, 158, 158, 0.3)",
                      opacity: isDailyGoalCompleted ? 1 : 0.6,
                      transition: "all 0.3s ease",
                    }}
                  >
                    <WhatshotRoundedIcon
                      sx={{
                        fontSize: { xs: 22, sm: 40 },
                        color: isDailyGoalCompleted ? "#FF6B6B" : "#757575",
                        mb: { xs: 0.25, sm: 0.75 },
                        filter: isDailyGoalCompleted ? "none" : "grayscale(100%)",
                      }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                      <Typography
                        variant={isMobile ? "h6" : "h4"}
                        sx={{
                          fontFamily: '"Fredoka", sans-serif',
                          fontWeight: 700,
                          color: isDailyGoalCompleted ? "#D32F2F" : "#757575",
                        }}
                      >
                        {user.offensive ?? 0}
                      </Typography>
                      {(user.offensive_guards ?? 0) > 0 && (
                        <Chip
                          icon={<ShieldIcon sx={{ fontSize: { xs: 12, sm: 16 } }} />}
                          label={user.offensive_guards}
                          size="small"
                          sx={{
                            bgcolor: isDailyGoalCompleted ? "#2196F3" : "#BDBDBD",
                            color: "#fff",
                            fontWeight: 700,
                            height: { xs: 18, sm: 24 },
                            fontSize: { xs: "0.65rem", sm: "0.75rem" },
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: '"Fredoka", sans-serif',
                        fontWeight: 600,
                        color: isDailyGoalCompleted ? "#D32F2F" : "#757575",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontSize: { xs: "0.65rem", sm: "0.75rem" },
                      }}
                    >
                      Ofensiva
                    </Typography>
                    {isDailyGoalCompleted && !isMobile && (
                      <Chip
                        label="Meta de hoje concluída! ✓"
                        size="small"
                        sx={{
                          mt: 1,
                          fontFamily: '"Nunito", sans-serif',
                          fontWeight: 600,
                          bgcolor: "#4CAF50",
                          color: "#fff",
                        }}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Stack>
          </Paper>

          {/* Botões de ação */}
          <Stack spacing={{ xs: 1.5, sm: 2 }}>
            <Button
              variant="outlined"
              size={isMobile ? "medium" : "large"}
              startIcon={<LogoutRoundedIcon />}
              onClick={openLogoutDialog}
              sx={{
                borderRadius: 3,
                py: { xs: 1, sm: 1.5 },
                fontFamily: '"Fredoka", sans-serif',
                fontWeight: 600,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                borderWidth: 2,
                borderColor: "primary.main",
                color: "primary.main",
                "&:hover": {
                  borderWidth: 2,
                  bgcolor: "primary.main",
                  color: "#fff",
                },
              }}
            >
              Sair
            </Button>

            <Button
              variant="outlined"
              size={isMobile ? "medium" : "large"}
              startIcon={<DeleteForeverRoundedIcon />}
              onClick={openDeleteDialog}
              color="error"
              sx={{
                borderRadius: 3,
                py: { xs: 1, sm: 1.5 },
                fontFamily: '"Fredoka", sans-serif',
                fontWeight: 600,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                borderWidth: 2,
                "&:hover": {
                  borderWidth: 2,
                  bgcolor: "error.main",
                  color: "#fff",
                },
              }}
            >
              Excluir Conta
            </Button>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: "center", fontFamily: '"Nunito", sans-serif' }}
            >
              <Link component={RouterLink} to="/privacidade" underline="hover">
                Política de Privacidade
              </Link>
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}
        </Stack>
      </Container>

      {/* Dialog de confirmação de logout */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: '"Fredoka", sans-serif',
            fontWeight: 700,
            fontSize: "1.5rem",
          }}
        >
          Sair do App?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: '"Nunito", sans-serif' }}>
            Tem certeza que deseja sair? Você pode voltar a qualquer momento!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            sx={{
              fontFamily: '"Fredoka", sans-serif',
              fontWeight: 600,
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleLogout}
            variant="contained"
            color="primary"
            sx={{
              fontFamily: '"Fredoka", sans-serif',
              fontWeight: 600,
            }}
          >
            Sair
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de reautenticação para exclusão de conta */}
      <Dialog
        open={reauthDialogOpen}
        onClose={() => !loading && setReauthDialogOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: 4, p: 1 } } }}
      >
        <DialogTitle
          sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 700, fontSize: "1.5rem", color: "error.main" }}
        >
          🔒 Confirme sua identidade
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography sx={{ fontFamily: '"Nunito", sans-serif' }}>
              Por segurança, confirme quem você é antes de excluir a conta permanentemente.
            </Typography>

            {isGoogleUser() ? (
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                fullWidth
                loading={loading}
                onClick={handleGoogleReauth}
                sx={{
                  py: 1.5,
                  borderColor: "divider",
                  color: "text.primary",
                  gap: 1.5,
                  "&:hover": { borderColor: "text.secondary", bgcolor: "action.hover" },
                }}
                startIcon={
                  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                }
              >
                Confirmar com Google
              </Button>
            ) : (
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="E-mail"
                  type="email"
                  value={reauthEmail}
                  onChange={(e) => setReauthEmail(e.target.value)}
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
                  fullWidth
                  label="Senha"
                  type="password"
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading && reauthPassword) handleEmailReauth();
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockRoundedIcon color="primary" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Stack>
            )}

            {reauthError && (
              <Alert severity="error" sx={{ borderRadius: 3 }}>
                {reauthError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setReauthDialogOpen(false)}
            disabled={loading}
            sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 600 }}
          >
            Cancelar
          </Button>
          {!isGoogleUser() && (
            <Button
              onClick={handleEmailReauth}
              variant="contained"
              color="error"
              disabled={loading || !reauthPassword}
              sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 600 }}
            >
              {loading ? "Excluindo..." : "Confirmar e Excluir"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: '"Fredoka", sans-serif',
            fontWeight: 700,
            fontSize: "1.5rem",
            color: "error.main",
          }}
        >
          ⚠️ Excluir Conta?
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography sx={{ fontFamily: '"Nunito", sans-serif' }}>
              Esta ação é <strong>permanente</strong> e não pode ser desfeita. Todos os dados, pontos e progresso serão
              perdidos.
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Nunito", sans-serif',
                fontWeight: 600,
                color: "text.secondary",
              }}
            >
              Digite a senha configurada pelos pais para confirmar:
            </Typography>
            <TextField
              fullWidth
              type="password"
              label="Senha dos pais"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              error={!!error}
              helperText={error}
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setPassword("");
              setError("");
            }}
            sx={{
              fontFamily: '"Fredoka", sans-serif',
              fontWeight: 600,
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={!password}
            sx={{
              fontFamily: '"Fredoka", sans-serif',
              fontWeight: 600,
            }}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
