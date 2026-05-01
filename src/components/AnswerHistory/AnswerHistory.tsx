import { useEffect, useState } from "react";
import { Box, Typography, List, ListItem, Divider, Chip } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { loadFromLocalStorage, STORAGE_KEYS } from "../../lib/localStorage";
import type { AnswerRecord } from "../../types/localStorage";

export default function AnswerHistory() {
  const [history, setHistory] = useState<AnswerRecord[]>([]);

  useEffect(() => {
    // Carrega histórico inicial
    const loadHistory = () => {
      const data = loadFromLocalStorage<AnswerRecord[]>(STORAGE_KEYS.ANSWER_HISTORY);
      setHistory((data ?? []).slice(-20).reverse()); // Últimas 20 respostas, mais recentes primeiro
    };

    loadHistory();

    // Atualiza a cada 2 segundos para pegar novas respostas
    const interval = setInterval(loadHistory, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        width: 260,
        height: "100vh",
        position: "fixed",
        right: 0,
        top: 0,
        bgcolor: "background.paper",
        borderLeft: "1px solid",
        borderColor: "divider",
        display: { xs: "none", xl: "block" },
        overflow: "auto",
      }}
    >
      <Box
        sx={{
          p: 2,
          position: "sticky",
          top: 0,
          bgcolor: "background.paper",
          zIndex: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: '"Fredoka", sans-serif',
            fontWeight: 700,
            fontSize: "1.1rem",
            color: "primary.main",
          }}
        >
          📊 Histórico
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Últimas {history.length} respostas
        </Typography>
      </Box>

      <List sx={{ p: 0 }}>
        {history.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Nenhuma resposta ainda.
              <br />
              Comece a jogar! 🎮
            </Typography>
          </Box>
        ) : (
          history.map((record, index) => (
            <Box key={record.id}>
              {index > 0 && <Divider />}
              <ListItem
                sx={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 0.5,
                  py: 1.5,
                  px: 2,
                  bgcolor: record.is_correct ? "success.50" : "error.50",
                  "&:hover": {
                    bgcolor: record.is_correct ? "success.100" : "error.100",
                  },
                }}
              >
                {/* Ícone + Questão */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                  {record.is_correct ? (
                    <CheckCircleRoundedIcon sx={{ color: "success.main", fontSize: 18 }} />
                  ) : (
                    <CancelRoundedIcon sx={{ color: "error.main", fontSize: 18 }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: '"Fredoka", sans-serif',
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      flex: 1,
                    }}
                  >
                    {record.question}
                  </Typography>
                </Box>

                {/* Resposta e alternativas */}
                <Box sx={{ pl: 3, width: "100%" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                    Resposta: <strong>{record.answer}</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                    Opções: {record.alternatives.join(", ")}
                  </Typography>
                </Box>

                {/* Métricas */}
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", pl: 3, mt: 0.5 }}>
                  <Chip
                    label={`${record.reward_xp >= 0 ? "+" : ""}${record.reward_xp} XP`}
                    size="small"
                    sx={{
                      fontSize: "0.65rem",
                      height: 20,
                      bgcolor: record.is_correct ? "success.main" : "error.main",
                      color: "white",
                      fontWeight: 600,
                    }}
                  />
                  {record.current_stack > 0 && (
                    <Chip
                      label={`🔥 ${record.current_stack}`}
                      size="small"
                      sx={{
                        fontSize: "0.65rem",
                        height: 20,
                        bgcolor: "warning.main",
                        color: "white",
                        fontWeight: 600,
                      }}
                    />
                  )}
                  <Chip
                    label={`⏱️ ${record.bonus}%`}
                    size="small"
                    sx={{
                      fontSize: "0.65rem",
                      height: 20,
                      bgcolor: "info.main",
                      color: "white",
                      fontWeight: 600,
                    }}
                  />
                </Box>

                {/* Timestamp */}
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.disabled",
                    fontSize: "0.65rem",
                    pl: 3,
                    mt: 0.5,
                  }}
                >
                  {new Date(record.data_registro).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </ListItem>
            </Box>
          ))
        )}
      </List>
    </Box>
  );
}
