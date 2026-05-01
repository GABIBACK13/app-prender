import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Avatar,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import WhatshotRoundedIcon from "@mui/icons-material/WhatshotRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { useAuth } from "../../contexts/AuthContext";
import { LevelDisplay } from "../../components/LevelDisplay/LevelDisplay";

export default function MainPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const stats = [
    {
      label: "Pontos",
      value: user?.points || 0,
      icon: <StarRoundedIcon sx={{ fontSize: 40 }} />,
      color: "#FFB300",
      bgColor: "#FFF9C4",
      type: "normal" as const,
    },
    {
      label: "Ofensiva",
      value: `${user?.offensive || 0} dias`,
      icon: <WhatshotRoundedIcon sx={{ fontSize: 40 }} />,
      color: "#FF6F00",
      bgColor: "#FFE0B2",
      type: "normal" as const,
    },
    {
      label: "Nível",
      value: user?.level || 1,
      color: "#1976D2",
      bgColor: "#BBDEFB",
      type: "level" as const,
    },
  ];

  return (
    <Box
      sx={{
        maxWidth: 800,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4 },
      }}
    >
      {/* Header com saudação */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography
          variant={isMobile ? "h4" : "h3"}
          sx={{
            fontFamily: '"Fredoka", sans-serif',
            fontWeight: 700,
            color: "primary.main",
            mb: 1,
          }}
        >
          Olá, {user?.nickname || user?.name || "Aventureiro"}! 👋
        </Typography>
        <Typography
          variant={isMobile ? "body1" : "h6"}
          sx={{
            fontFamily: '"Nunito", sans-serif',
            color: "text.secondary",
          }}
        >
          O que vamos aprender hoje?
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid size={4} key={index}>
            <Card
              elevation={2}
              sx={{
                height: "100%",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
              }}
            >
              <CardContent
                sx={{
                  textAlign: "center",
                  p: { xs: 1.5, sm: 2 },
                  "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                }}
              >
                {stat.type === "level" ? (
                  <>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                      <LevelDisplay
                        level={stat.value as number}
                        size={isMobile ? "small" : "medium"}
                        color={stat.color}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: '"Nunito", sans-serif',
                        color: "text.secondary",
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Avatar
                      sx={{
                        width: { xs: 50, sm: 60 },
                        height: { xs: 50, sm: 60 },
                        bgcolor: stat.bgColor,
                        color: stat.color,
                        mx: "auto",
                        mb: 1,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Typography
                      variant={isMobile ? "h6" : "h5"}
                      sx={{
                        fontFamily: '"Fredoka", sans-serif',
                        fontWeight: 700,
                        color: stat.color,
                        mb: 0.5,
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: '"Nunito", sans-serif',
                        color: "text.secondary",
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Action Buttons */}
      <Stack spacing={2}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<PlayArrowRoundedIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />}
          onClick={() => navigate("/main/jogar")}
          sx={{
            py: { xs: 2, sm: 3 },
            fontSize: { xs: "1.1rem", sm: "1.3rem" },
            fontFamily: '"Fredoka", sans-serif',
            fontWeight: 600,
            borderRadius: 3,
            background: "linear-gradient(135deg, #42A5F5 0%, #1976D2 100%)",
            boxShadow: "0 4px 20px rgba(25, 118, 210, 0.4)",
            textTransform: "none",
            transition: "all 0.3s",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 6px 24px rgba(25, 118, 210, 0.5)",
              background: "linear-gradient(135deg, #1976D2 0%, #1565C0 100%)",
            },
          }}
        >
          Jogar Agora!
        </Button>

        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<ShoppingBagRoundedIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />}
          onClick={() => navigate("/main/loja")}
          sx={{
            py: { xs: 2, sm: 3 },
            fontSize: { xs: "1.1rem", sm: "1.3rem" },
            fontFamily: '"Fredoka", sans-serif',
            fontWeight: 600,
            borderRadius: 3,
            background: "linear-gradient(135deg, #66BB6A 0%, #43A047 100%)",
            boxShadow: "0 4px 20px rgba(67, 160, 71, 0.4)",
            textTransform: "none",
            transition: "all 0.3s",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 6px 24px rgba(67, 160, 71, 0.5)",
              background: "linear-gradient(135deg, #43A047 0%, #388E3C 100%)",
            },
          }}
        >
          Visitar a Loja
        </Button>
      </Stack>

      {/* Motivational Message */}
      {user?.offensive && user.offensive > 0 && (
        <Card
          sx={{
            mt: 3,
            background: "linear-gradient(135deg, #FFF9C4 0%, #FFE082 100%)",
            border: "2px solid #FFB300",
          }}
        >
          <CardContent sx={{ textAlign: "center", py: { xs: 2, sm: 2.5 } }}>
            <Typography
              variant={isMobile ? "body2" : "body1"}
              sx={{
                fontFamily: '"Nunito", sans-serif',
                fontWeight: 600,
                color: "#E65100",
              }}
            >
              🔥 Você está em chamas! Continue jogando para manter sua ofensiva de {user.offensive} dias!
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
