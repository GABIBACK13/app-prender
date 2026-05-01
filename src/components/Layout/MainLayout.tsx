import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "../Header/Header";
import Navigation from "../Navigation/Navigation";
import AnswerHistory from "../AnswerHistory/AnswerHistory";

export default function MainLayout() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* AppBar visível apenas em desktop */}
      <Header />

      {/* Histórico de respostas (direita, desktop) */}
      <AnswerHistory />

      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flex: 1,
          pt: { xs: 2, md: 10 },
          pb: { xs: 10, md: 4 },
          px: { xs: 2, sm: 3, md: 4 },
          ml: { xs: 0, xl: "260px" },
          mr: { xs: 0, xl: "260px" },
          maxWidth: { xs: "100%", xl: 1200 },
          width: "100%",
          mx: { xs: 0, xl: "auto" },
        }}
      >
        <Outlet />
      </Box>

      {/* BottomNavigation visível apenas em mobile */}
      <Navigation />
    </Box>
  );
}
