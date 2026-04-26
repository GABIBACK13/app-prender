import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Fab,
  CircularProgress,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import HistoryIcon from "@mui/icons-material/History";
import StarsIcon from "@mui/icons-material/Stars";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ShopItemCard } from "../../components/ShopItemCard/ShopItemCard";
import { PurchaseHistoryDialog } from "../../components/PurchaseHistoryDialog/PurchaseHistoryDialog";
import { getUserShopItems, purchaseItem } from "../../models/shop";
import type { ShopItem } from "../../models/shop";

export function ShopPage() {
  const { user, patchUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    item: ShopItem | null;
  }>({ open: false, item: null });
  const [historyDialog, setHistoryDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadItems();
  }, [user]);

  const loadItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const shopItems = await getUserShopItems(user.id);
      // Filtra apenas itens disponíveis (quantidade > 0)
      setItems(shopItems.filter((item) => item.quantity > 0));
    } catch (error) {
      console.error("Erro ao carregar itens:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = (item: ShopItem) => {
    setConfirmDialog({ open: true, item });
  };

  const handleConfirmPurchase = async () => {
    if (!user || !confirmDialog.item) return;

    setPurchasing(true);
    try {
      const newPoints = await purchaseItem(user.id, confirmDialog.item.id, user.points);

      // Atualiza o cache local
      patchUser({ points: newPoints });

      // Recarrega os itens para refletir a quantidade atualizada
      await loadItems();

      // Fecha o diálogo
      setConfirmDialog({ open: false, item: null });

      // Mostra mensagem de sucesso
      setSnackbar({
        open: true,
        message: `🎉 Você comprou: ${confirmDialog.item.name}!`,
        severity: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao comprar item.";
      setSnackbar({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handleCancelPurchase = () => {
    setConfirmDialog({ open: false, item: null });
  };

  const handleManageClick = () => {
    navigate("/main/loja/gerenciar");
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Carregando...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, pb: { xs: 12, md: 4 } }}>
      {/* Header com pontos do usuário */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          textAlign: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
          <StarsIcon sx={{ fontSize: "2.5rem", mr: 1 }} />
          <Typography variant="h3" fontFamily='"Fredoka", sans-serif' fontWeight={700}>
            {user.points}
          </Typography>
        </Box>
        <Typography variant="h6" fontFamily='"Fredoka", sans-serif'>
          Seus Pontos
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate("/main/jogar")}
          sx={{
            mt: 2,
            color: "white",
            borderColor: "rgba(255,255,255,0.7)",
            fontFamily: '"Fredoka", sans-serif',
            fontWeight: 600,
            fontSize: "0.95rem",
            borderRadius: 3,
            px: 3,
            "&:hover": {
              borderColor: "white",
              bgcolor: "rgba(255,255,255,0.15)",
            },
          }}
        >
          🎮 Obter mais pontos
        </Button>
      </Paper>

      {/* Título da loja */}
      <Typography variant="h4" fontFamily='"Fredoka", sans-serif' fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        🎁 Loja de Recompensas
      </Typography>

      {/* Grid de itens */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhuma recompensa disponível ainda! 🎈
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Peça para seus pais configurarem recompensas legais para você conquistar!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {items.map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
              <ShopItemCard item={item} mode="view" userPoints={user.points} onBuy={handleBuyClick} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Botão flutuante para histórico de compras */}
      <Fab
        color="secondary"
        aria-label="histórico"
        onClick={() => setHistoryDialog(true)}
        sx={{
          position: "fixed",
          bottom: { xs: 160, md: 96 },
          right: 16,
        }}
      >
        <HistoryIcon />
      </Fab>

      {/* Botão flutuante para gerenciamento (para pais) */}
      <Fab
        color="primary"
        aria-label="gerenciar"
        onClick={handleManageClick}
        sx={{
          position: "fixed",
          bottom: { xs: 80, md: 16 },
          right: 16,
        }}
      >
        <SettingsIcon />
      </Fab>

      {/* Dialog de confirmação de compra */}
      <Dialog open={confirmDialog.open} onClose={handleCancelPurchase} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar Compra</DialogTitle>
        <DialogContent>
          {confirmDialog.item && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h6" gutterBottom>
                {confirmDialog.item.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Preço: <strong>{confirmDialog.item.price} pontos</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Saldo após compra: <strong>{user.points - confirmDialog.item.price} pontos</strong>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelPurchase} disabled={purchasing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmPurchase} variant="contained" disabled={purchasing} autoFocus>
            {purchasing ? "Comprando..." : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de histórico de compras */}
      <PurchaseHistoryDialog open={historyDialog} onClose={() => setHistoryDialog(false)} />

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
