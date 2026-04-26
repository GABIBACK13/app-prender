import { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Avatar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useNavigate, useLocation } from "react-router-dom";
import AppLogo from "../AppLogo/AppLogo";
import { useAuth } from "../../contexts/AuthContext";
import { logout } from "../../models/auth";

const NAV_ITEMS = [
  { label: "Início", icon: <HomeRoundedIcon />, path: "/main" },
  { label: "Jogar", icon: <SportsEsportsRoundedIcon />, path: "/main/jogar" },
  { label: "Recompensas", icon: <CardGiftcardRoundedIcon />, path: "/main/loja" },
  { label: "Perfil", icon: <AccountCircleRoundedIcon />, path: "/main/perfil" },
];

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          display: { xs: "none", md: "flex" },
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            edge="start"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
            sx={{ color: "primary.main" }}
          >
            <MenuIcon />
          </IconButton>
          <div onClick={() => navigate("/main")} style={{ cursor: "pointer" }}>
            <AppLogo size="medium" />
          </div>
          <Box sx={{ flexGrow: 1 }} />
          {user && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <StarRoundedIcon sx={{ color: "warning.main", fontSize: 22 }} />
              <Typography
                variant="body2"
                sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 600, color: "warning.main" }}
              >
                {user.points} pts
              </Typography>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "primary.main",
                  fontFamily: '"Fredoka", sans-serif',
                  fontWeight: 700,
                  fontSize: "1rem",
                  ml: 1,
                }}
              >
                {(user.nickname?.[0] ?? user.name?.[0] ?? "?").toUpperCase()}
              </Avatar>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ display: { xs: "none", md: "block" } }}
        slotProps={{ paper: { sx: { width: 260, pt: 2 } } }}
      >
        <Box sx={{ px: 3, pb: 2 }}>
          <AppLogo size="large" />
          {user && (
            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                color: "text.secondary",
                fontFamily: '"Fredoka", sans-serif',
              }}
            >
              Olá, {user.nickname || user.name}! 👋
            </Typography>
          )}
        </Box>
        <Divider sx={{ mb: 1 }} />
        <List>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.path}
                selected={active}
                onClick={() => {
                  navigate(item.path);
                  setDrawerOpen(false);
                }}
                sx={{
                  borderRadius: 3,
                  mx: 1,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                    "&:hover": { bgcolor: "primary.dark" },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: active ? "inherit" : "primary.main",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 600, fontSize: "1.05rem" }}>
                      {item.label}
                    </Typography>
                  }
                />
              </ListItemButton>
            );
          })}
        </List>
        <Divider sx={{ mt: 1 }} />
        <List>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 3, mx: 1, mt: 0.5, color: "error.main" }}>
            <ListItemIcon sx={{ minWidth: 40, color: "error.main" }}>
              <LogoutRoundedIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  sx={{
                    fontFamily: '"Fredoka", sans-serif',
                    fontWeight: 600,
                    fontSize: "1.05rem",
                    color: "error.main",
                  }}
                >
                  Sair
                </Typography>
              }
            />
          </ListItemButton>
        </List>
      </Drawer>
    </>
  );
}
