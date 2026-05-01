import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Avatar,
  IconButton,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { useNavigate, useLocation, Link } from "react-router-dom";
import AppLogo from "../AppLogo/AppLogo";
import { useAuth } from "../../contexts/AuthContext";
import { logout } from "../../models/auth";

const NAV_ITEMS = [
  { label: "Início", icon: <HomeRoundedIcon />, path: "/main" },
  { label: "Jogar", icon: <SportsEsportsRoundedIcon />, path: "/main/jogar" },
  { label: "Recompensas", icon: <CardGiftcardRoundedIcon />, path: "/main/loja" },
  { label: "Perfil", icon: <AccountCircleRoundedIcon />, path: "/main/perfil" },
];

function NavDrawerContent({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  function handleNav(path: string) {
    navigate(path);
    onClose?.();
  }

  return (
    <>
      <Box sx={{ px: 3, pb: 2 }}>
        <AppLogo size="large" />
        {user && (
          <Typography
            variant="body2"
            sx={{ mt: 0.5, color: "text.secondary", fontFamily: '"Fredoka", sans-serif' }}
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
              onClick={() => handleNav(item.path)}
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
              <ListItemIcon sx={{ minWidth: 40, color: active ? "inherit" : "primary.main" }}>
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
                sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 600, fontSize: "1.05rem", color: "error.main" }}
              >
                Sair
              </Typography>
            }
          />
        </ListItemButton>
      </List>
    </>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* AppBar — tablet e desktop */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          display: { xs: "none", md: "flex" },
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          left: { xl: 260 },
          right: { xl: 260 },
          width: { xl: "calc(100% - 520px)" },
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {/* Hamburger — tablet apenas (some no desktop onde o drawer fixo existe) */}
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { xs: "none", md: "flex", xl: "none" }, mr: 0.5 }}
          >
            <MenuRoundedIcon />
          </IconButton>

          {/* Logo — quando o drawer fixo não está visível */}
          <Box sx={{ display: { xs: "block", xl: "none" }, cursor: "pointer" }} onClick={() => navigate("/main")}>
            <AppLogo size="medium" />
          </Box>

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
              <Link to="/main/perfil" style={{ textDecoration: "none", color: "inherit" }}>
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
              </Link>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer temporário — tablet (md a xl) */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          display: { xs: "none", md: "block", xl: "none" },
          "& .MuiDrawer-paper": {
            width: 260,
            boxSizing: "border-box",
            pt: 2,
          },
        }}
      >
        <NavDrawerContent onClose={() => setDrawerOpen(false)} />
      </Drawer>

      {/* Drawer permanente — desktop (xl+) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", xl: "block" },
          "& .MuiDrawer-paper": {
            width: 260,
            boxSizing: "border-box",
            pt: 2,
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <NavDrawerContent />
      </Drawer>
    </>
  );
}
