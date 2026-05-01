import { Box, CircularProgress, Typography, useTheme } from "@mui/material";

interface LevelDisplayProps {
  level: number;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
  color?: string;
}

export function LevelDisplay({ level, size = "medium", showLabel = false, color }: LevelDisplayProps) {
  const theme = useTheme();

  // Calcula nível inteiro e progresso
  const levelInt = Math.floor(level / 100);
  const progress = ((level % 100) / 100) * 100; // Percentual de progresso para o próximo nível

  // Tamanhos responsivos
  const sizes = {
    small: { circle: 50, font: "1rem", label: "0.7rem" },
    medium: { circle: 70, font: "1.5rem", label: "0.75rem" },
    large: { circle: 90, font: "2rem", label: "0.85rem" },
  };

  const currentSize = sizes[size];
  const mainColor = color || theme.palette.primary.main;

  return (
    <Box sx={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        {/* Background circle (cinza) */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={currentSize.circle}
          thickness={4}
          sx={{
            color: theme.palette.grey[200],
            position: "absolute",
          }}
        />
        {/* Progress circle (colorido) */}
        <CircularProgress
          variant="determinate"
          value={progress}
          size={currentSize.circle}
          thickness={4}
          sx={{
            color: mainColor,
            "& .MuiCircularProgress-circle": {
              strokeLinecap: "round",
            },
          }}
        />
        {/* Nível no centro */}
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontFamily: '"Fredoka", sans-serif',
              fontWeight: 700,
              fontSize: currentSize.font,
              color: mainColor,
            }}
          >
            {levelInt}
          </Typography>
        </Box>
      </Box>
      {showLabel && (
        <Typography
          variant="caption"
          sx={{
            mt: 0.5,
            fontFamily: '"Nunito", sans-serif',
            fontSize: currentSize.label,
            color: "text.secondary",
            fontWeight: 600,
          }}
        >
          Nível
        </Typography>
      )}
    </Box>
  );
}
