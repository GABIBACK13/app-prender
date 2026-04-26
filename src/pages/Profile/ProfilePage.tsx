import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
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
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { logout, deleteAccount, validateParentPassword } from "../../models/auth";
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

const AVERAGE_RATING = 400; // Rating médio para comparação

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function handleDeleteAccount() {
    if (!user.parentPassword) {
      setError("Nenhuma senha configurada. Configure uma senha na loja primeiro.");
      return;
    }

    if (!validateParentPassword(user.parentPassword, password)) {
      setError("Senha incorreta.");
      return;
    }

    setLoading(true);
    try {
      await deleteAccount(user.id);
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      setError("Erro ao excluir conta. Tente novamente.");
      setLoading(false);
    }
  }

  function openDeleteDialog() {
    if (!user.parentPassword) {
      setError("Configure uma senha na loja antes de excluir a conta.");
      return;
    }
    setDeleteDialogOpen(true);
    setPassword("");
    setError("");
  }

  function openLogoutDialog() {
    setLogoutDialogOpen(true);
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
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
          </Box>

          {/* Card de informações principais */}
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 4 },
              borderRadius: { xs: 3, sm: 5 },
              background: "linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)",
            }}
          >
            <Stack spacing={{ xs: 2, sm: 3 }}>
              {/* Nome e apelido */}
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant={isMobile ? "h5" : "h4"}
                  sx={{
                    fontFamily: '"Fredoka", sans-serif',
                    fontWeight: 700,
                    color: "primary.main",
                    mb: 0.5,
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
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
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
                      sx={{ fontSize: { xs: 28, sm: 48 }, color: "#F57F17", mb: { xs: 0.5, sm: 1 } }}
                    />
                    <Typography
                      variant={isMobile ? "h5" : "h3"}
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
                        fontSize: { xs: 28, sm: 48 },
                        color: isAboveAverage ? "#01579B" : "#C2185B",
                        mb: { xs: 0.5, sm: 1 },
                      }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                      <Typography
                        variant={isMobile ? "h5" : "h3"}
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
                    <CakeRoundedIcon sx={{ fontSize: { xs: 28, sm: 48 }, color: "#6A1B9A", mb: { xs: 0.5, sm: 1 } }} />
                    <Typography
                      variant={isMobile ? "h5" : "h3"}
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
                        fontSize: { xs: 28, sm: 48 },
                        color: isDailyGoalCompleted ? "#FF6B6B" : "#757575",
                        mb: { xs: 0.5, sm: 1 },
                        filter: isDailyGoalCompleted ? "none" : "grayscale(100%)",
                      }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                      <Typography
                        variant={isMobile ? "h5" : "h3"}
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
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1,
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

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1,
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
            onClick={handleDeleteAccount}
            variant="contained"
            color="error"
            disabled={loading || !password}
            sx={{
              fontFamily: '"Fredoka", sans-serif',
              fontWeight: 600,
            }}
          >
            {loading ? "Excluindo..." : "Excluir Definitivamente"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
