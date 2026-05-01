import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  IconButton,
  Popover,
} from "@mui/material";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import { IconPicker } from "../IconPicker/IconPicker";
import type { ShopItem } from "../../models/shop";
import type { ShopItemFormData } from "../../types/shop";

export type { ShopItemFormData };

interface ShopItemFormProps {
  open: boolean;
  mode: "create" | "edit";
  item?: ShopItem;
  onSubmit: (data: ShopItemFormData) => void;
  onCancel: () => void;
}

export function ShopItemForm({ open, mode, item, onSubmit, onCancel }: ShopItemFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [formData, setFormData] = useState<ShopItemFormData>({
    name: "",
    description: "",
    iconType: "emoji",
    iconValue: "🎁",
    price: 10,
    quantity: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [anchorElPontos, setAnchorElPontos] = useState<null | HTMLElement>(null);
  const [anchorElQtd, setAnchorElQtd] = useState<null | HTMLElement>(null);

  // Preenche o formulário quando estiver no modo edição
  useEffect(() => {
    if (mode === "edit" && item) {
      setFormData({
        name: item.name,
        description: item.description,
        iconType: item.iconType,
        iconValue: item.iconValue,
        price: item.price,
        quantity: item.quantity,
      });
    } else {
      // Reset ao modo criar
      setFormData({
        name: "",
        description: "",
        iconType: "emoji",
        iconValue: "🎁",
        price: 10,
        quantity: 1,
      });
    }
    setErrors({});
  }, [mode, item, open]);

  // Fecha os popovers quando o dialog fecha para evitar problemas de aria-hidden
  useEffect(() => {
    if (!open) {
      setAnchorElPontos(null);
      setAnchorElQtd(null);
    }
  }, [open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório.";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Nome deve ter pelo menos 3 caracteres.";
    }

    if (!formData.iconValue) {
      newErrors.icon = "Selecione um ícone.";
    }

    if (formData.price < 1) {
      newErrors.price = "Preço deve ser pelo menos 1 ponto.";
    }

    if (formData.quantity < 0) {
      newErrors.quantity = "Quantidade não pode ser negativa.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      // Fecha popovers antes de submeter
      setAnchorElPontos(null);
      setAnchorElQtd(null);
      onSubmit(formData);
    }
  };

  const handleCancel = () => {
    // Fecha popovers antes de cancelar
    setAnchorElPontos(null);
    setAnchorElQtd(null);
    onCancel();
  };

  const handleChange = (field: keyof ShopItemFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpa o erro do campo ao editar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            maxHeight: isMobile ? "100vh" : "90vh",
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>{mode === "create" ? "Adicionar Recompensa" : "Editar Recompensa"}</DialogTitle>

      <DialogContent
        sx={{
          overflowY: "auto",
          pt: { xs: 1, sm: 2 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, sm: 2 } }}>
          <TextField
            label="Nome da Recompensa"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            placeholder="Ex: Sorvete, 30 min de videogame..."
            size={isMobile ? "small" : "medium"}
          />

          <TextField
            label="Descrição (opcional)"
            fullWidth
            multiline
            rows={isMobile ? 2 : 2}
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Descreva a recompensa..."
            size={isMobile ? "small" : "medium"}
          />

          <Box sx={{ display: "flex", gap: { xs: 1, sm: 2 }, flexDirection: { xs: "column", sm: "row" } }}>
            {/* Preço (pontos) com ícone de ajuda */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, flex: 1 }}>
              <TextField
                label="Preço (pontos)"
                type="number"
                fullWidth
                required
                value={formData.price}
                onChange={(e) => handleChange("price", parseInt(e.target.value) || 0)}
                error={!!errors.price}
                helperText={errors.price}
                slotProps={{ htmlInput: { min: 1 } }}
                size={isMobile ? "small" : "medium"}
              />
              <IconButton
                aria-label="Ajuda sobre pontos"
                size="small"
                onClick={(e) => setAnchorElPontos(e.currentTarget)}
                sx={{ mt: isMobile ? 0.5 : 1 }}
              >
                <HelpOutlineOutlined fontSize="small" />
              </IconButton>
              <Popover
                open={Boolean(anchorElPontos)}
                anchorEl={anchorElPontos}
                onClose={() => setAnchorElPontos(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
              >
                <Box sx={{ p: 2, maxWidth: 320 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    O que são pontos?
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Os pontos são a moeda do app. Você ganha pontos resolvendo problemas de matemática e estudando
                    conteúdos.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <b>Exemplo:</b> 100 pontos ≈ 25 questões respondidas
                    <br />
                    (em média 4 pontos por questão)
                  </Typography>
                  <Typography variant="body2">
                    300 pontos ≈ 10~15 minutos de estudo
                    <br />
                    (em média 1min 30s para 10 questões)
                  </Typography>
                </Box>
              </Popover>
            </Box>

            {/* Quantidade com ícone de ajuda */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, flex: 1 }}>
              <TextField
                label="Quantidade"
                type="number"
                fullWidth
                required
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", parseInt(e.target.value) || 0)}
                error={!!errors.quantity}
                helperText={errors.quantity || "Estoque disponível"}
                slotProps={{ htmlInput: { min: 0 } }}
                size={isMobile ? "small" : "medium"}
              />
              <IconButton
                aria-label="Ajuda sobre quantidade"
                size="small"
                onClick={(e) => setAnchorElQtd(e.currentTarget)}
                sx={{ mt: isMobile ? 0.5 : 1 }}
              >
                <HelpOutlineOutlined fontSize="small" />
              </IconButton>
              <Popover
                open={Boolean(anchorElQtd)}
                anchorEl={anchorElQtd}
                onClose={() => setAnchorElQtd(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
              >
                <Box sx={{ p: 2, maxWidth: 320 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Como funciona a quantidade?
                  </Typography>
                  <Typography variant="body2">
                    Este campo define quantas vezes a recompensa pode ser resgatada na semana. O estoque é reiniciado
                    toda semana para o valor definido aqui.
                  </Typography>
                </Box>
              </Popover>
            </Box>
          </Box>

          {/* Ícone por último */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
              Ícone *
            </Typography>
            {errors.icon && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {errors.icon}
              </Alert>
            )}
            <IconPicker
              selectedIcon={{ type: formData.iconType, value: formData.iconValue }}
              onSelect={(type, value) => {
                handleChange("iconType", type);
                handleChange("iconValue", value);
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
        <Button onClick={handleCancel} size={isMobile ? "medium" : "large"}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" size={isMobile ? "medium" : "large"}>
          {mode === "create" ? "Adicionar" : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
