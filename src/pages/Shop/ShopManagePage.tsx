import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ParentPasswordDialog } from "../../components/ParentPasswordDialog/ParentPasswordDialog";
import { ShopItemCard } from "../../components/ShopItemCard/ShopItemCard";
import { ShopItemForm } from "../../components/ShopItemForm/ShopItemForm";
import { PurchaseHistoryDialog } from "../../components/PurchaseHistoryDialog/PurchaseHistoryDialog";
import type { ShopItemFormData } from "../../types/shop";
import { getUserShopItems, createShopItem, updateShopItem, deleteShopItem } from "../../models/shop";
import { updateParentPassword } from "../../models/auth";
import type { ShopItem } from "../../models/shop";

export function ShopManagePage() {
  const { user, patchUser } = useAuth();
  const navigate = useNavigate();
  const [validatedPassword, setValidatedPassword] = useState<string | null>(null);

  const [passwordDialog, setPasswordDialog] = useState<{
    open: boolean;
    mode: "create" | "validate" | "reset";
  }>({ open: false, mode: "create" });
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [itemForm, setItemForm] = useState<{
    open: boolean;
    mode: "create" | "edit";
    item?: ShopItem;
  }>({ open: false, mode: "create" });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    item: ShopItem | null;
  }>({ open: false, item: null });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    checkPasswordAndLoadItems();
  }, [user]);

  const checkPasswordAndLoadItems = async () => {
    if (!user) return;

    // Verifica se a senha do pai está configurada
    if (!user.parentPassword) {
      // Primeira vez - precisa criar senha
      setPasswordDialog({ open: true, mode: "create" });
    } else if (!validatedPassword) {
      // Senha existe mas não foi validada nesta sessão
      setPasswordDialog({ open: true, mode: "validate" });
    } else {
      // Senha validada - carrega os itens
      await loadItems();
    }
  };

  const loadItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const shopItems = await getUserShopItems(user.id);
      setItems(shopItems);
    } catch (error) {
      console.error("Erro ao carregar itens:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSuccess = async (password: string) => {
    if (!user) return;

    if (passwordDialog.mode === "create" || passwordDialog.mode === "reset") {
      const isCreate = passwordDialog.mode === "create";
      try {
        await updateParentPassword(user.id, password);
        // Atualiza o estado React imediatamente, sem depender do ciclo de sync
        patchUser({ parentPassword: password });
        setSnackbar({
          open: true,
          message: isCreate ? "Senha criada com sucesso!" : "Senha redefinida com sucesso!",
          severity: "success",
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: isCreate ? "Erro ao criar senha. Tente novamente." : "Erro ao redefinir senha. Tente novamente.",
          severity: "error",
        });
        return;
      }
    }

    // Armazena a senha validada apenas no estado (não persiste)
    setValidatedPassword(password);

    setPasswordDialog({ ...passwordDialog, open: false });
    await loadItems();
  };

  const handleRequestReset = () => {
    setPasswordDialog({ open: true, mode: "reset" });
  };

  const handlePasswordCancel = () => {
    // Volta para a loja se cancelar a validação
    navigate("/main/loja");
  };

  const handleAddItem = () => {
    setItemForm({ open: true, mode: "create" });
  };

  const handleEditItem = (item: ShopItem) => {
    setItemForm({ open: true, mode: "edit", item });
  };

  const openDeleteDialog = (item: ShopItem) => {
    setDeleteDialog({ open: true, item });
  };

  const handleItemFormSubmit = async (data: ShopItemFormData) => {
    if (!user) return;

    try {
      if (itemForm.mode === "create") {
        await createShopItem(user.id, data);
        setSnackbar({
          open: true,
          message: "Item adicionado com sucesso!",
          severity: "success",
        });
      } else if (itemForm.mode === "edit" && itemForm.item) {
        await updateShopItem(itemForm.item.id, data);
        setSnackbar({
          open: true,
          message: "Item atualizado com sucesso!",
          severity: "success",
        });
      }

      setItemForm({ open: false, mode: "create" });
      await loadItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar item.";
      setSnackbar({
        open: true,
        message,
        severity: "error",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.item) return;

    try {
      await deleteShopItem(deleteDialog.item.id);
      setSnackbar({
        open: true,
        message: "Item deletado com sucesso!",
        severity: "success",
      });
      setDeleteDialog({ open: false, item: null });
      await loadItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao deletar item.";
      setSnackbar({
        open: true,
        message,
        severity: "error",
      });
    }
  };

  const handleBack = () => {
    navigate("/main/loja");
  };

  // Se não há usuário ou senha ainda não foi validada, mostra apenas o diálogo
  if (!user || !validatedPassword) {
    return (
      <>
        <ParentPasswordDialog
          open={passwordDialog.open}
          mode={passwordDialog.mode}
          storedPassword={user?.parentPassword}
          onSuccess={handlePasswordSuccess}
          onCancel={passwordDialog.mode === "validate" ? handlePasswordCancel : undefined}
          onRequestReset={passwordDialog.mode === "validate" ? handleRequestReset : undefined}
        />
      </>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, pb: { xs: 12, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Voltar para Loja
        </Button>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Fredoka", sans-serif',
              fontWeight: 700,
            }}
          >
            ⚙️ Gerenciar Recompensas
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="outlined" startIcon={<HistoryIcon />} onClick={() => setHistoryDialog(true)} size="large">
              Histórico
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddItem} size="large">
              Adicionar Item
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Grid de itens */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhuma recompensa cadastrada ainda
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Clique em "Adicionar Item" para criar a primeira recompensa!
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddItem}>
            Adicionar Item
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {items.map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
              <ShopItemCard item={item} mode="manage" onEdit={handleEditItem} onDelete={openDeleteDialog} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog de senha (create/validate) */}
      <ParentPasswordDialog
        open={passwordDialog.open}
        mode={passwordDialog.mode}
        storedPassword={user.parentPassword}
        onSuccess={handlePasswordSuccess}
        onCancel={passwordDialog.mode === "validate" ? handlePasswordCancel : undefined}
      />

      {/* Dialog de formulário de item */}
      <ShopItemForm
        open={itemForm.open}
        mode={itemForm.mode}
        item={itemForm.item}
        onSubmit={handleItemFormSubmit}
        onCancel={() => setItemForm({ open: false, mode: "create" })}
      />

      {/* Dialog de confirmação de deleção */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja deletar a recompensa <strong>{deleteDialog.item?.name}</strong>? Esta ação não pode
            ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
            Deletar
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
